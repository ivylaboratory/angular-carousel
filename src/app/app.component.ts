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
			path: '/assets/photo-1494391727071-33d8df6f13cf.jpg',
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

	onImgChange(index: number) {
		console.log(index);
	}
}
