import { invoke } from '@tauri-apps/api/core'

export type Project = {
	createdAt: string
	description: string | null
	id: string
	name: string
	workspaceId: string
}

export type ProjectReference = Omit<Project, 'createdAt'>

export type TimeEntry = {
	description: string | null
	elapsedMilliseconds: number
	endedAt: string | null
	id: string
	projectId: string
	projectDescription: string | null
	projectName: string
	runningSince: string | null
	startedAt: string
	title: string
	workspaceId: string
	workspaceName: string
}

export type Workspace = {
	createdAt: string
	id: string
	name: string
}

export type WorkspaceReference = Omit<Workspace, 'createdAt'>

export type ExitConfirmationRequested = {
	activeTimerCount: number
}

export type CreateProjectInput = {
	description?: string
	name: string
	workspaceId: string
}

export type StartTimeEntryInput = {
	description?: string
	projectId: string
	startedAt: string
	title: string
}

export type UpdateProjectInput = {
	description?: string
	name: string
}

export type UpdateTimeEntryInput = {
	description?: string
	startedAt: string
	title: string
}

export type UpdateWorkspaceInput = {
	name: string
}

export const WORKLOG_QUERY_KEYS = {
	activeTimeEntries: ['timeEntries', 'active'] as const,
	projectTimeEntries: (projectId: string) => ['timeEntries', 'project', projectId] as const,
	projects: (workspaceId: string) => ['projects', workspaceId] as const,
	timeEntries: (startedAfter: string, endedBefore: string) =>
		['timeEntries', 'range', startedAfter, endedBefore] as const,
	workspaces: ['workspaces'] as const,
}

export const EXIT_CONFIRMATION_REQUESTED_EVENT = 'worklog://exit-confirmation-requested'

export async function confirmApplicationExit(): Promise<void> {
	return invokeCommand('confirm_application_exit')
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
	return invokeCommand('create_project', { input })
}

export async function createWorkspace(name: string): Promise<Workspace> {
	return invokeCommand('create_workspace', { input: { name } })
}

export async function deleteProject(projectId: string): Promise<void> {
	return invokeCommand('delete_project', { projectId })
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
	return invokeCommand('delete_time_entry', { entryId })
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
	return invokeCommand('delete_workspace', { workspaceId })
}

export async function listActiveTimeEntries(): Promise<TimeEntry[]> {
	return invokeCommand('list_active_time_entries')
}

export async function listProjects(workspaceId: string): Promise<Project[]> {
	return invokeCommand('list_projects', { workspaceId })
}

export async function listProjectTimeEntries(projectId: string): Promise<TimeEntry[]> {
	return invokeCommand('list_project_time_entries', { projectId })
}

export async function listTimeEntriesBetween(
	startedAfter: string,
	endedBefore: string,
): Promise<TimeEntry[]> {
	return invokeCommand('list_time_entries_between', {
		input: { endedBefore, startedAfter },
	})
}

export async function listWorkspaces(): Promise<Workspace[]> {
	return invokeCommand('list_workspaces')
}

export async function resumeTimeEntry(entryId: string): Promise<TimeEntry> {
	return invokeCommand('resume_time_entry', { entryId })
}

export async function setTrayLocale(locale: string): Promise<void> {
	return invokeCommand('set_tray_locale', { locale })
}

export async function startTimeEntry(input: StartTimeEntryInput): Promise<TimeEntry> {
	return invokeCommand('start_time_entry', { input })
}

export async function stopTimeEntry(entryId: string): Promise<TimeEntry> {
	return invokeCommand('stop_time_entry', { entryId })
}

export async function updateProject(
	projectId: string,
	input: UpdateProjectInput,
): Promise<Project> {
	return invokeCommand('update_project', { input, projectId })
}

export async function updateTimeEntry(
	entryId: string,
	input: UpdateTimeEntryInput,
): Promise<TimeEntry> {
	return invokeCommand('update_time_entry', { entryId, input })
}

export async function updateWorkspace(
	workspaceId: string,
	input: UpdateWorkspaceInput,
): Promise<Workspace> {
	return invokeCommand('update_workspace', { input, workspaceId })
}

async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	return invoke<T>(command, args)
}
