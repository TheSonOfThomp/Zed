import { ElevatedElement } from "./ElevatedElement";
import { calcPath, cloneDOMRect, getSharedEdges, getCSSShadowValue } from "./geometry";
import { Intersection, IntersectionSet } from "./Intersection";

let ELEVATION_INCREMENT = 1

export function setElevationIncrement(increment: number) {
  ELEVATION_INCREMENT = increment
}

/* 
 * Returns the clip-path polygon on an element from the provided DOMRect
 */
export function getClipPath(ixn: DOMRect, baseElElem: ElevatedElement): string {
  const newIxnRect = getExpandedIntersectionRect(ixn, baseElElem);
  return `polygon(${calcPath(newIxnRect)})`;
}

/*
* Returns all the clip-path polygons on an element from the provided array of DOMRects
*/
export function getAllBaseClipPath(intersections: Array<DOMRect>, baseElElem: ElevatedElement): string {
  const newBase = getExpandedBaseRect(baseElElem, ELEVATION_INCREMENT);
  const basePath = calcPath(newBase, false);

  let ixPaths: string[] = []
  intersections.forEach(ixn => {
    if (!!ixn) {
      const newIxnRect = getExpandedIntersectionRect(ixn, baseElElem)
      ixPaths.push(calcPath(newIxnRect, true))
    }
  })

  if (ixPaths.length > 0) {
    const clipPath = `polygon(${basePath}, ${ixPaths.join(", ")})`;
    return (clipPath)
  } else {
    return `polygon(${basePath})`
  }
}

/*
 * Returns an expanded DOMRect intersection so the shadow doesn't clip
 */
export function getExpandedIntersectionRect(ixnRect: DOMRect, baseElElem: ElevatedElement): DOMRect {
  //console.trace('getExpandedIntersectionRect', baseElElem.element.id)
  const baseRect = cloneDOMRect(baseElElem.baseRect);
  const sharedEdges = getSharedEdges(ixnRect, baseRect);
  const expandedBaseRect = getExpandedBaseRect(baseElElem, ELEVATION_INCREMENT);

  // expand the intersection along the shared edges
  const iy = sharedEdges.includes('t') ? expandedBaseRect.y : ixnRect.y - baseRect.y
  const ir = sharedEdges.includes('r') ? expandedBaseRect.right : ixnRect.right - baseRect.x
  const ib = sharedEdges.includes('b') ? expandedBaseRect.bottom : ixnRect.bottom - baseRect.y
  const ix = sharedEdges.includes('l') ? expandedBaseRect.x : ixnRect.x - baseRect.x
  const iw = ir - ix;
  const ih = ib - iy;

  const expandedIxnRect = new DOMRect(ix, iy, iw, ih);
  return expandedIxnRect
}

/*
 * Returns an expanded base element so the shadow doesn't clip
 */
export function getExpandedBaseRect(elElem: ElevatedElement, increment: number): DOMRect {
  //console.trace('getExpandedBaseRect', elElem.element.id)
  const baseRect = cloneDOMRect(elElem.baseRect)
  const z = elElem.z
  const z_px = increment * z

  // expand the baseRect by 50% in all directions (to accommodate the big shadow)
  // Original x,y is 0, 0
  const bw = baseRect.width
  const bh = baseRect.height
  const newBaseRect = new DOMRect(-z_px, -z_px, bw + 4 * z_px, bh + 4 * z_px);
  return newBaseRect
}

/**
 * Returns a DOMRect (relative to the viewport) that is the intersection of the provided 2 HTML elements
 */
export function getIntersectionRectOf(elem1: ElevatedElement, elem2: ElevatedElement): DOMRect {
  const rect1 = elem1.baseRect
  const rect2 = elem2.baseRect

  // return an empty rect if there is no intersection
  if (rect1.left > rect2.right || rect2.left > rect1.right) {
    return new DOMRect();
  } else if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) {
    return new DOMRect();
  }

  const left = Math.max(rect1.left, rect2.left) // the right-most left edge
  const top = Math.max(rect1.top, rect2.top) // the bottom-most top edge
  const right = Math.min(rect1.right, rect2.right) // the left-most right edge
  const bottom = Math.min(rect1.bottom, rect2.bottom) // the top-most bottom edge
  const width = right - left
  const height = bottom - top
  return new DOMRect(left, top, width, height)
}

/**
 * 
 */
export function drawOverlappingShadowForIntersection(ixn: Intersection): void {
  if(!ixn.shadowElement) { return }

  if (ixn.zDiff > 0) {
    const shadowVal = getCSSShadowValue(ixn.zDiff, ELEVATION_INCREMENT)
    const clipPath = getClipPath(ixn.intersectionRect, ixn.primaryElement);
    ixn.shadowElement.style.setProperty('box-shadow', shadowVal)
    ixn.shadowElement.style.setProperty('clip-path', clipPath)
  }  
}

/**
 * 
 */
export function updateIntersectionClipPathsForElement(elElem: ElevatedElement, intersections: IntersectionSet) {
  // Clip out the overlapping parts from the base element
  const relevantIxns = elElem.intersections.map(id => intersections[id].intersectionRect)
  const clipPath = getAllBaseClipPath(relevantIxns, elElem)
  elElem.baseShadowElement.style.setProperty('clip-path', clipPath)
}

/**
 * 
 */
export function drawOverlappingShadowsForElement(elElem: ElevatedElement, intersections: IntersectionSet) {
  // Loop all valid for this element
  for (let id of elElem.intersections) {
    drawOverlappingShadowForIntersection(intersections[id])
  }
}

/**
 * 
 */
export function createOverlappingShadowElement(elElem: ElevatedElement, id: string): HTMLElement {
  
  const ovShadowElem = document.createElement('div')
  ovShadowElem.classList.add('zed-shadow', 'overlapping-shadow')
  ovShadowElem.id = `ol-${id}`
  elElem.element.insertBefore(ovShadowElem, elElem.element.firstChild)
  elElem.overlappingShadows.push(ovShadowElem)
  return ovShadowElem
}

/**
 * 
 */
export function removeOverlappingShadowsForElement(elElem: ElevatedElement): void {
  for (let domNode of elElem.overlappingShadows) {
    domNode.remove()
  }
}

/**
 * 
 */
export function drawBaseElementShadow(elElem: ElevatedElement) {
  elElem.baseShadowElement.style.setProperty('box-shadow', getCSSShadowValue(elElem.z, ELEVATION_INCREMENT))
}
