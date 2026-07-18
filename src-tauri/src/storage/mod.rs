use std::{fs, path::Path, sync::Mutex, time::Duration};

use chrono::{DateTime, SecondsFormat, Utc};
use rusqlite::{params, Connection, OptionalExtension, Row};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::domain::{
    normalize_description, normalize_name, normalize_title, CommandError, CommandResult,
    CreateProjectInput, CreateWorkspaceInput, Project, StartTimeEntryInput, TimeEntry,
    TimeRangeInput, UpdateProjectInput, UpdateTimeEntryInput, UpdateWorkspaceInput, Workspace,
};

const DATABASE_FILE_NAME: &str = "worklog.sqlite3";
const LATEST_SCHEMA_VERSION: i64 = 3;

pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    pub fn initialize(app: &AppHandle) -> CommandResult<Self> {
        let app_data_directory = app.path().app_data_dir().map_err(|error| {
            CommandError::internal(format!("Cannot resolve app data path: {error}"))
        })?;
        fs::create_dir_all(&app_data_directory)?;

        let database_path = app_data_directory.join(DATABASE_FILE_NAME);
        let had_existing_data = database_path
            .metadata()
            .map(|metadata| metadata.len() > 0)
            .unwrap_or(false);
        let mut connection = Connection::open(&database_path)?;

        connection.busy_timeout(Duration::from_secs(5))?;
        connection.pragma_update(None, "foreign_keys", "ON")?;
        connection.pragma_update(None, "journal_mode", "WAL")?;

        let current_version = schema_version(&connection)?;
        if had_existing_data && current_version < LATEST_SCHEMA_VERSION {
            create_backup(&connection, &database_path)?;
        }
        migrate(&mut connection, current_version)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn create_project(&self, input: CreateProjectInput) -> CommandResult<Project> {
        let name = normalize_name(input.name)?;
        let description = normalize_description(input.description)?;
        let created_at = utc_now();
        let id = Uuid::new_v4().to_string();
        let connection = self.lock()?;

        let workspace_exists = connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM workspaces WHERE id = ?1)",
            [&input.workspace_id],
            |row| row.get::<_, bool>(0),
        )?;
        if !workspace_exists {
            return Err(CommandError::not_found("Workspace not found"));
        }

        connection
            .execute(
                "INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
                params![id, input.workspace_id, name, description, created_at],
            )
            .map_err(map_constraint_error)?;

        Ok(Project {
            created_at,
            description,
            id,
            name,
            workspace_id: input.workspace_id,
        })
    }

    pub fn create_workspace(&self, input: CreateWorkspaceInput) -> CommandResult<Workspace> {
        let name = normalize_name(input.name)?;
        let created_at = utc_now();
        let id = Uuid::new_v4().to_string();
        let connection = self.lock()?;

        connection
            .execute(
                "INSERT INTO workspaces (id, name, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?3)",
                params![id, name, created_at],
            )
            .map_err(map_constraint_error)?;

        Ok(Workspace {
            created_at,
            id,
            name,
        })
    }

    pub fn delete_project(&self, project_id: &str) -> CommandResult<()> {
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows =
            transaction.execute("DELETE FROM projects WHERE id = ?1", [project_id])?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Project not found"));
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn delete_time_entry(&self, entry_id: &str) -> CommandResult<()> {
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows =
            transaction.execute("DELETE FROM time_entries WHERE id = ?1", [entry_id])?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Time entry not found"));
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn delete_workspace(&self, workspace_id: &str) -> CommandResult<()> {
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows =
            transaction.execute("DELETE FROM workspaces WHERE id = ?1", [workspace_id])?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Workspace not found"));
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn list_active_time_entries(&self) -> CommandResult<Vec<TimeEntry>> {
        self.query_time_entries(
            "WHERE time_entries.running_since IS NOT NULL ORDER BY time_entries.running_since ASC",
            [],
        )
    }

    pub fn list_project_time_entries(&self, project_id: &str) -> CommandResult<Vec<TimeEntry>> {
        self.query_time_entries(
            "WHERE time_entries.project_id = ?1 ORDER BY time_entries.started_at DESC LIMIT 200",
            [project_id],
        )
    }

    pub fn list_projects(&self, workspace_id: &str) -> CommandResult<Vec<Project>> {
        let connection = self.lock()?;
        let mut statement = connection.prepare(
            "SELECT id, workspace_id, name, description, created_at
             FROM projects
             WHERE workspace_id = ?1
             ORDER BY name COLLATE NOCASE ASC",
        )?;
        let projects = statement
            .query_map([workspace_id], |row| {
                Ok(Project {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(projects)
    }

    pub fn list_time_entries_between(
        &self,
        input: TimeRangeInput,
    ) -> CommandResult<Vec<TimeEntry>> {
        validate_timestamp(&input.started_after)?;
        validate_timestamp(&input.ended_before)?;

        self.query_time_entries(
            "WHERE time_entries.started_at >= ?1 AND time_entries.started_at < ?2
             ORDER BY time_entries.started_at DESC",
            [input.started_after, input.ended_before],
        )
    }

    pub fn list_workspaces(&self) -> CommandResult<Vec<Workspace>> {
        let connection = self.lock()?;
        let mut statement = connection.prepare(
            "SELECT id, name, created_at FROM workspaces ORDER BY name COLLATE NOCASE ASC",
        )?;
        let workspaces = statement
            .query_map([], |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(workspaces)
    }

    pub fn start_time_entry(&self, input: StartTimeEntryInput) -> CommandResult<TimeEntry> {
        let title = normalize_title(input.title)?;
        let description = normalize_description(input.description)?;
        let started_at = validate_timestamp(&input.started_at)?;
        if started_at > Utc::now() {
            return Err(CommandError::validation(
                "A timer cannot start in the future",
            ));
        }

        let created_at = utc_now();
        let id = Uuid::new_v4().to_string();
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;

        let project_exists = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM projects WHERE id = ?1)",
            [&input.project_id],
            |row| row.get::<_, bool>(0),
        )?;
        if !project_exists {
            return Err(CommandError::not_found("Project not found"));
        }

        transaction.execute(
            "INSERT INTO time_entries
                (id, project_id, title, description, started_at, elapsed_milliseconds, running_since, ended_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, NULL, ?6, ?6)",
            params![
                id,
                input.project_id,
                title,
                description,
                input.started_at,
                created_at
            ],
        )?;
        let entry = query_time_entry(&transaction, &id)?;
        transaction.commit()?;

        Ok(entry)
    }

    pub fn stop_time_entry(&self, entry_id: &str) -> CommandResult<TimeEntry> {
        let ended_at = utc_now();
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows = transaction.execute(
            "UPDATE time_entries
             SET elapsed_milliseconds = elapsed_milliseconds + MAX(
                    0,
                    CAST(ROUND((julianday(?1) - julianday(running_since)) * 86400000) AS INTEGER)
                 ),
                 running_since = NULL,
                 ended_at = ?1,
                 updated_at = ?1
             WHERE id = ?2 AND running_since IS NOT NULL",
            params![ended_at, entry_id],
        )?;

        if changed_rows == 0 {
            return Err(CommandError::not_found("Running time entry was not found"));
        }

        let entry = query_time_entry(&transaction, entry_id)?;
        transaction.commit()?;
        Ok(entry)
    }

    pub fn stop_all_active_time_entries(&self) -> CommandResult<usize> {
        let ended_at = utc_now();
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let stopped_entries = transaction.execute(
            "UPDATE time_entries
             SET elapsed_milliseconds = elapsed_milliseconds + MAX(
                    0,
                    CAST(ROUND((julianday(?1) - julianday(running_since)) * 86400000) AS INTEGER)
                 ),
                 running_since = NULL,
                 ended_at = ?1,
                 updated_at = ?1
             WHERE running_since IS NOT NULL",
            [ended_at],
        )?;
        transaction.commit()?;

        Ok(stopped_entries)
    }

    pub fn resume_time_entry(&self, entry_id: &str) -> CommandResult<TimeEntry> {
        let running_since = utc_now();
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows = transaction.execute(
            "UPDATE time_entries
             SET running_since = ?1, ended_at = NULL, updated_at = ?1
             WHERE id = ?2 AND running_since IS NULL",
            params![running_since, entry_id],
        )?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Stopped time entry was not found"));
        }

        let entry = query_time_entry(&transaction, entry_id)?;
        transaction.commit()?;
        Ok(entry)
    }

    pub fn update_project(
        &self,
        project_id: &str,
        input: UpdateProjectInput,
    ) -> CommandResult<Project> {
        let description = normalize_description(input.description)?;
        let name = normalize_name(input.name)?;
        let updated_at = utc_now();
        let connection = self.lock()?;
        let changed_rows = connection
            .execute(
                "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
                params![name, description, updated_at, project_id],
            )
            .map_err(map_constraint_error)?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Project not found"));
        }

        query_project(&connection, project_id)
    }

    pub fn update_time_entry(
        &self,
        entry_id: &str,
        input: UpdateTimeEntryInput,
    ) -> CommandResult<TimeEntry> {
        let description = normalize_description(input.description)?;
        let title = normalize_title(input.title)?;
        let started_at = validate_timestamp(&input.started_at)?;
        if started_at > Utc::now() {
            return Err(CommandError::validation(
                "A time entry cannot be in the future",
            ));
        }

        let updated_at = utc_now();
        let mut connection = self.lock()?;
        let transaction = connection.transaction()?;
        let changed_rows = transaction.execute(
            "UPDATE time_entries
             SET title = ?1, description = ?2, started_at = ?3, updated_at = ?4
             WHERE id = ?5",
            params![title, description, input.started_at, updated_at, entry_id],
        )?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Time entry not found"));
        }

        let entry = query_time_entry(&transaction, entry_id)?;
        transaction.commit()?;
        Ok(entry)
    }

    pub fn update_workspace(
        &self,
        workspace_id: &str,
        input: UpdateWorkspaceInput,
    ) -> CommandResult<Workspace> {
        let name = normalize_name(input.name)?;
        let updated_at = utc_now();
        let connection = self.lock()?;
        let changed_rows = connection
            .execute(
                "UPDATE workspaces SET name = ?1, updated_at = ?2 WHERE id = ?3",
                params![name, updated_at, workspace_id],
            )
            .map_err(map_constraint_error)?;
        if changed_rows == 0 {
            return Err(CommandError::not_found("Workspace not found"));
        }

        query_workspace(&connection, workspace_id)
    }

    fn lock(&self) -> CommandResult<std::sync::MutexGuard<'_, Connection>> {
        self.connection
            .lock()
            .map_err(|_| CommandError::internal("Database lock is poisoned"))
    }

    fn query_time_entries<P>(&self, where_clause: &str, params: P) -> CommandResult<Vec<TimeEntry>>
    where
        P: rusqlite::Params,
    {
        let connection = self.lock()?;
        let sql = format!("{} {where_clause}", time_entry_select());
        let mut statement = connection.prepare(&sql)?;
        let entries = statement
            .query_map(params, map_time_entry)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(entries)
    }
}

fn create_backup(connection: &Connection, database_path: &Path) -> CommandResult<()> {
    let timestamp = Utc::now().format("%Y%m%dT%H%M%SZ");
    let backup_path = database_path.with_file_name(format!("worklog-backup-{timestamp}.sqlite3"));
    connection.execute("VACUUM INTO ?1", [backup_path.to_string_lossy().as_ref()])?;
    Ok(())
}

fn map_constraint_error(error: rusqlite::Error) -> CommandError {
    match &error {
        rusqlite::Error::SqliteFailure(details, _)
            if details.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            CommandError::validation("An item with this name already exists")
        }
        _ => error.into(),
    }
}

