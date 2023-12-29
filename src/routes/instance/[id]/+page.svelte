<script lang="ts">
	import TabCLI from './TabCLI.svelte';
	import TabGUI from './TabGUI.svelte'
	import TabLogs from './TabLogs.svelte'
	import TabMetrics from './TabMetrics.svelte'
	import TabSettings from './TabSettings.svelte'
	import '$styles/grid-styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
		arrowBackOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { instanceTab } from './instanceTabStore'
	export let id = $page.params.id
	// const instance_id = $page.params.id
	import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey, StreamingBackupSite } from '$models/interfaces'
	import { onMount } from 'svelte'

	let keys: Key[] = []
	let project_instance_keys: ProjectInstanceKey[] = []

	let sites: Site[] = []
	let streaming_backup_sites: StreamingBackupSite[] = []
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
		type: 'primary',
		db_streaming_backup_location: '',
		logs_streaming_backup_location: '',
		db_streaming_backup_retention: 0,
		logs_streaming_backup_retention: 0
	};
	
	let initTab: string;
	onMount(async () => {
		initTab = localStorage.getItem('instance.tab') || 'settings'
		console.log('localStorage got ====> initTab', initTab)
		setTimeout(() => {
			const tb: any = document.getElementById('ion-tabs')
			console.log('setTimeout changing tab to:', initTab)
			console.log('tb is ', tb)
			if (tb) tb.select(initTab || 'settings')
		}, 100)
	})
	const ionViewWillEnter = async () => {
		console.log('*** ionViewWillEnter, id', id)
		console.log('*** looking for instances with id', id)
		project_instance = await pb.collection('instance_view').getFirstListItem(
			`id = "${id}"`,{
			fields: 'name, project_id, owner, ownertype, code, domain, id, port, site_domain, site_name, site_id, type, db_streaming_backup_location, logs_streaming_backup_location, db_streaming_backup_retention, logs_streaming_backup_retention',
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

		const tb: any = document.getElementById('ion-tabs')
		

	}
	const back = async () => {
		//goto('/projects')
		window.history.back();
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
			<ion-title>{project_instance?.name || '<untitled project>'}: {project_instance?.site_name}</ion-title>
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
		<ion-tabs id="ion-tabs"
			on:ionTabsDidChange={(e) => {
				console.log('*********************************************')
				console.log('***** ionTabsDidChange               ********')
				console.log('*********************************************')
				console.log('e', e)
				console.log(e.detail.tab);
				console.log('loccalStorage setting instance.tab', e.detail.tab)
				localStorage.setItem('instance.tab', e.detail.tab)
				instanceTab.set(e.detail.tab)
				console.log('*********************************************')
			}}
		>
			<ion-tab tab="settings">
					<TabSettings {project_instance} {sites} {streaming_backup_sites} />
			</ion-tab>
			<ion-tab tab="gui">
					<TabGUI {project_instance} />
					<!-- <div class="ion-padding ion-text-center">
						<ion-spinner name="crescent" /><br/>
						<ion-label>Loading...</ion-label>
					</div> -->
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
			<ion-tab-bar id="tab-bar" slot="top">
				<ion-tab-button tab="settings">
					<ion-icon src="settings.svg" />Settings
				</ion-tab-button>
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
			</ion-tab-bar>
		</ion-tabs>
	</ion-content>
</IonPage>
