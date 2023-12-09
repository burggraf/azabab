<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	// import { page } from '$app/stores'
	import { currentUser } from '$services/backend.service'
	import Login from '$components/Login.svelte'

	import AccordionMenu from './AccordionMenu.svelte'

	import { pwaBeforeInstallPrompt, canInstall } from '$lib/services/pwa'

	import { menuController, modalController, registerMenu } from '$ionic/svelte'
	import { isPlatform } from '@ionic/core'
	import * as allIonicIcons from 'ionicons/icons'

	import IOSInstall from '$lib/components/IOSInstall.svelte'

	let hideMenu = true // a hack because the menu shows before the splash (in Chrome on Windows)
	import { showConfirm } from '$services/alert.service'

	// ** get package info
	const app_version = __APP_VERSION__
	const app_name = __APP_NAME__
	// const app_homepage = __APP_HOMEPAGE__
	// const app_description = __APP_DESCRIPTION__
	const app_menu_title = __APP_MENU_TITLE__
	const app_menu_subtitle = __APP_MENU_SUBTITLE__
	// const app_theme_color = __APP_THEME_COLOR__
	// const app_background_color = __APP_BACKGROUND_COLOR__
	// *******************

	import { toast } from '$services/toast'
	import { isOnline } from '$services/network.service'

	onMount(() => {
		// this is unfortunately needed in order to have the menuController API function properly
		// without this, clicking on the icon at the top left does not close the menu
		registerMenu('mainmenu')
	})

	interface AppPage {
		title: string
		url: string
		icon?: string
		iosIcon?: string
		mdIcon?: string
		children?: AppChild[]
	}
	interface AppChild {
		title: string
		url: string
		icon: string
		disabled?: boolean
	}

	const appPages: AppPage[] = [
		{
			title: 'Dashboard',
			url: 'dashboardMenu',
			icon: 'barChart',
			children: [
				{ title: 'Welcome', url: 'welcome', icon: 'map', disabled: false },
				{ title: 'Quiz', url: 'quiz', icon: 'map', disabled: false },
				{ title: 'Lobby', url: 'lobby', icon: 'map', disabled: false },
			],
		},
		{
			title: 'Help & Information',
			url: 'informationMenu',
			icon: 'informationCircle',
			children: [
				{ title: 'About...', url: 'about', icon: 'map', disabled: false },
				{ title: 'Terms of Use', url: 'terms', icon: 'map', disabled: false },
				{ title: 'Privacy Policy', url: 'privacy', icon: 'map', disabled: false },
				{ title: 'Support', url: 'support', icon: 'map', disabled: false },
			],
		},
		{
			title: 'Settings & Profile',
			url: 'settingsMenu',
			icon: 'settings',
			children: [
				{ title: 'Account', url: 'account', icon: 'settings', disabled: false },
				{ title: 'Settings', url: 'settings', icon: 'settings', disabled: false },
			],
		},
		{
			title: 'Admin',
			url: 'adminMenu',
			icon: 'lockClosed',
			children: [
				{ title: 'Users', url: 'adm-users', icon: 'map', disabled: true },
			],
		},
		{
			title: 'Samples',
			url: 'samples',
			icon: 'starOutline',
		},
	]

	const badges: any = {};

	const closeAndNavigate = async (url: string) => {
		goto(url)

		menuController.close('mainmenu')
	}
	const closeMenu = async () => {
		menuController.close('mainmenu')
	}

	// hack because of visibility of menu in Chrome/Windows
	setTimeout(() => {
		hideMenu = false
	}, 100)

	let iosInstall = isPlatform('ios') && !isPlatform('pwa')

	const showIOSinstall = async () => {
		const modal = await modalController.create({
			component: IOSInstall,
			componentProps: {},
			showBackdrop: true,
			backdropDismiss: false,
		})

		modal.onDidDismiss().then((value) => {
			//if (value.role === 'backdrop') console.log('Backdrop clicked');
		})

		await modal.present()
	}
	const toggleOnlineStatus = async (e: any) => {
		await showConfirm({
			header: 'Manually set online status',
			message: `Force online status to <b>${$isOnline ? 'Offline' : 'Online'}</b>?`,
			okHander: async () => {
				isOnline.set(!$isOnline)
				toast(
					`Online status set to: <b>${$isOnline ? 'Online' : 'Offline'}</b>`,
					$isOnline ? 'success' : 'danger'
				)
			},
		})
	}
	const toggleDebugger = () => {
		const el = document.getElementById('debugger')
		if (el) {
			if (el.classList.contains('hidden')) {
				el.classList.remove('hidden')
			} else {
				el.classList.add('hidden')
			}
		}
	}
