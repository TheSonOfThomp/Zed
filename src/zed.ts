import md5 from 'js-md5'
import {ElevatedElement} from "./ElevatedElement";
import {Intersection, IntersectionSet} from "./Intersection";
import { getElementArray } from "./utils";
import { updateIntersectionClipPathsForElement, drawOverlappingShadowsForElement, getIntersectionRectOf, createOverlappingShadowElement, drawBaseElementShadow, removeOverlappingShadowsForElement } from './zHelpers';


const attributes = [
  'zed',
]

// Known issues
// - Does not deal well with more than 2 layers of overlap
// -- Need to clip all but the highest clip path
//
// - Odd behaviour when the distance between cards is less than the shadow spread (too much/too little shadow)

/**
 * 
 * TODO abstract out any functions that can be into zHelpers
 * 
 * Cleanup the logic in here
 * 
 * Later : Use rxjs to manage changes in the elementTree & intersections ? 
 * 
 */

export default class Zed {
  private rootElement: HTMLElement;
  private elementTree: ElevatedElement;
  private intersections: IntersectionSet = {};
  private elementMap: WeakMap<HTMLElement, ElevatedElement> = new WeakMap()

  // how many pixels is one z-index level worth?
  public ELEVATION_INCREMENT: number = 1;
  
  constructor(rootElement: HTMLElement | string){
    // default to the document element if none is provided
    if (typeof rootElement === 'string') {
      this.rootElement = (document.querySelector(rootElement) as HTMLElement)
    } else {
      this.rootElement = rootElement || document.documentElement
    }
    this.elementTree = this.createElementTree(this.rootElement)

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

  public setElevationIncrement(newIncrement: number) {
    this.ELEVATION_INCREMENT = newIncrement;
    this.update()
  }

  public update():void {
    this.elementTree = this.createElementTree(this.rootElement)
    this.initTree(this.elementTree)
  }

  protected createElementTree(rootNode: HTMLElement | ElevatedElement): ElevatedElement{
    
    const recurseDOMTree = (currentNode: HTMLElement, prevElement: ElevatedElement) => {
      const children = currentNode.childNodes
      if (children.length) {
        for (let child of getElementArray(children)) {
          if (child.getAttributeNames && child.getAttributeNames().includes('zed')) {
            // create a new element
            const newNode = new ElevatedElement(child, prevElement)
            // add the new element to the parent's children array
            const parent = prevElement
            parent.children.push(newNode)
            // create a map reference to the element
            this.elementMap.set(child, newNode)
            // get this elements children
            recurseDOMTree(child, newNode)
          } else {
            // keep going
            recurseDOMTree(child, prevElement)
          }
        }
      }
      return prevElement
    }
    
    if (rootNode instanceof HTMLElement) {
      const root = new ElevatedElement(rootNode)
      recurseDOMTree(rootNode, root)
      return root
    } else {
      recurseDOMTree(rootNode.element, rootNode)
      return rootNode
    }
  }

  protected initTree(treeRoot: ElevatedElement):void {
    treeRoot = treeRoot || this.createElementTree(this.rootElement)
    treeRoot.element.classList.add('zed-element')
    this.updateTreeFrom(treeRoot, true)
  }

  public updateFromElement(element: HTMLElement, hardUpdate: boolean = false):void {
    const elElem = this.elementMap.get(element)
    if (elElem) this.updateTreeFrom(elElem, hardUpdate)
  }

  public updateTreeFrom(node: ElevatedElement, hardUpdate: boolean = false):void {
    if(hardUpdate) {
      this.resetIntersectionsFrom(node)
      node = this.createElementTree(node.element)
    }
    // First update the Zed attribute of all elements
    const recursiveUpdateTreeNodes = (elElem: ElevatedElement) => {
      elElem.updateZed()
      this.drawShadowsForElement(elElem, hardUpdate)
      for (let child of elElem.children) {
        recursiveUpdateTreeNodes(child)
      }
    }
    recursiveUpdateTreeNodes(node)
  }

  protected drawShadowsForElement(elElem: ElevatedElement, hardUpdate: boolean = false):void {
    // update the base shadow for the element
    drawBaseElementShadow(elElem)
    let ixnIds: Array<string>;

    // Get all the intersections with other elevated elements
    if (hardUpdate) {
      ixnIds = this.getIntersectionsForElement(elElem)
    } else {
      ixnIds = elElem.intersections
    }
    // Update the intersection shadows
    updateIntersectionClipPathsForElement(elElem, this.intersections)
    drawOverlappingShadowsForElement(elElem, this.intersections)
  }

  protected getIntersectionsForElement(elElem:ElevatedElement):Array<string> {
    const elem = elElem.element
    for (let otherElevatedElem of this.elevatedElementsList) {
      const otherElem = otherElevatedElem.element
      if (otherElem !== elem && elElem.id !== otherElevatedElem.id) {
        const ixnRect_ij = getIntersectionRectOf(elElem, otherElevatedElem);
        if (ixnRect_ij.height > 0 && ixnRect_ij.width > 0) {
          const ixn_id = md5(elElem.id + otherElevatedElem.id)
          otherElevatedElem.updateZed()
          const zDiff = elElem.z - otherElevatedElem.z;
          if(zDiff > 0) {
            // Add this object to the global object
            this.intersections[ixn_id] = {
              id: ixn_id,
              primaryElement: elElem,
              intersectingElement: otherElevatedElem,
              intersectionRect: ixnRect_ij,
              zDiff: zDiff,
              shadowElement: elElem.element.querySelector(`#ol-${ixn_id}`) || createOverlappingShadowElement(elElem, ixn_id),
            }
            // keep a reference on the element
            if (!elElem.intersections[ixn_id]) {
              elElem.intersections.push(ixn_id)
            }
          }
        }
      }
    }
    return elElem.intersections
  }

  protected resetIntersectionsFrom(elElem: ElevatedElement):void {
    const removeIxnsRecursive = (el: ElevatedElement) => {
      for (let id of el.intersections) {
        const ixn = this.intersections[id]
        if (ixn.intersectingElement.id !== elElem.id) {
          removeIxnsRecursive(ixn.intersectingElement)
        }
        delete this.intersections[id]
      }
      el.intersections.length = 0
      removeOverlappingShadowsForElement(el)
    }
    removeIxnsRecursive(elElem)
  }

  // protected addMutationObserver(elevatedElem: ElevatedElement): void {
  //   const ZedObserver = new MutationObserver((mutations: Array<any>, obs) => {
  //     mutations.forEach(mutation => {
  //       if (mutation.attributeName === 'zed' || mutation.attributeName === 'zed-rel') {
  //         console.log('Firing mutation observer')
  //         this.updateTreeFrom(elevatedElem, false)
  //       }
  //     });
  //   })
  //   ZedObserver.observe(elevatedElem.element, { attributes: true, childList: false, subtree: false })
  // }
}
