<script lang="ts">
	import IonPage from "$ionpage";
    import { page } from '$app/stores'
	import { arrowBackOutline, checkmarkOutline } from "ionicons/icons"
    import { currentUser, pb } from "$services/backend.service";
	import { goto } from "$app/navigation"
	export let id = $page.params.id
    let sites: any = []
    const project: any = {
        domain: '',
        name: '',
        owner: $currentUser?.id,
        ownertype: 'person'
    }
    const project_instances: any = [{
        id: '',
        name: '',
        type: 'primary'
    }]
    const ionViewWillEnter = async () => {        
        console.log("ionViewWillEnter")
        if (id !== 'new') {
            const record = await pb.collection('projects').getOne(id)
            console.log('record', record)
            project.domain = record.domain
            project.name = record.name
            project.owner = record.owner
            project.ownertype = record.ownertype
        }
        sites = await pb.collection('sites').getFullList({
            fields: 'id, name, code',
        });
        if (id === 'new') {
            project_instances[0].id = sites[0].id
        }
    }
    const save = async () => {
        console.log("save")
        if (id === 'new') { 
            delete project.id;

            const { email } = await pb.send(
                "/createproject",
                {
                method: "POST",
                body: {
                    project,
                    project_instances,
                },
                },
            );
        

            //const record = await pb.collection('projects').create(project)
            //console.log('record', record)
            // goto(`/project/${record.id}`)
            //goto("/projects")
        } else {
            //const result = await pb.collection('projects').update(id, project)
            //console.log('result', result)
            //goto("/projects")
        }
    }
    const back = async () => {
        goto("/projects")
    }
	const handleChange = async (event: any) => {
        console.log('id', event.target.id)
        console.log('handleChange', event.target.value)
        console.log(event)
        project[event.target.id] = event.target.value || ''
	}
    const siteChange = async (event: any) => {
        console.log('siteChange', event.target.value)
        console.log(event)
        const fieldname = event.target.id.split('_')[0]
        const index = event.target.id.split('_')[1]
        project_instances[index][fieldname] = event.target.value || ''
    }
</script>
<IonPage {ionViewWillEnter}>
    <ion-header>
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-button on:click={back}>
                    <ion-icon slot="icon-only" icon={arrowBackOutline} />
                </ion-button>
            </ion-buttons>
            <ion-title>Project</ion-title>
            <ion-buttons slot="end">
                <ion-button on:click={save}>
                    <ion-icon slot="icon-only" icon={checkmarkOutline} />
                </ion-button>
        </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
		<ion-grid class="ion-padding Grid">
			<ion-row>
				<ion-col>
					<ion-label>domain</ion-label>
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
						<!-- <ion-icon
							class="inputIcon"
							icon={}
							size="large"
							color="medium"
							slot="start"
						/> -->
					</ion-item>
				</ion-col>
			</ion-row>

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
						<!-- <ion-icon
							class="inputIcon"
							icon={}
							size="large"
							color="medium"
							slot="start"
						/> -->
					</ion-item>
				</ion-col>
			</ion-row>
		</ion-grid>


        <ion-grid class="ion-padding Grid">
            <ion-row>
				<ion-col>
					<ion-label>Instances</ion-label>
				</ion-col>
			</ion-row>
            {#each project_instances as project_instance, index}
                <ion-row>
                    <ion-col>
                        <ion-item class="GridItem" lines="none">
                            <ion-select
                                id={"type_" + index}
                                label="Type"
                                value={project_instance.type}
                                placeholder="Select One"                                
                                on:ionChange={siteChange}>
                                <ion-select-option value="primary">primary</ion-select-option>
                                <ion-select-option value="replica">replica</ion-select-option>
                            </ion-select>
                        </ion-item>
                    </ion-col>    
                    <ion-col>
                        <ion-item class="GridItem" lines="none">
                            <ion-select
                                id={"id_" + index}
                                label="Data Center"
                                value={project_instance.id}
                                placeholder="Select One"                                
                                on:ionChange={siteChange}>
                                {#each sites as site}
                                    <ion-select-option value={site.id}>{site.name}</ion-select-option>
                                {/each}
                            </ion-select>
                        </ion-item>
                    </ion-col>
                </ion-row>
            {/each}
        </ion-grid>
        <!-- project: {JSON.stringify(project)}
        <br />
        project_instances: {JSON.stringify(project_instances)} -->
    </ion-content>
</IonPage>
<style>
	.title {
		padding-left: 10px;
	}
	.container {
		width: 150px;
		height: 150px;
		border: 1px solid; /* Optional, just for visibility */
		border-color: var(--ion-color-medium);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container ion-img {
		max-width: 100%;
		max-height: 100%;
	}
	.Grid {
		max-width: 500px;
	}
	.ProvidersGrid {
		max-width: 375px;
	}
	input:-webkit-autofill {
		-webkit-text-fill-color: var(--ion-color-FORCEDARK);
		font-weight: 500px;
	}

	input:-webkit-autofill:focus {
		-webkit-text-fill-color: var(--ion-color-FORCEDARK);
		font-weight: 500px;
	}

	.inputIcon {
		margin-left: 10px;
		margin-right: 10px;
	}

	.GridItem {
		--padding-start: 0px;
		--padding-end: 0px;
		--inner-padding-end: 0px;
	}
	.loginInputBoxWithIcon {
		height: 50px;
		border: 1px solid;
		border-color: var(--ion-color-medium);
		background-color: var(--ion-background-color) !important;
		border-radius: 5px;
	}
	.toast {
		font-weight: bold;
	}
	.flex-container {
		display: flex;
		display: -webkit-flex;
		display: -moz-flex;
		flex-flow: row wrap;
		-webkit-flex-flow: row wrap;
		-moz-flex-flow: row wrap;
		justify-content: center;
	}
</style>