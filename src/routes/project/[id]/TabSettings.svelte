<script lang="ts">
	import type { Project, ProjectInstance, Site } from './interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
	import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons'
	import { checkDomainAvailability } from './project-utils'
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
	export let project_instances: ProjectInstance[] = [
		{
			code: '',
			domain: '',
			id: '',
			port: 0,
			site_domain: '',
			site_name: 'Select a site',
			site_id: '',
			type: 'primary',
		},
	]
	export let sites: Site[] = []
	$: domainAvailable = false

	const handleChange = async (event: any) => {
		const field = event.target.id
		const value = event.target.value || ''
		// if field is domain, strip out anything other than a-z 0-9 and -
		if (field === 'domain') {
			project[field] = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
			domainAvailable = await checkDomainAvailability(project)
		} else if (field === 'name' && project?.id !== '') {
			project[field] = value
			try {
				const result = await pb.collection('projects').update(project?.id, {name: value});			
			} catch (err) {
				console.error('error updating project name', err)
			}
		} 
		else {
			project[field] = value
		}
	}
	const chooseSite = async (e: any) => {
		let items = []
		for (let i = 0; i < sites.length; i++) {
			const site = sites[i]
			items.push({
				text: site.name,
				icon: allIonicIcons.globeOutline,
				color: site.active ? 'primary' : 'medium',
				textcolor: site.active ? 'primary' : 'medium',
				handler: async () => {
					project_instances[0].id = site.id
					project_instances[0].site_name = site.name
					project_instances[0].site_domain = site.domain
				},
			})
		}
		const result = await dropdownmenu(e, items)
	}
	const removeinstance = async () => {
		console.log('removeinstance')
		console.log('project_instance', project_instances[0])
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
						project_instance: project_instances[0],
					},
				})
                console.log('data', data)
                console.log('typeof data', typeof data)
                console.log('error', error)
                if (error) {
                    toast('Error: ' + JSON.stringify(error), 'danger')
                } else {
                    if (data === "0") {
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

<ion-grid class="ion-padding Grid">
	<ion-row>
		<ion-col>
			<ion-label>Project Name</ion-label>
		</ion-col>
	</ion-row>
	<ion-row>
		<ion-col>
			<ion-item class="GridItem" lines="none">
				<ion-input
					on:ionInput={handleChange}
					class="loginInputBoxWithIcon"
					type="text"
					id="name"
					placeholder="Project Name"
					style="--padding-start: 10px;"
					value={project.name}
					debounce={500}
				/>
			</ion-item>
		</ion-col>
	</ion-row>

	<ion-row>
		<ion-col>
			<ion-label>Domain</ion-label>
		</ion-col>
	</ion-row>
	{#if project?.id === ''}
		<ion-row>
			<ion-col>
				<ion-item class="GridItem" lines="none">
					<ion-input
						on:ionInput={handleChange}
						class="loginInputBoxWithIcon"
						type="text"
						id="domain"
						placeholder="domain"
						style="--padding-start: 10px;"
						value={project.domain}
						debounce={500}
					/>
				</ion-item>
			</ion-col>
		</ion-row>
	{:else}
		<ion-row>
			<ion-col>
				<div class="loginInputBoxWithIcon" style="padding-left: 10px;padding-top:15px; background-color: var(--ion-color-light) !important;">
					<ion-label>{project.domain}</ion-label>
				</div>
			</ion-col>
		</ion-row>
	{/if}

	{#if project?.id === '' && project?.domain.trim().length > 0}
		<ion-row>
			<ion-col>
				<ion-label color={domainAvailable ? 'success' : 'danger'} style="padding-left: 20px;">
					{domainAvailable ? 'Domain is available' : 'Domain is not available'}
					<ion-icon
						color={domainAvailable ? 'success' : 'danger'}
						icon={domainAvailable ? checkmarkCircleOutline : closeCircleOutline}
						style=""
					/>
				</ion-label>
			</ion-col>
		</ion-row>
	{/if}
	<ion-row style="padding-top: 20px;">
		<ion-col
			class="ion-text-center"
			style="width: 100%;border: 1px solid;background-color: var(--ion-color-dark);"
		>
			<ion-label color="light"><b>Instances</b></ion-label>
		</ion-col>
	</ion-row>
	{#each project_instances as project_instance, index}
		<ion-row>
			<ion-col class="ion-text-center">
				<ion-label>Instance {index + 1}</ion-label>
			</ion-col>
		</ion-row>
		<ion-row>
			<ion-col>
				<ion-button size="small" expand="block" on:click={chooseSite}
					>{project_instance.site_name}</ion-button
				>
			</ion-col>
		</ion-row>
		<ion-row>
			<ion-col>
				<ion-button
					size="small"
					fill={project_instance.type === 'primary' ? 'solid' : 'outline'}
					expand="block"
					on:click={() => {}}
				>
					primary
				</ion-button>
			</ion-col>
			<ion-col>
				<ion-button
					size="small"
					fill={project_instance.type === 'replica' ? 'solid' : 'outline'}
					expand="block"
					on:click={() => {}}
				>
					replica
				</ion-button>
			</ion-col>
		</ion-row>
		<ion-row><ion-col style="width: 100%;border-top: 1px solid;">&nbsp;</ion-col></ion-row>
		{#if project?.id !== ''}
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
		{/if}
	{/each}
</ion-grid>
