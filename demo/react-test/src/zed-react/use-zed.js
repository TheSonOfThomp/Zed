import {useRef, useEffect, useState} from 'react'
import Zed from 'zed-shadow';

export const useZed = () => {
  const ref = useRef()
  // const Z = useRef()
  const [Z, setZ] = useState()

  useEffect(() => {
    setZ(new Zed(ref.current))
  }, [])

  useEffect(() => {
    if(Z) Z.update()
  }, [ref])

  console.log('useZed', Z)
  return { ref, Z }
}