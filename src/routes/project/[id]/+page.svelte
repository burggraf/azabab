<script lang="ts">
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import { arrowBackOutline, checkmarkOutline } from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
	import { toast } from '$services/toast'

	export let id = $page.params.id
	console.log('**** id', id)
	interface IObjectKeys {
		[key: string]: string | number
	}

	interface Project extends IObjectKeys {
		id: string
		domain: string
		name: string
		owner: string
		ownertype: string
	}
	interface ProjectInstance extends IObjectKeys {
		code: string
		domain: string
		id: string
		port: number
		site_domain: string
		site_name: string
		site_id: string
		type: string
	}
	interface Site {
		id: string
		name: string
		code: string
		domain: string
	}

	interface Key {
		id: string
		title: string
		sort_key: number
	}
	interface ProjectInstanceKey {
		id: string
		project_instance_id: string
		user_keys_id: string
		project_id: string
	}

	let keys: Key[] = []
	let project_instance_keys: ProjectInstanceKey[] = []

	let sites: Site[] = []
	const project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: $currentUser?.id,
		ownertype: 'person',
	}
	let project_instances: ProjectInstance[] = [
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
	const ionViewWillEnter = async () => {
		console.log('ionViewWillEnter')
		if (id !== 'new') {
			console.log('looking for projects with id', id)
			const record = await pb.collection('projects').getOne(id)
			console.log('project record', record)
			project.domain = record.domain
			project.name = record.name
			project.owner = record.owner
			project.ownertype = record.ownertype
			project_instances = await pb.collection('instance_view').getFullList({
				filter: `project_id = "${id}"`,
				fields: 'code, domain, id, port, site_domain, site_name, site_id, type',
			})
			console.log('project_instances', project_instances)
		}
		sites = await pb.collection('sites').getFullList({
			fields: 'id, name, code, domain',
		})
		if (id === 'new') {
			project_instances[0].id = sites[0].id
		}
		keys = await pb.collection('user_keys').getFullList({
			fields: 'id,title,key,sort_key',
			sort: 'sort_key',
		})
		console.log('keys', keys)
		loadProjectInstanceKeys()
	}
	const loadProjectInstanceKeys = async () => {
		project_instance_keys = await pb.collection('project_instance_keys').getFullList({
			filter: `project_id = "${id}"`,
			fields: 'id,project_instance_id,user_keys_id',
		})
		console.log('project_instance_keys', project_instance_keys)
	}
	const save = async () => {
		console.log('save')
		/*
        to create a new project, we need to send:

            data.project.owner
            data.project.name
            data.project.ownertype
            data.project.domain
            
            data.project_instances[0].id
            data.project_instances[0].type

            data.site.domain 
        */
		const site = sites.find((site) => site.id === project_instances[0].id)
		if (id === 'new') {
			console.log('creating new project')
			console.log('sending', {
				project,
				project_instances,
				site,
			})
			const { data, error } = await pb.send('/createproject', {
				method: 'POST',
				body: {
					project,
					project_instances,
					site,
				},
			})
			console.log('data, error', data, error)
			if (error) {
				if (error === 'constraint failed: UNIQUE constraint failed: projects.domain (2067)')
					toast('Project domain already exists', 'danger')
				else toast(error, 'danger')
			} else {
				// open the project in a new windows
				window.open(`https://${project.domain}.${site.domain}/_/`, '_blank')

				console.log('**** goto', `/project/${data}`)
				id = data
				goto(`/project/${data}`)
			}
			//const record = await pb.collection('projects').create(project)
			//console.log('record', record)
			// goto(`/project/${record.id}`)
			//goto("/projects")
		} else {
			//const result = await pb.collection('projects').update(id, project)
			//console.log('result', result)
			//goto("/projects")
		}
	}
	const back = async () => {
		goto('/projects')
	}
	const handleChange = async (event: any) => {
		console.log('id', event.target.id)
		console.log('handleChange', event.target.value)
		console.log(event)
		project[event.target.id] = event.target.value || ''
	}
	const chooseSite = async (e: any) => {
		let items = []
		for (let i = 0; i < sites.length; i++) {
			const site = sites[i]
			items.push({
				text: site.name,
				icon: allIonicIcons.globeOutline,
				handler: async () => {
					project_instances[0].id = site.id
					project_instances[0].site_name = site.name
					project_instances[0].site_domain = site.domain
				},
			})
		}
		const result = await dropdownmenu(e, items)
		// console.log('result', result)
	}

	const siteChange = async (event: any) => {
		console.log('siteChange', event.target.value)
		console.log(event)
		const fieldname = event.target.id.split('_')[0]
		const index = event.target.id.split('_')[1]
		project_instances[index][fieldname] = event.target.value || ''
	}
	const toggleKey = async (user_keys_id: string, project_instance_id: string) => {
		console.log('toggleKey', id)
		// add or remove the key from the project_instance_keys collection
		const project_instance_key = project_instance_keys.find((project_instance_key) => {
			return project_instance_key.user_keys_id === user_keys_id
		})
		console.log('*** project_instance_key', project_instance_key)
		if (project_instance_key) {
			console.log('key was found, remove it, id', project_instance_key.id)
			// remove it
			const result = await pb.collection('project_instance_keys').delete(project_instance_key.id)
		} else {
			console.log('key was not found, add it')
			// add it
			const payload = {
				project_instance_id: project_instance_id,
				user_keys_id: user_keys_id,
				user_id: $currentUser.id,
				project_id: id,
			}
			console.log('payload', payload)
			const result = await pb.collection('project_instance_keys').create(payload)
			console.log('toggleKey result', result)
		}
		const { data, error } = await pb.send(`/create-ssh-keys/${project_instance_id}`, {
			method: 'GET',
		})
		if (error) {
			toast(error, 'danger')
		} else {
			toast('SSH Keys updated for this project', 'success')
		}
		loadProjectInstanceKeys()
	}
</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar>
			<ion-buttons slot="start">
				<ion-button on:click={back}>
					<ion-icon slot="icon-only" icon={arrowBackOutline} />
				</ion-button>
			</ion-buttons>
			<ion-title>Project</ion-title>
			<ion-buttons slot="end">
				{#if id === 'new'}
					<ion-button on:click={save}>
						<ion-icon slot="icon-only" icon={checkmarkOutline} />
					</ion-button>
				{/if}
			</ion-buttons></ion-toolbar
		>
	</ion-header>
	<ion-content class="ion-padding">
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
						<!-- <ion-icon
							class="inputIcon"
							icon={}
							size="large"
							color="medium"
							slot="start"
						/> -->
					</ion-item>
				</ion-col>
			</ion-row>

			<ion-row>
				<ion-col>
					<ion-label>domain</ion-label>
				</ion-col>
			</ion-row>
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
						<!-- <ion-icon
							class="inputIcon"
							icon={}
							size="large"
							color="medium"
							slot="start"
						/> -->
					</ion-item>
				</ion-col>
			</ion-row>
		</ion-grid>

		<ion-grid class="ion-padding Grid">
			<ion-row>
				<ion-col>
					<ion-label>Instances</ion-label>
				</ion-col>
			</ion-row>
			{#each project_instances as project_instance, index}
				<!-- code, domain, id, port, site_domain, site_name, type -->
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
				<ion-row>
					<ion-col>
						<ion-button size="small" expand="block" on:click={chooseSite}
							>{project_instance.site_name}</ion-button
						>
					</ion-col>
				</ion-row>

				<ion-row>
					<ion-col>
						<ion-label>SSH Keys</ion-label>
					</ion-col>
				</ion-row>
				<!-- code, domain, id, port, site_domain, site_name, type -->
				<ion-row>
					<ion-col>
						{#each keys as key, index}
							<ion-chip
								outline={project_instance_keys.find((project_instance_key) => {
									return project_instance_key.user_keys_id === key.id
								})
									? false
									: true}
								on:click={() => {
									toggleKey(key.id, project_instance.id)
								}}>{key.title}</ion-chip
							>
						{/each}
					</ion-col>
				</ion-row>
			{/each}
		</ion-grid>

		<!-- project: {JSON.stringify(project)}
        <br />
        project_instances: {JSON.stringify(project_instances)} -->
	</ion-content>
</IonPage>

<style>
	.title {
		padding-left: 10px;
	}
	.container {
		width: 150px;
		height: 150px;
		border: 1px solid; /* Optional, just for visibility */
		border-color: var(--ion-color-medium);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container ion-img {
		max-width: 100%;
		max-height: 100%;
	}
	.Grid {
		max-width: 500px;
	}
	.ProvidersGrid {
		max-width: 375px;
	}
	input:-webkit-autofill {
		-webkit-text-fill-color: var(--ion-color-FORCEDARK);
		font-weight: 500px;
	}

	input:-webkit-autofill:focus {
		-webkit-text-fill-color: var(--ion-color-FORCEDARK);
		font-weight: 500px;
	}

	.inputIcon {
		margin-left: 10px;
		margin-right: 10px;
	}

	.GridItem {
		--padding-start: 0px;
		--padding-end: 0px;
		--inner-padding-end: 0px;
	}
	.loginInputBoxWithIcon {
		height: 50px;
		border: 1px solid;
		border-color: var(--ion-color-medium);
		background-color: var(--ion-background-color) !important;
		border-radius: 5px;
	}
	.toast {
		font-weight: bold;
	}
	.flex-container {
		display: flex;
		display: -webkit-flex;
		display: -moz-flex;
		flex-flow: row wrap;
		-webkit-flex-flow: row wrap;
		-moz-flex-flow: row wrap;
		justify-content: center;
	}
</style>
