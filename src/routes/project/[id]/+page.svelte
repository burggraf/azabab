<script lang="ts">
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
		analyticsOutline,
		arrowBackOutline,
		browsersOutline,
		callOutline,
		checkmarkOutline,
		fileTrayFullOutline,
		informationOutline,
		listOutline,
		personOutline,
		settingsOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
	import { toast } from '$services/toast'
	import Keys from '$components/Keys.svelte'
	import { onMount } from 'svelte'
    import moment from 'moment';

    const formatDate = (timestamp: number) => moment(timestamp * 1000).format('MM/DD/YY HH:mm:ss');

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
	onMount(async () => {
		const tb: any = document.getElementById('ion-tabs')
        let initTab: string;
        if (id === 'new') {
            initTab = 'settings'
        } else {
            initTab = localStorage.getItem('project.tab') || 'settings';
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
		if (project_instances[0].site_name !== 'US West 2') {
			toast('Only US West 2 is supported at the moment', 'danger')
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
	const ionViewDidEnter = async () => {
		// select the settings tab
	}
    let stats: any = []
    const changeMetrics = async (e: any) => {
        console.log('changeMetrics', e, typeof e)
        if (e !== "info") {
            // fetch a paginated records list
            try {
                console.log(`instance_id = "${e.detail.value}"`);
                const resultList = await pb.collection('stats_view').getList(1, 50, {
                    filter: `instance_id = "${e.detail.value}"`,
                    columns: `ts, event, cpu_usage, mem_usage, disk_read, disk_write, net_in, net_out`,
                    sort: '-ts'
                });
                console.log('resultList', resultList)
                stats = resultList.items
                console.log('items', stats)
            } catch (error) {
                console.log('error', error)
            }
        }
    }
</script>

<IonPage {ionViewWillEnter} {ionViewDidEnter}>
	<ion-header>
		<ion-toolbar>
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
				{/if}
			</ion-buttons></ion-toolbar
		>
	</ion-header>
	<ion-content class="ion-padding">
		<ion-tabs
			id="ion-tabs"
			on:ionTabsDidChange={(e) => {
				console.log('CHANGE',e.detail.tab)
                localStorage.setItem('project.tab', e.detail.tab)
			}}
		>
			<!-- Tab views -->
			<ion-tab tab="gui">
				<ion-grid style="height: 100%; width: 100%;">
					<ion-row style="height: 50%;">
						<ion-col size-md="6" size-xs="12" class="ion-padding" style="border:1px solid;">
							<div
								class="box"
								style="width: 100%;padding: 5px;color: var(--ion-color-light);background-color: var(--ion-color-primary)"
							>
								<b>Database (/pb_data)</b>
							</div>
						</ion-col>
						<ion-col size-md="6" size-xs="12" class="ion-padding" style="border:1px solid;">
							<div
								class="box"
								style="width: 100%;padding: 5px;color: var(--ion-color-light);background-color: var(--ion-color-primary)"
							>
								<b>Hooks (/pb_hooks)</b>
							</div>
						</ion-col>
					</ion-row>
					<ion-row style="height: 50%;">
						<ion-col size-md="6" size-xs="12" class="ion-padding" style="border:1px solid;">
							<div
								class="box"
								style="width: 100%;padding: 5px;color: var(--ion-color-light);background-color: var(--ion-color-primary)"
							>
								<b>Migration (/pb_migrations)</b>
							</div>
						</ion-col>
						<ion-col size-md="6" size-xs="12" class="ion-padding" style="border:1px solid;">
							<div
								class="box"
								style="width: 100%;padding: 5px;color: var(--ion-color-light);background-color: var(--ion-color-primary)"
							>
								<b>Public (/pb_public)</b>
							</div>
						</ion-col>
					</ion-row>
				</ion-grid>
			</ion-tab>
			<ion-tab tab="cli">
				<ion-grid class="ion-padding Grid">
					<ion-row>
						<ion-col style="width: 100%; border-bottom: 1px solid;">
							<ion-label><h1>SSH Keys</h1></ion-label>
						</ion-col>
					</ion-row>
					<!-- code, domain, id, port, site_domain, site_name, type -->

					{#each project_instances as project_instance, index}
						<ion-row>
							<ion-col class="ion-text-center">
								<ion-label>Instance #{index + 1}</ion-label>
							</ion-col>
						</ion-row>
						<ion-row>
							<ion-col class="ion-text-center">
								<ion-label>{project_instance.site_name}</ion-label>
							</ion-col>
						</ion-row>
						<ion-row>
							<ion-col class="ion-text-center" style="border: 1px solid;">
								<ion-label>installed keys:</ion-label><br />
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
						<ion-row>
							<ion-col>
								{#if project_instance_keys.length > 0}
									<ion-label>Example <b>scp</b> copy commands:</ion-label>
									<pre>
scp -P 2222 -r pb_public/* \
   {project_instance.domain}@{project_instance.site_domain}:/pb_public
scp -P 2222 -r pb_hooks/* \
   {project_instance.domain}@{project_instance.site_domain}:/pb_hooks
scp -P 2222 -r pb_migrations/* \
   {project_instance.domain}@{project_instance.site_domain}:/pb_migrations</pre>
									<ion-label>To connect via <b>sftp</b>:</ion-label>
									<pre>
sftp -P 2222 {project_instance.domain}@{project_instance.site_domain}
   </pre>
								{:else}
									<ion-label>
										In order to use <b>scp</b> or <b>sftp</b> to copy files to your project:<br />
										<ul>
											<li>Add at least one SSH Public Key</li>
											<li>
												Select at least one SSH Public Key above (this installs the SSH Public Key
												to your server instance automatically)
											</li>
										</ul>
									</ion-label>
								{/if}
							</ion-col>
						</ion-row>
					{/each}
					<Keys />
				</ion-grid>
			</ion-tab>
			<ion-tab tab="metrics">
                <div class="ion-padding" style="overflow: scroll;height: 100%">
                    <ion-segment on:ionChange={changeMetrics} id="metrics" value="info">
                        <ion-segment-button value="info">
                            <ion-label>Info</ion-label>
                        </ion-segment-button>
                        {#each project_instances as project_instance, index}
                            <ion-segment-button value={project_instance.id}>
                                <ion-label>{project_instance.site_name}</ion-label>
                            </ion-segment-button>
                        {/each}
                    </ion-segment>    
                        <ion-grid class="ion-padding" id="statGrid" style="width: 100%">
                            <ion-row style="color:var(--ion-color-light);background-color:var(--ion-color-medium)">
                                <ion-col>Date</ion-col>
                                <ion-col>Event</ion-col>
                                <ion-col>CPU%</ion-col>
                                <ion-col>Mem(mb)</ion-col>
                                <ion-col>Disk Read</ion-col>
                                <ion-col>Disk Write</ion-col>
                                <ion-col>Net In</ion-col>
                                <ion-col>Net Out</ion-col>
                            </ion-row>
                            {#each stats as stat, index}
                            <ion-row>
                                <ion-col>{formatDate(stat.ts)}</ion-col>
                                <ion-col>{stat.event}</ion-col>
                                <ion-col>{stat.cpu_usage}</ion-col>
                                <ion-col>{stat.mem_usage}</ion-col>
                                <ion-col>{stat.disk_read}</ion-col>
                                <ion-col>{stat.disk_write}</ion-col>
                                <ion-col>{stat.net_in}</ion-col>
                                <ion-col>{stat.net_out}</ion-col>
                        </ion-row>
                            {/each}
                        </ion-grid>
                </div>

				<!-- Tab bar -->
			</ion-tab>
			<ion-tab tab="settings">
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
					<!-- </ion-grid>
        
                <ion-grid class="ion-padding Grid"> -->
					<ion-row style="padding-top: 20px;">
						<ion-col
							class="ion-text-center"
							style="width: 100%;border: 1px solid;background-color: var(--ion-color-dark);"
						>
							<ion-label color="light"><b>Instances</b></ion-label>
						</ion-col>
					</ion-row>
					{#each project_instances as project_instance, index}
						<!-- code, domain, id, port, site_domain, site_name, type -->
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
					{/each}
				</ion-grid>
			</ion-tab>

			<!-- Tab bar -->
			<ion-tab-bar id="tab-bar" slot="top">
				<ion-tab-button tab="gui">
					<ion-icon icon={browsersOutline} />GUI
				</ion-tab-button>
				<ion-tab-button tab="cli">
					<ion-icon icon={listOutline} />CLI
				</ion-tab-button>
				<ion-tab-button tab="metrics">
					<ion-icon icon={analyticsOutline} />Metrics
				</ion-tab-button>
				<ion-tab-button tab="settings">
					<ion-icon icon={settingsOutline} />Settings
				</ion-tab-button>
			</ion-tab-bar>
		</ion-tabs>

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
		/* max-width: 350px;
        width: 350px; */
		max-width: 500px;
		width: 100%;
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
