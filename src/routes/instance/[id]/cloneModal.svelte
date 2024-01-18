<script lang="ts">
	import IonPage from '$ionpage'
	import { modalController } from '$ionic/svelte'
	import { checkmarkOutline, closeOutline, trashOutline } from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
	import { showConfirm } from '$services/alert.service'
    import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey, StreamingBackupSite } from '$models/interfaces'

    interface IObjectKeys {
        [key: string]: string | number;
    }

	export const instance: ProjectInstance = 
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
		logs_streaming_backup_retention: 0,
		instance_status: ''
	};
	onMount(async () => {
		if (!$currentUser) {
			toast('You must be logged in to clone a project instance', 'danger')
			closeModal()
		}
		console.log('we got instance', instance)
        const instances = await pb.collection('instance_view').getFullList({
            sort: 'name, site_domain',
            fields: 'id,name,project_id,owner,ownertype,code,domain,port,site_domain,site_name,site_id,type,db_streaming_backup_location,logs_streaming_backup_location,db_streaming_backup_retention,logs_streaming_backup_retention,instance_status',
        });
        // delete this instance from the list
        instances.splice(instances.findIndex((i: any) => i.id === instance.id), 1)
        console.log('instances', instances)
        if (instances.length === 0) {
            toast('No other instances available as a destination', 'danger')
            closeModal()
        }

	})
	const closeModal = async () => {
		modalController.dismiss()
	}
	const handleChange = async (event: any) => {
		const { id, value } = event.target
		// data[id] = value
	}
	const save = async () => {
        await showConfirm({
            header: 'Confirm header here',
            message: `message here`,
            okHandler: async () => {
                // saveKey()
            },
        })
	}
</script>

<IonPage>
	<ion-header>
		<ion-toolbar>
			<ion-buttons slot="start">
				<ion-button on:click={closeModal}>
					<ion-icon slot="icon-only" icon={closeOutline} />
				</ion-button>
			</ion-buttons>
			<ion-title>Clone Project Instance</ion-title>
			<ion-buttons slot="end">
				<ion-button on:click={save}>
					<ion-icon slot="icon-only" icon={checkmarkOutline} />
				</ion-button>
			</ion-buttons>
		</ion-toolbar>
	</ion-header>
	<ion-content>
		<div class="ion-padding">


		</div>
	</ion-content>
</IonPage>
