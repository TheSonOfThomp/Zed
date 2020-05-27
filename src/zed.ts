import {ElevatedElement, ElementTree} from "./ElevatedElement";
import {Intersection} from "./Intersection";
import { hash, getElementArray } from "./utils";

const attributes = [
  'zed',
]

// Known issues
// - Does not deal well with more than 2 layers of overlap
// -- Need to clip all but the highest clip path
//
// - Odd behaviour when the distance between cards is less than the shadow spread (too much/too little shadow)

export default class Zed {
  private rootElement: HTMLElement;
  private elementTree: ElementTree;

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT: number = 1;
  
  constructor(rootElement: HTMLElement | string){

    // some change
    debugger
    // default to the document element if none is provided
    if (typeof rootElement === 'string') {
      this.rootElement = (document.querySelector(rootElement) as HTMLElement)
    } else {
      this.rootElement = rootElement || document.documentElement
    }
    // this.elevatedElementsList = []
    this.elementTree = this.getElementTree(this.rootElement)
    // this.init()
    this.initTree(this.elementTree)
    console.log(this.elementTree)
  }

  public setElevationIncrement(newIncrement: number) {
    this.ELEVATION_INCREMENT = newIncrement;
    this.update()
  }

  public update() {
    // this.init(this.elevatedElementsList)
    this.elementTree = this.getElementTree(this.rootElement)
    this.initTree(this.elementTree)
  }

  private get elevatedElementsList(): Array<ElevatedElement> {
    const elelems: Array<ElevatedElement> = []
    const flattenElements = (node: ElevatedElement) => {
      elelems.push(node)
      node.children.forEach(child => flattenElements(child))
    }
    this.elementTree.children.forEach(child => flattenElements(child))
    return elelems
  }

  // protected init(elevatedElements?: Array<ElevatedElement>) {
  //   // Iterate over all the elevated elements
  //   this.elevatedElementsList.forEach((elElem) => {
  //     elElem.element.classList.add('zed-element')
  //     this.drawShadows(elElem, true)
  //     this.addMutationObserver(elElem) // watch for changes in [zed]
  //   })
  // }

  protected initTree(treeRoot: ElementTree) {
    treeRoot = treeRoot || this.getElementTree(this.rootElement)
    treeRoot.element.classList.add('zed-element')

    const initTreeNodes = (elElem: ElevatedElement) => {
      this.drawShadows(elElem, true)
      this.addMutationObserver(elElem)
      for (let node of elElem.children) {
        initTreeNodes(node)
      }
    }

    for (let node of treeRoot.children) {
      initTreeNodes(node)
    }
  }

  protected getElementTree(rootNode: HTMLElement): ElementTree {
    const root: ElementTree = {
      element: rootNode,
      children: []
    }

    const recurseDOMTree = (currentNode: HTMLElement, prevElement?: ElevatedElement) => {
      const children = currentNode.childNodes
      if (children.length) {
        for (let child of getElementArray(children)) {
          if (child.getAttributeNames && child.getAttributeNames().includes('zed')) {
            const newNode = this.createElevatedElementFrom(child, prevElement)
            if(!!prevElement) {
              prevElement?.children.push(newNode)
            } else {
              root.children.push(newNode)
            }
            recurseDOMTree(child, newNode)
          } else {
            recurseDOMTree(child, prevElement)
          }
        }
      }
      return prevElement
    }
    recurseDOMTree(rootNode)
    return root
  }

  // protected setZedFromRelative(elem: HTMLElement):void {
  //   const parentZ = this.getParentZed(elem)
  //   const absZ = parentZ + parseInt(elem.getAttribute('zed-rel') || '0')
  //   elem.setAttribute('zed', absZ.toString())
  // }

  protected updateZed(elElem: ElevatedElement, shouldUpdateIntersections: boolean = false) {
    console.log(`Updating ${elElem.element.id}`)
    elElem.z = this.getZed(elElem)
    // Update shadows
    // TODO update the intersecting component as well when updating Intersections
    this.drawShadows(elElem, shouldUpdateIntersections)

    for (let ixn of elElem.intersections) {
      if (ixn.zDiff > 0 ){
        // this.setZedFromRelative(ixn.intersectingElement.element)
        this.updateZed(ixn.intersectingElement, shouldUpdateIntersections)
      }
    }
  }

