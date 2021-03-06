import { Intersection, updateZDiff } from "./Intersection";

export type ElevatedElement = {
  element: HTMLElement;
  baseRect: DOMRect;
  intersections: Array<Intersection>
  baseShadowElement: HTMLElement;
  overlappingShadows: Array<HTMLElement>;
  z: number;
}

export function setElementZ(elElem: ElevatedElement, newZ: number): ElevatedElement {
  elElem.z = newZ
  for (let ixn of elElem.intersections) {
    ixn = updateZDiff(ixn)
  }
  return elElem
}

// export class ElevatedElement {
//   element: HTMLElement;
//   baseRect: DOMRect;
//   intersections: Array<Intersection>
//   baseShadowElement: HTMLElement;
//   overlappingShadows: Array<HTMLElement>;
//   private _z: number;
  
//   get z(): number {
//     return this._z
//   }
//   set z(newZ: number) {
//     // Update this z
//     this._z = newZ
//     // Update zDiffs for all intersections
//     this.updateIntersections()
//   }

//   public updateIntersections() {
//     for(let ixn of this.intersections){
//       ixn = updateZDiff(ixn)
//     }
//   }
  
//   constructor({ element, baseRect, z, intersections, baseShadowElement, overlappingShadows}){
//     this.element = element;
//     this.baseRect = baseRect;
//     this.intersections = intersections;
//     this.baseShadowElement = baseShadowElement;
//     this.overlappingShadows = overlappingShadows;
//     this._z = z;
//   }
// }

// function eeFactory() {
//   return ElevatedElement
// }

// declare var define: any;
// (
//   function (global, factory) {
//     typeof exports === 'object' && typeof module !== 'undefined'
//       ? module.exports = factory()
//       : typeof define === 'function' && define.amd
//         ? define(factory)
//         : global.moment = factory()
//   }(this, eeFactory)
// );