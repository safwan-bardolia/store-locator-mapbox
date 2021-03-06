import { useEffect, useState} from 'react';
import './App.css';
import MapIcon from '@material-ui/icons/Map';
import List from '@material-ui/icons/List';

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

  // for smaller screen this will decide text of button and
  // it will also decide what to show on screen (sidebar or map) by changing class name
  const[maptext, setMaptext] = useState(true);
  
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
                
        // /* Add details to the individual listing. */
        // var details = listing.appendChild(document.createElement('div'));
        // details.innerHTML = prop.city;
        // // if (prop.phone) {
        // //   details.innerHTML += ' &middot; ' + prop.phoneFormatted;
        // // }

        // add img inside listing
        var img = listing.appendChild(document.createElement('img'));
        img.src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ_wbPYTxQPMcBh7SPzLFActXnP3uhifeVT_g&usqp=CAU";
 
        /* Add the link to the individual listing created above. */
        // var link = listing.appendChild(document.createElement('a'));
        // link.href = '#';
        // link.className = 'title';
        // link.id = 'link-' + prop.uid;
        // link.innerHTML = prop.address;
        
        
        var listing__info = listing.appendChild(document.createElement('div'));
        listing__info.className = 'listing__info';

        // # listing__info start
        
        var listing__infoTop = listing__info.appendChild(document.createElement('div'));
        listing__infoTop.className = 'listing__infoTop'

          // * listing__infoTop start
            var location = listing__infoTop.appendChild(document.createElement('p'))
            location.innerHTML = `${prop.country} | ${prop.state} | ${prop.city}`

            // var title = listing__infoTop.appendChild(document.createElement('h3'))
            // title.innerHTML = prop.address

            /* Add the link to the individual listing created above. */
            var link = listing__infoTop.appendChild(document.createElement('a'));
            link.href = '#';
            link.className = 'title';
            link.id = 'link-' + prop.uid;
            link.innerHTML = prop.address;

            var underscope = listing__infoTop.appendChild(document.createElement('p'))
            underscope.innerHTML = '_____'
            
            var description = listing__infoTop.appendChild(document.createElement('p'))
            description.innerHTML = `${prop.description} . ${prop.totalVehicles} space for vehicle . User ${prop.fullName} . Mobile ${prop.mobile}`
          // * listing__infoTop end

          
          var listing__infoBottom = listing__info.appendChild(document.createElement('div'));
          listing__infoBottom.className = 'listing__infoBottom'

          // ** listing__infoBottom start
            var stars = listing__infoBottom.appendChild(document.createElement('div'));
            stars.className = 'listing_stars'

              var stars_p = stars.appendChild(document.createElement('p'))
              stars_p.innerHTML = '4.3'

            var price = listing__infoBottom.appendChild(document.createElement('div'));
            stars.className = 'listing_price'

              var price_h2 = price.appendChild(document.createElement('h2'))
              price_h2.innerHTML = `???${prop.fees} / hour`
          // ** listing__infoBottom end

        // # listing__info end

        /**
        * Listen to the element and when it is clicked, do four things:
        * 1. Update the `currentFeature` to the store associated with the clicked link
        * 2. Fly to the point
        * 3. Close all other popups and display popup for clicked store
        * 4. Highlight listing in suidebar (and remove highlight for all other listings)
        **/

        // link.addEventListener('click', function (e) {
        //   for (var i = 0; i < geojson.features.length; i++) {
        //     if (this.id === 'link-' + geojson.features[i].properties.uid) {
        //       var clickedListing = geojson.features[i];
        //       flyToStore(clickedListing);
        //       createPopUp(clickedListing);
        //     }
        //   }
        //   var activeItem = document.getElementsByClassName('active');
        //   if (activeItem[0]) {
        //     activeItem[0].classList.remove('active');
        //   }
        //   this.parentNode.parentNode.parentNode.classList.add('active');
        // });

        listing.addEventListener('mouseover', function (e) {
          for (var i = 0; i < geojson.features.length; i++) {
            if (this.id === 'listing-' + geojson.features[i].properties.uid) {
              var clickedListing = geojson.features[i];
              flyToStore(clickedListing);
              createPopUp(clickedListing);
            }
          }
          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.classList.add('active');
        });

        // move to booking when user click on sidebar-listing-record
        listing.addEventListener('click',()=>{
          console.log("click on map1")
        })


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
      // '<h3>Parking</h3>' +
      // '<h4>' +
      // currentFeature.properties.address +
      // '</h4>'
      `<div id='mapcard' class='mapcard'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ_wbPYTxQPMcBh7SPzLFActXnP3uhifeVT_g&usqp=CAU'/>
        <div class='mapcard__info'>
          <h3>${currentFeature.properties.address}, ${currentFeature.properties.city} <br> </>
          <h3>${currentFeature.properties.description} <br> ${currentFeature.properties.totalVehicles} space for vehicle - ${currentFeature.properties.mobile} <br> </>
          <h2>???${currentFeature.properties.fees} / hour</>
        </div>
      </div>`
      )
      .addTo(map);

      // move to booking when user click on mapcard
      var mapcard = document.getElementById("mapcard");
      mapcard.addEventListener('click',()=>{
        console.log("click on map")
      })

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

  // for smaller screen, this will decide whether to display sidebar or map
  const hideAndShowMapAndSidebar = () => {
    if(maptext) {
      // we are going to display list

      // hide map
      // remove 'show' class from map & add 'hide'
      document.getElementById("map").classList.remove('show')
      document.getElementById("map").classList.add('hide')

      // show sidebar
      // remove 'hide' class from sidebar & add 'show'
      document.getElementById("app__sidebar").classList.remove('hide')
      document.getElementById("app__sidebar").classList.add('show')      

    } else {
      // we are going to display map

      // hide sidebar
      // remove 'show' class from app__sidebar & add 'hide'
      document.getElementById("app__sidebar").classList.remove('show')
      document.getElementById("app__sidebar").classList.add('hide')

      // show map
      // remove 'hide' class from map & add 'show'
      document.getElementById("map").classList.remove('hide')
      document.getElementById("map").classList.add('show')

    }
    setMaptext(!maptext);
  }

  return (
    <div className="app">

        {/* remember we only target 'hide' & 'show' class for screen < 1100px   */}
      <div id="app__sidebar" className="app__sidebar hide">
        <div className="app__heading">
          <h1>nearby parking location</h1>
        </div>
        <div id="listings" className="listings">

        </div>
      </div>
      
      <div id="map" className="app__map show">

      </div>

      <div className="app__button" onClick={hideAndShowMapAndSidebar}>
        <h4>{maptext?'list':'map'}</h4>
        {maptext?<List/>:<MapIcon/>}
      </div>
      {/* <Button onClick={hideAndShowMapAndSidebar}>{maptext?'list':'map'}</Button> */}

    </div>
  );
}

export default App;
