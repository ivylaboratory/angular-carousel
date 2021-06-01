import { Component, ViewChildren } from '@angular/core';

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

    imagesForSlider = [
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

    ngOnInit(){

    }

	handleCarouselEvents(event) {
		if (event.type === "click") {
			console.log(event);
		}
	}
}
