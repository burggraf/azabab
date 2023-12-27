<script lang="ts">
	import './styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
		arrowBackOutline,
		checkmarkCircleOutline,
		closeCircleOutline,
		globeOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
    import { checkDomainAvailability } from './project-utils'
	import { dropdownmenu } from '$components/DropdownMenu'

	import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey } from '../instance/[id]/interfaces'

	let sites: Site[] = []
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
	};
	
	onMount(async () => {
        console.log('*** newproject onMount')
		const tb: any = document.getElementById('ion-tabs')
		let initTab: string
		setTimeout(() => {
			if (tb) tb.select(initTab || 'settings')
		}, 100)
	})
	const ionViewWillEnter = async () => {
		console.log('*** ionViewWillEnter')
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
		const domainAvailable = await checkDomainAvailability(project)
        console.log('domainAvailable', domainAvailable)
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
            toast('Select a site', 'danger')
        }
        console.log('project_instance.site_id', project_instance.site_id)
        console.log('=====project_instance', project_instance)
		// look up the site to see if it's active
		const active = sites.find((site) => site.id === project_instance.site_id)?.active;
		if (!active) {
			toast('The site you selected is not currently active', 'danger')
			return
		} else {
            console.log('site is active')
            ///////
            // code: '',
            // domain: '',
            // id: '',
            // port: 0,
            // site_domain: '',
            // site_name: 'Select a site',
            // site_id: '',
            // type: 'primary',
        }
		/*
        to create a new project, we need to send:

            data.project.owner
            data.project.name
            data.project.ownertype
            data.project.domain
            
            data.project_instance.id
            data.project_instance.type

            data.site.domain 
        */
		const site = sites.find((site) => site.id === project_instance.id)
        console.log('creating new project')
        console.log('project_instance', project_instance);
        console.log('sending', {
            project,
            project_instance,
            site,
        })
        const { data, error } = await pb.send('/createproject', {
            method: 'POST',
            body: {
                project,
                project_instance,
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
            window.open(`https://${project.domain}.${project_instance.site_domain}/_/`, '_blank')

            console.log('**** goto', `/instance/${data}`)
            // id = data
            goto(`/instance/${data}`)
        }
	}
	const back = async () => {
		goto('/projects')
	}
	$: domainAvailable = false

	const handleChange = async (event: any) => {
		const field = event.target.id
		const value = event.target.value || ''
		// if field is domain, strip out anything other than a-z 0-9 and -
		if (field === 'domain') {
			project[field] = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
			domainAvailable = await checkDomainAvailability(project)
            project_instance.domain = value
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
				icon: {globeOutline},
				color: site.active ? 'primary' : 'medium',
				textcolor: site.active ? 'primary' : 'medium',
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

</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar color="secondary">
			<ion-buttons slot="start">
				<ion-button on:click={back}>
					<ion-icon slot="icon-only" icon={arrowBackOutline} />
				</ion-button>
			</ion-buttons>
			<ion-title>New Project</ion-title>
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
            <!-- <ion-row style="padding-top: 20px;">
                <ion-col
                    class="ion-text-center"
                    style="width: 100%;border: 1px solid;background-color: var(--ion-color-dark);"
                >
                    <ion-label color="light"><b>Instances</b></ion-label>
                </ion-col>
            </ion-row> -->
                <ion-row>
                    <ion-col>
                        <ion-button size="small" color="secondary" expand="block" on:click={chooseSite}
                            >{project_instance.site_name}</ion-button
                        >
                    </ion-col>
                </ion-row>
                <ion-row>
                    <ion-col>
                    <ion-button size="default" 
                        disabled={project.name.trim().length === 0 ||
                        !project.domain ||
                        !project_instance.site_id
                        }
                        expand="block" on:click={save}
                        >Save New Project</ion-button>
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