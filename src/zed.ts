// Known issues
// - Does not deal well with more than 2 layers of overlap
// -- Need to clip all but the highest clip path
//
// - Need to check whether we need to update or not. Lots of unnecessary updating happening
//
// - Odd behaviour when the distance between cards is less than the shadow spread (too much/too little shadow)
//
// - Should add MutationObservers to watch for [zed] attribute changes

interface IIntersection {
  id: string;
  element1: Element;
  element2: Element;
  intersection: DOMRect;
  zDiff: number; // +ve zDiff means element1 is higher
}

class Zed {
  private rootElement: Element;
  private elevatedElements: Array<Element>;
  private initialized:boolean = false;

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT:number = 4
  
  constructor(rootElement: Element){
    // default to the document element if none is provided
    this.rootElement = rootElement || document.documentElement;
    this.elevatedElements = []
    this.init()
  }
  
  init(elevatedElements?:Array<Element>){
    // Get all the elevated elements on the page
    this.elevatedElements = elevatedElements || Array.prototype.slice.call(this.rootElement.querySelectorAll('[zed]'));

    // Iterate over all the elevated elements
    this.elevatedElements.forEach((elem, i) => {
      let intersections:Array<DOMRect> = []
      let zDiffs: Array<number> = [];
      let z: number = this.getZed(elem);

      // set actual z-index css
      this.replaceStyle(elem, 'z-index', z.toString());

      // Find all the intersections of elevated elements
      this.elevatedElements.forEach((otherElem, j) => {
        let otherZ = this.getZed(otherElem)//otherElem.getAttribute('z-index')
        let zDiff = z - otherZ;
        if(zDiff >= 0){
          intersections.push(this.getIntersectionOf(elem, otherElem))
          zDiffs.push(zDiff)
        }
      })

      // Find or create main shadow element
      let baseShadowElem: Element;
      const baseShadowQuery = elem.querySelector('.base-shadow')

      if(!!baseShadowQuery){
        baseShadowElem = baseShadowQuery;
        this.replaceStyle(baseShadowElem, 'z-index', z.toString());
        this.replaceStyle(baseShadowElem, 'box-shadow', this.getCSSShadowValue(z))
      } else {
        // Create the element
        baseShadowElem = document.createElement('div');
        baseShadowElem.classList.add('zed-shadow','base-shadow')
        // Set the appropriate shadowHeight;
        this.setStyle(baseShadowElem, `
          box-shadow: ${this.getCSSShadowValue(z)};
          z-index: -${z};
        `)
        // Add it to the DOM
        elem.appendChild(baseShadowElem);
      }

      // Start adding the intersection shadows
      if(intersections.length > 0){
        this.replaceStyle(baseShadowElem, 'clip-path', `${this.getAllBaseClipPath(intersections, elem)}`)

        let existingIxnElems = Array.prototype.slice.call(elem.querySelectorAll('.overlapping-shadow'));
        // existingIxnElems.forEach(elem => { this.setStyle(elem, '') });
        let countExistingIxns = existingIxnElems.length || 0

        // intersections = intersections.filter(ixn => !!ixn) // filter out the undefined intersections

        for (let ixnIndex = 0; ixnIndex < Math.max(countExistingIxns, intersections.length); ixnIndex++) {
          const ixn = intersections[ixnIndex] || null
          const ixnShadowElem = existingIxnElems[ixnIndex] || document.createElement('div');

          if (!!ixn){
            const ixnZ = zDiffs[ixnIndex]
            ixnShadowElem.classList.add('zed-shadow','overlapping-shadow')
            this.setStyle(ixnShadowElem, `
              box-shadow: ${this.getCSSShadowValue(ixnZ)};
              clip-path: ${this.getClipPath(ixn, elem)};
            `)
            if (!existingIxnElems[ixnIndex]){
              elem.appendChild(ixnShadowElem); // the element does not exist. Create it
            }
          } else {
            if(!!existingIxnElems[ixnIndex]){ // there are more existing elements than shadows
              ixnShadowElem.parentNode.removeChild(ixnShadowElem)
            }
          }
        } // end intersection loop
      } // end intersections if
    }) // end element loop
  }

  public setElevationIncrement(newIncrement:number){
    this.ELEVATION_INCREMENT = newIncrement;
  }