  /*
   * Returns the [zed] attribute of the provided HTML element
   */
  protected getZedAttr(elem: HTMLElement):number {
    const _zed = elem.getAttribute('zed')
    if (!!_zed){
      return parseFloat(_zed)
    } else {
      return 0
    }
  }

  /**
   * Returns the absolute elevation of an elevated element
   */
  protected getZed(elElem: ElevatedElement): number {
    if (elElem.parent) {
      return this.getZed(elElem.parent) + elElem.z
    } else {
      return elElem.z
    }
  }

  /**
   * returns the absolute elevation of an HTML element
   */
  protected getZedForElement(elem: HTMLElement, parent?: ElevatedElement): number {
    if (parent) {
      return this.getZed(parent) + this.getZedAttr(elem)
    } else {
      return this.getZedAttr(elem)
    }
  }

  protected getElevatedElements(): Array<ElevatedElement> {
    const elements = this.rootElement.querySelectorAll('[zed]')
    return getElementArray(elements).map(e => {
      return this.createElevatedElementFrom(e)
    });
  }

  createElevatedElementFrom(el: HTMLElement, parent?: ElevatedElement): ElevatedElement {
    return {
      id: hash(el.innerHTML),
      children: [],
      parent: parent || null,
      element: el,
      baseRect: this.cloneDOMRect(el.getBoundingClientRect()),
      baseShadowElement: this.createBaseShadowElement(el),
      intersections: [],
      overlappingShadows: [],
      z: this.getZedForElement(el, parent),
      zRel: this.getZedAttr(el)
    }
  }

  protected drawShadows(elElem: ElevatedElement, shouldRecalculateIntersections: boolean = false) {
    // set the actual z-index css
    this.replaceStyle(elElem.element, 'z-index', elElem.z.toString());

    // Get all the intersections with other elevated elements
    let elementsIntersections: Array<Intersection> = shouldRecalculateIntersections 
      ? this.getIntersectionsForElement(elElem) 
      : elElem.intersections

    this.setBaseShadowStyle(elElem)

    // Start adding the intersection shadows
    if (elementsIntersections.length > 0) {
      this.updateIntersectionClipPathsForElement(elElem)
      this.drawOverlappingShadowsForElement(elElem)
    }
  }

  protected getIntersectionsForElement(elElem:ElevatedElement) {
    const elem = elElem.element

    this.elevatedElementsList.forEach((otherElElem:ElevatedElement, j) => {
      const otherElem = otherElElem.element
      if (otherElem !== elem) {
        const otherZ = this.getZedAttr(otherElem) //otherElem.getAttribute('z-index')
        const ixnRect_ij = this.getIntersectionRectOf(elElem, otherElElem);
        const zDiff = this.getZedAttr(elem) - otherZ;
        if (ixnRect_ij.height > 0 && ixnRect_ij.width > 0) {
          const ixnObject: Intersection = {
            id: hash(elElem.element.id + otherElElem.id),
            primaryElement: elElem,
            intersectingElement: otherElElem,
            intersectionRect: ixnRect_ij,
            zDiff: zDiff,
            shadowElement: zDiff > 0 ? this.createOverlappingShadowElement(elElem) : null,
          }
          elElem.intersections.push(ixnObject)
        }
      }
    })
    return elElem.intersections
  }

  // protected getElementIndex(elem: HTMLElement): number {
  //   const index = this.elevatedElementsList.findIndex(ee => ee.element === elem)
  //   return index
  // }

  protected createBaseShadowElement(elem: HTMLElement): HTMLElement {
    const baseShadowElem = document.createElement('div')
    baseShadowElem.classList.add('zed-shadow', 'base-shadow')
    elem.insertBefore(baseShadowElem, elem.firstChild)
    return baseShadowElem
  }

  protected setBaseShadowStyle(elElem: ElevatedElement) {
    // Find or create main shadow element
    const baseShadowElem: HTMLElement = elElem.baseShadowElement;
    // this.replaceStyle(baseShadowElem, 'z-index', elElem.z.toString());
    this.replaceStyle(baseShadowElem, 'box-shadow', this.getCSSShadowValue(elElem.z))
  }

