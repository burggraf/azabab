<script lang="ts">
	import IonPage from '$ionpage'
	import { modalController } from '$ionic/svelte'
	import { checkmarkOutline, closeOutline, trashOutline } from 'ionicons/icons'
	import { currentUser, pb } from '$services/backend.service'
	import { toast } from '$services/toast'
	import { onMount } from 'svelte'
    import { dropdownmenu } from '$components/DropdownMenu'
    import { selectItemFromList } from '$services/utils.service'
	import { showConfirm } from '$services/alert.service'
    import type { Project, ProjectInstance, Site, Key, ProjectInstanceKey, StreamingBackupSite } from '$models/interfaces'

    interface IObjectKeys {
        [key: string]: string | number;
    }
    let instances: ProjectInstance[] = [];
	export let instance: ProjectInstance = 
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
    let destination: any;
    let destination_id: string = '';
	onMount(async () => {
		if (!$currentUser) {
			toast('You must be logged in to clone a project instance', 'danger')
			closeModal()
		}
		console.log('we got instance', instance)
        const records: ProjectInstance[] = await pb.collection('instance_view').getFullList({
            sort: 'name, site_domain',
            fields: '*'//'id,name,project_id,owner,ownertype,code,domain,port,site_domain,site_name,site_id,type,db_streaming_backup_location,logs_streaming_backup_location,db_streaming_backup_retention,logs_streaming_backup_retention,instance_status',
        });
        // delete this instance from the list
        console.log('instances', records)
        instances = records;
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
	const chooseInstance = async (e: any) => {
        console.log('instances', instances)
        console.log('instance', instance)
        const items = [];
        for (let i = 0; i < instances.length; i++) {
            const instanceItem: ProjectInstance = instances[i];
            if (instanceItem.id === instance.id) continue;
            items.push({
                item: {contents: `<div style="color: ${instanceItem.type==='primary'?'var(--ion-color-primary)':'var(--ion-color-medium)'};">
                <b>${instanceItem.name}</b> (${instanceItem.site_name})<br/>
                <small>domain: <b>${instanceItem.domain}.${instanceItem.site_domain}</b></small><br/>
                <small>project type: <b>${instanceItem.project_type}</b></small><br/>
                <small>instance type: <b>${instanceItem.type}</b></small></div>`,
                value: instanceItem.id,
                instance_type: instanceItem.type,
                },
                icon: 'globeOutline',
                color: instanceItem.type === 'primary' ? 'primary' : 'medium',
            })
        }
        const {data} = await selectItemFromList({title:'Choose Instance', items: items, currentItem: ""})
        if (data.item) {
            if (data.item?.instance_type !== 'primary') {
                await showConfirm({
                    header: 'Not a primary instance',
                    message: `It is not recommended to clone a replica instance.  Replicas are designed to be replicated directly from a primary instance only.  Are you sure you want to continue?`,
                    okHandler: async () => {
                        // saveKey()
                        destination = data.item;
                        destination_id = data.item.value;
                    }
                })
            } else {
                destination = data.item;
                destination_id = data.item.value;
            }
        }
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
            {#if destination}
            <div style="margin: 15px;">Destination:</div>
            <div on:click={chooseInstance} class="destinationBox">{@html destination?.contents}</div>
            {:else}
            <ion-button expand="block" color="primary" on:click={chooseInstance}>Choose Destination:</ion-button>
            {/if}

		</div>
	</ion-content>
</IonPage>
<style>
    .destinationBox {
        border: 1px solid;
        padding: 10px;
        margin: 10px;
    }
</style>
