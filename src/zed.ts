import md5 from 'js-md5'
import {ElevatedElement, ElementTree} from "./ElevatedElement";
import {Intersection, IntersectionSet} from "./Intersection";
import { getElementArray, getZedAttr } from "./utils";
import { cloneDOMRect, calcPath, getSharedEdges, getCSSShadowValue } from "./geometry";


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
  private intersections: IntersectionSet = {};

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT: number = 1;
  
  constructor(rootElement: HTMLElement | string){
    // default to the document element if none is provided
    if (typeof rootElement === 'string') {
      this.rootElement = (document.querySelector(rootElement) as HTMLElement)
    } else {
      this.rootElement = rootElement || document.documentElement
    }
    this.elementTree = this.getElementTree(this.rootElement)

    this.initTree(this.elementTree)
    console.log(this.elementTree)
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

  public setElevationIncrement(newIncrement: number) {
    this.ELEVATION_INCREMENT = newIncrement;
    this.update()
  }

  public update() {
    this.elementTree = this.getElementTree(this.rootElement)
    this.initTree(this.elementTree)
  }

  public updateTreeFrom(node: ElevatedElement | ElementTree, shouldRecalculateIntersections: boolean = false) {
    const updateTreeNodes = (elElem: ElevatedElement) => {
      elElem.updateZed()
      this.drawShadows(elElem, shouldRecalculateIntersections)
      this.addMutationObserver(elElem)
      for (let child of elElem.children) {
        updateTreeNodes(child)
      }
    }
    try {
      updateTreeNodes(node as ElevatedElement)
    } catch (error) {
      for (let child of node.children) {
        updateTreeNodes(child)
      }
    }
  }

  protected initTree(treeRoot: ElementTree) {
    treeRoot = treeRoot || this.getElementTree(this.rootElement)
    treeRoot.element.classList.add('zed-element')
    this.updateTreeFrom(treeRoot, true)
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
            const newNode = new ElevatedElement(child, prevElement)
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

  protected drawShadows(elElem: ElevatedElement, shouldRecalculateIntersections: boolean = false) {
    this.setBaseShadowStyle(elElem)
    
    // Get all the intersections with other elevated elements
    if (shouldRecalculateIntersections) {
      this.intersections = {}
    }

    const ixnIds: Array<string> = shouldRecalculateIntersections 
      ? this.getIntersectionsForElement(elElem) 
      : elElem.intersections

    const elementsIntersections: Array<Intersection> = ixnIds.map(id => this.intersections[id])

    // Start adding the intersection shadows
    if (elementsIntersections.length > 0) {
      this.updateIntersectionClipPathsForElement(elElem)
      this.drawOverlappingShadowsForElement(elElem)
    }
  }

  protected getIntersectionsForElement(elElem:ElevatedElement) {
    const elem = elElem.element

    for (let otherElevatedElem of this.elevatedElementsList) {
      const otherElem = otherElevatedElem.element
      if (otherElem !== elem && elElem.id !== otherElevatedElem.id) {
        const ixnRect_ij = this.getIntersectionRectOf(elElem, otherElevatedElem);
        if (ixnRect_ij.height > 0 && ixnRect_ij.width > 0) {
          const ixn_id = md5(elElem.id + otherElevatedElem.id)
          const zDiff = elElem.z - otherElevatedElem.z;

          if(!this.intersections[ixn_id]) {
            this.intersections[ixn_id] = {
              id: ixn_id,
              primaryElement: elElem,
              intersectingElement: otherElevatedElem,
              intersectionRect: ixnRect_ij,
              zDiff: zDiff,
              shadowElement: zDiff > 0 ? this.createOverlappingShadowElement(elElem) : null,
            }
            elElem.intersections.push(ixn_id)
          }
        }
      }
    }
    return elElem.intersections
  }

  protected setBaseShadowStyle(elElem: ElevatedElement) {
    // Find or create main shadow element
    const baseShadowElem: HTMLElement = elElem.baseShadowElement;
    baseShadowElem.style.setProperty('box-shadow', getCSSShadowValue(elElem.z, this.ELEVATION_INCREMENT))
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
    for (let id of elElem.intersections) {
      const ixn = this.intersections[id]
      this.drawOverlappingShadowForIntersection(ixn)
    }
  }

  protected updateIntersectionClipPathsForElement(elElem: ElevatedElement) {
    // Clip out the overlapping parts from the base element
    const clipPath = this.getAllBaseClipPath(
      elElem.intersections.map(id => this.intersections[id].intersectionRect), elElem
    )
    elElem.baseShadowElement.style.setProperty('clip-path', clipPath) 
  }

  protected drawOverlappingShadowForIntersection(ixn: Intersection):void {
    if (!ixn.shadowElement) { return } // short circuit

    const zDiff = ixn.zDiff;
    const thisIxnShadowElement = ixn.shadowElement;
    const elElemRef = ixn.primaryElement

    const ixnZ = Math.abs(ixn.zDiff);
    if (zDiff >= 0) {
      const shadowVal = getCSSShadowValue(ixnZ, this.ELEVATION_INCREMENT)
      const clipPath = this.getClipPath(ixn.intersectionRect, elElemRef);
      thisIxnShadowElement.style.setProperty('box-shadow', shadowVal)
      thisIxnShadowElement.style.setProperty('clip-path', clipPath)
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
   * Returns an expanded base element so the shadow doesn't clip
   */
  protected getExpandedBaseRect(elElem: ElevatedElement, increment: number):DOMRect {
    //console.trace('getExpandedBaseRect', elElem.element.id)
    const baseRect = cloneDOMRect(elElem.baseRect)
    const z = elElem.z
    const z_px = increment * z

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
    const baseRect = cloneDOMRect(baseElElem.baseRect);
    const sharedEdges = getSharedEdges(ixnRect, baseRect);
    const expandedBaseRect = this.getExpandedBaseRect(baseElElem, this.ELEVATION_INCREMENT);
    
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
    return `polygon(${calcPath(newIxnRect)})`;
  }

  /*
   * Returns all the clip-path polygons on an element from the provided array of DOMRects
   */
  protected getAllBaseClipPath(intersections:DOMRect[], baseElElem: ElevatedElement):string {
    const newBase = this.getExpandedBaseRect(baseElElem, this.ELEVATION_INCREMENT);
    const basePath = calcPath(newBase, false);

    let ixPaths:string[] = []
    intersections.forEach(ixn => {
      if(!!ixn) {
        const newIxnRect = this.getExpandedIntersectionRect(ixn, baseElElem)
        ixPaths.push(calcPath(newIxnRect, true)) 
      }
    })

    if(ixPaths.length > 0){
      const clipPath = `polygon(${basePath}, ${ixPaths.join(", ")})`;
      return(clipPath)
    } else {
      return `polygon(${basePath})`
    } 
  }

  protected addMutationObserver(elevatedElem: ElevatedElement): void {
    const ZedObserver = new MutationObserver((mutations: Array<any>, obs) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'zed' || mutation.attributeName === 'zed-rel') {
          this.updateTreeFrom(elevatedElem, false)
        }
      });
    })
    ZedObserver.observe(elevatedElem.element, { attributes: true, childList: false, subtree: false })
  }
}
