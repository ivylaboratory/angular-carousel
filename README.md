# Carousel for Angular

<img src="https://badgen.net/bundlephobia/min/angular-responsive-carousel" />

A simple solution for horizontal scrolling images with lazy loading.

Live demo can be found on [home page](http://ivylab.space/carousel).

🔬️ Help make IvyCarousel better by [answering a few questions](https://docs.google.com/forms/d/e/1FAIpQLSemPfIejDl3Pq4mFz32sFZgvLo7JbyXZPZFt4uDw9G4H92H8Q/viewform?usp=sf_link).

## Installation

Install the npm package.
```
  npm i angular-responsive-carousel
```
Import module:
```ts
  import {IvyCarouselModule} from 'angular-responsive-carousel';

  @NgModule({
      imports: [IvyCarouselModule]
  })
```

## Usage
Put the contents of your cells in containers with the `carousel-cell` class.

```html
<carousel>
    <div class="carousel-cell">
        <img src="path_to_image">
    </div>
    <div class="carousel-cell">
        ...
</carousel>
```

Or prepare an image array for the carousel. If necessary, specify in the settings the sizes of the cells and the carousel container. And also select the method of arranging images inside the cells using the objectFit property.

```html
<carousel
    [images]="images">
</carousel>
```
```ts
images = [
    {path: 'PATH_TO_IMAGE'},
    ...
]
```

## Lazy loading
To use lazy loading, pass the carousel an array of images, as shown in the example above. Images will be uploaded only as needed, this will save you traffic. Using the `overflowCellsLimit` property, you can specify the number of images that will be loaded outside the visible area, which will allow the images to be loaded before they are displayed.
<img src="http://ivylab.space/assets/img/carousel-lazy-loading.gif" />

## Properties

| name | type | default | description |
|------|------|---------|-------------|
| height | number | | Carousel height. |
| width | number | | Carousel Width. |
| cellWidth | number, '100%' | 200 | Cell width. |
| cellsToShow | number | | The number of cells to display, regardless of the width of the container. |
| cellsToScroll | number | 1 | The number of carousel cells to scroll per arrow click. |
| loop | boolean | false | Infinite loop. |
| lightDOM | boolean | false | Keep a limited number of cells in the DOM tree for an unlimited number of images. As the carousel scrolls, the images will be lazy loaded. This allows you not to overload the browser memory. This mode works only with images passed as an array. |
| overflowCellsLimit | number | 3 | The number of carousel cells that will be stored for in the DOM tree outside the scope. |
| freeScroll | boolean | false | The carousel will stop where the touch ended and will not automatically align. |
| autoplay | boolean | false | Automatically start the carousel after initialization. |
| autoplayInterval | number | 5000 | The interval between scrolling the carousel. Used together with autoplay. |
| pauseOnHover | boolean | true | Stops autoplay if the cursor is over the carousel area. |
| dots | boolean | false | Carousel progress bar. |
| margin | number | 10 | Cell spacing. |
| minSwipeDistance | number | 10 | Minimum distance for swipe. |
| transitionDuration | number | 300 | Animation duration. |
| transitionTimingFunction | 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' | 'ease-in-out' | Smooth animation function. |
| counter | boolean | false | Counter. |
| counterSeparator | string | " / " | Counter separator. |
| borderRadius | number | 0 | Border radius for carousel cells. |
| arrows | boolean | true | Arrows for image navigation. |
| arrowsOutside | boolean | false | Arrows on the outside of the carousel container. |
| arrowsTheme | 'light', 'dark' | 'light' | Arrow color theme. |

The IvyCarousel also has a Pro version, with an [extended API](http://ivylab.space/carousel).

## Author services

Are you interested in this library but lacks features? Write to the author, he can do it for you.

## Roadmap

`centerMode` - center the cells inside the container (Pro version).

`fade` - fade in and fade out animation.

`adaptiveHeight` - the height of the container is set based on the height of the tallest cell currently visible.