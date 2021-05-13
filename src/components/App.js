import { useEffect, useState} from 'react';
import './App.css';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
// eslint-disable-next-line import/no-webpack-loader-syntax
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';
import arriendo from '../api/arriendo';

if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

mapboxgl.workerClass = MapboxWorker;
mapboxgl.accessToken = 'pk.eyJ1Ijoic2Fmd2FuLWJhcmRvbGlhIiwiYSI6ImNrb2IwaXI5MzAzYnkydm4xZWg4eDFkbmoifQ.2JbbEHLeVd5Y1BcuVHAyyQ';

function App() {

  const[hostingData,setHostingData] = useState([]);
  const[locationData,setLocationData] = useState([]);
  
  // when data with same user is present in both table then we merged ""hosting data into location data""?? because some user had only fill the hosting data
  // we assign location data to following var
  // we have not use state here. because when merging, following var mutate multiple time so inorder to avoid multiple re-rendering we have used simple var
  let finalMergedData = [];

  let geojson = {
    type: "FeatureCollection",
    features: [],
  };
  
  const merging = () => {
    // step 1
    // merge location data into var
    // because we perform mutation on independent-state variable
    finalMergedData.push(...locationData);
    console.log(finalMergedData[0])

    // step 2
    // do the final merge, 
    if(finalMergedData.length!==0) {

      hostingData.forEach((hosting)=>{
        finalMergedData.forEach((location)=>{
          if(hosting.uid===location.uid){
            location.userProfileUrl=hosting.userProfileUrl;
            location.fullName=hosting.fullName;
            location.mobile=hosting.mobile;
            location.description=hosting.description;
            location.country=hosting.country;
            location.state=hosting.state;
            location.city=hosting.city;
            location.address=hosting.address;
            location.totalVehicles=hosting.totalVehicles;
            location.fees=hosting.fees;
            location.aadharFileUri=hosting.aadharFileUri;
            location.residentialFileUri=hosting.residentialFileUri;
            location.parkingPhotoUri=hosting.parkingPhotoUri;
          }
        })
      })
      
    }

    console.log(finalMergedData[0])

  }

  const jsonToGeojson = () => {
    for(let i=0;i<finalMergedData.length;i++) {
      geojson.features.push({
        "type":"Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [finalMergedData[i].longitude, finalMergedData[i].latitude]
        },
        "properties": {
          "uid": finalMergedData[i].uid,
          "userProfileUrl": finalMergedData[i].userProfileUrl,
          "totalVehicles": finalMergedData[i].totalVehicles,
          "state": finalMergedData[i].state,
          "residentialFileUri": finalMergedData[i].residentialFileUri,
          "parkingPhotoUri": finalMergedData[i].parkingPhotoUri,
          "mobile": finalMergedData[i].mobile,
          "latitude": finalMergedData[i].latitude,
          "longitude": finalMergedData[i].longitude,
          "fullName": finalMergedData[i].fullName,
          "fees": finalMergedData[i].fees,
          "email": finalMergedData[i].email,
          "description": finalMergedData[i].description,
          "country": finalMergedData[i].country,
          "city": finalMergedData[i].city,
          "address": finalMergedData[i].address,
          "aadharFileUri": finalMergedData[i].aadharFileUri,
        
        }
      })
    }
  }

  const loadMap=()=> {
    if (!('remove' in Element.prototype)) {
      Element.prototype.remove = function () {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      };
    }
    
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [73.7898, 19.9975],
      zoom: 12,
      scrollZoom: false
    });

    map.on('load', function (e) {
      /**
      * This is where your '.addLayer()' used to be, instead
      * add only the source without styling a layer
      */
      map.addSource('places', {
      'type': 'geojson',
      'data': geojson
      });
       
      /**
      * Add all the things to the page:
      * - The location listings on the side of the page
      * - The markers onto the map
      */
      buildLocationList();
      addMarkers();
    });

    function addMarkers() {
      /* For each feature in the GeoJSON object above: */
      geojson.features.forEach(function (marker) {
        /* Create a div element for the marker. */
        var el = document.createElement('div');
        /* Assign a unique `id` to the marker. */
        el.id = 'marker-' + marker.properties.uid;
        /* Assign the `marker` class to each marker for styling. */
        el.className = 'marker';
        
        /**
        * Create a marker using the div element
        * defined above and add it to the map.
        **/
        new mapboxgl.Marker(el, { offset: [0, -23] })
        .setLngLat(marker.geometry.coordinates)
        .addTo(map);
        
        /**
        * Listen to the element and when it is clicked, do three things:
        * 1. Fly to the point
        * 2. Close all other popups and display popup for clicked store
        * 3. Highlight listing in sidebar (and remove highlight for all other listings)
        **/
        el.addEventListener('click', function (e) {
          /* Fly to the point */
          flyToStore(marker);
          /* Close all other popups and display popup for clicked store */
          createPopUp(marker);
          /* Highlight listing in sidebar */
          var activeItem = document.getElementsByClassName('active');
          e.stopPropagation();
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          var listing = document.getElementById(
          'listing-' + marker.properties.uid
          );
          listing.classList.add('active');
          // this.parentNode.classList.add('active');
        });
      });
    }

    /**
* Add a listing for each store to the sidebar.
**/
    function buildLocationList() {
      geojson.features.forEach(function (store, i) {
        /**
        * Create a shortcut for `store.properties`,
        * which will be used several times below.
        **/
        var prop = store.properties;
        
        /* Add a new listing section to the sidebar. */
        var listings = document.getElementById('listings');
        var listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = 'listing-' + prop.uid;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';
        
        /* Add the link to the individual listing created above. */
        var link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.id = 'link-' + prop.uid;
        link.innerHTML = prop.address;
        
        /* Add details to the individual listing. */
        var details = listing.appendChild(document.createElement('div'));
        details.innerHTML = prop.city;
        // if (prop.phone) {
        //   details.innerHTML += ' &middot; ' + prop.phoneFormatted;
        // }
        
        /**
        * Listen to the element and when it is clicked, do four things:
        * 1. Update the `currentFeature` to the store associated with the clicked link
        * 2. Fly to the point
        * 3. Close all other popups and display popup for clicked store
        * 4. Highlight listing in suidebar (and remove highlight for all other listings)
        **/
        link.addEventListener('click', function (e) {
          for (var i = 0; i < geojson.features.length; i++) {
            if (this.id === 'link-' + geojson.features[i].properties.uid) {
              var clickedListing = geojson.features[i];
              flyToStore(clickedListing);
              createPopUp(clickedListing);
            }
          }
          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.parentNode.classList.add('active');
        });
      });
    }

    function flyToStore(currentFeature) {
      map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
      });
    }

    function createPopUp(currentFeature) {
      var popUps = document.getElementsByClassName('mapboxgl-popup');
      if (popUps[0]) popUps[0].remove();
      // var popup = new mapboxgl.Popup({ closeOnClick: false })
      var popup = new mapboxgl.Popup()
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML(
      '<h3>Parking</h3>' +
      '<h4>' +
      currentFeature.properties.address +
      '</h4>'
      )
      .addTo(map);
    }
  }

  useEffect(()=>{

    const getData = async() => {
      try {
        const res = await arriendo.get(`/hostings`);
        setHostingData(res.data);
      } catch(err) {
        console.log(err)
      }

      try {
        const res = await arriendo.get(`/hostinglocations`);
        setLocationData(res.data);  
      } catch(err) {
        console.log(err)
      }

    } 
    
    // means when locationData fetching is complete
    if(locationData.length!==0) {
      merging();
      jsonToGeojson();
    }  

    console.log(geojson)
    
    if(geojson.length!==0) {
      loadMap();
    }

    // calling async function
    getData();   

  },[locationData.length])

  return (
    <div className="app">
      
      <div className="app__sidebar">
        <div className="app__heading">
          <h1>Our location</h1>
        </div>
        <div id="listings" className="listings">

        </div>
      </div>
      
      <div id="map" className="app__map">

      </div>

    </div>
  );
}

export default App;
