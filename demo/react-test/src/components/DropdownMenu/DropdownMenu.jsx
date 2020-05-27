import React from 'react';
import PropTypes from 'prop-types';
import './DropdownMenu.scss';

const DropdownMenu = (props) => {
  
  return (
    <ul id="dropdown-menu" zed={props.zed} style={{...props.style }}>
      {props.options.map(opt => {
        return (
          <li key={opt}>{opt}</li>
        )
      })}
    </ul>
  )
};

DropdownMenu.propTypes = {
  zed: PropTypes.number,
};

export default DropdownMenu;
