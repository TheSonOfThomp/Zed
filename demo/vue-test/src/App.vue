<template>
  <div id="app">
    <h1><img alt="Vue logo" src="./assets/logo.png">Zed demo with Vue</h1>
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

@import url('../node_modules/zed-shadow/lib/zed.css');

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  margin-top: 60px;
}

#app h1 {
  display: flex;
  align-items: center;
}

body {
  background-color: rgba(243, 246, 253, 1);
  position: relative;
  margin: 50px;
  font-family: --apple-system, Roboto, sans-serif;
  color: #333333;
}

</style>