fn map_time_entry(row: &Row<'_>) -> rusqlite::Result<TimeEntry> {
    Ok(TimeEntry {
        id: row.get(0)?,
        project_id: row.get(1)?,
        project_name: row.get(2)?,
        project_description: row.get(3)?,
        workspace_id: row.get(4)?,
        workspace_name: row.get(5)?,
        title: row.get(6)?,
        description: row.get(7)?,
        started_at: row.get(8)?,
        ended_at: row.get(9)?,
        elapsed_milliseconds: row.get(10)?,
        running_since: row.get(11)?,
    })
}

fn migrate(connection: &mut Connection, current_version: i64) -> CommandResult<()> {
    if current_version < 1 {
        let transaction = connection.transaction()?;
        transaction.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );

        CREATE TABLE workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(name) BETWEEN 1 AND 120),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE projects (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL COLLATE NOCASE CHECK(length(name) BETWEEN 1 AND 120),
            description TEXT CHECK(description IS NULL OR length(description) <= 1000),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(workspace_id, name)
        );

        CREATE TABLE time_entries (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
            description TEXT CHECK(description IS NULL OR length(description) <= 1000),
            started_at TEXT NOT NULL,
            ended_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            CHECK(ended_at IS NULL OR ended_at >= started_at)
        );

        CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
        CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
        CREATE INDEX idx_time_entries_started_at ON time_entries(started_at DESC);
        CREATE INDEX idx_time_entries_active ON time_entries(ended_at) WHERE ended_at IS NULL;",
        )?;
        transaction.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
            params![1, utc_now()],
        )?;
        transaction.commit()?;
    }

    if current_version < 2 {
        let transaction = connection.transaction()?;
        transaction.execute_batch(
            "ALTER TABLE time_entries ADD COLUMN elapsed_milliseconds INTEGER NOT NULL DEFAULT 0;
             ALTER TABLE time_entries ADD COLUMN running_since TEXT;
             UPDATE time_entries
             SET elapsed_milliseconds = CASE
                    WHEN ended_at IS NULL THEN 0
                    ELSE MAX(0, CAST(ROUND((julianday(ended_at) - julianday(started_at)) * 86400000) AS INTEGER))
                 END,
                 running_since = CASE WHEN ended_at IS NULL THEN started_at ELSE NULL END;",
        )?;
        transaction.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
            params![2, utc_now()],
        )?;
        transaction.commit()?;
    }

    if current_version < 3 {
        let transaction = connection.transaction()?;
        transaction.execute_batch(
            "CREATE TABLE time_entries_rebuilt (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
                description TEXT CHECK(description IS NULL OR length(description) <= 1000),
                started_at TEXT NOT NULL,
                elapsed_milliseconds INTEGER NOT NULL DEFAULT 0 CHECK(elapsed_milliseconds >= 0),
                running_since TEXT,
                ended_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
             );
             INSERT INTO time_entries_rebuilt
                (id, project_id, title, description, started_at, elapsed_milliseconds, running_since, ended_at, created_at, updated_at)
             SELECT
                id, project_id, title, description, started_at, elapsed_milliseconds, running_since, ended_at, created_at, updated_at
             FROM time_entries;
             DROP TABLE time_entries;
             ALTER TABLE time_entries_rebuilt RENAME TO time_entries;
             CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
             CREATE INDEX idx_time_entries_started_at ON time_entries(started_at DESC);
             CREATE INDEX idx_time_entries_running ON time_entries(running_since) WHERE running_since IS NOT NULL;",
        )?;
        transaction.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
            params![3, utc_now()],
        )?;
        transaction.commit()?;
    }

    Ok(())
}

