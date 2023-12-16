<script lang="ts">
	import { goto } from '$app/navigation'
	import IonPage from '$ionpage'
	import { addOutline, constructOutline, eyeOutline } from 'ionicons/icons'
	import { pb } from '$services/backend.service'
	let projects: any = []
	let project_instances: any = []
	const ionViewWillEnter = async () => {
		console.log('ionViewWillEnter')
		const instance_records = await pb.collection('instance_view').getFullList({
			sort: 'name,type,site_name',
		})
		project_instances = instance_records
		const project_records = await pb.collection('projects').getFullList({
			sort: 'name',
		})
		projects = project_records
	}
	const newProject = async () => {
		goto('/project/new')
	}
	const getInstancesForProject = (project_id: string) => {
		return project_instances.filter((instance: any) => {
			return instance.project_id === project_id
		})
	}
</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar>
			<ion-buttons slot="start">
				<ion-menu-button />
			</ion-buttons>
			<ion-title>Projects</ion-title>
			<ion-buttons slot="end">
				<ion-button on:click={newProject}>
					<ion-icon slot="icon-only" icon={addOutline} />
				</ion-button>
			</ion-buttons></ion-toolbar
		>
	</ion-header>
	<ion-content class="ion-padding">
		<ion-list>
			{#each projects as project}
				<ion-item-divider>
					<ion-label>{project.name}</ion-label><br />
					<ion-text slot="end">{project.domain}</ion-text>
				</ion-item-divider>
				{#each getInstancesForProject(project.id) as instance}
					<ion-item
						lines="full"
						on:click={() => {
							goto(`/project/${instance.project_id}`)
						}}
					>
						<div style="width:100%;">
							<ion-grid style="width: 100%;">
								<ion-row>
									<ion-col>Domain:</ion-col>
									<ion-col>
										{instance.domain}.{instance.site_domain}
									</ion-col>
								</ion-row>
								<ion-row>
										<ion-col>Location:</ion-col>
										<ion-col>
											{instance.site_name}
										</ion-col>
								</ion-row>
								<ion-row>
										<ion-col>Type:</ion-col>
										<ion-col>
											{instance.type}
										</ion-col>
								</ion-row>
                                <ion-row>
									<ion-col>
										<ion-button
											expand="block"
											size="small"
											fill="outline"
											on:click|stopPropagation={() => {
												// launch in another windows
												window.open(`https://${instance.domain}.${instance.site_domain}`, '_blank')
											}}
										>
											View Site
											<!-- <ion-icon slot="icon-only" icon={eyeOutline} /> -->
										</ion-button>
									</ion-col>
									<ion-col>
										<ion-button
											expand="block"
											size="small"
											on:click|stopPropagation={() => {
												// launch in another windows
												window.open(
													`https://${instance.domain}.${instance.site_domain}/_/`,
													'_blank'
												)
											}}
										>
											Admin
											<!-- <ion-icon slot="icon-only" icon={constructOutline} /> -->
										</ion-button>
									</ion-col>
								</ion-row>
							</ion-grid>
						</div>
					</ion-item>
				{/each}
			{/each}
			<!-- {#each project_instances as instance}
                <ion-item
                    lines="full"
                    on:click={() => {
                        goto(`/project/${instance.project_id}`)
                    }}
                >
                    <ion-label>
                        <h2>{instance.name}</h2>
                        <h3>domain: {instance.domain}.{instance.site_domain}<br/>
                           location: {instance.site_name}<br/>
                           type: {instance.type}</h3>
                    </ion-label>
                    <ion-button size="default" slot="end" fill="outline" on:click|stopPropagation={() => {
                        // launch in another windows
                        window.open(`https://${instance.domain}.${instance.site_domain}`,'_blank')
                        }}>
                        <ion-icon slot="icon-only" icon={eyeOutline} />
                        </ion-button>
                    <ion-button size="default" slot="end"  on:click|stopPropagation={() => {
                        // launch in another windows
                        window.open(`https://${instance.domain}.${instance.site_domain}/_/`,'_blank')
                        }}>
                        <ion-icon slot="icon-only" icon={constructOutline} />
                        </ion-button>
                </ion-item>
            {/each} -->
		</ion-list></ion-content
	>
</IonPage>
