import { Component, ViewChildren } from '@angular/core';
import { CarouselComponent } from './carousel/carousel.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})

export class AppComponent {

	myCarousel;
	carouselWidth = 640;
	carouselHeight = 220;

	images = [
		{
			path: '/assets/1.jfif'
		},
		{
			path: '/assets/2.jpg'
		},
		{
			path: '/assets/3.jpg'
		},
		{
			path: '/assets/4.jfif'
		},
		{
			path: '/assets/5.jpg'
		},
		{
			path: '/assets/6.jpg'
		},
		{
			path: '/assets/7.jpg'
		},
		{
			path: '/assets/8.jpg'
		},
		{
			path: '/assets/9.jpg'
		},
		{
			path: '/assets/10.jfif'
		}
	];

    images2 = [
        {
            path: '/assets/photo-1444065707204-12decac917e8.jfif',
        },
        {
            path: '/assets/photo-1445452916036-9022dfd33aa8.jfif',
        },
        {
            path: '/assets/photo-1443996104801-80c82e789b18.jfif',
        },
        {
            path: '/assets/photo-1505839673365-e3971f8d9184.jfif',
        },
        {
            path: '/assets/photo-1545420333-23a22b18b8fa.jfif',
        },
    ];

	@ViewChildren(CarouselComponent) carouselComponent;

    ngOnInit(){
    }

    ngAfterViewInit() {
        this.myCarousel = this.carouselComponent.find(elem => elem.id === "my-carousel");
    }

    requestFullscreen() {
    	document.documentElement.requestFullscreen();
    }

	handleCarouselEvents(event) {
		if (event.type === "click") {
			console.log(event);
		}
	}

	addImage() {
		this.images.push({
			path: '/assets/10.jfif'
		});
	}

	next() {
		this.myCarousel.next();
	}

	prev() {
		this.myCarousel.prev();
	}

	resize() {
		if (this.carouselWidth === 320) {
			this.carouselWidth = 480;
			this.carouselHeight = 320;
		} else {
			this.carouselWidth = 320;
			this.carouselHeight = 220;
		}
	}

	select(index) {
		this.myCarousel.select(index);
	}

	changeImagesArray() {
		this.images = this.images2;
	}
}