fn query_time_entry(connection: &Connection, id: &str) -> CommandResult<TimeEntry> {
    let sql = format!("{} WHERE time_entries.id = ?1", time_entry_select());
    connection
        .query_row(&sql, [id], map_time_entry)
        .optional()?
        .ok_or_else(|| CommandError::not_found("Time entry not found"))
}

fn query_project(connection: &Connection, id: &str) -> CommandResult<Project> {
    connection
        .query_row(
            "SELECT id, workspace_id, name, description, created_at FROM projects WHERE id = ?1",
            [id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .optional()?
        .ok_or_else(|| CommandError::not_found("Project not found"))
}

fn query_workspace(connection: &Connection, id: &str) -> CommandResult<Workspace> {
    connection
        .query_row(
            "SELECT id, name, created_at FROM workspaces WHERE id = ?1",
            [id],
            |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                })
            },
        )
        .optional()?
        .ok_or_else(|| CommandError::not_found("Workspace not found"))
}

fn schema_version(connection: &Connection) -> CommandResult<i64> {
    let has_migrations_table = connection.query_row(
        "SELECT EXISTS(
            SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'
        )",
        [],
        |row| row.get::<_, bool>(0),
    )?;

    if !has_migrations_table {
        return Ok(0);
    }

    Ok(connection.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?)
}

