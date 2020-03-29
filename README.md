# Carousel for Angular

<img src="https://badgen.net/bundlephobia/min/@ivylab/angular-carousel" />

A simple solution for horizontal scrolling images with lazy loading.

Live demo can be found on [home page](http://ivylab.space/carousel).

## Installation

Install the npm package.

  npm i @ivylab/angular-carousel

Import module:

  import {IvyCarouselModule} from '@ivylab/angular-carousel';

  @NgModule({
      imports: [IvyCarouselModule]
  })

## Usage
Prepare an image array for the carousel. If necessary, specify in the settings the sizes of the cells and the carousel container. And also select the method of arranging images inside the cells using the objectFit property.

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

## Properties

```ts
height: number
// Carousel height

width: number
// Carousel Width

cellWidth: number = 200
// Cell width

overflowCellsLimit: number = 3
// The number of carousel cells that will be stored for in the DOM tree outside the scope.

margin: number = 10
// Cell spacing

minSwipeDistance: number = 50
// Minimum distance for swipe

transitionDuration: number = 200
// Animation duration

transitionTimingFunction: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' = 'ease'
// Smooth animation function

counter: boolean = false
// Counter

counterSeparator: string = " / "
// Counter separator

borderRadius: number
// Border radius for carousel cells
```

## Browser support

IvyPinch supports the most recent two versions of all major browsers: Chrome (including Android 4.4-10), Firefox, Safari (including iOS 9-13), and Edge.