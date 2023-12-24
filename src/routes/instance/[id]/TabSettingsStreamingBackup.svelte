<script lang="ts">
	//db_streaming_backup_location
	//logs_streaming_backup_location
	import type { ProjectInstance, StreamingBackupSite } from './interfaces'
    import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'
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

	const chooseStreamingBackupLocation = async (e: any, entity: string) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('unset streaming_backup_site') 
					project_instance[entity] = ''
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
					console.log('chooseStreamingBackupLocation id', streaming_backup_site.id)
					project_instance[entity] = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_site', result)
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
					console.log('chooseStreamingBackupDBRetention hours', hours)
					project_instance[entity] = hours
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_retention', result)

	}
	const chooseStreamingBackupLogsRetention = async (e: any) => {
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
					console.log('chooseStreamingBackupLogsRetention hours', hours)
					project_instance.logs_streaming_backup_retention = hours
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_retention', result)

	}
	const getBackupLocationName = (id: string) => {
		if (!id) return 'Not enabled'
		for (let i = 0; i < streaming_backup_sites.length; i++) {
			const streaming_backup_site = streaming_backup_sites[i]
			if (streaming_backup_site.id === id) return streaming_backup_site.name
		}
		return 'Not enabled'
	}

</script>

<ion-row>
    <ion-col class="ion-text-center bold" style="background-color: var(--ion-color-dark); color: var(--ion-color-dark-contrast)">
        <ion-label>Streaming Backup</ion-label>
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
            {getBackupLocationName(project_instance.db_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Database Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupRetention(e, 'db_streaming_backup_retention')}}>
            {(project_instance.db_streaming_backup_retention || 0) / 24} {`day${project_instance.db_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupLocation(e, 'logs_streaming_backup_location')}}>
            {getBackupLocationName(project_instance.logs_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={(e) => {chooseStreamingBackupRetention(e, 'logs_streaming_backup_retention')}}>
            {(project_instance.logs_streaming_backup_retention || 0) / 24} {`day${project_instance.logs_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
