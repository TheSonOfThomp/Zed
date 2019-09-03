// Known issues
// - Does not deal well with multiple layers of overlap
// -- Need to clip all but the highest clip path
var Zed = /** @class */ (function () {
    function Zed(rootElement) {
        this.initialized = false;
        this.rootElement = rootElement;
        this.init();
    }
    Object.defineProperty(Zed.prototype, "ELEVATION_INCREMENT", {
        // how many pixels is one z-index level worth?
        get: function () {
            return 4;
        },
        enumerable: true,
        configurable: true
    });
    // private allIntersections: Array<IIntersection>;
    Zed.prototype.init = function (elevatedElements) {
        var _this = this;
        // Get all the elevated elements on the page
        this.elevatedElements = elevatedElements || Array.prototype.slice.call(this.rootElement.querySelectorAll('[zed]'));
        // Iterate over all the elevated elements
        this.elevatedElements.forEach(function (elem, i) {
            var intersections = [];
            var zDiffs = [];
            var z = _this.getZed(elem);
            // set actual z-index css
            _this.replaceStyle(elem, 'z-index', z.toString());
            // Find all the intersections of elvated elements
            _this.elevatedElements.forEach(function (otherElem, j) {
                var otherZ = _this.getZed(otherElem); //otherElem.getAttribute('z-index')
                var zDiff = z - otherZ;
                if (zDiff >= 0) {
                    intersections.push(_this.getIntersectionOf(elem, otherElem));
                    zDiffs.push(zDiff);
                }
            });
            // Find or create main shadow element
            var baseShadowElem;
            var baseShadowQuery = elem.querySelector('.base-shadow');
            if (!!baseShadowQuery) {
                baseShadowElem = baseShadowQuery;
                _this.replaceStyle(baseShadowElem, 'z-index', z.toString());
                _this.replaceStyle(baseShadowElem, 'box-shadow', _this.getCSSShadowValue(z));
            }
            else {
                // Create the element
                baseShadowElem = document.createElement('div');
                baseShadowElem.classList.add('zed-shadow', 'base-shadow');
                // Set the appropriate shadowHeight;
                _this.setStyle(baseShadowElem, "\n          box-shadow: " + _this.getCSSShadowValue(z) + ";\n          z-index: -" + z + ";\n        ");
                // Add it to the DOM
                elem.appendChild(baseShadowElem);
            }
            // Start adding the intersection shadows
            if (intersections.length > 0) {
                _this.replaceStyle(baseShadowElem, 'clip-path', "" + _this.getAllBaseClipPath(intersections, elem));
                var existingIxnElems = Array.prototype.slice.call(elem.querySelectorAll('.overlapping-shadow'));
                // existingIxnElems.forEach(elem => { this.setStyle(elem, '') });
                var countExistingIxns = existingIxnElems.length || 0;
                // intersections = intersections.filter(ixn => !!ixn) // filter out the undefined intersections
                for (var ixnIndex = 0; ixnIndex < Math.max(countExistingIxns, intersections.length); ixnIndex++) {
                    var ixn = intersections[ixnIndex] || null;
                    var ixnShadowElem = existingIxnElems[ixnIndex] || document.createElement('div');
                    if (!!ixn) {
                        var ixnZ = zDiffs[ixnIndex];
                        ixnShadowElem.classList.add('zed-shadow', 'overlapping-shadow');
                        _this.setStyle(ixnShadowElem, "\n              box-shadow: " + _this.getCSSShadowValue(ixnZ) + ";\n              clip-path: " + _this.getClipPath(ixn, elem) + ";\n            ");
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
    };
    Zed.prototype.update = function () {
        this.init(this.elevatedElements);
    };
    Zed.prototype.getZed = function (elem) {
        return parseFloat(elem.getAttribute('zed'));
    };
    Zed.prototype.setStyle = function (elem, style) {
        elem.setAttribute('style', style);
    };
    Zed.prototype.replaceStyle = function (elem, attribute, value) {
        // debugger
        var currentStyle = elem.getAttribute('style') + ';';
        var toReplace = attribute + ":.*?(?=[\n;]).";
        var toReplaceRegex = new RegExp(toReplace, 'g');
        if (currentStyle && currentStyle.includes(attribute)) {
            var newStyle = currentStyle.replace(toReplaceRegex, attribute + ": " + value);
            // console.log(currentStyle === newStyle)
            this.setStyle(elem, newStyle);
        }
        else {
            this.appendStyle(elem, attribute + ": " + value);
        }
    };
    Zed.prototype.appendStyle = function (elem, style) {
        var currentStyle = elem.getAttribute('style');
        var newStyle = [currentStyle, style].join(';\n');
        elem.setAttribute('style', newStyle);
    };
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
    Zed.prototype.getIntersectionOf = function (node1, node2) {
        var elem1 = node1.getBoundingClientRect();
        var elem2 = node2.getBoundingClientRect();
        var leftmostElem = elem2.left > elem1.left ? elem2 : elem1;
        var rightmostElem = elem2.left > elem1.left ? elem1 : elem2;
        var topmostElem = elem2.top > elem1.top ? elem2 : elem1;
        var bottommostElem = elem2.top > elem1.top ? elem1 : elem2;
        var x = leftmostElem.left;
        var y = topmostElem.top;
        var w = rightmostElem.right - leftmostElem.left;
        var h = bottommostElem.bottom - topmostElem.top;
        if (w > 0
            && h > 0
            && w < Math.min(elem1.width, elem2.width)
            && h < Math.min(elem1.height, elem2.height)) {
            return new DOMRect(x, y, w, h);
        }
    };
    Zed.prototype.getCSSShadowValue = function (z) {
        z = z <= 0 ? 0.5 : z;
        var elevation = this.ELEVATION_INCREMENT * z;
        var blur = 1.2 * elevation;
        var spread = -0.5 * elevation;
        return "0px " + elevation + "px " + blur + "px " + spread + "px rgba(0, 0, 0, 0.18);";
    };
    Zed.prototype.getSharedEdges = function (ixn, baseElem) {
        var baseRect = baseElem.getBoundingClientRect();
        var sharedEdges = [];
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
    };
    Zed.prototype.getExpandedBase = function (baseElem) {
        var baseRect = baseElem.getBoundingClientRect();
        var z = this.getZed(baseElem);
        var z_px = this.ELEVATION_INCREMENT * z;
        // expand the baseRect by 50% in all directions (to accomodate the big shadow)
        // Original x,y is 0, 0
        var bw = baseRect.width;
        var bh = baseRect.height;
        return new DOMRect(-z_px, -z_px, bw + 3 * z_px, bh + 3 * z_px);
    };
    Zed.prototype.getExpandedIntersection = function (ixn, baseElem) {
        var baseRect = baseElem.getBoundingClientRect();
        var sharedEdges = this.getSharedEdges(ixn, baseElem);
        var newBase = this.getExpandedBase(baseElem);
        // expand the intersection along the shared edges
        var iy = sharedEdges.includes('t') ? newBase.y : ixn.y - baseRect.y;
        var ir = sharedEdges.includes('r') ? newBase.right : ixn.right - baseRect.x;
        var ib = sharedEdges.includes('b') ? newBase.bottom : ixn.bottom - baseRect.y;
        var ix = sharedEdges.includes('l') ? newBase.x : ixn.x - baseRect.x;
        var iw = ir - ix;
        var ih = ib - iy;
        return new DOMRect(ix, iy, iw, ih);
    };
    // returns [expandedIxn, expandedBase]. 
    // expanded rectangles to accommodate for the big shadow
    Zed.prototype.getExpandedRects = function (ixn, baseRect) {
        var newBase = this.getExpandedBase(baseRect);
        var newIxn = this.getExpandedIntersection(ixn, baseRect);
        return [newIxn, newBase];
    };
    Zed.prototype.getClipPath = function (ixn, baseElem) {
        var baseRect = baseElem.getBoundingClientRect();
        var newIxn = this.getExpandedIntersection(ixn, baseElem);
        return "polygon(" + this.calcPath(newIxn) + ")";
    };
    Zed.prototype.getAllBaseClipPath = function (intersections, baseElem) {
        var _this = this;
        var baseRect = baseElem.getBoundingClientRect();
        // TODO - Pass Elem into getExpanded*** functions so we know the elevation, 
        // and how far exactly to expand the box
        var newBase = this.getExpandedBase(baseElem);
        var basePath = this.calcPath(newBase, false);
        var ixPaths = [];
        intersections.forEach(function (ixn) {
            if (!!ixn) {
                var newIxn = _this.getExpandedIntersection(ixn, baseElem);
                ixPaths.push(_this.calcPath(newIxn, true));
            }
        });
        if (ixPaths.length > 0) {
            var clipPath = "polygon(" + basePath + ", " + ixPaths.join(", ") + ")";
            return (clipPath);
        }
        else {
            return "polygon(" + basePath + ")";
        }
    };
    Zed.prototype.calcPath = function (rect, clockwise) {
        if (clockwise === void 0) { clockwise = true; }
        var tl = rect.x + "px " + rect.y + "px";
        var tr = rect.right + "px " + rect.y + "px";
        var br = rect.right + "px " + rect.bottom + "px";
        var bl = rect.x + "px " + rect.bottom + "px";
        if (clockwise) {
            return tl + ", " + tr + ", " + br + ", " + bl + ", " + tl;
        }
        else {
            return tl + ", " + bl + ", " + br + ", " + tr + ", " + tl;
        }
    };
    return Zed;
}());
