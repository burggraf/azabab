<script lang="ts">
	import { Map, View } from 'ol'
	import TileLayer from 'ol/layer/Tile'
	import OSM from 'ol/source/OSM'
	import { Vector as VectorLayer } from 'ol/layer'
	import { Vector as VectorSource } from 'ol/source'
	import { Point } from 'ol/geom'
	import { Feature } from 'ol'
	import { Style, Icon } from 'ol/style'
	import IonPage from '$ionpage'
	import { add } from 'ol/coordinate'
	import { fromLonLat } from 'ol/proj'
	import { Attribution, defaults as defaultControls } from 'ol/control'

	let map: any
	let vectorSource: any // Declare vectorSource in the outer scope
	// Function to initialize the map
	function initializeMap() {
		const mapElement = document.getElementById('map')
		if (!mapElement) {
			return
		}
		const osmLayer = new TileLayer({
			source: new OSM(),
		})

		vectorSource = new VectorSource() // Initialize vectorSource

		// Create a vector layer to include the vector source
		const vectorLayer = new VectorLayer({
			source: vectorSource,
		})
		const attributionControl = new Attribution({
			className: 'custom-attribution',
			target: 'my-attribution', // ID of the target element
		})
		map = new Map({
			target: mapElement,
			layers: [osmLayer, vectorLayer],
			view: new View({
				center: [0, 0], // Center of the map
				zoom: 2, // Initial zoom level
			}),
			controls: defaultControls({
				attribution: false, // Disable the default attribution control
			}).extend([attributionControl]), // Add the custom attribution control
		})
	}
    const cities = [
  {
    "city": "Nuremberg, Germany",
    "latitude": 49.460983,
    "longitude": 11.061859
  },
  {
    "city": "Chicago, IL",
    "latitude": 41.881832,
    "longitude": -87.623177
  },
  {
    "city": "Los Angeles, CA",
    "latitude": 34.052235,
    "longitude": -118.243683
  },
  {
    "city": "Singapore",
    "latitude": 1.290270,
    "longitude": 103.851959
  },
  {
    "city": "Tokyo",
    "latitude": 35.6895,
    "longitude": 139.6917
  },
  {
    "city": "Hillsboro, OR",
    "latitude": 45.5229,
    "longitude": -122.9898
  },
  {
    "city": "Vine Hill, Virginia",
    "latitude": 37.9940,
    "longitude": -77.4291
  },
  {
    "city": "Buffalo, NY",
    "latitude": 42.8864,
    "longitude": -78.8784
  },
  {
    "city": "Dallas, TX",
    "latitude": 32.7767,
    "longitude": -96.7970
  }
];
	// Add cities as dots on the map
	function addCity(latitude: number, longitude: number) {
		console.log('addCity', latitude, longitude)
		const cityFeature = new Feature({
			geometry: new Point(fromLonLat([longitude, latitude])),
		})

		cityFeature.setStyle(
			new Style({
				image: new Icon({
					// Specify your dot icon here
					//src: '/icon-16.png',
					src: '/icon.svg',
					height: 16,
					width: 16,
				}),
			})
		)

		vectorSource.addFeature(cityFeature)
		return
		//   const cityFeature = new Feature({
		//     geometry: new Point([longitude, latitude]),
		//   });

		//   cityFeature.setStyle(new Style({
		//     image: new Icon({
		//       // Specify your dot icon here
		//       src: '/icon-64.png',
		//     }),
		//   }));

		//   console.log('map', map)
		//   map.getSource().addFeature(cityFeature);
	}

	const ionViewDidEnter = async () => {
		console.log('ionViewDidEnter')
		initializeMap()
        for (const city of cities) {
            addCity(city.latitude, city.longitude)
        }
		// const { data, error } = await pb.send('/get-environment',{"method":"GET"})
		// console.log('enviroment:', data)
	}
	// Call this function for each city you want to add
	// Example: addCity(12.4964, 41.9028); // Coordinates for Rome, Italy
</script>

<!-- <svelte:window on:load={initializeMap} /> -->

<IonPage {ionViewDidEnter}>
	<div id="map" />
</IonPage>

<style>
	#map {
		width: 100%;
		height: 600px;
	}
	/* ol-attribution ol-unselectable ol-control ol-uncollapsible */
</style>
