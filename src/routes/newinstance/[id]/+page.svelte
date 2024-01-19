<script lang="ts">
	import '$styles/grid-styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import * as allIonicIcons from 'ionicons/icons'
	import { arrowBackOutline } from 'ionicons/icons'
	import { pb, currentUser } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
	import { dropdownmenu } from '$components/DropdownMenu'
	export let project_id = $page.params.id

	import type { ProjectInstance, Site, Project } from '$models/interfaces'
	import { loadingBox } from '$services/loadingMessage'

	let sites: Site[] = []
	const project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: '',
		ownertype: 'person',
		port: 0,
		type: 'production'
	}
	let project_instance: ProjectInstance = 
	{
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
		type: 'Select instance type',
		db_streaming_backup_location: '',
		logs_streaming_backup_location: '',
		db_streaming_backup_retention: 0,
		logs_streaming_backup_retention: 0,
		instance_status: ''
	};

	onMount(async () => {
		console.log('*** newproject onMount')
	})
	let existingInstances: any = []
	let existingInstanceRecords: any[] = []
	let primary_instance_id = ''
	const ionViewWillEnter = async () => {
		console.log('*** ionViewWillEnter')		
		if (!$currentUser) {
			goto('/');
		}
		localStorage.setItem('page', window.location.pathname)
		const record = await pb.collection('projects').getOne(project_id, {
			expand: 'id,domain,name,owner,ownertype,port,type',
		})
		if (record) {
			for (let attr in project) {
				console.log('attr', attr, record[attr])
				project[attr] = record[attr]
				if (attr !== 'id') project_instance[attr] = record[attr]
			}
		} else {
			toast('Project not found', 'danger')
			goto('/projects')
		}
		existingInstanceRecords = await pb.collection('instance_view').getFullList({
			filter: `project_id="${project_id}"`,
			fields: 'site_id, site_name, type, id',
		})
		if (existingInstanceRecords) {
			for (let instance of existingInstanceRecords) {
				existingInstances.push(instance.site_id)
			}
			primary_instance_id =
				existingInstanceRecords.find((record) => record.type === 'primary')?.id || ''
			console.log('primary_instance_id', primary_instance_id)
		}
		console.log('existingInstanceRecords', existingInstanceRecords)
		console.log('existingInstances', existingInstances)
		sites = await pb.collection('sites').getFullList({
			fields: 'id, name, code, domain, active',
		})
		console.log('sites', sites)
		// if (id === 'new') {
		// 	project_instance[0].id = sites[0].id
		// }
	}

	const save = async () => {
		console.log('save')
		console.log('project_instance 1', project_instance)
		if (project_instance.project_id === '') {
			project_instance.project_id = project_id
		}
		console.log('project_instance 2', project_instance)
		let loader = await loadingBox('Creating new instance...')

        const { data, error } = await pb.send('/createinstance', {
			method: 'POST',
			body: {
				project_instance,
			},
		})
        loader.dismiss();
		console.log('createinstance data', data)
		console.log('createinstance error', error)
		if (error) {
			console.log('/createinstance error', error)
			toast(JSON.stringify(error), 'danger')
		} else {
			// open the project in a new window
			// window.open(`https://${project.domain}.${project_instance.site_domain}/_/`, '_blank')

			console.log('********************')
			console.log(`/setup-marmot/${project.id}`)
			console.log('********************')
            loader = await loadingBox('Setting up automatic syncing with Marmot...')
			const { data: setupMarmotData, error: setupMarmotError } = await pb.send(
				`/setup-marmot/${project.id}`,
				{
					method: 'GET',
				}
			)
            loader.dismiss();
			if (setupMarmotError) {
				console.log('/setup-marmot error', setupMarmotError)
				toast(JSON.stringify(setupMarmotError), 'danger')
			} else {
				console.log('/setup-marmot data', setupMarmotData)
				// ****** sync the instance here ******
				if (primary_instance_id) {
					console.log('Syncing primary instance with this new instance', primary_instance_id)
                    loader = await loadingBox('Saving primary instance snapshot to S3...')
                    const { data: upData, error: upError } = await pb.send(
						`/sync/${primary_instance_id}/up`,
						{
							method: 'GET',
						}
					)
                    loader.dismiss();
					if (upError) {
						console.log('primary sync error', upError)
						toast('primary sync error: ' + JSON.stringify(upError), 'danger')
					} else {
						console.log('primary sync data', upData)
					}
                    loader = await loadingBox('Restoring primary instance to replica...')
					const { data: downData, error: downError } = await pb.send(`/sync/${data}/down`, {
						method: 'GET',
					})
                    loader.dismiss();
					if (downError) {
						console.log('primary sync error', downError)
						toast('replica sync error: ' + JSON.stringify(downError), 'danger')
					} else {
						console.log('replica sync data', downData)
                        toast('New instance created', 'success')
					}
				}

				console.log('**** goto', `/instance/${data}`)
				// id = data
				goto(`/instance/${data}`)
			}
		}
	}
	const back = async () => {
		// window.history.back()
		goto(`/project/${project_id}`)
	}
	//$: domainAvailable = false

	// const handleChange = async (event: any) => {
	//     console.log('*** handleChange', event)
	//     console.log('*** NOT IMPLEMENTED ***')
	// const field = event.target.id
	// const value = event.target.value || ''
	// // if field is domain, strip out anything other than a-z 0-9 and -
	// if (field === 'domain') {
	// 	project[field] = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
	// 	domainAvailable = await checkDomainAvailability(project)
	//     project_instance.domain = value
	// } else if (field === 'name' && project?.id !== '') {
	// 	project[field] = value
	// 	try {
	// 		const result = await pb.collection('projects').update(project?.id, {name: value});
	// 	} catch (err) {
	// 		console.error('error updating project name', err)
	// 	}
	// }
	// else {
	// 	project[field] = value
	// }
	//}
	const chooseSite = async (e: any) => {
		let items = []
		for (let i = 0; i < sites.length; i++) {
			const site = sites[i]
			items.push({
				text: site.name,
				icon: allIonicIcons.globeOutline,
				color: !site.active ? 'medium' : 'primary',
				disabled: existingInstances.indexOf(site.id) > -1 || !site.active,
				textcolor: existingInstances.indexOf(site.id) > -1 || !site.active ? 'medium' : 'primary',
				handler: async () => {
					project_instance.site_id = site.id
					project_instance.site_name = site.name
					project_instance.site_domain = site.domain
					project_instance.code = site.code
				},
			})
		}
		const result = await dropdownmenu(e, items)
		console.log('*** you chose site', result)
	}
	const chooseType = async (e: any) => {
		let items = [
			{
				text: 'Read Only Replica',
				icon: allIonicIcons.lockClosedOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					project_instance.type = 'read only replica'
				},
			},
			{
				text: 'Read/Write Replica',
				icon: allIonicIcons.lockOpenOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					project_instance.type = 'read write replica'
				},
			},
		]
		const result = await dropdownmenu(e, items)
		console.log('*** you chose type', result)
	}
