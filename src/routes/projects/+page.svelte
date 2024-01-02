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
		if (projects.length === 0) {
			// goto('/newproject')
		}
	}
	const newProject = async () => {
		goto('/newproject')
	}
	const getInstancesForProject = (project_id: string) => {
		return project_instances.filter((instance: any) => {
			return instance.project_id === project_id
		})
	}
	let filterValue = ''
	const filterProjects = (e: any) => {
		console.log('filterProjects now')

		for (let i = 0; i < projects.length; i++) {
			const project = projects[i]
			projects[i].hidden = false
		}
		const value = e.target.value.toLowerCase()
		if (value !== '') {
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i]
				if (
					project.name.toLowerCase().indexOf(value) === -1 &&
					project.domain.toLowerCase().indexOf(value) === -1
				) {
					projects[i].hidden = true
				}
			}
		}
	}
</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar color="primary">
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
	<ion-content>
		{#if projects.length > 4}
		<ion-searchbar value={filterValue} 
			debounce={500} 
			on:ionInput={filterProjects}
			style="margin-left: 10px;padding-right: 30px;" 
			placeholder="search for project"></ion-searchbar>
		{/if}
		<ion-list>
			<div class="grid-container">
				{#each projects as project}
					<ion-card style="max-width: 400px; display: {project.hidden?'none':'block'};">
						<ion-card-header style="cursor:pointer;"
						on:click|stopPropagation={() => {
							goto(`/project/${project.id}`)
						}}
						>
							<ion-card-title>{project.name}</ion-card-title>
							<ion-card-subtitle>{project.domain}</ion-card-subtitle>
						</ion-card-header>

						<ion-card-content>
							<ion-list>
								{#each getInstancesForProject(project.id) as instance}
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
										fill="clear"
										on:click|stopPropagation={() => {
											// launch in another windows
											window.open(
												`https://${instance.domain}.${instance.site_domain}/`,
												'_blank'
											)
										}}
									>
										<ion-icon slot="icon-only" src="/launch.svg" />
									</ion-button>


										<ion-button
											slot="end"
											size="small"
											fill="clear"
											on:click|stopPropagation={() => {
												// launch in another windows
												window.open(
													`https://${instance.domain}.${instance.site_domain}/_/`,
													'_blank'
												)
											}}
										>
											<ion-icon slot="icon-only" src="/pb.svg" />
										</ion-button>
									</ion-item>
								{/each}
							</ion-list>
						</ion-card-content>
					</ion-card>
				{/each}
			</div>
		</ion-list>
	</ion-content>
</IonPage>

<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat(
			auto-fill,
			minmax(400px, 1fr)
		); /* Creates as many columns of at least 250px wide as can fit */
		/*grid-gap: 0px;  Adjust the gap between the cards */
		/*padding: 0px;  Optional padding around the grid */
	}

	ion-card {
		max-width: 100%; /* Override the inline style to make the card responsive */
	}
	ion-card-subtitle {
		/* font-family: monospace; */
		text-transform: lowercase;	
	}
</style>
