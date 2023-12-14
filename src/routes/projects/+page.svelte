<script lang="ts">
	import IonPage from "$ionpage";
	import { addOutline } from "ionicons/icons"
    const ionViewWillEnter = async () => {
        console.log("ionViewWillEnter")
    }
    const newProject = async () => {
        console.log("newProject")
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
        <h1>
            Projects
        </h1>
    </ion-content>
</IonPage>