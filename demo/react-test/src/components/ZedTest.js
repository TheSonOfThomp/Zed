import React, {useEffect, useState} from 'react';
import './zedTest.scss';
import Zed from 'zed-shadow';
import Card from './Card/Card';
// import Dropdown from './Dropdown/Dropdown';

const ZedTest = () => {
  const [z1, setZ1] = useState(3)
  const [z2, setZ2] = useState(2)
  const [z3, setZ3] = useState(4)
  
  useEffect(() => {
    // eslint-disable-next-line
    const Z = new Zed('#shadow-container');
  }, [])

  return (
    <div id="shadow-container">
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
