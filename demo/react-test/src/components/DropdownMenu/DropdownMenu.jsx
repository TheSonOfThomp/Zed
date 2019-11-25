import React from 'react';
import PropTypes from 'prop-types';
import './DropdownMenu.scss';

const DropdownMenu = (props) => {
  
  return (
    <ul id="dropdown-menu" zed={3} style={{...props.style }}>
      {props.options.map(opt => {
        return (
          <li key={opt}>{opt}</li>
        )
      })}
    </ul>
  )
};

DropdownMenu.propTypes = {
  // bla: PropTypes.string,
};

DropdownMenu.defaultProps = {
  // bla: 'test',
};

export default DropdownMenu;
