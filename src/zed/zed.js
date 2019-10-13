"use strict";
// Known issues
// - Does not deal well with multiple layers of overlap
// -- Need to clip all but the highest clip path
class Zed {
    constructor(rootElement) {
        this.initialized = false;
        // how many pixels is one z-index level worth?
        this.ELEVATION_INCREMENT = 4;
        // default to the document element if none is provided
        this.rootElement = rootElement || document.documentElement;
        this.elevatedElements = [];
        this.init();
    }
    init(elevatedElements) {
        // Get all the elevated elements on the page
        this.elevatedElements = elevatedElements || Array.prototype.slice.call(this.rootElement.querySelectorAll('[zed]'));
        // Iterate over all the elevated elements
        this.elevatedElements.forEach((elem, i) => {
            let intersections = [];
            let zDiffs = [];
            let z = this.getZed(elem);
            // set actual z-index css
            this.replaceStyle(elem, 'z-index', z.toString());
            // Find all the intersections of elvated elements
            this.elevatedElements.forEach((otherElem, j) => {
                let otherZ = this.getZed(otherElem); //otherElem.getAttribute('z-index')
                let zDiff = z - otherZ;
                if (zDiff >= 0) {
                    intersections.push(this.getIntersectionOf(elem, otherElem));
                    zDiffs.push(zDiff);
                }
            });
            // Find or create main shadow element
            let baseShadowElem;
            const baseShadowQuery = elem.querySelector('.base-shadow');
            if (!!baseShadowQuery) {
                baseShadowElem = baseShadowQuery;
                this.replaceStyle(baseShadowElem, 'z-index', z.toString());
                this.replaceStyle(baseShadowElem, 'box-shadow', this.getCSSShadowValue(z));
            }
            else {
                // Create the element
                baseShadowElem = document.createElement('div');
                baseShadowElem.classList.add('zed-shadow', 'base-shadow');
                // Set the appropriate shadowHeight;
                this.setStyle(baseShadowElem, `
          box-shadow: ${this.getCSSShadowValue(z)};
          z-index: -${z};
        `);
                // Add it to the DOM
                elem.appendChild(baseShadowElem);
            }
            // Start adding the intersection shadows
            if (intersections.length > 0) {
                this.replaceStyle(baseShadowElem, 'clip-path', `${this.getAllBaseClipPath(intersections, elem)}`);
                let existingIxnElems = Array.prototype.slice.call(elem.querySelectorAll('.overlapping-shadow'));
                // existingIxnElems.forEach(elem => { this.setStyle(elem, '') });
                let countExistingIxns = existingIxnElems.length || 0;
                // intersections = intersections.filter(ixn => !!ixn) // filter out the undefined intersections
                for (let ixnIndex = 0; ixnIndex < Math.max(countExistingIxns, intersections.length); ixnIndex++) {
                    const ixn = intersections[ixnIndex] || null;
                    const ixnShadowElem = existingIxnElems[ixnIndex] || document.createElement('div');
                    if (!!ixn) {
                        const ixnZ = zDiffs[ixnIndex];
                        ixnShadowElem.classList.add('zed-shadow', 'overlapping-shadow');
                        this.setStyle(ixnShadowElem, `
              box-shadow: ${this.getCSSShadowValue(ixnZ)};
              clip-path: ${this.getClipPath(ixn, elem)};
            `);
                        if (!existingIxnElems[ixnIndex]) {
                            elem.appendChild(ixnShadowElem); // the element does not exist. Create it
                        }
                    }
                    else {
                        if (!!existingIxnElems[ixnIndex]) { // there are more existing elements than shadows
                            ixnShadowElem.parentNode.removeChild(ixnShadowElem);
                        }
                    }
                } // end intersection loop
            } // end intersections if
        }); // end element loop
    }
    setElevationIncrement(newIncrement) {
        this.ELEVATION_INCREMENT = newIncrement;
    }
    update() {
        this.init(this.elevatedElements);
    }
    getZed(elem) {
        const _zed = elem.getAttribute('zed');
        if (!!_zed) {
            return parseFloat(_zed);
        }
        else {
            return 0;
        }
    }
    setStyle(elem, style) {
        elem.setAttribute('style', style);
    }
    replaceStyle(elem, attribute, value) {
        // debugger
        const currentStyle = elem.getAttribute('style') + ';';
        const toReplace = `${attribute}:.*?(?=[\n\;]).`;
        const toReplaceRegex = new RegExp(toReplace, 'g');
        if (currentStyle && currentStyle.includes(attribute)) {
            const newStyle = currentStyle.replace(toReplaceRegex, `${attribute}: ${value}`);
            // console.log(currentStyle === newStyle)
            this.setStyle(elem, newStyle);
        }
        else {
            this.appendStyle(elem, `${attribute}: ${value}`);
        }
    }
    appendStyle(elem, style) {
        const currentStyle = elem.getAttribute('style');
        const newStyle = [currentStyle, style].join(';\n');
        elem.setAttribute('style', newStyle);
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
    // The returned DOMRect is relative to the VIEWPORT
    getIntersectionOf(node1, node2) {
        const elem1 = node1.getBoundingClientRect();
        const elem2 = node2.getBoundingClientRect();
        let leftmostElem = elem2.left > elem1.left ? elem2 : elem1;
        let rightmostElem = elem2.left > elem1.left ? elem1 : elem2;
        let topmostElem = elem2.top > elem1.top ? elem2 : elem1;
        let bottommostElem = elem2.top > elem1.top ? elem1 : elem2;
        let x = leftmostElem.left;
        let y = topmostElem.top;
        let w = rightmostElem.right - leftmostElem.left;
        let h = bottommostElem.bottom - topmostElem.top;
        let intersection = new DOMRect();
        if (w > 0
            && h > 0
            && w < Math.min(elem1.width, elem2.width)
            && h < Math.min(elem1.height, elem2.height)) {
            intersection = new DOMRect(x, y, w, h);
        }
        return intersection;
    }
    getCSSShadowValue(z) {
        z = z <= 0 ? 0.5 : z;
        let elevation = this.ELEVATION_INCREMENT * z;
        let blur = 1.2 * elevation;
        let spread = -0.5 * elevation;
        return `0px ${elevation}px ${blur}px ${spread}px rgba(0, 0, 0, 0.18);`;
    }
    getSharedEdges(ixn, baseElem) {
        const baseRect = baseElem.getBoundingClientRect();
        let sharedEdges = [];
        if (ixn.top === baseRect.top) {
            sharedEdges.push('t');
        }
        if (ixn.right === baseRect.right) {
            sharedEdges.push('r');
        }
        if (ixn.bottom === baseRect.bottom) {
            sharedEdges.push('b');
        }
        if (ixn.left === baseRect.left) {
            sharedEdges.push('l');
        }
        return sharedEdges;
    }
    getExpandedBase(baseElem) {
        const baseRect = baseElem.getBoundingClientRect();
        const z = this.getZed(baseElem);
        const z_px = this.ELEVATION_INCREMENT * z;
        // expand the baseRect by 50% in all directions (to accomodate the big shadow)
        // Original x,y is 0, 0
        const bw = baseRect.width;
        const bh = baseRect.height;
        return new DOMRect(-z_px, -z_px, bw + 3 * z_px, bh + 3 * z_px);
    }
    getExpandedIntersection(ixn, baseElem) {
        const baseRect = baseElem.getBoundingClientRect();
        const sharedEdges = this.getSharedEdges(ixn, baseElem);
        const newBase = this.getExpandedBase(baseElem);
        // expand the intersection along the shared edges
        const iy = sharedEdges.includes('t') ? newBase.y : ixn.y - baseRect.y;
        const ir = sharedEdges.includes('r') ? newBase.right : ixn.right - baseRect.x;
        const ib = sharedEdges.includes('b') ? newBase.bottom : ixn.bottom - baseRect.y;
        const ix = sharedEdges.includes('l') ? newBase.x : ixn.x - baseRect.x;
        const iw = ir - ix;
        const ih = ib - iy;
        return new DOMRect(ix, iy, iw, ih);
    }
    // returns [expandedIxn, expandedBase]. 
    // expanded rectangles to accommodate for the big shadow
    getExpandedRects(ixn, baseRect) {
        const newBase = this.getExpandedBase(baseRect);
        const newIxn = this.getExpandedIntersection(ixn, baseRect);
        return [newIxn, newBase];
    }
    getClipPath(ixn, baseElem) {
        const baseRect = baseElem.getBoundingClientRect();
        const newIxn = this.getExpandedIntersection(ixn, baseElem);
        return `polygon(${this.calcPath(newIxn)})`;
    }
    getAllBaseClipPath(intersections, baseElem) {
        const baseRect = baseElem.getBoundingClientRect();
        // TODO - Pass Elem into getExpanded*** functions so we know the elevation, 
        // and how far exactly to expand the box
        const newBase = this.getExpandedBase(baseElem);
        const basePath = this.calcPath(newBase, false);
        let ixPaths = [];
        intersections.forEach(ixn => {
            if (!!ixn) {
                let newIxn = this.getExpandedIntersection(ixn, baseElem);
                ixPaths.push(this.calcPath(newIxn, true));
            }
        });
        if (ixPaths.length > 0) {
            const clipPath = `polygon(${basePath}, ${ixPaths.join(", ")})`;
            return (clipPath);
        }
        else {
            return `polygon(${basePath})`;
        }
    }
    calcPath(rect, clockwise = true) {
        const tl = `${rect.x}px ${rect.y}px`;
        const tr = `${rect.right}px ${rect.y}px`;
        const br = `${rect.right}px ${rect.bottom}px`;
        const bl = `${rect.x}px ${rect.bottom}px`;
        if (clockwise) {
            return `${tl}, ${tr}, ${br}, ${bl}, ${tl}`;
        }
        else {
            return `${tl}, ${bl}, ${br}, ${tr}, ${tl}`;
        }
    }
}
function zedFactory() {
    return Zed;
}
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory()
        : typeof define === 'function' && define.amd
            ? define(factory)
            : global.moment = factory();
}(this, zedFactory));
