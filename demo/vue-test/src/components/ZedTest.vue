<template>
  <div id="shadow-container">
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
      // this.Z.setElevationIncrement(1.5)
      // this.Z.update()
    },
    refresh(){
      if (this.Z){
        this.Z.update();
      }
    },
    mousedownCard(x){
      if(x === 1){
        this.card1.z = this.card1.z - 1
      } else if (x === 2) {
        this.card2.z = this.card2.z - 1
      } else if(x === 3) {
        this.card3.z = this.card3.z - 1
      }
    },
    mouseupCard(x){
      // eslint-disable-next-line
      console.log(`clickCard ${x}`)
      if(x === 1){
        this.card1.z = this.card1.z + 1
      } else if (x === 2) {
        this.card2.z = this.card2.z + 1
      } else if(x === 3) {
        this.card3.z = this.card3.z + 1
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
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}

#card-1{
  top: 50px;
  left: 0px;
}
#card-2 {
  top: 150px;
  left: -75px;
}
#card-3 {
  top: 0px;
  left: -150px;
}
</style>
