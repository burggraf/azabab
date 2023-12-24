<script lang="ts">
	import type { Project, ProjectInstance, Site, StreamingBackupSite } from './interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import { dropdownmenu } from '$components/DropdownMenu'
	// import { globeOutline , closeCircleOutline} from 'ionicons/icons'
	import * as allIonicIcons from 'ionicons/icons'
	import { showConfirm } from '$services/alert.service'
	import { toast } from '$services/toast'
	import { goto } from '$app/navigation'
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
		logs_streaming_backup_location: ''
	}
	export let sites: Site[] = []
	export let streaming_backup_sites: StreamingBackupSite[] = []

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
	//db_streaming_backup_location
	//logs_streaming_backup_location
	const chooseStreamingBackupDBLocation = async (e: any) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('unset streaming_backup_site') 
					project_instance.db_streaming_backup_location = ''
				},
		}]
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			items.push({
				text: streaming_backup_site.name,
				icon: allIonicIcons.globeOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('chooseStreamingBackupLocation id', streaming_backup_site.id)
					project_instance.db_streaming_backup_location = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_site', result)
	}
	const chooseStreamingBackupLogsLocation = async (e: any) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('unset streaming_backup_site') 
					project_instance.logs_streaming_backup_location = ''
				},
		}]
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			items.push({
				text: streaming_backup_site.name,
				icon: allIonicIcons.globeOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('chooseStreamingBackupLocation id', streaming_backup_site.id)
					project_instance.logs_streaming_backup_location = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_site', result)
	}
	const getBackupLocationName = (id: string) => {
		if (!id) return 'Not enabled'
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			if (streaming_backup_site.id === id) return streaming_backup_site.name
		}
		return 'Not enabled'
	}
</script>
	
<ion-grid class="ion-padding Grid">
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
	<ion-row>
		<ion-col class="ion-text-center bold" style="background-color: var(--ion-color-dark); color: var(--ion-color-dark-contrast)">
			<ion-label>Streaming Backup Settings</ion-label>
		</ion-col>
	</ion-row>
	<ion-row>
		<ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
			<ion-label>Database</ion-label>
		</ion-col>
		<ion-col>
			<ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupDBLocation}>
				{getBackupLocationName(project_instance.db_streaming_backup_location)}
			</ion-button>
		</ion-col>
	</ion-row>
	<ion-row>
		<ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
			<ion-label>Logs</ion-label>
		</ion-col>
		<ion-col>
			<ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupLogsLocation}>
				{getBackupLocationName(project_instance.logs_streaming_backup_location)}
			</ion-button>
		</ion-col>
	</ion-row>
	
	<ion-row><ion-col>&nbsp;</ion-col></ion-row>
	<ion-row>
		<ion-col>
			<ion-button
				size="small"
				fill="outline"
				expand="block"
				color="danger"
				on:click={removeinstance}
			>
				Remove Instance
			</ion-button>
		</ion-col>
	</ion-row>
</ion-grid>
<style>
	.bold {
		font-weight: bold;
	}
</style>