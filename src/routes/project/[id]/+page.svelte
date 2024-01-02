<script lang="ts">
	import '$styles/grid-styles.css'
	import IonPage from '$ionpage'
	import { page } from '$app/stores'
	import {
	addOutline,
		arrowBackOutline,
		arrowForwardOutline,
		checkmarkOutline,
	} from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { goto } from '$app/navigation'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
    export let id = $page.params.id

	import type { Project, ProjectInstance } from '$models/interfaces'

    let instances: ProjectInstance[] = []

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
		if (!$currentUser) {
			goto('/');
		}
        const record = await pb.collection('projects').getOne(id, {});
        if (record) {
            for (let attr in project) {
                project[attr] = record[attr]
            }
        } else {
            toast('Project not found', 'danger')
            goto('/projects')
        }
        const records = await pb.collection('instance_view').getFullList({
            filter: `project_id="${id}"`
        });
        console.log('*** instance records', records)
        if (records) {
            for (let instance of records) {
                const newInstance: ProjectInstance = {
                    id: instance.id,
                    owner: instance.owner,
                    ownertype: instance.ownertype,
                    name: instance.name,
                    domain: instance.domain,
                    project_id: instance.project_id,
                    project_name: instance.project_name,
                    type: instance.type,
                    site_name: instance.site_name,
                    site_domain: instance.site_domain,
                    site_id: instance.site_id,
                    port: instance.port,
                    code: instance.code,
                    db_streaming_backup_location: instance.db_streaming_backup_location,
                    logs_streaming_backup_location: instance.logs_streaming_backup_location,
                    db_streaming_backup_retention: instance.db_streaming_backup_retention,
                    logs_streaming_backup_retention: instance.logs_streaming_backup_retention,
                }
                instances.push(newInstance)
            }
            instances = instances; // stupid svelte
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
    const createNewInstance = async () => {
        console.log('*** createNewInstance')
        for (let i = 0; i < instances.length; i++) {
            const instance = instances[i]
            if (instance.db_streaming_backup_location !== '' || 
                instance.logs_streaming_backup_location !== '') {
                toast('You cannot create a new instance if you are configured for streaming backup', 'danger')
                return
            }
        }
        goto(`/newinstance/${project.id}`)
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
                <ion-row>
                    <ion-col>
                        <ion-list>
                            <ion-item-divider>
                                <ion-label>Instances</ion-label>
                            </ion-item-divider>
                            {#each instances as instance}
                                <ion-item
                                    style="cursor:pointer;--padding-start:0px;--inner-padding-end: 0px;"
                                    lines="full"
                                    on:click={() => {
                                        goto(`/instance/${instance.id}`)
                                    }}
                                >
                                    {instance.site_name}
                                    {instance.type}<br />
                                    {instance.domain}.{instance.site_domain}
                                    <ion-button
                                        slot="end"
                                        size="small"
                                        fill="outline"
                                        on:click|stopPropagation={() => {
                                            goto(`/instance/${instance.id}`)
                                        }}
                                    >
                                        <ion-icon slot="icon-only" icon={arrowForwardOutline} />
                                    </ion-button>
                                </ion-item>
                            {/each}
                            <ion-item>
                                <div style="width:100%;text-align:center;">
                                    <ion-button size="small" expand="block" 
                                    on:click={createNewInstance}>
                                    <ion-icon slot="icon-only" icon={addOutline} />
                                    &nbsp;New Instance
                                    </ion-button>
                                </div>
                            </ion-item>
                        </ion-list>
                    </ion-col>
        </ion-grid>
        
	</ion-content>
</IonPage>
