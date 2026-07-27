import {
	ArrowLeftIcon,
	ArrowRightIcon,
	EllipsisHorizontalIcon,
	FolderIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { m } from '@/paraglide/messages.js'

import {
	type Project,
	type ProjectReference,
	WORKLOG_QUERY_KEYS,
	type WorkspaceReference,
	createProject,
	deleteProject,
	listProjects,
	updateProject,
} from '@/shared/api'
import { useLocale } from '@/shared/i18n'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Textarea,
} from '@/shared/ui'

type WorkspaceProjectsProps = {
	onBack: () => void
	onOpen: (project: ProjectReference) => void
	workspace: WorkspaceReference
}

type ProjectEditorDialogProps = {
	isSaving: boolean
	onClose: () => void
	onSave: (input: { description: string; name: string }) => void
	project: Project
}

type ProjectFormFieldsProps = {
	description: string
	descriptionId: string
	name: string
	nameId: string
	onDescriptionChange: (description: string) => void
	onNameChange: (name: string) => void
	className?: string
}

function ProjectFormFields({
	className,
	description,
	descriptionId,
	name,
	nameId,
	onDescriptionChange,
	onNameChange,
}: ProjectFormFieldsProps) {
	'use no memo'

	return (
		<div className={className}>
			<label className="block text-sm font-medium" htmlFor={nameId}>
				{m.projectFormName()}
			</label>
			<Input
				className="mt-2"
				id={nameId}
				maxLength={120}
				onChange={(event) => onNameChange(event.target.value)}
				required
				value={name}
			/>
			<label className="mt-4 block text-sm font-medium" htmlFor={descriptionId}>
				{m.projectFormDescription()}
			</label>
			<Textarea
				className="mt-2"
				id={descriptionId}
				maxLength={1000}
				onChange={(event) => onDescriptionChange(event.target.value)}
				value={description}
			/>
		</div>
	)
}

