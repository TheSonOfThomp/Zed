import ElevatedElement from "./ElevatedElement";
import Intersection from "./Intersection";


// Known issues
// - Does not deal well with more than 2 layers of overlap
// -- Need to clip all but the highest clip path
//
// - Need to check whether we need to update or not. Lots of unnecessary updating happening
//
// - Odd behaviour when the distance between cards is less than the shadow spread (too much/too little shadow)
//
// - Should add MutationObservers to watch for [zed] attribute changes

// TODO - COPY all assignments from the base element 
// Don't just use the reference, 'cause then it expands the original DOMRect

class Zed {
  private rootElement: Element;
  private elevatedElements: Array<ElevatedElement>; // all elements with [zed] attributes
  private initialized:boolean = false;

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT:number = 4;
  
  constructor(rootElement: Element | string){
    // default to the document element if none is provided
    if (typeof rootElement === 'string') {
      this.rootElement = (document.querySelector(rootElement) as Element)
    } else {
      this.rootElement = rootElement || document.documentElement
    }
    this.elevatedElements = []
    this.init()
  }

  public setElevationIncrement(newIncrement: number) {
    this.ELEVATION_INCREMENT = newIncrement;
    this.update()
  }

  public update() {
    this.init(this.elevatedElements)
  }
  
  init(elevatedElements?:Array<ElevatedElement>){
    // Get all the elevated elements on the page
    this.elevatedElements = elevatedElements || this.getElevatedElements()

    // Iterate over all the elevated elements
    this.elevatedElements.forEach((elElem) => {
      elElem.element.classList.add('zed-element')
      this.drawShadows(elElem, true)
      this.addMutationObserver(elElem) // watch for changes in [zed]
    })
    this.initialized = true;
  }


  protected updateZed(elElem: ElevatedElement) {
    elElem.z = this.getZed(elElem.element)

    // // Update base shadow
    // const newBaseShadow = this.getCSSShadowValue(elElem.z)
    // this.replaceStyle(elElem.baseShadowElement, 'box-shadow', newBaseShadow)
    this.setBaseShadowStyle(elElem)

    // Update overlapping shadows
    this.drawOverlappingShadowsForElement(elElem)
  }

  /*
   * Returns the [zed] attribute of the provided HTML element
   */
  protected getZed(elem: Element):number {
    const _zed = elem.getAttribute('zed')
    if (!!_zed){
      return parseFloat(_zed)
    } else {
      return 0
    }
  }

  protected getElevatedElements(): Array<ElevatedElement>{
    return Array.prototype.slice.call(this.rootElement.querySelectorAll('[zed]')).map(e => {
      return new ElevatedElement({
        element: e,
        baseRect: this.cloneDOMRect(e.getBoundingClientRect()),
        z: this.getZed(e),
        intersections: [],
        baseShadowElement: this.createBaseShadowElement(e),
        overlappingShadows: [],
      })
    });
  }

  protected drawShadows(elElem: ElevatedElement, shouldUpdateIxns: boolean = false) {
    // set the actual z-index css
    this.replaceStyle(elElem.element, 'z-index', elElem.z.toString());

    // Get all the intersections with other elevated elements
    let elementsIntersections: Array<Intersection> = shouldUpdateIxns 
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

    this.elevatedElements.forEach((otherElElem:ElevatedElement, j) => {
      const otherElem = otherElElem.element
      if (otherElem !== elem) {
        const otherZ = this.getZed(otherElem) //otherElem.getAttribute('z-index')
        const ixnRect_ij = this.getIntersectionRectOf(elElem, otherElElem);
        const zDiff = this.getZed(elem) - otherZ;
        if (ixnRect_ij.height > 0 && ixnRect_ij.width > 0) {
          const ixnObject: Intersection = new Intersection({
            primaryElementRef: elElem,
            primaryElement: elem,
            intersectingElement: otherElem,
            intersectingElementRef: otherElElem,
            intersectionRect: ixnRect_ij,
            zDiff: zDiff,
            shadowElement: zDiff > 0 ? this.createOverlappingShadowElement(elElem) : null,
          })
          elElem.intersections.push(ixnObject)
        }
      }
    })
    return elElem.intersections
  }

  protected getElementIndex(elem: Element): number {
    const index = this.elevatedElements.findIndex(ee => ee.element === elem)
    return index
  }

  protected createBaseShadowElement(elem: Element): Element {
    const baseShadowElem = document.createElement('div')
    baseShadowElem.classList.add('zed-shadow', 'base-shadow')
    elem.insertBefore(baseShadowElem, elem.firstChild)
    return baseShadowElem
  }

  protected setBaseShadowStyle(elElem: ElevatedElement) {
    // Find or create main shadow element
    const baseShadowElem: Element = elElem.baseShadowElement;
    // this.replaceStyle(baseShadowElem, 'z-index', elElem.z.toString());
    this.replaceStyle(baseShadowElem, 'box-shadow', this.getCSSShadowValue(elElem.z))
  }

  protected createOverlappingShadowElement(elElem: ElevatedElement): Element {
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
    const elElemRef = ixn.primaryElementRef

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
  protected setStyle(elem: Element, style:string){
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
  protected appendStyle(elem: Element, style: string) {
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
  protected replaceStyle(elem: Element, attribute: string, value:string){
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
    //console.trace('getIntersectionRectOf', elem1.element.id, elem2.element.id)
    const rect1 = elem1.baseRect
    const rect2 = elem2.baseRect

    const leftmostElem = rect2.left > rect1.left ? rect2 : rect1
    const rightmostElem = rect2.left > rect1.left ? rect1 : rect2
    const topmostElem = rect2.top > rect1.top ? rect2 : rect1
    const bottommostElem = rect2.top > rect1.top ? rect1 : rect2

    const x = Math.round(leftmostElem.left);
    const y = Math.round(topmostElem.top);
    const w = Math.round(rightmostElem.right - leftmostElem.left);
    const h = Math.round(bottommostElem.bottom - topmostElem.top);

    let intersection: DOMRect = new DOMRect();

    if (w > 0 
        && h > 0 
        && w < Math.min(rect1.width, rect2.width) 
        && h < Math.min(rect1.height, rect2.height)
    ) {
      intersection = new DOMRect(x, y, w, h)
    }
    return intersection
  }

  /*
   * Returns the CSS shadow rule given a z-position
   */
  protected getCSSShadowValue(z:number):string {
    z = z <= 0 ? 0.5 : z
    let elevation = this.ELEVATION_INCREMENT * z
    let blur = 1.2 * elevation;
    let spread = -0.5 * elevation;
    return `0px ${elevation}px ${blur}px ${spread}px rgba(0, 0, 0, 0.18);`
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
    console.log('getAllBaseClipPath', baseElElem.element.id)
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
    const observer = new MutationObserver((mutations: Array<any>, obs) => {
      mutations.forEach(mutation => {
        if (mutation.type === "attributes" && mutation.attributeName === 'zed') {
          // console.log(`Updated Zed of ${elevatedElem.element.id}`)
          this.updateZed(elevatedElem)
        }
      });
    })
    observer.observe(elevatedElem.element, { attributes: true, childList: false, subtree: false })
  }
}


function zedFactory() {
  return Zed
}

declare var define:any;
(
  function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' 
    ? module.exports = factory() 
    : typeof define === 'function' && define.amd 
      ? define(factory) 
      : global.moment = factory()
  }(this, zedFactory)
);