  public update(){
    this.init(this.elevatedElements)
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
  /*
   * Sets the [style] attribute of the provided HTML element
   */
  protected setStyle(elem: Element, style:string){
    elem.setAttribute('style', style)
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

  // getAllIntersections(elements: Array<Element>):Array<IIntersection> {
  //   const allIxns: Array<IIntersection> = [];
  //   this.elevatedElements.forEach((elem, i) => {
  //     let z: number = this.getZed(elem);

  //     // Find all the intersections of elvated elements
  //     this.elevatedElements.slice(i).forEach((otherElem, j) => {
  //       const otherZ = this.getZed(otherElem)
  //       const ixnRect = this.getIntersectionOf(elem, otherElem)
  //       const zDiff = z - otherZ;
  //       if(ixnRect){
  //         allIxns.push({
  //           id: `${ixnRect.x}-${ixnRect.y}-${ixnRect.width}-${ixnRect.width}`,
  //           element1: elem,
  //           element2: otherElem,
  //           intersection: ixnRect,
  //           zDiff: zDiff
  //         })
  //       }
  //     })
  //   })
  //   return allIxns;
  // }

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

    let x = leftmostElem.left;
    let y = topmostElem.top;
    let w = rightmostElem.right - leftmostElem.left;
    let h = bottommostElem.bottom - topmostElem.top;

    let intersection: DOMRect = new DOMRect();

    if (w > 0 
        && h > 0 
        && w < Math.min(elem1.width, elem2.width) 
        && h < Math.min(elem1.height, elem2.height)) 
    {
      intersection = new DOMRect(x, y, w, h)
    }
    return intersection
  }

  /*
   * Returns the CSS shadow rule given a z-position
   */
  protected getCSSShadowValue(z:number) {
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
    if (ixn.top === baseRect.top){sharedEdges.push('t')}
    if (ixn.right === baseRect.right){sharedEdges.push('r')}
    if (ixn.bottom === baseRect.bottom){sharedEdges.push('b')}
    if (ixn.left === baseRect.left){sharedEdges.push('l')}
    return sharedEdges
  }

  /*
   * Returns an expanded base element so the shadow doesn't clip
   */
  protected getExpandedBase(baseElem:Element):DOMRect {
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
  protected getExpandedIntersection(ixn:DOMRect, baseElem:Element):DOMRect {
    const baseRect = (baseElem.getBoundingClientRect() as DOMRect)
    const sharedEdges = this.getSharedEdges(ixn, baseElem);
    const newBase = this.getExpandedBase(baseElem);

    // expand the intersection along the shared edges
    const iy = sharedEdges.includes('t') ? newBase.y : ixn.y - baseRect.y
    const ir = sharedEdges.includes('r') ? newBase.right : ixn.right - baseRect.x
    const ib = sharedEdges.includes('b') ? newBase.bottom : ixn.bottom - baseRect.y
    const ix = sharedEdges.includes('l') ? newBase.x : ixn.x - baseRect.x
    const iw = ir - ix;
    const ih = ib - iy;

    return new DOMRect(ix, iy, iw, ih);
  }

  /*
   * Returns an expanded DOMRect and Element so the shadow doesn't clip
   */
  protected getExpandedRects(ixn:DOMRect, baseRect:Element) {
    const newBase = this.getExpandedBase(baseRect);
    const newIxn = this.getExpandedIntersection(ixn, baseRect)
    return [newIxn, newBase]
  }
  
  /*
   * Returns the clip-path polygon on an element from the provided DOMRect
   */
  protected getClipPath(ixn:DOMRect, baseElem:Element) {
    // const baseRect = baseElem.getBoundingClientRect()
    const newIxn = this.getExpandedIntersection(ixn, baseElem);
    return `polygon(${this.calcPath(newIxn)})`;
  }

  /*
   * Returns all the clip-path polygons on an element from the provided array of DOMRects
   */
  protected getAllBaseClipPath(intersections:DOMRect[], baseElem:Element):string {
    // TODO - Pass Elem into getExpanded*** functions so we know the elevation, 
    // and how far exactly to expand the box
    const newBase = this.getExpandedBase(baseElem);
    const basePath = this.calcPath(newBase, false);

    let ixPaths:string[] = []
    intersections.forEach(ixn => {
      if(!!ixn) {
        let newIxn = this.getExpandedIntersection(ixn, baseElem)
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
  protected calcPath(rect: DOMRect, clockwise:boolean = true){
    const tl = `${rect.x}px ${rect.y}px`;
    const tr = `${rect.right}px ${rect.y}px`
    const br = `${rect.right}px ${rect.bottom}px`
    const bl = `${rect.x}px ${rect.bottom}px`

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

