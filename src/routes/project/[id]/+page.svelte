<script lang="ts">
	import TabCLI from './TabCLI.svelte';
	import TabGUI from './TabGUI.svelte'
	import TabLogs from './TabLogs.svelte'
	import TabMetrics from './TabMetrics.svelte'
	import TabSettings from './TabSettings.svelte'
	import './styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
		analyticsOutline,
		arrowBackOutline,
		browsersOutline,
		buildOutline,
		checkmarkOutline,
		listOutline,
		settingsOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
    import { checkDomainAvailability } from './project-utils'

	export let id = $page.params.id
	console.log('**** id', id)
	$: instance_id = ''
	import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey } from './interfaces'

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
	onMount(async () => {
		const tb: any = document.getElementById('ion-tabs')
		let initTab: string
		if (id === 'new') {
			initTab = 'settings'
		} else {
			initTab = localStorage.getItem('project.tab') || 'settings'
		}
		setTimeout(() => {
			if (tb) tb.select(initTab || 'settings')
		}, 10)
	})
	const ionViewWillEnter = async () => {
		console.log('ionViewWillEnter')
		if (id !== 'new') {
			console.log('looking for projects with id', id)
			const record = await pb.collection('projects').getOne(id)
			console.log('project record', record)
			project.id = record.id
			project.domain = record.domain
			project.name = record.name
			project.owner = record.owner
			project.ownertype = record.ownertype
			project_instances = await pb.collection('instance_view').getFullList({
				filter: `project_id = "${id}"`,
				fields: 'code, domain, id, port, site_domain, site_name, site_id, type',
			})
			console.log('project_instances', project_instances)
			if (project_instances.length > 0)
				instance_id = project_instances[0].id
			console.log('instance_id is NOW', instance_id)
		}
		sites = await pb.collection('sites').getFullList({
			fields: 'id, name, code, domain, active',
		})
		if (id === 'new') {
			project_instances[0].id = sites[0].id
		}
		keys = await pb.collection('user_keys').getFullList({
			fields: 'id,title,key,sort_key',
			sort: 'sort_key',
		})
		console.log('keys', keys)
	}
	const save = async () => {
		console.log('save')
		const domainAvailable = await checkDomainAvailability(project)
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
		// look up the site to see if it's active
		const active = sites.find((site) => site.id === project_instances[0].id)?.active;
		if (!active) {
			toast('The site you selected is not currently active', 'danger')
			return
		}
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
			console.log('project_instances', project_instances);
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
				window.open(`https://${project.domain}.${project_instances[0].site_domain}/_/`, '_blank')

				console.log('**** goto', `/project/${data}`)
				id = data
				goto(`/project/${data}`)
			}
		}
	}
	const back = async () => {
		goto('/projects')
	}
	const gotoAdminPage = async () => {
		window.open(`https://${project_instances[0].domain}.${project_instances[0].site_domain}/_/`, '_blank')
	}
	const gotoSite = async () => {
		window.open(`https://${project_instances[0].domain}.${project_instances[0].site_domain}/`, '_blank')
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
			<ion-title>Project: {project?.domain || ''}</ion-title>
			<ion-buttons slot="end">
				{#if id === 'new'}
					<ion-button on:click={save}>
						<ion-icon slot="icon-only" icon={checkmarkOutline} />
					</ion-button>
				{:else}
					<ion-button on:click={gotoSite}>
						<ion-icon slot="icon-only" src="/launch.svg" />
					</ion-button>
					<ion-button on:click={gotoAdminPage}>
							<ion-icon slot="icon-only" src="/pb.svg" />
					</ion-button>
				{/if}
			</ion-buttons></ion-toolbar
		>
	</ion-header>
	<ion-content class="ion-padding">
		<ion-tabs
			id="ion-tabs"
			on:ionTabsDidChange={(e) => {
				console.log('CHANGE', e.detail.tab)
				localStorage.setItem('project.tab', e.detail.tab)
			}}
		>
			<ion-tab tab="gui">
				{#if instance_id !== ''}
					<TabGUI {instance_id} />
				{:else}
					<div class="ion-padding ion-text-center">
						<ion-spinner name="crescent" /><br/>
						<ion-label>Loading...</ion-label>
					</div>
				{/if}
			</ion-tab>
			<ion-tab tab="cli">
				<TabCLI {keys} {project_instance_keys} {project_instances} {id}/>
			</ion-tab>
			<ion-tab tab="logs">
				<TabLogs {project_instances} />
			</ion-tab>
			<ion-tab tab="metrics">
				<TabMetrics {project_instances} />
			</ion-tab>
			<ion-tab tab="settings">
				<TabSettings {project} {project_instances} {sites}/>
			</ion-tab>
			<ion-tab-bar id="tab-bar" slot="top">
				<ion-tab-button tab="gui">
					<ion-icon src="gui.svg" />GUI
				</ion-tab-button>
				<ion-tab-button tab="cli">
					<ion-icon src="cli.svg" />CLI
				</ion-tab-button>
				<ion-tab-button tab="logs">
					<ion-icon src="logs.svg" />Logs
				</ion-tab-button>
				<ion-tab-button tab="metrics">
					<ion-icon src="metrics.svg" />Metrics
				</ion-tab-button>
				<ion-tab-button tab="settings">
					<ion-icon src="settings.svg" />Settings
				</ion-tab-button>
			</ion-tab-bar>
		</ion-tabs>
	</ion-content>
</IonPage>
