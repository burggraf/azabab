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

	const chooseStreamingBackupDBLocation = async (e: any) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('unset streaming_backup_site') 
					project_instance.db_streaming_backup_location = ''
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
					project_instance.db_streaming_backup_location = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_site', result)
	}
	const chooseStreamingBackupDBRetention = async (e: any) => {
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
					project_instance.db_streaming_backup_retention = hours
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
	const chooseStreamingBackupLogsLocation = async (e: any) => {
		const items = [{
			text: 'Not enabled',
				icon: allIonicIcons.closeCircleOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					console.log('unset streaming_backup_site') 
					project_instance.logs_streaming_backup_location = ''
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
					project_instance.logs_streaming_backup_location = streaming_backup_site.id 
				},
			})
		}
		const result = await dropdownmenu(e, items)
        console.log('*** you chose streaming_backup_site', result)
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
    <ion-col class="">
        <ion-text>Setup streaming backups of your database and/or logs to allow PITR (point in time recovery) from any point in your backup retention period.
            Backups are made incrementally and automatically as your data is changed and can be restored to any point.
        </ion-text>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Database</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupDBLocation}>
            {getBackupLocationName(project_instance.db_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Database Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupDBRetention}>
            {(project_instance.db_streaming_backup_retention || 0) / 24} {`day${project_instance.db_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupLogsLocation}>
            {getBackupLocationName(project_instance.logs_streaming_backup_location)}
        </ion-button>
    </ion-col>
</ion-row>
<ion-row>
    <ion-col class="ion-text-right bold" style="justify-content: right;display: flex;align-items: center;">
        <ion-label>Logs Retention</ion-label>
    </ion-col>
    <ion-col>
        <ion-button size="small" color="secondary" expand="block" on:click={chooseStreamingBackupLogsRetention}>
            {(project_instance.logs_streaming_backup_retention || 0) / 24} {`day${project_instance.logs_streaming_backup_retention !== 24 ? 's' : ''}`}
        </ion-button>
    </ion-col>
</ion-row>
