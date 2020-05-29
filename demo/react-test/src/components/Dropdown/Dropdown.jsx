import React, {useEffect, useRef, useState, forwardRef} from 'react';
import './Dropdown.scss'

const Dropdown = forwardRef((props, ref) => {
  const [menuStyle, setMenuStyle] = useState({})
  const buttonRef = useRef()
  
  useEffect(() => {
    setMenuStyle({
      width: `${buttonRef.current.offsetWidth}px`,
    })
  }, [buttonRef, props.isOpen])

  const handleClick = () => {
    props.toggle()
  }

  return (
    <div className="dropdown-wrapper">
      <span ref={buttonRef} onClick={() => handleClick()}>
        Open menu
      </span>
      { props.isOpen && (
        <ul 
          ref={ref}
          id="dropdown-menu" 
          zed={props.isOpen ? 3 : 0} 
          style={menuStyle}
        >
          {props.options.map(opt => {
            return (
              <li key={opt}>{opt}</li>
            )
          })}
        </ul>
      )}
    </div>
  )
});

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
