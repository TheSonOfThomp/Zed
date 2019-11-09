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

interface IIntersection {
  primaryElement: Element;
  intersectingElement: Element,
  intersectionRect: DOMRect;
  zDiff: number; // +ve zDiff means element1 is higher
}

interface IElevatedElement {
  element: Element,
  z: number,
  intersections: Array<IIntersection>
}

class Zed {
  private rootElement: Element;
  private elevatedElements: Array<IElevatedElement>; // all elements with [zed] attributes
  // private elementIntersections: Array<Array<IIntersection>>; // the intersections for element[i]
  private initialized:boolean = false;

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT:number = 4
  
  constructor(rootElement: Element | string){
    // default to the document element if none is provided
    if (typeof rootElement === 'string') {
      this.rootElement = (document.querySelector(rootElement) as Element)
    } else {
      this.rootElement = rootElement || document.documentElement
    }
    this.elevatedElements = []
    // this.elementIntersections = []
    this.init()
  }

  public update() {
    this.init(this.elevatedElements)
  }
  
  init(elevatedElements?:Array<IElevatedElement>){

    // Get all the elevated elements on the page
    this.elevatedElements = elevatedElements || Array.prototype.slice.call(this.rootElement.querySelectorAll('[zed]')).map(e => {
      return {
        element: e,
        z: this.getZed(e),
        intersections: []
      }
    });

    console.log(this.elevatedElements.map(el => el.element.getBoundingClientRect()))

    // Iterate over all the elevated elements
    this.elevatedElements.forEach((eElem, i) => {
      this.drawShadows(eElem, true)
      // watch for changes in Zed
      this.addMutationObserver(eElem.element)
    }) // end element loop
    this.initialized = true;
  }

