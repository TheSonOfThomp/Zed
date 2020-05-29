import { useState, useEffect } from "react"

const useElevation = (initial, ref,Z) => {
  const [z, setZ] = useState(initial)

  useEffect(() => {
    Z.updateTreeFrom()
  })
}