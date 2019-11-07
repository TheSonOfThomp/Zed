import React from 'react';
import './zedTest.scss';
import Zed from 'zed-shadow';

class ZedTest extends React.Component {

  constructor(){
    super();
    this.card1 = {z: 9}
    this.card2 = {z: 5}
    this.card3 = {z: 7}
  }

  componentDidMount(){
    this.Z = new Zed('#shadow-container')
  }
  
  render(){
    return (
      <div id="shadow-container">
        <div 
          zed={this.card1.z}
          id="card-1"
          className="card"
        >Card 1 (z={ this.card1.z })</div>
  
        <div 
          zed={this.card2.z}
          id="card-2"
          className="card" 
        > Card 2(z = { this.card2.z })</div>
  
        <div 
          zed={this.card3.z}
          id="card-3"
          className="card" 
        >Card 3(z = { this.card3.z })</div>
    </div>
    );
  }
}

export default ZedTest;
