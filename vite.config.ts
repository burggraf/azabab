import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
// import { VitePWA } from 'vite-plugin-pwa';
import { generateSW } from './pwa.mjs';


import { readFileSync } from 'fs'
import { fileURLToPath } from 'url';

/*** get info from package.json ***/
const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const config: UserConfig = {
	// WARN: this will not be necessary on your project
	// logLevel: 'info',
	// WARN: this will not be necessary on your project
	// build: {
	// 	minify: false,
	// },
	// WARN: this will not be necessary on your project
	define: {
		__DATE__: `'${new Date().toISOString()}'`,
		__RELOAD_SW__: false,
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
		'__APP_VERSION__': JSON.stringify(pkg.version),
		'__APP_NAME__': JSON.stringify(pkg.name),
		'__APP_HOMEPAGE__': JSON.stringify(pkg.homepage),
		'__APP_DESCRIPTION__': JSON.stringify(pkg.description),
		'__APP_MENU_TITLE__': JSON.stringify(pkg.menu_title),
		'__APP_MENU_SUBTITLE__': JSON.stringify(pkg.menu_subtitle),
		'__APP_PROFILE_TABLE__': JSON.stringify(pkg.profileTable),
		'__APP_PROFILE_KEY__': JSON.stringify(pkg.profileKey),
		'__APP_THEME_COLOR__': JSON.stringify(pkg.theme_color),
		'__APP_BACKGROUND_COLOR__': JSON.stringify(pkg.background_color),	  
	},
	// WARN: this will not be necessary on your project
	server: {
		fs: {
			// Allow serving files from hoisted root node_modules
			allow: ['../..']
		}
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
				srcDir: './src',
				mode: 'development',
				// you don't need to do this if you're using generateSW strategy in your app
				strategies: generateSW ? 'generateSW' : 'injectManifest',
				// you don't need to do this if you're using generateSW strategy in your app
				filename: generateSW ? undefined : 'prompt-sw.ts',
				scope: '/',
				base: '/',
				selfDestroying: process.env.SELF_DESTROYING_SW === 'true',
				manifest: {
					short_name: 'SvelteKit PWA',
					name: 'SvelteKit PWA',
					start_url: '/',
					scope: '/',
					display: 'standalone',
					theme_color: "#ffffff",
					background_color: "#ffffff",
					icons: [
						{
							"src": "/icon-32.png",
							"sizes": "32x32",
							"type": "image/png"
						  },
						  {
							"src": "/icon-64.png",
							"sizes": "64x64",
							"type": "image/png"
						  },
						  {
							"src": "/icon-96.png",
							"sizes": "96x96",
							"type": "image/png"
						  },
						  {
							"src": "/icon-128.png",
							"sizes": "128x128",
							"type": "image/png"
						  },
						  {
							"src": "/icon-152.png",
							"sizes": "152x152",
							"type": "image/png"
						  },
						  {
							"src": "/icon-168.png",
							"sizes": "168x168",
							"type": "image/png"
						  },
						  {
							"src": "/icon-192.png",
							"sizes": "192x192",
							"type": "image/png"
						  },
						  {
							"src": "/icon-256.png",
							"sizes": "256x256",
							"type": "image/png"
						  },
						  {
							"src": "/icon-384.png",
							"sizes": "384x384",
							"type": "image/png"
						  },
						  {
							"src": "/icon-512.png",
							"sizes": "512x512",
							"type": "image/png",
							"purpose": "any maskable"
						  },
					],
				},
				injectManifest: {
					globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
				},
				workbox: {
					globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
				},
				devOptions: {
					enabled: true,
					suppressWarnings: process.env.SUPPRESS_WARNING === 'true',
					type: 'module',
					navigateFallback: '/',
				},
				// if you have shared info in svelte config file put in a separate module and use it also here
				kit: {}
			}
		)
	],
	// build: {
    //     chunkSizeWarningLimit: 2000
    // },
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y-')) return
		handler(warning)
	}
};

export default config;