fn time_entry_select() -> &'static str {
    "SELECT
        time_entries.id,
        time_entries.project_id,
        projects.name,
        projects.description,
        workspaces.id,
        workspaces.name,
        time_entries.title,
        time_entries.description,
        time_entries.started_at,
        time_entries.ended_at,
        time_entries.elapsed_milliseconds,
        time_entries.running_since
     FROM time_entries
     JOIN projects ON projects.id = time_entries.project_id
     JOIN workspaces ON workspaces.id = projects.workspace_id"
}

fn utc_now() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn validate_timestamp(timestamp: &str) -> CommandResult<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(timestamp)
        .map(|value| value.with_timezone(&Utc))
        .map_err(|_| CommandError::validation("Timestamp must be valid RFC 3339"))
}

#[cfg(test)]
mod tests {
    use chrono::{Duration as ChronoDuration, SecondsFormat, Utc};
    use rusqlite::Connection;

    use super::{migrate, Database};
    use crate::domain::{
        CreateProjectInput, CreateWorkspaceInput, StartTimeEntryInput, UpdateProjectInput,
        UpdateTimeEntryInput, UpdateWorkspaceInput,
    };

    fn database() -> Database {
        let mut connection = Connection::open_in_memory().unwrap();
        connection
            .pragma_update(None, "foreign_keys", "ON")
            .unwrap();
        migrate(&mut connection, 0).unwrap();
        Database {
            connection: std::sync::Mutex::new(connection),
        }
    }

