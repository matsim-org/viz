<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>

body,p,h1,h2,h3,h4,h5,h6 {
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

#app {
  height: 100%;
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

</style>
