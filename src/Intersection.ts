import {ElevatedElement} from "./ElevatedElement";

export type Intersection = {
  id: string,
  primaryElement: ElevatedElement;
  intersectingElement: ElevatedElement;
  intersectionRect: DOMRect;
  shadowElement: HTMLElement | null;
  zDiff: number; // +ve zDiff means element1 is higher
}

export function updateZDiff(ixn: Intersection):Intersection {
  ixn.zDiff = ixn.primaryElement.z - ixn.intersectingElement.z
  return ixn
}
