"use strict";

// Must use npm and babel to support IE11/Safari
import "babel-polyfill";
import "isomorphic-fetch";
import yaml from "js-yaml";
import debounce from "debounce";

const SERVER_ADDR = "http://geo.vsp.tu-berlin.de";
const SERVER_PARAMS = "/geoserver/accessibilities/ows?service=WFS" +
  "&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=";

mapboxgl.accessToken = "pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ";


  // "pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA";


const STARTING_MODE = 'Walk';

// some global variables save some state for us.
let _dataLayer;
let _activeDataLayer;
let _activeDataset;
let _chosenCity;
let _popup;

let app;
let mymap;

// Called immediately after MapBox is ready to draw the map
function mapIsReady() {
  // Add map chatchkies
  mymap.addControl(new mapboxgl.NavigationControl(), "bottom-right");
  tweakMapColors();
  loadDatasets();
  addAccessibilityLayer(STARTING_MODE);
}

// Add the dataset layer corresponding to our chosen alternative
async function addAccessibilityLayer(alt) {

  console.log("--City: " + _activeDataset.city);
  console.log("--Dataset: " + _activeDataset.name);
  console.log("--Alternative: " + alt);

  let alternative = _activeDataset.alternatives[alt];
  let geoserverLayerId = alternative["geoserver"];
  console.log("--Geoserver Layer: " + geoserverLayerId);

  // choose correct colors: dataset has default colorScale,
  // but alternative can override this setting.
  let colorRamp = COLORS[_activeDataset.colorScale];
  if ("colorScale" in alternative) {
    colorRamp = COLORS[alternative.colorScale];
  }

  mymap.addLayer(
    {
      id: geoserverLayerId,
      source: geoserverLayerId,
      type: "fill",
      paint: {
        "fill-opacity": 0.9,
        "fill-color": {
          property: alternative.column,
          stops: [ [-5, '#f00'], [5, '#00f'] ],
        }
      }
    },
    "water"  // layer gets added just *above* this MapBox-defined layer.
  );

  // remove old layer after new layer is added
  if (_activeDataLayer) mymap.removeLayer(_activeDataLayer);
  _activeDataLayer = geoserverLayerId;

  //add "highlight" layer: for highlighting the square under the mouse
   mymap.addLayer({
      id: "highlight-layer",
      type: 'line',
      source: geoserverLayerId,
      paint: {
        "line-color": "#dff",
        "line-width": 5,
      },
      filter: ["==", "id", ""]
     },
   );

  // turn "hover cursor" into a pointer, so user knows they can click.
  mymap.on("mousemove", geoserverLayerId, function(e) {
      mymap.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab';
  });

  // and back to normal when they mouse away
  mymap.on("mouseleave", geoserverLayerId, function() {
      mymap.getCanvas().style.cursor = '-webkit-grab';
  });

  mymap.on("click", geoserverLayerId, function(e) {
    clickedOnTaz(e);
  });

  addLegend(colorRamp);

  mymap.resize(); // this prevents some redraw problems in MapBox. Thanks MapBox.
}

// clickedOnTaz: called when user... clicks on the taz ;-)
function clickedOnTaz(e) {
  // cancel old close-popup event because it messes with event ordering
  if (_popup) _popup.off('close', closePopupEvent);

  // the browser delivers some details that we need, in the fn argument 'e'
  let props = e.features[0].properties;

  // highlight the zone that we clicked on, using this weird filter thing in MapBox API
  // see https://www.mapbox.com/mapbox-gl-js/example/hover-styles/
  mymap.setFilter("highlight-layer", ["==", "id", props.id]);

  // build HTML of popup window
  let html = `<h4>Raw Values:</h4><hr/>`
  for (let altname in _activeDataset.alternatives) {
    let column = _activeDataset.alternatives[altname].column;
    let value = props[column].toFixed(4);
    html += `<p class="popup-value"><b>${altname}:</b> ${value}</p>`;
  }

  _popup = new mapboxgl.Popup({closeOnClick: true})
    .setLngLat(e.lngLat)
    .setHTML(html);

  // add a close-event, to remove highlight if user closes the popup
  _popup.on('close', closePopupEvent);

  // create the popup!
  _popup.addTo(mymap);
}

function closePopupEvent(p) {
    // remove highlight
    mymap.setFilter("highlight-layer", ["==", "id", '']);
}

