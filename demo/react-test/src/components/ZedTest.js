import React, {useState} from 'react';
import './zedTest.scss';
import Card from './Card/Card';
import {useZed} from '../hooks/useZed'
// import Dropdown from './Dropdown/Dropdown';

const ZedTest = () => {
  const [z1, setZ1] = useState(24)
  const [z2, setZ2] = useState(6)
  const [z3, setZ3] = useState(16)
  
  const {ref} = useZed()

  return (
    <div id="shadow-container" ref={ref}>
      <Card 
        id="card-1" 
        zed={z1} 
        setZ={setZ1}
      />
      <Card 
        id="card-2" 
        zed={z2} 
        setZ={setZ2}
      />
      <Card 
        id="card-3" 
        zed={z3} 
        setZ={setZ3}
      />
  </div>
  );
}

export default ZedTest;