  protected createOverlappingShadowElement(elElem: ElevatedElement): HTMLElement {
    const ovShadowElem = document.createElement('div')
    ovShadowElem.classList.add('zed-shadow', 'overlapping-shadow')
    elElem.element.insertBefore(ovShadowElem, elElem.element.firstChild)
    elElem.overlappingShadows.push(ovShadowElem)
    return ovShadowElem
  }

  protected drawOverlappingShadowsForElement(elElem: ElevatedElement) {
    // Loop all valid for this element
    elElem.intersections.forEach((ixn) => {
      this.drawOverlappingShadowForIntersection(ixn)
    })
  }

  protected updateIntersectionClipPathsForElement(elElem: ElevatedElement) {
    // Clip out the overlapping parts from the base element
    this.replaceStyle(
      elElem.baseShadowElement,
      'clip-path',
      `${this.getAllBaseClipPath(elElem.intersections.map(ixn => ixn.intersectionRect), elElem)}`
    )
  }

  protected drawOverlappingShadowForIntersection(ixn: Intersection):void {
    if (!ixn.shadowElement) { return } // short circuit

    const zDiff = ixn.zDiff;
    const thisIxnShadowElement = ixn.shadowElement;
    const elElemRef = ixn.primaryElement

    const ixnZ = Math.abs(ixn.zDiff);
    if (zDiff >= 0) {
      const shadowVal = this.getCSSShadowValue(ixnZ)
      const clipPath = this.getClipPath(ixn.intersectionRect, elElemRef);
      
      this.setStyle(thisIxnShadowElement, `
        box-shadow: ${shadowVal};
        clip-path: ${clipPath}
      `)
    }  
  }

  /*
   * Sets the [style] attribute of the provided HTML element
   */
  protected setStyle(elem: HTMLElement, style:string){
    style = style
      .replace(/\n/, '')
      .split(';')
      .filter(s => s.length > 1)
      .join(';')
      .trim();
    elem.setAttribute('style', style)
  }

  /*
   * Appends to the [style] attribute of the provided HTML element
   */
  protected appendStyle(elem: HTMLElement, style: string) {
    const currentStyle = elem.getAttribute('style');
    let newStyle: string;
    if (currentStyle) {
      newStyle = [currentStyle, style].join(';')
    } else {
      newStyle = style
    }
    elem.setAttribute('style', newStyle);
  }

  /*
   * Replaces a rule in the [style] attribute of the provided HTML element
   */
  protected replaceStyle(elem: HTMLElement, attribute: string, value:string){
    const currentStyle = elem.getAttribute('style')

    if (currentStyle && currentStyle.includes(attribute)) {
      const toReplace = `${attribute}:.*?(?=[;]).`
      const toReplaceRegex = new RegExp(toReplace, 'g');
      const newStyle = currentStyle.replace(toReplaceRegex, `${attribute}: ${value};`)
      this.setStyle(elem, newStyle)
    } else {
      this.appendStyle(elem, `${attribute}: ${value}`);
    }
  }

