import {ElevatedElement} from "./ElevatedElement";

export type Intersection = {
  primaryElementRef: ElevatedElement;
  primaryElement: HTMLElement;
  intersectingElement: HTMLElement;
  intersectingElementRef: ElevatedElement;
  intersectionRect: DOMRect;
  shadowElement: HTMLElement | null;
  zDiff: number; // +ve zDiff means element1 is higher
}

export function updateZDiff(ixn: Intersection):Intersection {
  ixn.zDiff = ixn.primaryElementRef.z - ixn.intersectingElementRef.z
  return ixn
}

// export class Intersection {
//   primaryElementRef: ElevatedElement;
//   primaryElement: HTMLElement;
//   intersectingElement: HTMLElement;
//   intersectingElementRef: ElevatedElement;
//   intersectionRect: DOMRect;
//   shadowElement: HTMLElement | null;
//   zDiff: number; // +ve zDiff means element1 is higher

//   constructor({ primaryElementRef, primaryElement, intersectingElement, intersectingElementRef, intersectionRect, shadowElement, zDiff}){
//     this.primaryElementRef = primaryElementRef;
//     this.primaryElement = primaryElement;
//     this.intersectingElement = intersectingElement;
//     this.intersectingElementRef = intersectingElementRef;
//     this.intersectionRect  = intersectionRect;
//     this.shadowElement = shadowElement;
//     this.zDiff = zDiff;
//   }

//   updateZDiff(){
//     this.zDiff = this.primaryElementRef.z - this.intersectingElementRef.z
//   }
// }

// function ixFactory() {
//   return Intersection
// }

// declare var define: any;
// (
//   function (global, factory) {
//     typeof exports === 'object' && typeof module !== 'undefined'
//       ? module.exports = factory()
//       : typeof define === 'function' && define.amd
//         ? define(factory)
//         : global.moment = factory()
//   }(this, ixFactory)
// );