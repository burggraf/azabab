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
		arrowBackOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'

	export let id = $page.params.id
	// const instance_id = $page.params.id
	import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey, StreamingBackupSite } from './interfaces'

	let keys: Key[] = []
	let project_instance_keys: ProjectInstanceKey[] = []

	let sites: Site[] = []
	let streaming_backup_sites: StreamingBackupSite[] = []
	const project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: $currentUser?.id,
		ownertype: 'person',
	}
	let project_instance: ProjectInstance = 
	{
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
	};
	
	onMount(async () => {
		const tb: any = document.getElementById('ion-tabs')
		let initTab: string
			initTab = localStorage.getItem('project.tab') || 'settings'
		setTimeout(() => {
			if (tb) tb.select(initTab || 'settings')
		}, 10)
	})
	const ionViewWillEnter = async () => {
		console.log('*** ionViewWillEnter, id', id)
		console.log('*** looking for projects with id', id)
		const record = await pb.collection('projects').getOne(id)
		console.log('project record', record)
		project.id = record.id
		project.domain = record.domain
		project.name = record.name
		project.owner = record.owner
		project.ownertype = record.ownertype
		project_instance = await pb.collection('instance_view').getFirstListItem(
			`project_id = "${id}"`,{
			fields: 'code, domain, id, port, site_domain, site_name, site_id, type, db_streaming_backup_location, logs_streaming_backup_location, db_streaming_backup_retention, logs_streaming_backup_retention',
		})

		console.log('*****  project_instance', project_instance)
		sites = await pb.collection('sites').getFullList({
			fields: 'id, name, code, domain, active',
		})
		keys = await pb.collection('user_keys').getFullList({
			fields: 'id,title,key,sort_key',
			sort: 'sort_key',
		})
		streaming_backup_sites = await pb.collection('streaming_backup_sites').getFullList({
			fields: 'id, name, location',
		})
	}
	const back = async () => {
		goto('/projects')
	}
	const gotoAdminPage = async () => {
		window.open(`https://${project_instance.domain}.${project_instance.site_domain}/_/`, '_blank')
	}
	const gotoSite = async () => {
		window.open(`https://${project_instance.domain}.${project_instance.site_domain}/`, '_blank')
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
			<ion-title>{project?.name || '<untitled project>'}: {project_instance.site_name}</ion-title>
			<ion-buttons slot="end">
					<ion-button on:click={gotoSite}>
						<ion-icon slot="icon-only" src="/launch.svg" />
					</ion-button>
					<ion-button on:click={gotoAdminPage}>
							<ion-icon slot="icon-only" src="/pb.svg" />
					</ion-button>
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
				{#if project_instance}
					<TabGUI {project_instance} />
				{:else}
					<div class="ion-padding ion-text-center">
						<ion-spinner name="crescent" /><br/>
						<ion-label>Loading...</ion-label>
					</div>
				{/if}
			</ion-tab>
			<ion-tab tab="cli">
				<TabCLI {keys} {project_instance_keys} {project_instance} {id}/>
			</ion-tab>
			<ion-tab tab="logs">
				<TabLogs {project_instance} />
			</ion-tab>
			<ion-tab tab="metrics">
				<TabMetrics {project_instance} />
			</ion-tab>
			<ion-tab tab="settings">
				<TabSettings {project} {project_instance} {sites} {streaming_backup_sites} />
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
