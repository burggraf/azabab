<script lang="ts">
	import type { Project, ProjectInstance, Site } from './interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
	import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons'
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
	}
	export let sites: Site[] = []

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

<pre>
	{JSON.stringify(project_instance,null,2)}
</pre>
	
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