</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar color="secondary">
			<ion-buttons slot="start">
				<ion-button on:click={back}>
					<ion-icon slot="icon-only" icon={arrowBackOutline} />
				</ion-button>
			</ion-buttons>
			<ion-title>New Instance</ion-title>
			<!-- <ion-buttons slot="end">
					<ion-button on:click={save}>
						<ion-icon slot="icon-only" icon={checkmarkOutline} />
					</ion-button>
			</ion-buttons> -->
		</ion-toolbar>
	</ion-header>
	<ion-content class="ion-padding">
		<ion-grid class="ion-padding Grid">
			<ion-row>
				<ion-col size={'4'}>
					<ion-label>Project Name</ion-label>
				</ion-col>
				<ion-col size={'8'}>
					<ion-label>{project.name}</ion-label>
				</ion-col>
			</ion-row>

			<ion-row>
				<ion-col size={'4'}>
					<ion-label>Domain</ion-label>
				</ion-col>
				<ion-col size={'8'}>
					<ion-label>{project.domain}</ion-label>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-button size="small" color="secondary" expand="block" on:click={chooseSite}
						>{project_instance.site_name}</ion-button
					>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col size={'4'}>
					<ion-label>Existing instances:</ion-label>
				</ion-col>
				<ion-col size={'8'} class="ion-text-wrap">
					<ion-label
						>{existingInstanceRecords.map((record) => record.site_name).join(', ')}</ion-label
					>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-button size="small" color="secondary" expand="block" on:click={chooseType}
						>{project_instance.type}</ion-button
					>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-button
						size="default"
						disabled={project_instance.site_name === 'Select a site' ||
							project_instance.type === 'Select instance type'}
						expand="block"
						on:click={save}>Deploy New Instance</ion-button
					>
				</ion-col>
			</ion-row>
		</ion-grid>
	</ion-content>
</IonPage>
<!--
		if (project.name.trim().length === 0) {
			toast('Project name is required', 'danger')
			return
		}
		if (!project.domain) {
			toast('Project domain is required', 'danger')
			return
		}
		if (!domainAvailable) {
			toast('Domain is not available', 'danger')
			return
		}
        if (!project_instance.site_id) {


-->
