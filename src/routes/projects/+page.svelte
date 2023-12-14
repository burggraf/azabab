<script lang="ts">
	import { goto } from "$app/navigation"
	import IonPage from "$ionpage";
	import { addOutline } from "ionicons/icons"
    import { pb } from "$services/backend.service";
    let projects: any = []
    const ionViewWillEnter = async () => {
        console.log("ionViewWillEnter")
        const records = await pb.collection('projects').getFullList({
            sort: '-created',
        });
        console.log('records', records)
        projects = records
    }
    const newProject = async () => {
        console.log("newProject")
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
                        goto(`/project/${project.id}`)
                    }}
                >
                    <ion-label>
                        <h2>{project.name}</h2>
                        <p>{project.domain}</p>
                    </ion-label>
                </ion-item>
            {/each}
    </ion-content>
</IonPage>