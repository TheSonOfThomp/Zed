export function cloneDOMRect (rect: DOMRect): DOMRect {
  return new DOMRect(
    Math.round(rect.x),
    Math.round(rect.y),
    Math.round(rect.width),
    Math.round(rect.height)
  )
}

/*
 * Returns a clip-path polygon from the provided DOMRect
 */
export function calcPath(rect: DOMRect, clockwise: boolean = true): string {
  const tl = `${Math.round(rect.x)}px ${Math.round(rect.y)}px`;
  const tr = `${Math.round(rect.right)}px ${Math.round(rect.y)}px`
  const br = `${Math.round(rect.right)}px ${Math.round(rect.bottom)}px`
  const bl = `${Math.round(rect.x)}px ${Math.round(rect.bottom)}px`

  if (clockwise) {
    return `${tl}, ${tr}, ${br}, ${bl}, ${tl}`
  }
  else {
    return `${tl}, ${bl}, ${br}, ${tr}, ${tl}`
  }
}  

/*
 * Returns the edges shared between the intersection rectangle and the related element
 */
export function getSharedEdges(ixnRect: DOMRect, baseRect: DOMRect): string[] {
  let sharedEdges: string[] = []
  if (Math.round(ixnRect.top) === Math.round(baseRect.top)) { sharedEdges.push('t') }
  if (Math.round(ixnRect.right) === Math.round(baseRect.right)) { sharedEdges.push('r') }
  if (Math.round(ixnRect.bottom) === Math.round(baseRect.bottom)) { sharedEdges.push('b') }
  if (Math.round(ixnRect.left) === Math.round(baseRect.left)) { sharedEdges.push('l') }

  return sharedEdges
}

/*
  * Returns the CSS shadow rule given a z-position
  */
export function getCSSShadowValue(z: number, increment: number): string {
  if (z === 0) return ''
  let elevation = Math.round(increment * z);
  let blur = Math.round(1.2 * elevation);
  let spread = Math.round(-0.5 * elevation);
  return `rgba(0, 0, 0, 0.18) 0px ${elevation}px ${blur}px ${spread}px`
}