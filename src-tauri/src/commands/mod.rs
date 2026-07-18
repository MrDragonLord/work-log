use tauri::State;

use crate::{
    domain::{
        CommandResult, CreateProjectInput, CreateWorkspaceInput, Project, StartTimeEntryInput,
        TimeEntry, TimeRangeInput, UpdateProjectInput, UpdateTimeEntryInput, UpdateWorkspaceInput,
        Workspace,
    },
    storage::Database,
};

#[tauri::command]
pub fn create_project(
    database: State<'_, Database>,
    input: CreateProjectInput,
) -> CommandResult<Project> {
    database.create_project(input)
}

#[tauri::command]
pub fn create_workspace(
    database: State<'_, Database>,
    input: CreateWorkspaceInput,
) -> CommandResult<Workspace> {
    database.create_workspace(input)
}

#[tauri::command]
pub fn delete_project(database: State<'_, Database>, project_id: String) -> CommandResult<()> {
    database.delete_project(&project_id)
}

#[tauri::command]
pub fn delete_time_entry(database: State<'_, Database>, entry_id: String) -> CommandResult<()> {
    database.delete_time_entry(&entry_id)
}

#[tauri::command]
pub fn delete_workspace(database: State<'_, Database>, workspace_id: String) -> CommandResult<()> {
    database.delete_workspace(&workspace_id)
}

#[tauri::command]
pub fn list_active_time_entries(database: State<'_, Database>) -> CommandResult<Vec<TimeEntry>> {
    database.list_active_time_entries()
}

#[tauri::command]
pub fn list_project_time_entries(
    database: State<'_, Database>,
    project_id: String,
) -> CommandResult<Vec<TimeEntry>> {
    database.list_project_time_entries(&project_id)
}

#[tauri::command]
pub fn list_projects(
    database: State<'_, Database>,
    workspace_id: String,
) -> CommandResult<Vec<Project>> {
    database.list_projects(&workspace_id)
}

#[tauri::command]
pub fn list_time_entries_between(
    database: State<'_, Database>,
    input: TimeRangeInput,
) -> CommandResult<Vec<TimeEntry>> {
    database.list_time_entries_between(input)
}

#[tauri::command]
pub fn list_workspaces(database: State<'_, Database>) -> CommandResult<Vec<Workspace>> {
    database.list_workspaces()
}

#[tauri::command]
pub fn resume_time_entry(
    database: State<'_, Database>,
    entry_id: String,
) -> CommandResult<TimeEntry> {
    database.resume_time_entry(&entry_id)
}

#[tauri::command]
pub fn start_time_entry(
    database: State<'_, Database>,
    input: StartTimeEntryInput,
) -> CommandResult<TimeEntry> {
    database.start_time_entry(input)
}

#[tauri::command]
pub fn stop_time_entry(
    database: State<'_, Database>,
    entry_id: String,
) -> CommandResult<TimeEntry> {
    database.stop_time_entry(&entry_id)
}

#[tauri::command]
pub fn update_project(
    database: State<'_, Database>,
    project_id: String,
    input: UpdateProjectInput,
) -> CommandResult<Project> {
    database.update_project(&project_id, input)
}

#[tauri::command]
pub fn update_time_entry(
    database: State<'_, Database>,
    entry_id: String,
    input: UpdateTimeEntryInput,
) -> CommandResult<TimeEntry> {
    database.update_time_entry(&entry_id, input)
}

#[tauri::command]
pub fn update_workspace(
    database: State<'_, Database>,
    workspace_id: String,
    input: UpdateWorkspaceInput,
) -> CommandResult<Workspace> {
    database.update_workspace(&workspace_id, input)
}
