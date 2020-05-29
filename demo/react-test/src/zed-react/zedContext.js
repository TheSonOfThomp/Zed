import React from 'react';
import { useZed } from "./use-zed"

export const ZedContext = React.createContext()

export const Zed = (props) => {

  const {ref, Z} = useZed()

  return (
    <ZedContext.Provider value={Z}>
      <div className="zed-context" ref={ref}>
        {props.children}
      </div>
    </ZedContext.Provider>
  )
}