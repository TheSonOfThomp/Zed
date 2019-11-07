import React from 'react';
import './zedTest.scss';
import Zed from 'zed-shadow';

class ZedTest extends React.Component {

  constructor(){
    super();
    this.state = {
      cards: [
        { z: 9 },
        { z: 5 },
        { z: 7 }
      ]
    }

    this.incrementCard = this.incrementCard.bind(this)
  }

  componentDidMount(){
    this.Z = new Zed('#shadow-container')
  }

  incrementCard(i){
    const cards = this.state.cards
    cards.splice(i, 1, { z: cards[i].z + 1 })
    this.setState({
      cards: cards
    })
  }
  
  render(){
    return (
      <div id="shadow-container">

        <div 
          zed={this.state.cards[0].z}
          id="card-1"
          className="card"
          onClick={() => this.incrementCard(0)}
        >Card 1 (z={ this.state.cards[0].z })</div>
  
        <div 
          zed={this.state.cards[1].z}
          id="card-2"
          className="card" 
          onClick={() => this.incrementCard(1)}
        > Card 2(z = { this.state.cards[1].z })</div>
  
        <div 
          zed={this.state.cards[2].z}
          id="card-3"
          className="card" 
          onClick={() => this.incrementCard(2)}
        >Card 3(z = { this.state.cards[2].z })</div>
    </div>
    );
  }
}

export default ZedTest;