  public setElevationIncrement(newIncrement:number){
    this.ELEVATION_INCREMENT = newIncrement;
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

  protected drawShadows(elElem: IElevatedElement, updateIxns: boolean = false) {
    let elem = elElem.element
    // set the actual z-index css
    this.replaceStyle(elem, 'z-index', this.getZed(elem).toString());

    // Get all the intersections with other elevated elements
    let validIntersections: Array<IIntersection> = updateIxns 
      ? this.getIntersectionsForElement(elElem) 
      : elElem.intersections


    // if (!updateIxns) debugger
    this.getBaseShadowForElement(elem)

    // Start adding the intersection shadows
    if (validIntersections.length > 0) {
      this.drawOverlappingShadowsForElement(elElem)
    }
  }

  protected getIntersectionsForElement(elElem:IElevatedElement) {
    let elem = elElem.element

    this.elevatedElements.forEach((otherElElem:IElevatedElement, j) => {
      let otherElem = otherElElem.element
      if (otherElem !== elem) {
        const otherZ = this.getZed(otherElem) //otherElem.getAttribute('z-index')
        const ixnIJ = this.getIntersectionOf(elem, otherElem);
        const zDiff = this.getZed(elem) - otherZ;
        if (ixnIJ.height > 0 && ixnIJ.width > 0) {
          const ixnObject: IIntersection = {
            primaryElement: elem,
            intersectingElement: otherElem,
            intersectionRect: ixnIJ,
            zDiff: zDiff
          } 
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

  protected getBaseShadowForElement(elem: Element):Element {
    // Find or create main shadow element
    const baseElementExists = !!elem.querySelector('.base-shadow')
    let baseShadowElem: Element = elem.querySelector('.base-shadow') || document.createElement('div');

    if (!!baseElementExists) {
      this.replaceStyle(baseShadowElem, 'z-index', this.getZed(elem).toString());
      this.replaceStyle(baseShadowElem, 'box-shadow', this.getCSSShadowValue(this.getZed(elem)))
    } else {
      // Create the element
      baseShadowElem.classList.add('zed-shadow', 'base-shadow')
      // Set the appropriate shadowHeight;
      this.setStyle(baseShadowElem,
        `box-shadow: ${this.getCSSShadowValue(this.getZed(elem))};
          z-index: -${this.getZed(elem)};
        `)
      // Add it to the DOM
      elem.appendChild(baseShadowElem);
    }
    return baseShadowElem
  }

  protected drawOverlappingShadowsForElement(elElem: IElevatedElement) {
    let elem = elElem.element
    // update the element's clip-path
    const elementIndex = this.getElementIndex(elem)
    const baseShadowElem: Element = this.getBaseShadowForElement(elem)
    const intersections: Array<IIntersection> = elElem.intersections

    this.replaceStyle(
      baseShadowElem,
      'clip-path',
      `${this.getAllBaseClipPath(intersections.map(ixn => ixn.intersectionRect), elem)}`
    )

    // Loop all valid for this element
    intersections.forEach((ixn) => {
      // console.log(ixn.primaryElement.id, ixn.intersectingElement.id)
      // console.log(ixn.intersectionRect.x, ixn.intersectionRect.y, ixn.intersectionRect.width, ixn.intersectionRect.height)
      this.drawOverlappingShadowForIntersection(ixn)
    })
  }

  protected drawOverlappingShadowForIntersection(ixn: IIntersection):void {
    const zDiff = ixn.zDiff;
    const primaryElem = ixn.primaryElement;
    const shadowExists = !!primaryElem.querySelector('.overlapping-shadow')
    const thisIxnShadowElement: Element = primaryElem.querySelector('.overlapping-shadow') || document.createElement('div')

    const ixnZ = Math.abs(ixn.zDiff);
    if (zDiff > 0) {
      thisIxnShadowElement.classList.add('zed-shadow', 'overlapping-shadow')
      const shadowVal = this.getCSSShadowValue(ixnZ)
      const clipPath = this.getClipPath(ixn.intersectionRect, primaryElem);

      // console.log(clipPath) // TODO Find out why clipPath changes every time it's called with the same args
      
      this.setStyle(thisIxnShadowElement, `
        box-shadow: ${shadowVal};
        clip-path: ${clipPath}
      `)
      if (!shadowExists) {
        primaryElem.appendChild(thisIxnShadowElement); // the element does not exist. Create it
      }
    }  
    // else {
    //   if (shadowExists) { // there are more existing elements than shadows
    //     thisIxnShadowElement.parentNode.removeChild(thisIxnShadowElement)
    //   }
    // }
  }

  protected addMutationObserver(elem: Element):void {
    // console.log('Adding Mutation Observer to ', elem.id)
    const observer = new MutationObserver((mutations:Array<any>, obs) => {
      mutations.forEach(mutation => {
        if (mutation.type === "attributes" && mutation.attributeName === 'zed') {
          console.log(`Updated Zed of ${elem.id}`, elem)
          console.log(this.elevatedElements.map(el => el.element.getBoundingClientRect()))
          this.drawShadows(this.elevatedElements[this.getElementIndex(elem)])

        }
      });
    })

    observer.observe(elem, {attributes: true, childList: false, subtree: false})
  }


  /*
   * Sets the [style] attribute of the provided HTML element
   */
  protected setStyle(elem: Element, style:string){
    elem.setAttribute('style', style.replace(/\n/, ''))
  }

  /*
   * Appends to the [style] attribute of the provided HTML element
   */
  protected appendStyle(elem: Element, style: string) {
    const currentStyle = elem.getAttribute('style');
    const newStyle = [currentStyle, style].join(';\n')
    elem.setAttribute('style', newStyle);
  }

  /*
   * Replaces a rule in the [style] attribute of the provided HTML element
   */
  protected replaceStyle(elem: Element, attribute: string, value:string){
    const currentStyle = elem.getAttribute('style') + ';';
    const toReplace = `${attribute}:.*?(?=[\n\;]).`
    const toReplaceRegex = new RegExp(toReplace, 'g');
    if (currentStyle && currentStyle.includes(attribute)) {
      const newStyle = currentStyle.replace(toReplaceRegex, `${attribute}: ${value}`); 
      // console.log(currentStyle === newStyle)
      this.setStyle(elem, newStyle)
    } else {
      this.appendStyle(elem, `${attribute}: ${value}`);
    }
  }

  /*
   * Returns a DOMRect (relative to the viewport) that is the intersection of the provided 2 HTML elements
   */
  protected getIntersectionOf(node1:Element, node2:Element):DOMRect {
    const elem1 = node1.getBoundingClientRect()
    const elem2 = node2.getBoundingClientRect()

    let leftmostElem = elem2.left > elem1.left ? elem2 : elem1
    let rightmostElem = elem2.left > elem1.left ? elem1 : elem2
    let topmostElem = elem2.top > elem1.top ? elem2 : elem1
    let bottommostElem = elem2.top > elem1.top ? elem1 : elem2

    let x = Math.round(leftmostElem.left);
    let y = Math.round(topmostElem.top);
    let w = Math.round(rightmostElem.right - leftmostElem.left);
    let h = Math.round(bottommostElem.bottom - topmostElem.top);

    let intersection: DOMRect = new DOMRect();

    if (w > 0 
        && h > 0 
        && w < Math.min(elem1.width, elem2.width) 
        && h < Math.min(elem1.height, elem2.height)
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
  protected getSharedEdges(ixn:DOMRect, baseElem:Element):string[] {
    const baseRect = baseElem.getBoundingClientRect()
    let sharedEdges:string[] = []
    if (Math.round(ixn.top) === Math.round(baseRect.top)){sharedEdges.push('t')}
    if (Math.round(ixn.right) === Math.round(baseRect.right)){sharedEdges.push('r')}
    if (Math.round(ixn.bottom) === Math.round(baseRect.bottom)){sharedEdges.push('b')}
    if (Math.round(ixn.left) === Math.round(baseRect.left)){sharedEdges.push('l')}

    // console.log(baseElem.id, sharedEdges, ixn, baseRect)

    return sharedEdges
  }

  /*
   * Returns an expanded base element so the shadow doesn't clip
   */
  protected getExpandedBaseRect(baseElem:Element):DOMRect {
    const baseRect = baseElem.getBoundingClientRect()
    const z = this.getZed(baseElem)
    const z_px = this.ELEVATION_INCREMENT * z

    // expand the baseRect by 50% in all directions (to accommodate the big shadow)
    // Original x,y is 0, 0
    const bw = baseRect.width
    const bh = baseRect.height
    return new DOMRect(-z_px, -z_px, bw + 3*z_px, bh + 3*z_px);
  }

  /*
   * Returns an expanded DOMRect intersection so the shadow doesn't clip
   */
  // 
  // TODO 
  // THERES SOMETHING WRONG WITH THIS FUNCTION. 
  // 
  protected getExpandedIntersectionRect(ixn:DOMRect, baseElem:Element):DOMRect {
    const baseRect = (baseElem.getBoundingClientRect() as DOMRect)
    const sharedEdges = this.getSharedEdges(ixn, baseElem);
    const expandedBaseRect = this.getExpandedBaseRect(baseElem);

    // expand the intersection along the shared edges
    const iy = sharedEdges.includes('t') ? expandedBaseRect.y : ixn.y - baseRect.y
    const ir = sharedEdges.includes('r') ? expandedBaseRect.right : ixn.right - baseRect.x
    const ib = sharedEdges.includes('b') ? expandedBaseRect.bottom : ixn.bottom - baseRect.y
    const ix = sharedEdges.includes('l') ? expandedBaseRect.x : ixn.x - baseRect.x
    const iw = ir - ix;
    const ih = ib - iy;

    return new DOMRect(ix, iy, iw, ih);
  }

  
  /*
   * Returns the clip-path polygon on an element from the provided DOMRect
   */
  protected getClipPath(ixn:DOMRect, baseElem:Element):string {
    // const baseRect = baseElem.getBoundingClientRect()
    const newIxnRect = this.getExpandedIntersectionRect(ixn, baseElem);
    return `polygon(${this.calcPath(newIxnRect)})`;
  }

  /*
   * Returns all the clip-path polygons on an element from the provided array of DOMRects
   */
  protected getAllBaseClipPath(intersections:DOMRect[], baseElem:Element):string {
    const newBase = this.getExpandedBaseRect(baseElem);
    const basePath = this.calcPath(newBase, false);

    let ixPaths:string[] = []
    intersections.forEach(ixn => {
      if(!!ixn) {
        let newIxn = this.getExpandedIntersectionRect(ixn, baseElem)
        ixPaths.push(this.calcPath(newIxn, true)) 
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
  protected calcPath(rect: DOMRect, clockwise:boolean = true): string{
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

