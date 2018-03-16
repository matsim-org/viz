<template lang="pug">
#main
  #fill
    canvas#canvas
  #row(style="height: 2em")
    button#btnPlayPause Play
    button#btnDecrSpeed -
    input#inputPlaybackSpeed(name="inputPlaybackSpeed" type="number" min="0.05" max="10" step="0.05" value="1.0" readonly)
    button#btnIncrSpeed +
    input#inputTimeSlider.flex(type="range")
    input#inputTimestep(type="text" readonly)
    input#inputIsFetchingData(type="text" value="not loading" readonly)
    input#inputAgentNumber(type="text" value="0" readonly)
    button#btnReload reload
</template>

<script>
'use strict'

let Webvis = require('@/assets/janek-viz/Webvis.js')

let webvis;
let timeslider, txtTimestep, txtNumberOfAgents;
let isPlaying = false;
let isSliderMouseDown = false;

let store = {}

// this export is the Vue Component itself
export default {
  name: 'JanekViz',
  components: {},
  data () {
    return store
  },
  mounted: function () {
    mounted();
  },
  methods: {
  },
  watch: {
  },
}

function mounted () {
  loadWebvis();
  subscribeEvents();

  document.getElementById('btnReload').addEventListener('click', function (e) {
    webvis.destroy();
    webvis = null;

    loadWebvis();
  });
}

function loadWebvis () {
  webvis = new Webvis.Webvis({ canvasId: 'canvas' });
  webvis.onServerConfigChanged = handleConfigLoaded;
  webvis.onTimestepChanged = handleTimestepChanged;
  webvis.onFetchingData = handleFetchingData;
}

function handleConfigLoaded () {
  timeslider = document.getElementById('inputTimeSlider');
  txtTimestep = document.getElementById('inputTimestep');
  txtFetching = document.getElementById('inputIsFetchingData');
  txtNumberOfAgents = document.getElementById('inputAgentNumber');
  timeslider.min = webvis.firstTimestep;
  timeslider.max = webvis.lastTimestep;
  timeslider.value = webvis.firstTimestep;
  timeslider.step = webvis.timestepSize;
  txtTimestep.value = webvis.firstTimestep;

  timeslider.oninput = function (e) {
    txtTimestep.value = timeslider.value;
  }
  timeslider.onchange = function (e) {
    webvis.seekTimestep(parseFloat(timeslider.value));
  }
  timeslider.onmousedown = function (e) {
    isSliderMouseDown = true;
  }
  timeslider.onmouseup = function (e) {
    isSliderMouseDown = false;
  }
}

function handleTimestepChanged (timestep) {
  if (!isSliderMouseDown) {
    timeslider.value = timestep;
    txtTimestep.value = timestep;
    let snapshot = webvis.playback.getSnapshotForCurrentTimestep();
    txtNumberOfAgents.value = snapshot.position.length / 3;
  }
}

function handleFetchingData (isFetching) {
  if (isFetching) {
    txtFetching.value = 'loading...';
  } else {
    txtFetching.value = 'not loading';
  }
}

function subscribeEvents () {
  document.getElementById('btnPlayPause').addEventListener('click', function (e) {
    if (isPlaying) {
      webvis.stopPlayback();
      isPlaying = false;
      document.getElementById('btnPlayPause').innerHTML = 'Play';
    } else {
      webvis.startPlayback();
      isPlaying = true;
      document.getElementById('btnPlayPause').innerHTML = 'Pause';
    }
  });
  document.getElementById('btnDecrSpeed').addEventListener('click', function (e) {
    webvis.setPlaybackSpeed(webvis.playbackSpeedFactor / 2);
    document.getElementById('inputPlaybackSpeed').value = webvis.playbackSpeedFactor;
  });

  document.getElementById('btnIncrSpeed').addEventListener('click', function (e) {
    webvis.setPlaybackSpeed(webvis.playbackSpeedFactor * 2);
    document.getElementById('inputPlaybackSpeed').value = webvis.playbackSpeedFactor;
  });
}
</script>

<style scoped>
    html {
      height: 100%;
    }

    body {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.42857143;
      color: #333;
    }

    main {
      display: flex;
      flex-direction: column;
      align-content: stretch;
      height: 100%;
    }

    .fill {
      flex: 1;
      overflow: hidden;
    }

    .row {
      display: flex;
      flex-direction: row;
      align-content: stretch
    }

    .flex {
      flex: 1;
    }

    #canvas {
      height: 100%;
      width: 100%;
    }

    .page { height: 100%; }
    .container {height: 100%; }
    .content {
      margin-left: 290px;
      margin-right: 0px;
      padding-top: 5px;
      padding-bottom: 60px;
    }
</style>
