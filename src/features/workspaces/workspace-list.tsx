import {
	ArrowRightIcon,
	BuildingOffice2Icon,
	EllipsisHorizontalIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { m } from '@/paraglide/messages.js'

import {
	WORKLOG_QUERY_KEYS,
	type Workspace,
	createWorkspace,
	deleteWorkspace,
	listWorkspaces,
	updateWorkspace,
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
} from '@/shared/ui'

type WorkspaceListProps = {
	onOpen: (workspace: Workspace) => void
}

type WorkspaceEditorDialogProps = {
	isSaving: boolean
	onClose: () => void
	onSave: (name: string) => void
	workspace: Workspace
}

function WorkspaceEditorDialog({
	isSaving,
	onClose,
	onSave,
	workspace,
}: WorkspaceEditorDialogProps) {
	'use no memo'

	const [name, setName] = useState(workspace.name)

	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		onSave(name)
	}

	return (
		<Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open>
			<DialogContent closeLabel={m.commonClose()}>
				<DialogHeader>
					<DialogTitle>{m.actionsEditWorkspace()}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<label className="block text-sm font-medium" htmlFor="edit-workspace-name">
						{m.workspaceFormName()}
					</label>
					<Input
						className="mt-2"
						id="edit-workspace-name"
						maxLength={120}
						onChange={(event) => setName(event.target.value)}
						required
						value={name}
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

type DeleteWorkspaceDialogProps = {
	isDeleting: boolean
	onCancel: () => void
	onConfirm: () => void
	workspace: Workspace
}

function DeleteWorkspaceDialog({
	isDeleting,
	onCancel,
	onConfirm,
	workspace,
}: DeleteWorkspaceDialogProps) {
	'use no memo'

	return (
		<AlertDialog onOpenChange={(isOpen) => !isOpen && !isDeleting && onCancel()} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{m.actionsDeleteWorkspace()}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{m.actionsDeleteWorkspaceDescription({ name: workspace.name })}
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

export default function WorkspaceList({ onOpen }: WorkspaceListProps) {
	'use no memo'

	useLocale()

	const queryClient = useQueryClient()
	const [name, setName] = useState('')
	const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)
	const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
	const workspacesQuery = useQuery({
		queryFn: listWorkspaces,
		queryKey: WORKLOG_QUERY_KEYS.workspaces,
	})
	const createMutation = useMutation({
		mutationFn: createWorkspace,
		onSuccess: async (workspace) => {
			setName('')
			await queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.workspaces })
			onOpen(workspace)
		},
	})
	const updateMutation = useMutation({
		mutationFn: ({ name: nextName, workspaceId }: { name: string; workspaceId: string }) =>
			updateWorkspace(workspaceId, { name: nextName }),
		onSuccess: async () => {
			setEditingWorkspace(null)
			await queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.workspaces })
		},
	})
	const deleteMutation = useMutation({
		mutationFn: deleteWorkspace,
		onSuccess: async () => {
			setDeletingWorkspace(null)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.workspaces }),
				queryClient.invalidateQueries({ queryKey: ['timeEntries'] }),
			])
		},
	})

	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		const normalizedName = name.trim()
		if (normalizedName.length === 0) {
			return
		}
		createMutation.mutate(normalizedName)
	}

	return (
		<section>
			{editingWorkspace ? (
				<WorkspaceEditorDialog
					isSaving={updateMutation.isPending}
					onClose={() => setEditingWorkspace(null)}
					onSave={(nextName) =>
						updateMutation.mutate({ name: nextName, workspaceId: editingWorkspace.id })
					}
					workspace={editingWorkspace}
				/>
			) : null}
			{deletingWorkspace ? (
				<DeleteWorkspaceDialog
					isDeleting={deleteMutation.isPending}
					onCancel={() => setDeletingWorkspace(null)}
					onConfirm={() => deleteMutation.mutate(deletingWorkspace.id)}
					workspace={deletingWorkspace}
				/>
			) : null}
			<div className="max-w-2xl">
				<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
					{m.screensWorkspacesEyebrow()}
				</p>
				<h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
					{m.screensWorkspacesTitle()}
				</h1>
				<p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
					{m.screensWorkspacesDescription()}
				</p>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div>
					{workspacesQuery.isPending ? (
						<p className="text-sm text-muted-foreground">
							{m.commonLoading()}
						</p>
					) : null}
					{workspacesQuery.isError ? (
						<p className="text-sm text-destructive" role="alert">
							{m.commonError()}
						</p>
					) : null}
					{workspacesQuery.data?.length === 0 ? (
						<div className="grid min-h-56 place-items-center rounded-2xl border border-dashed bg-card/50 px-6 text-center">
							<div>
								<div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
									<BuildingOffice2Icon aria-hidden="true" className="size-5" />
								</div>
								<h2 className="mt-4 font-heading text-base font-semibold">
									{m.screensWorkspacesEmptyTitle()}
								</h2>
								<p className="mt-1.5 text-sm text-muted-foreground">
									{m.screensWorkspacesEmptyDescription()}
								</p>
							</div>
						</div>
					) : null}
					{workspacesQuery.data && workspacesQuery.data.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2">
							{workspacesQuery.data.map((workspace) => (
								<div
									className="group relative flex min-h-28 items-center rounded-2xl border bg-card transition-colors hover:border-primary/40 hover:bg-accent/35"
									key={workspace.id}
								>
									<button
										className="flex min-h-28 w-full items-center gap-4 p-5 pr-14 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
										onClick={() => onOpen(workspace)}
										type="button"
									>
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
											<BuildingOffice2Icon aria-hidden="true" className="size-5" />
										</div>
										<span className="min-w-0 flex-1 truncate font-heading font-semibold">
											{workspace.name}
										</span>
										<ArrowRightIcon
											aria-hidden="true"
											className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
										/>
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
											<DropdownMenuItem onSelect={() => setEditingWorkspace(workspace)}>
												<PencilSquareIcon aria-hidden="true" />
												{m.actionsEdit()}
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={() => setDeletingWorkspace(workspace)}
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
						{m.workspaceFormTitle()}
					</h2>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						{m.workspaceFormDescription()}
					</p>
					<label className="mt-5 block text-sm font-medium" htmlFor="workspace-name">
						{m.workspaceFormName()}
					</label>
					<Input
						autoComplete="off"
						className="mt-2"
						id="workspace-name"
						maxLength={120}
						onChange={(event) => setName(event.target.value)}
						placeholder={m.workspaceFormNamePlaceholder()}
						required
						value={name}
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
							: m.workspaceFormSubmit()}
					</Button>
				</form>
			</div>
		</section>
	)
}
