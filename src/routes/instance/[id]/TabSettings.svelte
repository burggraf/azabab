<script lang="ts">
	import type { Project, ProjectInstance, Site, StreamingBackupSite } from '$models/interfaces'
	import { currentUser, pb } from '$services/backend.service'
	// import TabSettingsStreamingBackup from './TabSettingsStreamingBackup.svelte';
	import * as allIonicIcons from 'ionicons/icons'

	import { showConfirm } from '$services/alert.service'
	import { toast } from '$services/toast'
	import { goto } from '$app/navigation'
	import { cloudDownloadOutline, cloudUploadOutline, trashOutline } from 'ionicons/icons'
	import { instanceTab } from './instanceTabStore'
	import { dropdownmenu } from '$components/DropdownMenu'

	export let project_instance: ProjectInstance = {
		name: '',
		project_id: '',
		owner: '',
		ownertype: '',
		code: '',
		domain: '',
		id: '',
		port: 0,
		site_domain: '',
		site_name: 'Select a site',
		site_id: '',
		type: 'primary',
		db_streaming_backup_location: '',
		logs_streaming_backup_location: '',
		db_streaming_backup_retention: 0,
		logs_streaming_backup_retention: 0,
		instance_status: ''
	}
	export let sites: Site[] = []
	export let projectInstances: any[] = []
	export let streaming_backup_sites: StreamingBackupSite[] = []
	instanceTab.subscribe((value: string) => {
		if (value === 'settings') {
			console.log('INSTANCE TAB SETTINGS')
		}
	})

	const removeinstance = async () => {
		console.log('removeinstance')
		console.log('project_instance', project_instance)
		console.log('sites', sites)
		if (projectInstances.length > 1 && project_instance.type === 'primary') {
			toast('You cannot remove the primary instance if there are existing replicas', 'danger')
			return
		}
		if (project_instance.db_streaming_backup_location || 
			project_instance.logs_streaming_backup_location) {
			toast('You cannot remove an instance with streaming backups enabled', 'danger')
			return
		}
		await showConfirm({
			header: 'Remove Project Instance',
			message: `Are you SURE?  This cannot be undone.  If this is the last instance, the project will also be removed.`,
			okHandler: async () => {
				console.log('calling /removeproject')
				const { data, error } = await pb.send('/removeproject', {
					method: 'POST',
					body: {
						project_instance: project_instance,
					},
				})

				// we need to call setup-marmot to reconfigure marmot
				// this will delete marmot if there is only one instance left
				// it will also remove sync files if there is only one instance left
				console.log('********************');
				console.log(`/setup-marmot/${project_instance.project_id}`)
				console.log('********************');
				const { data:setupMarmotData, error:setupMarmotError } = 
					await pb.send(`/setup-marmot/${project_instance.project_id}`, {
					method: 'GET',
				})
				if (setupMarmotError) {
					console.log('/setup-marmot error', setupMarmotError)
					toast(JSON.stringify(setupMarmotError), 'danger')
				} else {
					console.log('/setup-marmot data', setupMarmotData)
				}

				console.log('data', data)
				console.log('typeof data', typeof data)
				console.log('error', error)
				if (error) {
					toast('Error: ' + JSON.stringify(error), 'danger')
				} else {
					if (data === '0') {
						toast(`Project ${project_instance.name} removed`, 'success')
						goto('/projects')
					} else {
						toast(`Project instance removed, ${data} instances remain`, 'success')
						goto('/project/' + project_instance.project_id)
					}
				}
			},
		})
	}
	const sync = async (direction: string) => {
		const { data, error } = await pb.send(`/sync/${project_instance.id}/${direction}`, {
			method: 'GET',
		})
		console.log('error', error)
		console.log('data', data)
	}
	const changeStatus = async (e: any) => {
		let items = [
			{
				text: 'Online',
				icon: allIonicIcons.cloudOutline,
				color: 'success',
				disabled: (project_instance.instance_status === 'online'),
				// textcolor: 'dark',
				handler: async () => {
					await toggleinstance('online')
				},
			},
			{
				text: 'Offline',
				icon: allIonicIcons.cloudOfflineOutline,
				color: 'danger',
				disabled: (project_instance.instance_status === 'offline'),
				// textcolor: 'dark',
				handler: async () => {
					await toggleinstance('offline')
				},
			},
			{
				text: 'Maintenance Mode',
				icon: allIonicIcons.cloudOfflineOutline,
				color: 'warning',
				disabled: (project_instance.instance_status === 'maintenance'),
				// textcolor: 'dark',
				handler: async () => {
					await toggleinstance('maintenance')
				},
			}

		]
		const result = await dropdownmenu(e, items)
		console.log('*** you chose status', result)
	}
	const toggleinstance = async (status: string) => {
		console.log('calling hook /toggleinstance')
		const { data, error } = await pb.send(`/toggleinstance`, {
			method: 'POST',
			body: {
				instance_id: project_instance.id,
				status: status,
			},
		})
		console.log('toggleinstance hook error', error)
		console.log('toggleinstance hook data', data)
		if (data === 'OK') {
			project_instance.instance_status = status
		}
	}

