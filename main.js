var app = new Vue({
  el: '#shadowcontainer',
  data: {
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
  },
  mounted(){
    this.initShadows()
    this.$nextTick(() => {
      $( ".card" ).draggable({
        drag: () => {this.refresh()}
      });
    })
  },
  updated(){
    this.refresh()
  },
  methods: {
    initShadows(){
      this.Z = new Zed(this.$el);
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
      console.log(`clickCard ${x}`)
      if(x === 1){
        this.card1.z = this.card1.z + 2
      } else if (x === 2) {
        this.card2.z = this.card2.z + 2
      } else if(x === 3) {
        this.card3.z = this.card3.z + 2
      }
    }
  },
})