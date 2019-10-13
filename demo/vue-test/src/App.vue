<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <ZedTest/>
  </div>
</template>

<script>
import ZedTest from './components/ZedTest.vue'

export default {
  name: 'app',
  components: {
    ZedTest
  }
}
</script>

<style>

@import url('../node_modules/zed-shadow/zed/zed.css');

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

body {
  background-color: rgba(243, 246, 253, 1);
  position: relative;
  /* margin: 128px; */
  font-family: --apple-system, Roboto, sans-serif;
  color: #333333;
}

</style>
