import {Intersection} from "./Intersection";

export class ElevatedElement {
  element: Element;
  baseRect: DOMRect;
  z: number;
  intersections: Array<Intersection>
  baseShadowElement: Element;
  overlappingShadows: Array<Element>;
  
  constructor({ element, baseRect, z, intersections, baseShadowElement, overlappingShadows}){
    this.element = element;
    this.baseRect = baseRect;
    this.z = z;
    this.intersections = intersections;
    this.baseShadowElement = baseShadowElement;
    this.overlappingShadows = overlappingShadows;
  }
}

function eeFactory() {
  return ElevatedElement
}

declare var define: any;
(
  function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
      ? module.exports = factory()
      : typeof define === 'function' && define.amd
        ? define(factory)
        : global.moment = factory()
  }(this, eeFactory)
);