</script>

<ion-grid class="ion-padding Grid" style="height: 100%;overflow-x: scroll;">
	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Project Name</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project_instance.name}</ion-label>
		</ion-col>
	</ion-row>

	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Domain</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project_instance.domain}.{project_instance.site_domain}</ion-label>
		</ion-col>
	</ion-row>

	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Site</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project_instance.site_name}</ion-label>
		</ion-col>
	</ion-row>
	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Instance Type</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project_instance.type}</ion-label>
		</ion-col>
	</ion-row>

	<ion-row>
		<ion-col class="ion-text-right bold" style="padding-top: 12px;">
			<ion-label>Instance Status</ion-label>
		</ion-col>
		<ion-col>
			<ion-button size="small" color={
				project_instance.instance_status === 'online' ? 'success' : 
				project_instance.instance_status === 'offline' ? 'danger' : 'warning'
			} expand="block" on:click={changeStatus}
				>{project_instance.instance_status || 'unknown'}</ion-button
			>
		</ion-col>
	</ion-row>

	<ion-row><ion-col>&nbsp;</ion-col></ion-row>

	{#if projectInstances.length < 2}
	<ion-button
		size="small"
		expand="block"
		on:click={() => {
			goto(`/streamingbackups/${project_instance.id}`)
		}}>Streaming Backups</ion-button
	>
	{:else}
		<ion-row>
		<ion-col>
			<div><b>Streaming backups are disabled if you have more than one instance.</b>  Streaming backups require a database lock that interferes with multi-instance replication.</div>
		</ion-col>
		</ion-row>
	{/if}
</ion-grid>
<!-- <ion-footer class="ion-padding ion-text-left" style="background-color: var(--ion-color-light);border-top: 0.1px solid;"> -->
<ion-footer>
	<ion-toolbar color="light">
		<ion-buttons slot="start">
			<ion-button size="small" color="danger" on:click={removeinstance}>
				<ion-icon slot="icon-only" icon={trashOutline} />
				&nbsp;&nbsp;Remove Instance
			</ion-button>
		</ion-buttons>
		<!-- <ion-buttons slot="end">
			{#if projectInstances.length > 1}
				<ion-button
					size="small"
					color="primary"
					on:click={() => {
						sync('up')
					}}
				>
					<ion-icon slot="icon-only" icon={cloudUploadOutline} />
				</ion-button>&nbsp;&nbsp;
				<ion-button
					size="small"
					color="primary"
					on:click={() => {
						sync('down')
					}}
				>
					<ion-icon slot="icon-only" icon={cloudDownloadOutline} />
				</ion-button>
			{/if}
		</ion-buttons> -->
	</ion-toolbar>
</ion-footer>

<style>
	.bold {
		font-weight: bold;
	}
</style>