</script>

<ion-menu content-id="main" menu-id="mainmenu" class:menuhide={hideMenu}>
	<ion-header>
		<ion-toolbar color="primary">
			<ion-title>{app_menu_title}</ion-title>
			<ion-img on:click={closeMenu} src="/icon.svg" style="cursor:pointer;margin-left:10px;height:40px;width:40px;" />
		</ion-toolbar>
	</ion-header>
	<ion-content class="">
		<p class="menu_subtitle">
			{app_menu_subtitle}
		</p>
		<div class="login">
			<ion-menu-toggle auto-hide={false}>
				<Login
					providers={['google', 'facebook']}
					onSignOut={() => {
						localStorage.clear()
						// goto('/');
						window.location.href = '/'
					}}
					onSignIn={() => {
						// goto('/dashboardwelcome');
					}}
					profileFunction={() => {
						//console.log('do some profileFunction here')
						goto('/account');
					}}
				/>
			</ion-menu-toggle>
		</div>

		<AccordionMenu appPages={appPages} {badges} />

		<ion-list>
			<ion-item lines="none" />
			{#if iosInstall}
				<ion-item on:click={showIOSinstall} lines="none">
					<ion-icon icon={allIonicIcons['download']} slot="start" />
					<ion-label>Install this app as PWA</ion-label>
				</ion-item>
				<ion-item lines="none" />
			{/if}
			{#if $canInstall}
				<ion-item
					lines="none"
					on:click={() => {
						const prompt = $pwaBeforeInstallPrompt
						prompt.prompt()
					}}
				>
					<ion-icon icon={allIonicIcons['download']} slot="start" />
					<ion-label>Install this app as PWA</ion-label>
				</ion-item>
				<ion-item lines="none" />
			{/if}
		</ion-list>
	</ion-content>
	<ion-footer class="ion-padding">
		{#if $currentUser}
			<div
				class="pointer centered"
				on:click={() => {
					closeAndNavigate('/account')
				}}
			/>
			<br />
		{/if}
		<div
			class="pointer centered"
			on:click={() => {
				closeAndNavigate('/privacy')
			}}
		>
			Privacy Policy
		</div>
		<br />
		<div
			class="pointer centered"
			on:click={() => {
				closeAndNavigate('/terms')
			}}
		>
			Terms of Service
		</div>
		<br />
		<div class="pointer centered" on:click={toggleDebugger}>{app_name} {app_version}</div>
		<div id="debugger" class="hidden">
			<span
				class="pointer"
				on:click={() => {
					localStorage.clear()
				}}>clear cache</span
			>
			<span class="pointer span-on-right" on:click={toggleOnlineStatus}>
				<ion-label color={$isOnline ? 'success' : 'danger'}
					><b>{$isOnline ? 'Online' : 'Offline'}</b></ion-label
				>
			</span>
		</div>
		<br />
	</ion-footer>
</ion-menu>

<style>
	ion-item {
		cursor: pointer;
	}
	.active-item {
		font-weight: bold;
	}

	.menuhide {
		display: none;
	}

	.hidden {
		display: none;
	}
	.pointer {
		cursor: pointer;
	}
	.span-on-right {
		text-align: right;
		float: right;
		padding-right: 5px;
	}
	.centered {
		text-align: center;
	}
	ion-menu ion-content {
		--background: var(--ion-item-background, var(--ion-background-color, #fff));
	}

	ion-item:hover {
		--background: var(--ion-color-light);
		font-weight: bold;
		color: var(--ion-color-primary);
	}
	.menu_subtitle {
		margin-left: 8px;
		margin-right: 8px;
		text-align: center;
		color: var(--ion-color-medium);
	}
	.login {
		margin-left: 10px;
		margin-right: 10px;
	}
</style>
