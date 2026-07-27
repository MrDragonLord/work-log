import { type ProjectReference, type WorkspaceReference } from '@/shared/api'

import ProjectTimers from './project-timers'
import WorkspaceList from './workspace-list'
import WorkspaceProjects from './workspace-projects'

type WorkspacesPageProps = {
	onProjectChange: (project: ProjectReference | null) => void
	onWorkspaceChange: (workspace: WorkspaceReference | null) => void
	project: ProjectReference | null
	workspace: WorkspaceReference | null
}

function WorkspacesPage({
	onProjectChange,
	onWorkspaceChange,
	project,
	workspace,
}: WorkspacesPageProps) {
	if (workspace === null) {
		return <WorkspaceList onOpen={onWorkspaceChange} />
	}

	if (project === null) {
		return (
			<WorkspaceProjects
				onBack={() => onWorkspaceChange(null)}
				onOpen={onProjectChange}
				workspace={workspace}
			/>
		)
	}

	return (
		<ProjectTimers onBack={() => onProjectChange(null)} project={project} workspace={workspace} />
	)
}

export default WorkspacesPage
