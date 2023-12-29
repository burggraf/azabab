<script lang="ts">
	import type { Project, ProjectInstance, Site, StreamingBackupSite } from '../../../models/'
	import { currentUser, pb } from '$services/backend.service'
	// import TabSettingsStreamingBackup from './TabSettingsStreamingBackup.svelte';

	import { showConfirm } from '$services/alert.service'
	import { toast } from '$services/toast'
	import { goto } from '$app/navigation'
	import { trashOutline } from 'ionicons/icons'
	import { instanceTab } from './instanceTabStore'

	export let project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: $currentUser?.id,
		ownertype: 'person',
	}
	export let project_instance: ProjectInstance = {
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
		logs_streaming_backup_retention: 0
	}
	export let sites: Site[] = []
	export let streaming_backup_sites: StreamingBackupSite[] = []
    instanceTab.subscribe((value: string) => {
        if (value === 'settings') {
            console.log('INSTANCE TAB SETTINGS')
        }
    })

	const removeinstance = async () => {
		console.log('removeinstance')
		console.log('project_instance', project_instance)
		console.log('project', project)
		console.log('sites', sites)

		await showConfirm({
			header: 'Remove Project Instance',
			message: `Are you SURE?  This cannot be undone.  If this is the last instance, the project will also be removed.`,
			okHandler: async () => {
				console.log('calling /removeproject')
				const { data, error } = await pb.send('/removeproject', {
					method: 'POST',
					body: {
						project,
						project_instance: project_instance,
					},
				})
				console.log('data', data)
				console.log('typeof data', typeof data)
				console.log('error', error)
				if (error) {
					toast('Error: ' + JSON.stringify(error), 'danger')
				} else {
					if (data === '0') {
						toast(`Project ${project.name} removed`, 'success')
						goto('/projects')
					} else {
						toast(`Project instance removed, ${data} instances remain`, 'success')
					}
				}
			},
		})
	}
</script>
	
<ion-grid class="ion-padding Grid" style="height: 100%;overflow-x: scroll;">
	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Project Name</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project.name}</ion-label>			
		</ion-col>
	</ion-row>

	<ion-row>
		<ion-col class="ion-text-right bold">
			<ion-label>Domain</ion-label>
		</ion-col>
		<ion-col>
			<ion-label>{project.domain}.{project_instance.site_domain}</ion-label>
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
			<ion-label>primary</ion-label>
		</ion-col>
	</ion-row>
	<ion-row><ion-col>&nbsp;</ion-col></ion-row>

	<ion-button size="small" expand="block" on:click={()=>{goto(`/streamingbackups/${project_instance.id}`)}}>Streaming Backups</ion-button>
	
</ion-grid>
<ion-footer class="ion-padding ion-text-left" style="background-color: var(--ion-color-light);border-top: 0.1px solid;">
	<ion-button
		size="small"
		color="danger"
		on:click={removeinstance}
	>
	<ion-icon slot="icon-only" icon={trashOutline} />
		&nbsp;&nbsp;Remove Instance
	</ion-button>
</ion-footer>
<style>
	.bold {
		font-weight: bold;
	}
</style>