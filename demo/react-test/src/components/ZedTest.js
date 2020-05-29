import React, { useEffect } from 'react';
import './zedTest.scss';
import Card from './Card/Card';
import { useZed } from '../zed-react/use-zed';
import { Zed } from '../zed-react/zedContext';
// import Dropdown from './Dropdown/Dropdown';

const ZedTest = () => {

  // const {ref, Z} = useZed()

  // useEffect(() => {
  //   console.log(Z.current)
  // }, [Z])

  return (
    <Zed>
      <div id="demo-container">
      <Card 
        id="card-1" 
        elevation={24}
      />
      <Card 
        id="card-2" 
        elevation={12}
      />
      <Card 
        id="card-3" 
        elevation={16}
      />
      </div>
    </Zed>
  );
}

export default ZedTest;
