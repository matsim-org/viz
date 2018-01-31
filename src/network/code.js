"use strict";

// Must use npm and babel to support IE11/Safari
import "babel-polyfill";
import "isomorphic-fetch";

let filename = '/network/networkWGS84.geo.json';

mapboxgl.accessToken =
  "pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA";

let map;

// Called immediately after MapBox is ready to draw the map
async function mapIsReady() {

  map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

  let json;

  try {
    let resp = await fetch(filename);
    json = await resp.json();
  } catch (e) {
    alert(e);
  }

  for (let link of json.features) {
    link.properties.width = link.properties["base case (demand)_agents"] / 200;
    if (link.properties.width < 3) link.properties.width = 2;
    link.properties.vc = 1.0 * link.properties["base case (demand)_agents"] / link.properties.capacity;
  }

  map.addSource("my-data", {
    data: json,
    type: "geojson",
  });

  console.log(map.getStyle().layers);

  map.addLayer({
    id: "my-layer",
    source: "my-data",
    type: "line",
    paint: {
      "line-opacity": 0.8,
      "line-width": ["get", "width"],
      "line-color": {
        property: "vc",
        stops: [ [0.4, '#04c'],
                 [0.8, '#084'],
                 [1.0, '#0a0'],
                 [1.3, '#cc0'],
                 [1.7, '#fc0'],
                 [2.0, '#800'] ],

      }
    }
 // });
  }, "road-primary");  // layer gets added just *above* this MapBox-defined layer.

  map.on("click", "my-layer", function(e) {
    clickedOnTaz(e);
  });

// turn "hover cursor" into a pointer, so user knows they can click.
  map.on("mousemove", "my-layer", function(e) {
      map.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab';
  });

  // and back to normal when they mouse away
  map.on("mouseleave", "my-layer", function() {
      map.getCanvas().style.cursor = '-webkit-grab';
  });


}

let _popup;

// clickedOnTaz: called when user... clicks on the taz
function clickedOnTaz(e) {
  console.log(e);

  // cancel old close-popup event because it messes with event ordering
  // if (_popup) _popup.off('close', closePopupEvent);

  // the browser delivers some details that we need, in the fn argument 'e'
  let props = e.features[0].properties;

  // highlight the zone that we clicked on, using this weird filter thing in MapBox API
  // see https://www.mapbox.com/mapbox-gl-js/example/hover-styles/
  // mymap.setFilter("highlight-layer", ["==", "id", props.id]);

  // build HTML of popup window
  let html = `<h4>Raw Values:</h4>`;
  html +=  "Freespeed: " + props.Freespeed.toFixed(2) + "<br>"
  + "capacity: " + props.capacity.toFixed(2) + "<br>"
  + "demand: " + props["base case (demand)_agents"];

  /* for (let altname in _activeDataset.alternatives) {
    let column = _activeDataset.alternatives[altname].column;
    let value = props[column].toFixed(4);
    html += `<p class="popup-value"><b>${altname}:</b> ${value}</p>`;
  } */

  _popup = new mapboxgl.Popup({closeOnClick: true})
    .setLngLat(e.lngLat)
    .setHTML(html);

  // add a close-event, to remove highlight if user closes the popup
  // _popup.on('close', closePopupEvent);

  // create the popup!
  _popup.addTo(map);
}


// Code starts running here ---->

map = new mapboxgl.Map({
  bearing: 0,
  center: [13.4, 52.5],  //lnglat, not latlng
  container: "mymap",
  logoPosition: "bottom-right",
  style: "mapbox://styles/mapbox/dark-v9",
  pitch: 0,
  zoom: 11,
});


// Start doing stuff AFTER the MapBox library has fully initialized
map.on("style.load", mapIsReady);
