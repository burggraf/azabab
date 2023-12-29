<script lang="ts">
	import '$styles/grid-styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
		arrowBackOutline,
		checkmarkOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
    export let id = $page.params.id

	import type { Project } from '$models/interfaces'

	const project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: $currentUser?.id,
		ownertype: 'person',
        port: 0
	}
	
	onMount(async () => {
        console.log('*** project onMount')
	})
	const ionViewWillEnter = async () => {
		console.log('*** ionViewWillEnter')
        const record = await pb.collection('projects').getOne(id, {});
        if (record) {
            for (let attr in project) {
                project[attr] = record[attr]
            }
        } else {
            toast('Project not found', 'danger')
            goto('/projects')
        }

	}
	const save = async () => {
		console.log('save')
        console.log('**** NOT FINISHED YET')
	}
	const back = async () => {
		goto('/projects')
	}

	const handleChange = async (event: any) => {
        console.log('*** handleChange', event)
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
			<ion-title>{project.name || "Project"}</ion-title>
			<ion-buttons slot="end">
					<ion-button on:click={save}>
						<ion-icon slot="icon-only" icon={checkmarkOutline} />
					</ion-button>
			</ion-buttons>
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
        
        </ion-grid>
        
	</ion-content>
</IonPage>