    #[test]
    fn keeps_parallel_timers_running_independently() {
        let database = database();
        let workspace = database
            .create_workspace(CreateWorkspaceInput {
                name: "Main".into(),
            })
            .unwrap();
        let project = database
            .create_project(CreateProjectInput {
                description: Some("Desktop application".into()),
                name: "Desktop".into(),
                workspace_id: workspace.id,
            })
            .unwrap();
        let started_at =
            (Utc::now() - ChronoDuration::minutes(5)).to_rfc3339_opts(SecondsFormat::Millis, true);

        let first = database
            .start_time_entry(StartTimeEntryInput {
                description: None,
                project_id: project.id.clone(),
                started_at: started_at.clone(),
                title: "First".into(),
            })
            .unwrap();
        assert_eq!(first.elapsed_milliseconds, 0);
        assert_eq!(
            first.project_description.as_deref(),
            Some("Desktop application")
        );
        assert!(first.running_since.is_some());
        database
            .start_time_entry(StartTimeEntryInput {
                description: Some("Parallel work".into()),
                project_id: project.id,
                started_at,
                title: "Second".into(),
            })
            .unwrap();

        assert_eq!(database.list_active_time_entries().unwrap().len(), 2);
        database.stop_time_entry(&first.id).unwrap();
        let active_entries = database.list_active_time_entries().unwrap();
        assert_eq!(active_entries.len(), 1);
        assert_eq!(active_entries[0].title, "Second");

        let resumed = database.resume_time_entry(&first.id).unwrap();
        assert!(resumed.running_since.is_some());
        assert_eq!(database.list_active_time_entries().unwrap().len(), 2);
    }

    #[test]
    fn stops_all_active_timers_when_the_application_exits() {
        let database = database();
        let workspace = database
            .create_workspace(CreateWorkspaceInput {
                name: "Main".into(),
            })
            .unwrap();
        let project = database
            .create_project(CreateProjectInput {
                description: None,
                name: "Desktop".into(),
                workspace_id: workspace.id,
            })
            .unwrap();
        let started_at =
            (Utc::now() - ChronoDuration::minutes(5)).to_rfc3339_opts(SecondsFormat::Millis, true);

        let first = database
            .start_time_entry(StartTimeEntryInput {
                description: None,
                project_id: project.id.clone(),
                started_at: started_at.clone(),
                title: "First".into(),
            })
            .unwrap();
        let second = database
            .start_time_entry(StartTimeEntryInput {
                description: None,
                project_id: project.id,
                started_at,
                title: "Second".into(),
            })
            .unwrap();

        assert_eq!(database.stop_all_active_time_entries().unwrap(), 2);
        assert!(database.list_active_time_entries().unwrap().is_empty());

        let first = database
            .list_project_time_entries(&first.project_id)
            .unwrap()
            .into_iter()
            .find(|entry| entry.id == first.id)
            .unwrap();
        let second = database
            .list_project_time_entries(&second.project_id)
            .unwrap()
            .into_iter()
            .find(|entry| entry.id == second.id)
            .unwrap();
        assert!(first.ended_at.is_some());
        assert!(second.ended_at.is_some());
    }

    #[test]
    fn updates_and_deletes_the_complete_workspace_hierarchy() {
        let database = database();
        let workspace = database
            .create_workspace(CreateWorkspaceInput {
                name: "Main".into(),
            })
            .unwrap();
        let workspace = database
            .update_workspace(
                &workspace.id,
                UpdateWorkspaceInput {
                    name: "Updated workspace".into(),
                },
            )
            .unwrap();
        let project = database
            .create_project(CreateProjectInput {
                description: None,
                name: "Desktop".into(),
                workspace_id: workspace.id.clone(),
            })
            .unwrap();
        let project = database
            .update_project(
                &project.id,
                UpdateProjectInput {
                    description: Some("Updated description".into()),
                    name: "Updated project".into(),
                },
            )
            .unwrap();
        let entry = database
            .start_time_entry(StartTimeEntryInput {
                description: None,
                project_id: project.id,
                started_at: (Utc::now() - ChronoDuration::minutes(5))
                    .to_rfc3339_opts(SecondsFormat::Millis, true),
                title: "Draft".into(),
            })
            .unwrap();
        let updated_entry = database
            .update_time_entry(
                &entry.id,
                UpdateTimeEntryInput {
                    description: Some("Updated note".into()),
                    started_at: entry.started_at,
                    title: "Updated entry".into(),
                },
            )
            .unwrap();

        assert_eq!(workspace.name, "Updated workspace");
        assert_eq!(project.name, "Updated project");
        assert_eq!(updated_entry.title, "Updated entry");

        database.delete_workspace(&workspace.id).unwrap();

        assert!(database.list_workspaces().unwrap().is_empty());
        assert!(database.list_active_time_entries().unwrap().is_empty());
    }
}
