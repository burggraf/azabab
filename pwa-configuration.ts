import { readFileSync } from 'fs'
import { fileURLToPath } from 'url';

/*** get info from package.json ***/
const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const pwaManifest = {
    name: JSON.stringify(pkg.name).replace(/^"/g, '').replace(/"$/g, ''),
    short_name: JSON.stringify(pkg.menu_title).replace(/^"/g, '').replace(/"$/g, ''),
    description: JSON.stringify(pkg.description).replace(/"/g, '').replace(/^"/g, '').replace(/"$/g, ''),
    theme_color: JSON.stringify(pkg.theme_color).replace(/"/g, '').replace(/^"/g, '').replace(/"$/g, ''),
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
          "type": "image/png"
        }]
    }

const ionicSvelteDirectories = [
    // these are obsolete, everything is in /static now
    '/json/*', '/img/*', '/img/slides/*',
    '/img/ionic/*'
]

const pwaConfiguration = {
    filename: 'sw.js',
    workbox: { 
        swDest: "sw.js"
    },  
    srcDir: './build',
    outDir: './build', // to ensure sw.js and workbox are in build - not according to docs, but works nevertheless? 
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png', '/*', ...ionicSvelteDirectories],
    base: '/',
    scope: '/',
    manifest: pwaManifest
}

export { pwaConfiguration }
