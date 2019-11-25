import ElevatedElement from "./ElevatedElement";

export default class Intersection {
  primaryElementRef: ElevatedElement;
  primaryElement: Element;
  intersectingElement: Element;
  intersectingElementRef: ElevatedElement;
  intersectionRect: DOMRect;
  shadowElement: Element | null;
  zDiff: number; // +ve zDiff means element1 is higher

  constructor({ primaryElementRef, primaryElement, intersectingElement, intersectingElementRef, intersectionRect, shadowElement, zDiff}){
    this.primaryElementRef = primaryElementRef;
    this.primaryElement = primaryElement;
    this.intersectingElement = intersectingElement;
    this.intersectingElementRef = intersectingElementRef;
    this.intersectionRect  = intersectionRect;
    this.shadowElement = shadowElement;
    this.zDiff = zDiff;
  }

  updateZDiff(){
    this.zDiff = this.primaryElementRef.z - this.intersectingElementRef.z
  }
}

function ixFactory() {
  return Intersection
}

declare var define: any;
(
  function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
      ? module.exports = factory()
      : typeof define === 'function' && define.amd
        ? define(factory)
        : global.moment = factory()
  }(this, ixFactory)
);