function ProjectEditorDialog({ isSaving, onClose, onSave, project }: ProjectEditorDialogProps) {
	'use no memo'

	const [description, setDescription] = useState(project.description ?? '')
	const [name, setName] = useState(project.name)

	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		onSave({ description, name })
	}

	return (
		<Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open>
			<DialogContent closeLabel={m.commonClose()}>
				<DialogHeader>
					<DialogTitle>{m.actionsEditProject()}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<ProjectFormFields
						description={description}
						descriptionId="edit-project-description"
						name={name}
						nameId="edit-project-name"
						onDescriptionChange={setDescription}
						onNameChange={setName}
					/>
					<DialogFooter className="mt-5">
						<Button onClick={onClose} type="button" variant="outline">
							{m.actionsCancel()}
						</Button>
						<Button disabled={isSaving} type="submit">
							{isSaving
								? m.commonSaving()
								: m.actionsSave()}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

type DeleteProjectDialogProps = {
	isDeleting: boolean
	onCancel: () => void
	onConfirm: () => void
	project: Project
}

function DeleteProjectDialog({
	isDeleting,
	onCancel,
	onConfirm,
	project,
}: DeleteProjectDialogProps) {
	'use no memo'

	return (
		<AlertDialog onOpenChange={(isOpen) => !isOpen && !isDeleting && onCancel()} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{m.actionsDeleteProject()}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{m.actionsDeleteProjectDescription({ name: project.name })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{m.actionsCancel()}</AlertDialogCancel>
					<AlertDialogAction disabled={isDeleting} onClick={onConfirm}>
						{isDeleting
							? m.commonSaving()
							: m.actionsDelete()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default function WorkspaceProjects({ onBack, onOpen, workspace }: WorkspaceProjectsProps) {
	'use no memo'

	useLocale()

	const queryClient = useQueryClient()
	const [description, setDescription] = useState('')
	const [deletingProject, setDeletingProject] = useState<Project | null>(null)
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [name, setName] = useState('')
	const projectsQuery = useQuery({
		queryFn: () => listProjects(workspace.id),
		queryKey: WORKLOG_QUERY_KEYS.projects(workspace.id),
	})
	const createMutation = useMutation({
		mutationFn: createProject,
		onSuccess: async (project) => {
			setDescription('')
			setName('')
			await queryClient.invalidateQueries({
				queryKey: WORKLOG_QUERY_KEYS.projects(workspace.id),
			})
			onOpen(project)
		},
	})
	const updateMutation = useMutation({
		mutationFn: ({
			input,
			projectId,
		}: {
			input: { description: string; name: string }
			projectId: string
		}) => updateProject(projectId, input),
		onSuccess: async () => {
			setEditingProject(null)
			await queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.projects(workspace.id) })
		},
	})
	const deleteMutation = useMutation({
		mutationFn: deleteProject,
		onSuccess: async () => {
			setDeletingProject(null)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.projects(workspace.id) }),
				queryClient.invalidateQueries({ queryKey: ['timeEntries'] }),
			])
		},
	})

	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		if (name.trim().length === 0) {
			return
		}
		createMutation.mutate({ description, name, workspaceId: workspace.id })
	}

	return (
		<section>
			{editingProject ? (
				<ProjectEditorDialog
					isSaving={updateMutation.isPending}
					onClose={() => setEditingProject(null)}
					onSave={(input) => updateMutation.mutate({ input, projectId: editingProject.id })}
					project={editingProject}
				/>
			) : null}
			{deletingProject ? (
				<DeleteProjectDialog
					isDeleting={deleteMutation.isPending}
					onCancel={() => setDeletingProject(null)}
					onConfirm={() => deleteMutation.mutate(deletingProject.id)}
					project={deletingProject}
				/>
			) : null}
			<Button onClick={onBack} variant="ghost">
				<ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
				{m.commonBackToWorkspaces()}
			</Button>
			<p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
				{m.screensProjectsEyebrow()}
			</p>
			<h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
				{workspace.name}
			</h1>
			<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
				{m.screensProjectsDescription()}
			</p>

			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div>
					{projectsQuery.isPending ? (
						<p className="text-sm text-muted-foreground">
							{m.commonLoading()}
						</p>
					) : null}
					{projectsQuery.isError ? (
						<p className="text-sm text-destructive" role="alert">
							{m.commonError()}
						</p>
					) : null}
					{projectsQuery.data?.length === 0 ? (
						<div className="grid min-h-56 place-items-center rounded-2xl border border-dashed bg-card/50 px-6 text-center">
							<div>
								<div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
									<FolderIcon aria-hidden="true" className="size-5" />
								</div>
								<h2 className="mt-4 font-heading text-base font-semibold">
									{m.screensProjectsEmptyTitle()}
								</h2>
							</div>
						</div>
					) : null}
					{projectsQuery.data && projectsQuery.data.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2">
							{projectsQuery.data.map((project) => (
								<div
									className="group relative rounded-2xl border bg-card transition-colors hover:border-primary/40 hover:bg-accent/35"
									key={project.id}
								>
									<button
										className="w-full p-5 pr-14 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
										onClick={() => onOpen(project)}
										type="button"
									>
										<div className="flex items-center gap-3">
											<FolderIcon aria-hidden="true" className="size-5 text-primary" />
											<span className="min-w-0 flex-1 truncate font-heading font-semibold">
												{project.name}
											</span>
											<ArrowRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
										</div>
										{project.description ? (
											<p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
												{project.description}
											</p>
										) : null}
									</button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												aria-label={m.actionsOpenMenu()}
												className="absolute top-3 right-3"
												size="icon-sm"
												variant="ghost"
											>
												<EllipsisHorizontalIcon aria-hidden="true" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onSelect={() => setEditingProject(project)}>
												<PencilSquareIcon aria-hidden="true" />
												{m.actionsEdit()}
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={() => setDeletingProject(project)}
												variant="destructive"
											>
												<TrashIcon aria-hidden="true" />
												{m.actionsDelete()}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}
						</div>
					) : null}
				</div>

				<form className="h-fit rounded-2xl border bg-card p-5" onSubmit={handleSubmit}>
					<h2 className="font-heading text-base font-semibold">
						{m.projectFormTitle()}
					</h2>
					<ProjectFormFields
						className="mt-5"
						description={description}
						descriptionId="project-description"
						name={name}
						nameId="project-name"
						onDescriptionChange={setDescription}
						onNameChange={setName}
					/>
					{createMutation.isError ? (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{m.commonCheckFields()}
						</p>
					) : null}
					<Button className="mt-4 w-full" disabled={createMutation.isPending} type="submit">
						<PlusIcon aria-hidden="true" data-icon="inline-start" />
						{createMutation.isPending
							? m.commonSaving()
							: m.projectFormSubmit()}
					</Button>
				</form>
			</div>
		</section>
	)
}
