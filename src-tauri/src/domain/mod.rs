use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};

pub const MAX_DESCRIPTION_LENGTH: usize = 1_000;
pub const MAX_NAME_LENGTH: usize = 120;
pub const MAX_TITLE_LENGTH: usize = 200;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

impl CommandError {
    pub fn internal(message: impl Into<String>) -> Self {
        Self {
            code: "internal",
            message: message.into(),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            code: "notFound",
            message: message.into(),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: "validation",
            message: message.into(),
        }
    }
}

impl Display for CommandError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}", self.message)
    }
}

impl std::error::Error for CommandError {}

impl From<rusqlite::Error> for CommandError {
    fn from(error: rusqlite::Error) -> Self {
        Self::internal(format!("Database operation failed: {error}"))
    }
}

impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        Self::internal(format!("File operation failed: {error}"))
    }
}

pub type CommandResult<T> = Result<T, CommandError>;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub description: Option<String>,
    pub name: String,
    pub workspace_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspaceInput {
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartTimeEntryInput {
    pub description: Option<String>,
    pub project_id: String,
    pub started_at: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectInput {
    pub description: Option<String>,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTimeEntryInput {
    pub description: Option<String>,
    pub started_at: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkspaceInput {
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeRangeInput {
    pub ended_before: String,
    pub started_after: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub created_at: String,
    pub description: Option<String>,
    pub id: String,
    pub name: String,
    pub workspace_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub description: Option<String>,
    pub elapsed_milliseconds: i64,
    pub ended_at: Option<String>,
    pub id: String,
    pub project_id: String,
    pub project_description: Option<String>,
    pub project_name: String,
    pub running_since: Option<String>,
    pub started_at: String,
    pub title: String,
    pub workspace_id: String,
    pub workspace_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub created_at: String,
    pub id: String,
    pub name: String,
}

pub fn normalize_description(description: Option<String>) -> CommandResult<Option<String>> {
    let normalized = description.map(|value| value.trim().to_owned());

    match normalized {
        Some(value) if value.chars().count() > MAX_DESCRIPTION_LENGTH => Err(
            CommandError::validation("Description is longer than 1000 characters"),
        ),
        Some(value) if value.is_empty() => Ok(None),
        value => Ok(value),
    }
}

pub fn normalize_name(name: String) -> CommandResult<String> {
    normalize_required_text(name, "Name", MAX_NAME_LENGTH)
}

pub fn normalize_title(title: String) -> CommandResult<String> {
    normalize_required_text(title, "Title", MAX_TITLE_LENGTH)
}

fn normalize_required_text(
    value: String,
    field_name: &str,
    max_length: usize,
) -> CommandResult<String> {
    let normalized = value.trim().to_owned();

    if normalized.is_empty() {
        return Err(CommandError::validation(format!(
            "{field_name} cannot be empty"
        )));
    }

    if normalized.chars().count() > max_length {
        return Err(CommandError::validation(format!(
            "{field_name} is longer than {max_length} characters"
        )));
    }

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::{normalize_description, normalize_name, normalize_title};

    #[test]
    fn trims_required_text() {
        assert_eq!(normalize_name("  Team  ".into()).unwrap(), "Team");
        assert_eq!(normalize_title("  Review  ".into()).unwrap(), "Review");
    }

    #[test]
    fn converts_an_empty_description_to_none() {
        assert_eq!(normalize_description(Some("   ".into())).unwrap(), None);
    }
}
