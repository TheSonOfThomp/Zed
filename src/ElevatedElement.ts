import md5 from 'js-md5'
import { Intersection, updateZDiff, IntersectionSet } from "./Intersection";
import { getZedAttr, getElementArray } from "./utils";
import { cloneDOMRect } from "./geometry";

// export type ElementTree = {
//   element: HTMLElement,
//   children: Array<ElevatedElement>
// }

export class ElevatedElement {
  id: string;
  children: Array<ElevatedElement>;
  parent: ElevatedElement | null;
  element: HTMLElement;
  baseRect: DOMRect;
  intersections: Array<string>;
  baseShadowElement: HTMLElement;
  overlappingShadows: Array<HTMLElement>;
  private _z: number = 0;

  constructor(element: HTMLElement, parent?: ElevatedElement) {
    const oldShadows = element.querySelectorAll('.overlapping-shadow')
    if (oldShadows.length) {
      for (let oldShadow of getElementArray(oldShadows)) {
        oldShadow.remove()
      }
    }
    this.id = md5(element.tagName + element.id + element.outerHTML);
    this.children = [];
    this.parent = parent || null;
    this.element = element;
    this.baseRect = cloneDOMRect(element.getBoundingClientRect());
    this.baseShadowElement = element.querySelector(`.base-shadow`) || this.createBaseShadowElement(element, this.id);
    this.intersections = [];
    this.overlappingShadows = [];
    this.z = this.getZedForElement(element, parent);
  }

  get z():number {
    return this._z
  }
  set z(newZ:number) {
    this._z = newZ
    this.element.style.setProperty('z-index', this.z.toString())
  }

  get zRel():number {
    return getZedAttr(this.element)
  }

  /**
   * Returns the absolute elevation of an elevated element
   */
  public getZed(elElem: ElevatedElement = this): number {
    if (elElem.parent) {
      return elElem.parent.z + getZedAttr(this.element)
    } else {
      return getZedAttr(this.element)
    }
  }
  /**
   * returns the absolute elevation of an HTML element
   */
  public getZedForElement(elem: HTMLElement, parent?: ElevatedElement): number {
    if (parent) {
      return parent.z + getZedAttr(elem)
    } else {
      return getZedAttr(elem)
    }
  }

  public updateZed() {
    this.z = this.getZed()
  }

  /**
   * Creates a DOM element
   */
  private createBaseShadowElement(elem: HTMLElement, id: string): HTMLElement {
    const baseShadowElem = document.createElement('div')
    baseShadowElem.classList.add('zed-shadow', 'base-shadow')
    baseShadowElem.id = `base-${id}`
    elem.insertBefore(baseShadowElem, elem.firstChild)
    return baseShadowElem
  }
  
}