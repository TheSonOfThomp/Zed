import React, { useState, useLayoutEffect, useRef, useContext, useEffect, useCallback } from 'react';
import './Card.scss';
import Dropdown from '../Dropdown/Dropdown';
import { ZedContext } from '../../zed-react/zedContext';

const Card = (props) => {
  const [isOpen, setIsOpen] = useState(false)

  const elem = useRef()

  const [zed, setZed] = useState(props.elevation)
  const Zed = useContext(ZedContext)
  const prevNode = useRef()

  const ddCallback = useCallback(node => {
    if (Zed && node && !prevNode.current) {
      Zed.updateFromElement(elem.current, true)
    }
    prevNode.current = node
  })

  useEffect(() => {
    if (Zed) {
      Zed.updateFromElement(elem.current, false)
    }
  }, [zed])

  return (
    <div
      ref={elem}
      id={props.id}
      className="card"
      zed={zed}
      onMouseDown={() => setZed(zed * 2)}
      onMouseUp={() => setZed(zed / 2)}
    >
      <Dropdown 
        ref={ddCallback}
        isOpen={isOpen}
        toggle={() => setIsOpen(!isOpen)}
      />
    </div>
  )
}

export default Card;