function addLegend(colorValues) {

  // remove old legend first
  let mapElement = document.getElementById("mymap");
  let legend = document.getElementById("legend");
  if (legend) mapElement.removeChild(legend);

  // add new legend
  legend = document.createElement('div');
  legend.setAttribute('id', 'legend');
  legend.className = 'legend';

  let html = `<h4>Legend:</h4><hr/>`;

  // loop through our color-bin intervals and generate a label with a colored square for each interval
  for (let [index, val] of colorValues.entries()) {
    if (index==0 || index==10) continue;

    let pre = '';
    if (index == 1) pre = "< ";
    if (index == 9) pre = "> ";

    let breakpoint = val[0];
    let color = val[1];

    html += '<p class="legend-row">'
        + '<i style="background:' + color + '"></i>&nbsp;'
        + '<b>' + pre + breakpoint + '</b>'
        + (colorValues[index + 1] ? '<br>' : '')
        + '</p>';
  }

  html += '<button id="units" class="ui tiny inverted green button">in EMU Units</button>';
  legend.innerHTML = html;

  mapElement.appendChild(legend);
  document.getElementById("units").addEventListener("click", clickedUnits, false);
}

// Show units modal-dialog when user clicks in legend
function clickedUnits() {
  // this is cheating: I'm using jQuery to unhide the modal "What are the units? modal dialog"
  $('.ui.modal').modal('show');
}

// Add any map color & shape tweaks here
function tweakMapColors() {
  // Currently I like the stark black&white map, with one exception: the water should be blue
  mymap.setPaintProperty("water", "fill-color", "#8af");
}

// Do things when user clicks on one of the alternative buttons
function userChoseAlternative(alt) {
  addAccessibilityLayer(alt);
  app.selectedAlt = alt;
}

// Do things when user clicks on one of the dataset dropdown choices
function userChoseDataset(choice) {

  // first make sure user didn't just pick the same dataset
  if (DATASETS[choice].name == _activeDataset.name) return;

  _activeDataset = DATASETS[choice];
  app.selectedDataset = _activeDataset;

  // stay on selected mode, if we can (e.g., if bike was selected, stay on bike alt in new dataset)
  if (!(app.selectedAlt in _activeDataset.alternatives)) {
    app.selectedAlt = Object.keys(_activeDataset.alternatives)[0];
  }

  // zoom map, if we need to
  if (_activeDataset.city != _chosenCity) {
    _chosenCity = _activeDataset.city;

    mymap.flyTo({
      center: _activeDataset.lnglat,
      zoom: _activeDataset.zoom,
    });
  }

  // update the mode buttons
  app.alternatives = Object.keys(_activeDataset.alternatives).reverse();

  // add the datasets
  loadDatasets();

  // show the layer
  addAccessibilityLayer(app.selectedAlt);
}

// load geoserver data for all alternatives, but just for the one active dataset
function loadDatasets() {
  for (let altname in _activeDataset.alternatives) {
    let alt = _activeDataset.alternatives[altname];
    if (!mymap.getSource(alt.geoserver)) {
      const url = SERVER_ADDR + SERVER_PARAMS + alt.geoserver;
      mymap.addSource(alt.geoserver, {
        data: url,
        type: "geojson",
      });
    }
  }
  if (_popup) _popup.remove();
}

let DATASETS, COLORS;

// Load dataset definitions
async function loadDatasetsFromFile() {
  try {
    let url = "/kibera/datasets.yml";
    let resp = await fetch(url);
    let text = await resp.text();
    let yml = await yaml.safeLoad(text, 'utf8');
    return yml;
  } catch (error) {
    console.log('dataset load error: ' + error);
  }
}

// Load color definitions
async function loadColorsFromFile() {
  try {
    let url = "/kibera/colors.json";
    let resp = await fetch(url);
    let json = await resp.json();
    return json;
  } catch (error) {
    console.log('dataset load error: ' + error);
  }
}

async function startApp() {
  DATASETS = await loadDatasetsFromFile();
  COLORS = await loadColorsFromFile();

  _activeDataset = DATASETS[0];

  mymap = new mapboxgl.Map({
    bearing: 0,
    center: _activeDataset.lnglat,
    container: "mymap",
    logoPosition: "bottom-right",
    style: "mapbox://styles/psrc/cj3zxwv914d5b2rqjgdgqprqq",
    pitch: 30,
    zoom: _activeDataset.zoom,
  });

  app = new Vue({
    el: "#titlebar",
    delimiters: ['${', '}'],
    data: {
      selectedAlt: STARTING_MODE,
      selectedDataset: _activeDataset,
      showUnitModal: false,
      DATASETS: DATASETS,
      alternatives: Object.keys(_activeDataset.alternatives).reverse(), // reversed so they right-justify in the right order
    },
    watch: {
      // if there was a sliderbar, we would want to watch if the user changed its value here
    },
    methods: {
      // Vue method names called in the HTML code (e.g. onClick) are sent here
      // left side is name in HTML; right side is name of javaScript method
      // yes, they should probably be the same :-)
      clickedDataset: userChoseDataset,
      clickedAlternative: userChoseAlternative,
    },
  });

  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  $(".ui.dropdown").dropdown();

  // Start doing stuff AFTER the MapBox library has fully initialized
  mymap.on("style.load", mapIsReady);
}

// end of function definitions; start of actual running code
// ----------------------------------------------------------------

startApp();
