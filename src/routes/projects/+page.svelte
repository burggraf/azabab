<script lang="ts">
	import { goto } from "$app/navigation"
	import IonPage from "$ionpage";
	import { addOutline, constructOutline, eyeOutline } from "ionicons/icons"
    import { pb } from "$services/backend.service";
    let projects: any = []
    const ionViewWillEnter = async () => {
        console.log("ionViewWillEnter")
        // const records = await pb.collection('projects').getFullList({
        //     sort: '-created',
        //     expand: 'project_instance'
        // });
        // const records = await pb.collection('project_instance').getFullList({
        //     expand: 'project_id,site_id'//"project_instance(project_id).port"
        // });
        const records = await pb.collection('instance_view').getFullList({});
        projects = records
    }
    const newProject = async () => {
        goto("/project/new")
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
        </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
        <ion-list>
            {#each projects as project}
                <ion-item
                    lines="full"
                    on:click={() => {
                        goto(`/project/${project.project_id}`)
                    }}
                >
                    <ion-label>
                        <h2>{project.name}</h2>
                        <h3>domain: {project.domain}.{project.site_domain}<br/>
                           location: {project.site_name}<br/>
                           type: {project.type}</h3>
                    </ion-label>
                    <ion-button size="default" slot="end" fill="outline" on:click|stopPropagation={() => {
                        // launch in another windows
                        window.open(`https://${project.domain}.${project.site_domain}`,'_blank')
                        }}>
                        <ion-icon slot="icon-only" icon={eyeOutline} />
                        </ion-button>
                    <ion-button size="default" slot="end"  on:click|stopPropagation={() => {
                        // launch in another windows
                        window.open(`https://${project.domain}.${project.site_domain}/_/`,'_blank')
                        }}>
                        <ion-icon slot="icon-only" icon={constructOutline} />
                        </ion-button>
                </ion-item>
            {/each}
    </ion-content>
</IonPage>