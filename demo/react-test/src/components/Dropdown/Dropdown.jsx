import React, {useEffect, useRef, useState} from 'react';
import './Dropdown.scss'
import DropdownMenu from '../DropdownMenu/DropdownMenu';

const Dropdown = (props) => {
  const [isMenuVisible, setIsMenuVisible] = useState(true)
  const [menuStyle, setMenuStyle] = useState({})
  const buttonRef = useRef()
  
  useEffect(() => {
    setMenuStyle({
      display: isMenuVisible ? 'block' : 'none',
      width: `${buttonRef.current.offsetWidth}px`,
    })
  }, [buttonRef, isMenuVisible])

  const handleClick = () => {
    setIsMenuVisible(!isMenuVisible)
  }

  return (
    <div className="dropdown-wrapper">
      <span ref={buttonRef} onClick={() => handleClick()}>
        Click me
      </span>
      <DropdownMenu 
        zed={isMenuVisible ? 3 : 0}
        options={props.options} 
        style={menuStyle}
      />
    </div>
  )
};

Dropdown.propTypes = {
  // bla: PropTypes.string,
};

Dropdown.defaultProps = {
  options: [
    'Apple',
    'Banana',
    'Carrot',
    'Dragon',
    'Eggplant',
    'Fig',
  ]
};

export default Dropdown;
