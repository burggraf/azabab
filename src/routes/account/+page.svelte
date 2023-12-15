<script lang="ts">
	import IonPage from '$ionpage'
	import {
		add,
		addOutline,
		closeCircleOutline,
		cloudUploadOutline,
		imageOutline,
		personOutline,
	} from 'ionicons/icons'
	import { pb, currentUser, apiURL } from '$services/backend.service'
	import { onMount } from 'svelte'
	let name = ''
	const handleNameChange = async (event: any) => {
		name = event.target.value!
		if ($currentUser) {
			pb.collection('users').update($currentUser.id, {
				name: name,
			})
		} else {
			console.log('*** no currentUser -- aborting name change ***')
			return
		}
	}

	const handleChange = async (event: any) => {}

	const upload = () => {
		const fileInput: any = document.getElementById('fileInput')
		fileInput.click()
	}
	const deleteAvatar = async () => {
		if ($currentUser) {
			const result = await pb.collection('users').update($currentUser.id, { avatar: null })
			console.log('*** deleteAvatar result', result)
		}
	}
	onMount(async () => {
		console.log('onMount')
		if ($currentUser) {
			name = $currentUser.name
			console.log('$currentUser', $currentUser)
		}

		const fileInput: any = document.getElementById('fileInput')
		if (fileInput) {
			console.log('*** fileInput found ***', fileInput)
			fileInput.addEventListener('change', async function () {
				const formData = new FormData()

				for (let file of fileInput.files) {
					console.log('*** file', file)
					formData.append('avatar', file)
				}

				try {
					const result = await pb.collection('users').update($currentUser.id, formData)
					console.log('file upload result', result)
				} catch (error) {
					console.error('Error uploading file:', error)
				}
			})
		} else {
			console.log('*** fileInput not found ***')
		}

		const reorderGroup = document.getElementById('keygroup')
		console.log('**** reorderGroup', reorderGroup)
		if (reorderGroup) {
			reorderGroup.addEventListener('ionItemReorder', ({ detail }) => {
				// The `from` and `to` properties contain the index of the item
				// when the drag started and ended, respectively
				console.log('Dragged from index', detail.from, 'to', detail.to)

				// Finish the reorder and position the item in the DOM based on
				// where the gesture ended. This method can also be called directly
				// by the reorder group
				detail.complete()
			})
		}
	})
	const ionViewWillEnter = async () => {
		console.log('ionViewWillEnter')
	}
	const addKey = async () => {
		console.log('addKey')
	}
</script>

<IonPage {ionViewWillEnter}>
	<ion-header>
		<ion-toolbar>
			<ion-buttons slot="start">
				<ion-menu-button />
			</ion-buttons>
			<ion-title>Account</ion-title>
		</ion-toolbar>
	</ion-header>
	<ion-content class="ion-padding">
		<ion-grid class="ion-padding Grid">
			<ion-row>
				<ion-col>
					<ion-label>Name</ion-label>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-item class="GridItem" lines="none">
						<ion-input
							on:ionInput={handleNameChange}
							type="text"
							class="InputBoxWithIcon"
							placeholder="Your name"
							style="--padding-start: 10px;"
							value={name}
							debounce={500}
						/>
						<ion-icon
							class="inputIcon"
							icon={personOutline}
							size="large"
							color="medium"
							slot="start"
						/>
					</ion-item>
				</ion-col>
			</ion-row>

			<ion-row>
				<ion-col>
					<ion-label>Avatar/Image</ion-label>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-item class="GridItem" lines="none">
						<input style="display: none;" type="file" id="fileInput" />
						{#if $currentUser?.avatar}
							<ion-icon
								class="inputIcon"
								icon={closeCircleOutline}
								size="large"
								color="primary"
								slot="start"
								on:click={deleteAvatar}
							/>
						{:else}
							<ion-icon
								class="inputIcon"
								icon={imageOutline}
								size="large"
								color="medium"
								slot="start"
							/>
						{/if}

						<div class="container">
							{#if $currentUser?.avatar}
								<ion-img
									src={`${apiURL}api/files/users/${$currentUser.id}/${$currentUser?.avatar}?thumb=150x150`}
								/>
							{:else}
								<ion-button fill="clear" size="large" on:click={upload}
									><ion-icon slot="icon-only" icon={cloudUploadOutline} /></ion-button
								>
							{/if}
						</div>
					</ion-item>
				</ion-col>
			</ion-row>
		</ion-grid>

		<ion-grid class="ion-padding Grid">
			<ion-row>
				<ion-col>
					<ion-label>Public SSH Keys</ion-label>
				</ion-col>
			</ion-row>
			<ion-row>
				<ion-col>
					<ion-reorder-group id="keygroup" disabled={false}>
						<ion-item>
							<ion-label> Item 1 </ion-label>
							<ion-reorder slot="end" />
						</ion-item>
					</ion-reorder-group>
					<ion-item lines="none">
						<ion-button style="width: 100%;" size="default" expand="block" on:click={addKey}>
							<ion-icon slot="icon-only" icon={addOutline} />
							<ion-label>Add New Public SSH Key</ion-label>
						</ion-button>
					</ion-item>
				</ion-col>
			</ion-row>
		</ion-grid>
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
	.InputBoxWithIcon {
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
