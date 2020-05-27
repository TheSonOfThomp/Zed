import { Intersection, updateZDiff } from "./Intersection";

export type ElementTree = {
  element: HTMLElement,
  children: Array<ElevatedElement>
}

export type ElevatedElement = {
  id: string,
  children: Array<ElevatedElement>,
  parent: ElevatedElement | null, 
  element: HTMLElement;
  baseRect: DOMRect;
  intersections: Array<Intersection>
  baseShadowElement: HTMLElement;
  overlappingShadows: Array<HTMLElement>;
  z: number;
  zRel: number;
}

export function setElementZ(elElem: ElevatedElement, newZ: number): ElevatedElement {
  elElem.z = newZ
  for (let ixn of elElem.intersections) {
    ixn = updateZDiff(ixn)
  }
  return elElem
}
