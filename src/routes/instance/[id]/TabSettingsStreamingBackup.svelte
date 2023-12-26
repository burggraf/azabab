<script lang="ts">
	//db_streaming_backup_location
	//logs_streaming_backup_location
	import type { ProjectInstance, StreamingBackupSite } from './interfaces'
    import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
	import { pb } from '$services/backend.service'
	import { toast } from '$services/toast'
	export let project_instance: ProjectInstance = {
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
	}
	export let streaming_backup_sites: StreamingBackupSite[] = []
    let data: any = {
            db_streaming_backup_location: '',
            logs_streaming_backup_location: '',
            db_streaming_backup_retention: 0,
            logs_streaming_backup_retention: 0        
    };
    setTimeout(() => {
        data = {
            db_streaming_backup_location: project_instance.db_streaming_backup_location,
            logs_streaming_backup_location: project_instance.logs_streaming_backup_location,
            db_streaming_backup_retention: project_instance.db_streaming_backup_retention,
            logs_streaming_backup_retention: project_instance.logs_streaming_backup_retention
        }
    }, 1000)
    setTimeout(async () => {
        if (project_instance.db_streaming_backup_location && project_instance.db_streaming_backup_location.length > 0) {
            const data_generations = await getBackupGenerations('data')
            const el = document.getElementById('data-generations')
            if (el) el.innerText = data_generations
        }
        if (project_instance.logs_streaming_backup_location && project_instance.logs_streaming_backup_location.length > 0) {
            const logs_generations = await getBackupGenerations('logs')
            const el = document.getElementById('logs-generations')
            if (el) el.innerText = logs_generations
        }

    }, 2000)
	const chooseStreamingBackupLocation = async (e: any, entity: string) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					data[entity] = ''
				},
		}]
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			items.push({
				text: streaming_backup_site.name,
				icon: allIonicIcons.globeOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					data[entity] = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
	}
	const chooseStreamingBackupRetention = async (e: any, entity: string) => {
		const arr = [0, 24, 72, 168, 336, 504, 720]
		const items = []
		for (let i = 0; i < arr.length; i++) {
			const hours = arr[i]
			items.push({
				text: `${hours / 24} day${hours !== 24 ? 's' : ''}`,
				icon: allIonicIcons.timeOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					data[entity] = hours
				},
			})
		}
		const result = await dropdownmenu(e, items)

	}
	const getBackupLocationName = (id: string) => {
		if (!id) return 'Not enabled'
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			if (streaming_backup_site.id === id) return streaming_backup_site.name
		}
		return 'Not enabled'
	}
    const applyChanges = async () => {
        // update-streaming-backup-settings
        try {
            const { data: changeData, error: changeError } = 
            await pb.send(`/update-streaming-backup-settings`, {
				method: 'POST',
				body: {
					instance_id: project_instance.id,
					data
				},
			})
            if (changeError) {
                console.error('changeError', changeError)
                toast('Error updating streaming backup settings', 'danger')
                return
            } else {
                if (changeData?.json?.data === 'OK') {
                    toast('Streaming backup settings updated', 'success')
                    project_instance.db_streaming_backup_location = data.db_streaming_backup_location;
                    project_instance.logs_streaming_backup_location = data.logs_streaming_backup_location;
                    project_instance.db_streaming_backup_retention = data.db_streaming_backup_retention; 
                    project_instance.logs_streaming_backup_retention = data.logs_streaming_backup_retention;                    
                } else {
                    toast(changeData?.json?.data, 'danger')
                }
            }
        }
        catch (err) {
            console.log("ERROR", err)
        }

    }
    const getBackupGenerations = async (db: string) => {
        const { data, error } = await pb.send(`/get-litestream-generations`, {
            method: 'POST',
            body: {
                instance_id: project_instance.id,
                db
            },
        });
        if (error) {
            console.error('error', error)
            return ''
        } else {
            let arr = data.split('\n');
            for (let i = 0; i < arr.length; i++) {
                arr[i] = arr[i].substring(32);
            }
            return arr.join('\n');
        }
    }
</script>

<ion-row>
    <ion-col class="ion-text-center bold" style="background-color: var(--ion-color-dark); color: var(--ion-color-dark-contrast)">
        <ion-label>Streaming Backups</ion-label>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-center">
        <ion-text>Automatic continuous streaming backups to durable S3 storage with PITR (point in time recovery).
        </ion-text>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Database</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupLocation(e, 'db_streaming_backup_location')}}>
            {getBackupLocationName(data.db_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Database Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupRetention(e, 'db_streaming_backup_retention')}}>
            {(data.db_streaming_backup_retention || 0) / 24} {`day${data.db_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupLocation(e, 'logs_streaming_backup_location')}}>
            {getBackupLocationName(data.logs_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupRetention(e, 'logs_streaming_backup_retention')}}>
            {(data.logs_streaming_backup_retention || 0) / 24} {`day${data.logs_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
{#if project_instance.db_streaming_backup_location !== data.db_streaming_backup_location || 
     project_instance.logs_streaming_backup_location !== data.logs_streaming_backup_location || 
     project_instance.db_streaming_backup_retention !== data.db_streaming_backup_retention || 
     project_instance.logs_streaming_backup_retention !== data.logs_streaming_backup_retention}
    <ion-row>
        <ion-col>
            <ion-button
                size="small"                
                expand="block"
                color="danger"
                on:click={applyChanges}
            >
                Apply Changes
            </ion-button>
        </ion-col>
    </ion-row>
{/if}
{#if project_instance.db_streaming_backup_location}
<ion-row>
    <ion-col style="background-color: var(--ion-color-dark);color: var(--ion-color-dark-contrast)"><ion-label>data.db streaming backups</ion-label></ion-col>
</ion-row>
<ion-row>
    <ion-col>
        <pre id="data-generations">
        </pre>
    </ion-col>
</ion-row>
{/if}
{#if project_instance.logs_streaming_backup_location}
<ion-row>
    <ion-col style="background-color: var(--ion-color-dark);color: var(--ion-color-dark-contrast)"><ion-label>logs.db streaming backups</ion-label></ion-col>
</ion-row>
<ion-row>
    <ion-col>
        <pre id="logs-generations">
        </pre>
    </ion-col>
</ion-row>
{/if}
<!-- <ion-row>
    <ion-col><ion-button on:click={() => {getBackupGenerations('data')}}>get db generations</ion-button></ion-col>
</ion-row>
<ion-row>
    <ion-col><ion-button on:click={() => {getBackupGenerations('logs')}}>get logs generations</ion-button></ion-col>
</ion-row> -->