  /*
   * Returns a DOMRect (relative to the viewport) that is the intersection of the provided 2 HTML elements
   */
  protected getIntersectionRectOf(elem1: ElevatedElement, elem2: ElevatedElement):DOMRect {
    const rect1 = elem1.baseRect
    const rect2 = elem2.baseRect
    
    // return an empty rect if there is no intersection
    if (rect1.left > rect2.right || rect2.left > rect1.right) {
      return new DOMRect();
    } else if (rect1.bottom < rect2.top || rect2.bottom < rect1.top){
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

  /*
   * Returns the CSS shadow rule given a z-position
   */
  protected getCSSShadowValue(z:number):string {
    if (z === 0) return ''
    let elevation = Math.round(this.ELEVATION_INCREMENT * z);
    let blur = Math.round(1.2 * elevation);
    let spread = Math.round(-0.5 * elevation);
    return `rgba(0, 0, 0, 0.18) 0px ${elevation}px ${blur}px ${spread}px`
  }

  /*
   * Returns the edges shared between the intersection rectangle and the related element
   */
  protected getSharedEdges(ixnRect:DOMRect, baseRect:DOMRect):string[] {
    let sharedEdges:string[] = []
    if (Math.round(ixnRect.top) === Math.round(baseRect.top)){sharedEdges.push('t')}
    if (Math.round(ixnRect.right) === Math.round(baseRect.right)){sharedEdges.push('r')}
    if (Math.round(ixnRect.bottom) === Math.round(baseRect.bottom)){sharedEdges.push('b')}
    if (Math.round(ixnRect.left) === Math.round(baseRect.left)){sharedEdges.push('l')}

    return sharedEdges
  }

  /*
   * Returns an expanded base element so the shadow doesn't clip
   */
  protected getExpandedBaseRect(elElem: ElevatedElement):DOMRect {
    //console.trace('getExpandedBaseRect', elElem.element.id)
    const baseRect = this.cloneDOMRect(elElem.baseRect)
    const z = elElem.z
    const z_px = this.ELEVATION_INCREMENT * z

    // expand the baseRect by 50% in all directions (to accommodate the big shadow)
    // Original x,y is 0, 0
    const bw = baseRect.width
    const bh = baseRect.height
    const newBaseRect = new DOMRect(-z_px, -z_px, bw + 4 * z_px, bh + 4 * z_px);
    return newBaseRect
  }

  /*
   * Returns an expanded DOMRect intersection so the shadow doesn't clip
   */
  protected getExpandedIntersectionRect(ixnRect:DOMRect, baseElElem:ElevatedElement):DOMRect {
    //console.trace('getExpandedIntersectionRect', baseElElem.element.id)
    const baseRect = this.cloneDOMRect(baseElElem.baseRect);
    const sharedEdges = this.getSharedEdges(ixnRect, baseRect);
    const expandedBaseRect = this.getExpandedBaseRect(baseElElem);
    
    // expand the intersection along the shared edges
    const iy = sharedEdges.includes('t') ? expandedBaseRect.y : ixnRect.y - baseRect.y
    const ir = sharedEdges.includes('r') ? expandedBaseRect.right : ixnRect.right - baseRect.x
    const ib = sharedEdges.includes('b') ? expandedBaseRect.bottom : ixnRect.bottom - baseRect.y
    const ix = sharedEdges.includes('l') ? expandedBaseRect.x : ixnRect.x - baseRect.x
    const iw = ir - ix;
    const ih = ib - iy;
    
    const expandedIxnRect =  new DOMRect(ix, iy, iw, ih);
    return expandedIxnRect
  }
  
  /*
   * Returns the clip-path polygon on an element from the provided DOMRect
   */
  protected getClipPath(ixn:DOMRect, baseElElem: ElevatedElement):string {
    const newIxnRect = this.getExpandedIntersectionRect(ixn, baseElElem);
    return `polygon(${this.calcPath(newIxnRect)})`;
  }

  /*
   * Returns all the clip-path polygons on an element from the provided array of DOMRects
   */
  protected getAllBaseClipPath(intersections:DOMRect[], baseElElem: ElevatedElement):string {
    const newBase = this.getExpandedBaseRect(baseElElem);
    const basePath = this.calcPath(newBase, false);

    let ixPaths:string[] = []
    intersections.forEach(ixn => {
      if(!!ixn) {
        const newIxnRect = this.getExpandedIntersectionRect(ixn, baseElElem)
        ixPaths.push(this.calcPath(newIxnRect, true)) 
      }
    })

    if(ixPaths.length > 0){
      const clipPath = `polygon(${basePath}, ${ixPaths.join(", ")})`;
      return(clipPath)
    } else {
      return `polygon(${basePath})`
    } 
  }

  /*
   * Returns a clip-path polygon from the provided DOMRect
   */
  protected calcPath(rect: DOMRect, clockwise:boolean = true): string {
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

  protected cloneDOMRect(rect:DOMRect): DOMRect {
    return new DOMRect(
      Math.round(rect.x), 
      Math.round(rect.y), 
      Math.round(rect.width),
      Math.round(rect.height)
    )
  }

  protected addMutationObserver(elevatedElem: ElevatedElement): void {
    const ZedObserver = new MutationObserver((mutations: Array<any>, obs) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'zed' || mutation.attributeName === 'zed-rel') {
          this.updateZed(elevatedElem, false)
        }
      });
    })
    ZedObserver.observe(elevatedElem.element, { attributes: true, childList: false, subtree: false })
  }
}
