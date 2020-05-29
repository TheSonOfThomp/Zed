import React, { useState, useLayoutEffect, useRef, useContext, useEffect, useCallback } from 'react';
import './Card.scss';
import Dropdown from '../Dropdown/Dropdown';
import { ZedContext } from '../../zed-react/zedContext';

const Card = (props) => {
  const [isOpen, setIsOpen] = useState(true)

  const elem = useRef()
  // const ddMenu = useRef()
  const [zed, setZed] = useState(props.elevation)
  const Zed = useContext(ZedContext)

  // useLayoutEffect(() => {
  //   if (Zed && ddMenu.current) {
  //     console.log('Going to updateZed')
  //     Zed.updateFromElement(elem.current, true)
  //     /**
  //      * TODO - new intersections get calculated before the DOM actually updates
  //      * This is likely a view-layer fix (i.e. in React etc.) and not in Zed itself
  //      */
  //   }
  // })

  const prevNode = useRef()

  const ddCallback = useCallback(node => {
    if (Zed && node && !prevNode.current) {
      console.log('Hard updating', node)
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
      <div>Z = {zed}</div>
      <Dropdown 
        ref={ddCallback}
        isOpen={isOpen}
        toggle={() => setIsOpen(!isOpen)}
      />
    </div>
  )
}

export default Card;
