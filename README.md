# ZED

ZED stands for Z-Elevation based Drop-shadows. (It's also the correct way to pronounce the last letter in the alphabet 🇨🇦)

ZED creates more realistic-looking overlapping drop-shadows. The way drop-shadows are drawn by default in CSS doesn't take other elements into account. ZED draws shadows that get cast on other elevated elements, creating a more realistic effect.

## Installation
To install ZED, install it from NPM

```
npm i zed-shadow
```

## Usage
### Initialization
```js
import Zed from 'zed-shadow'

// Initialize Zed with a DOM element, or a selector string

const Z = new Zed('#shadow-container')
// or 
const Z = new Zed(document.getElementByID('#shadow-container)) 
```

Add the `zed` attribute to the DOM elements you want to elevate 
```html
<main id="shadow-container">
  <div zed="2">This div has a level 2 shadow</div>
  <div zed="4">This div has a level 4 shadow</div>
</main>
```

Include Zed styles in your main/global css file
```css
  @import url('../path/to/node_modules/zed-shadow/zed/zed.css'); 
```

### Modifying the default shadow distance
If you want to change the definition of `1 zed` unit, modify it with 
```js
let x = 2 // any number

Z.setElevationIncrement(x)
Z.update() // Need to redraw the shadows
```


### Updating shadows
To update the `zed` attribute of an element, this still needs to be done manually
```js
Z.update()
``` 
See the current `vue` example.

Live updating should be coming soon!

## Examples
See the [demo](./demo) directory to see examples in some common frameworks.
