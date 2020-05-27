import { useRef, useEffect } from "react"
import Zed from 'zed-shadow';


export const useZed = () => {

  const ref = useRef()
  const Z = useRef()

  useEffect(() => {
    Z.current = new Zed(ref.current);
  }, [ref])

  return {ref, Z}
}