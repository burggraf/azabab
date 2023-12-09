<script lang="ts">
    import IonPage from "$ionpage";
	import { onMount } from "svelte"
    import { pb } from '$services/backend.service';
    import { currentUser } from '$services/backend.service';
    let subscriptionRecordId: string = '';
    let usersInLobby: any = [];
    let listeners: any = {};
    onMount(async () => {
        listeners.visibilityListener = document.addEventListener("visibilitychange", async () => {
            if (document.visibilityState === 'hidden') {
                const record = await pb.collection('userstate').update(subscriptionRecordId, {state:{status: 'away',name: $currentUser.name}});
            } else {
                const record = await pb.collection('userstate').update(subscriptionRecordId, {state:{status: 'online',name: $currentUser.name}});
            }
        });  
        listeners.blur = window.addEventListener('blur', async () => {
            console.log('*** LOBBY: window blur ***')
            const record = await pb.collection('userstate').update(subscriptionRecordId, {state:{status: 'away',name: $currentUser.name}});
        });      
        listeners.focus = window.addEventListener('focus', async () => {
            console.log('*** LOBBY: window focus ***')
            const record = await pb.collection('userstate').update(subscriptionRecordId, {state:{status: 'online',name: $currentUser.name}});
        });      
        listeners.userstate = pb.collection('userstate').subscribe('*', function (e) {
            getAllUsersInLobby();
        });
        getAllUsersInLobby();
        listeners.currentUser = currentUser.subscribe(async (user: any) => {
            if (user) {
                setUserStatus();
            } else {
                if (subscriptionRecordId) {
                    const result = await pb.collection('userstate').delete(subscriptionRecordId);
                }
            }
        });
        return () => {
            document.removeEventListener("visibilitychange", listeners.visibilityListener);
            window.removeEventListener('blur', listeners.blur);
            window.removeEventListener('focus', listeners.focus);
            listeners.userstate.unsubscribe();
            listeners.currentUser.unsubscribe();
        };
    });
    const setUserStatus = async () => {
        if (!$currentUser) {
            console.log('*** LOBBY: ionViewWillEnter *** currentUser not found')
            return;
        }
        try {
            const resultList = await pb.collection('userstate').getFirstListItem(`user="${$currentUser.id}"`, {});
            if (resultList) {
                subscriptionRecordId = resultList.id;
                const result = await pb.collection('userstate').update(subscriptionRecordId, {entered:(new Date().toISOString()),state:{status: 'online',name: $currentUser.name}});
                return;
            }
        } catch (error) {
        }
        const result = await pb.collection('userstate').create({
            user: $currentUser.id,
            state: {entered: (+new Date()), 
                    name: $currentUser.name, 
                    status: 'online'
                    },
        });
        subscriptionRecordId = result.id;
    }
    const ionViewWillEnter = async () => {
        // console.log('ionViewWillEnter event fired');
    }
    const ionViewWillLeave = async () => {
        const result = await pb.collection('userstate').delete(subscriptionRecordId);
    }
    const getAllUsersInLobby = async () => {
        const records = await pb.collection('userstate').getFullList({
            sort: '-created',
        });
        usersInLobby = records;
    }
</script>
<IonPage {ionViewWillEnter} {ionViewWillLeave}>
    <ion-header>
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-menu-button />
            </ion-buttons>
            <ion-title>Lobby</ion-title>
        </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">


        <!--
{
    "collectionId": "xxxxxxxxxxxxxxx",
    "collectionName": "lobby",
    "created": "2023-12-03 15:52:02.559Z",
    "id": "xxxxxxxxxxxxxxx",
    "state": {
      "name": "User Name",
      "status": "online"
    },
    "updated": "2023-12-03 15:52:08.951Z",
    "user": "xxxxxxxxxxxxxxx"
  }            
        -->
        <ion-grid>
            <ion-row>
                <ion-col size="12">
                    <ion-card>
                        <ion-card-header>
                            <ion-card-title>Users in Lobby</ion-card-title>
                        </ion-card-header>
                        <ion-card-content>
                            <ion-list>
                                {#each usersInLobby as user}
                                <ion-item>
                                    <ion-label>{user.state.name || 'Unknown User'}</ion-label>
                                    <ion-badge slot="end" color={user.state.status==='online'?'success':'danger'}>{user.state.status}</ion-badge>
                                </ion-item>
                                {/each}
                            </ion-list>
                        </ion-card-content>
                    </ion-card>
                </ion-col>
        </ion-grid>
        <!-- <pre>
            {JSON.stringify(usersInLobby, null, 2)}
        </pre> -->
    </ion-content>
</IonPage>