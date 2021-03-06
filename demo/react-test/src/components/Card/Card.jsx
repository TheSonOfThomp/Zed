import React from 'react';
import './Card.scss';
import Dropdown from '../Dropdown/Dropdown';

const Card = (props) => (
  <div
    id={props.id}
    className="card"
    zed={props.zed}
    onMouseDown={() => props.setZ(props.zed + 3)}
    onMouseUp={() => props.setZ(props.zed - 3)}
  >
    Z =  {props.zed}
    <Dropdown />
  </div>
);

export default Card;
