import { Suspense, lazy, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type AppSection, AppShell } from '@/app/layout'
import { OverviewPage } from '@/features/overview'
import { type ProjectReference, type WorkspaceReference } from '@/shared/api'

const WorkspacesPage = lazy(async () => {
	const module = await import('@/features/workspaces')
	return { default: module.WorkspacesPage }
})

export default function App() {
	const [activeSection, setActiveSection] = useState<AppSection>('overview')
	const [project, setProject] = useState<ProjectReference | null>(null)
	const [workspace, setWorkspace] = useState<WorkspaceReference | null>(null)
	const { t } = useTranslation()

	function navigate(section: AppSection): void {
		setActiveSection(section)
		if (section === 'workspaces') {
			setProject(null)
			setWorkspace(null)
		}
	}

	function openProject(nextWorkspace: WorkspaceReference, nextProject: ProjectReference): void {
		setProject(nextProject)
		setWorkspace(nextWorkspace)
		setActiveSection('workspaces')
	}

	return (
		<AppShell activeSection={activeSection} onNavigate={navigate}>
			{activeSection === 'overview' ? (
				<OverviewPage onOpenProject={openProject} />
			) : (
				<Suspense fallback={<p className="text-sm text-muted-foreground">{t('common.loading')}</p>}>
					<WorkspacesPage
						onProjectChange={setProject}
						onWorkspaceChange={setWorkspace}
						project={project}
						workspace={workspace}
					/>
				</Suspense>
			)}
		</AppShell>
	)
}
