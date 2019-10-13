<template>
  <!-- <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      For a guide and recipes on how to configure / customize this project,<br>
      check out the
      <a href="https://cli.vuejs.org" target="_blank" rel="noopener">vue-cli documentation</a>.
    </p>
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
    </ul>
    <h3>Essential Links</h3>
    <ul>
      <li><a href="https://vuejs.org" target="_blank" rel="noopener">Core Docs</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a></li>
      <li><a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a></li>
      <li><a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a></li>
    </ul>
    <h3>Ecosystem</h3>
    <ul>
      <li><a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a></li>
      <li><a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a></li>
      <li><a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">vue-devtools</a></li>
      <li><a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a></li>
    </ul>
  </div> -->

  <div id="shadow-container">
    <!-- <button :click.native="refresh()">Refresh</button> -->
    <div 
      :zed="card1.z" 
      id="card-1" 
      class="card"
      @mousedown="mousedownCard(1)"
      @mouseup="mouseupCard(1)"
    >Card 1 (z={{card1.z}})</div>
    
    <div 
      :zed="card2.z" 
      id="card-2" 
      class="card" 
      @mousedown="mousedownCard(2)"
      @mouseup="mouseupCard(2)"
    >Card 2 (z={{card2.z}})</div>
    
    <div 
      :zed="card3.z"  
      id="card-3" 
      class="card" 
      @mousedown="mousedownCard(3)"
      @mouseup="mouseupCard(3)"
    >Card 3 (z={{card3.z}})</div>
  </div>
</template>

<script>
import Zed from 'zed-shadow';
// eslint-disable-next-line
console.log(Zed)
// const z = new Zed()
// eslint-disable-next-line
// console.log(z.rootElement)

export default {
  name: 'ZedTest',
  data(){
    return {
      message: 'Hello Vue!',
      Z: null,
      card1: {
        z: 9
      },
      card2: {
        z: 5
      },
      card3: {
        z: 7
      }
    }
  },
  mounted(){
    this.initShadows()
    // this.$nextTick(() => {
    //   $( ".card" ).draggable({
    //     drag: () => {this.refresh()}
    //   });
    // })
  },
  updated(){
    this.refresh()
  },
  methods: {
    initShadows(){
      this.Z = new Zed(this.$el);
      // eslint-disable-next-line
      console.log(this.Z)
    },
    refresh(){
      if (this.Z){
        this.Z.update();
      }
    },
    mousedownCard(x){
      if(x === 1){
        this.card1.z = this.card1.z - 2
      } else if (x === 2) {
        this.card2.z = this.card2.z - 2
      } else if(x === 3) {
        this.card3.z = this.card3.z - 2
      }
    },
    mouseupCard(x){
      // eslint-disable-next-line
      console.log(`clickCard ${x}`)
      if(x === 1){
        this.card1.z = this.card1.z + 2
      } else if (x === 2) {
        this.card2.z = this.card2.z + 2
      } else if(x === 3) {
        this.card3.z = this.card3.z + 2
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped >

button {
  cursor: pointer;
  padding: 4px;
  margin: 12px;
}

.card {
  height: 250px;
  width: 250px;
  background-color: white;
  border-radius: 16px;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}
.small-card {
  position: absolute;
  height: 50px;
  width: 50px;
  background-color: white;
  border-radius: 8px;
}

#card-1{
  top: 76px;
  left: 0px;
}
#card-2 {
  top: 150px;
  left: 150px;
}
#card-3 {
  top: 10px;
  left: 256px;
}
</style>
