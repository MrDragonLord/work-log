import { Suspense, lazy, useEffect, useState } from 'react'
import * as m from '@/paraglide/messages.js'

import { type AppSection, AppShell } from '@/app/layout'
import { OverviewPage } from '@/features/overview'
import { type ProjectReference, type WorkspaceReference } from '@/shared/api'
import { useLocale } from '@/shared/i18n'

const WorkspacesPage = lazy(async () => {
	const module = await import('@/features/workspaces')
	return { default: module.WorkspacesPage }
})

const LANGUAGE_CHANGE_SECTION_KEY = 'worklog.languageChange.section'

function resolveInitialSection(): AppSection {
	if (typeof sessionStorage === 'undefined') {
		return 'overview'
	}

	return sessionStorage.getItem(LANGUAGE_CHANGE_SECTION_KEY) === 'workspaces'
		? 'workspaces'
		: 'overview'
}

export default function App() {
	'use no memo'

	const [activeSection, setActiveSection] = useState<AppSection>(resolveInitialSection)
	const [project, setProject] = useState<ProjectReference | null>(null)
	const [workspace, setWorkspace] = useState<WorkspaceReference | null>(null)
	const locale = useLocale()

	useEffect(() => {
		sessionStorage.setItem(LANGUAGE_CHANGE_SECTION_KEY, activeSection)
	}, [activeSection])

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
		<AppShell activeSection={activeSection} locale={locale} onNavigate={navigate}>
			{activeSection === 'overview' ? (
				<OverviewPage onOpenProject={openProject} />
			) : (
				<Suspense
					fallback={
						<p className="text-sm text-muted-foreground">
							{m.commonLoading()}
						</p>
					}
				>
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
