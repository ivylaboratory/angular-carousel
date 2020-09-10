import {ChangeDetectorRef, Component, ElementRef, ViewChild, EventEmitter, HostBinding, HostListener, Input, Output, OnDestroy, SimpleChanges} from '@angular/core';

import {Images} from './interfaces';
import {Touches} from './touches';
import {Carousel} from './carousel';


@Component({
	selector: 'carousel, [carousel]',
    exportAs: 'carousel',
	templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.sass']
})

export class CarouselComponent implements OnDestroy {

    get isContainerLocked() {
        return this.carousel.isContainerLocked;
    }
    get slideCounter() {
        return this.carousel.slideCounter;
    }
    get previousSlideCounter() {
        return this.carousel.previousSlideCounter;
    }
    get lapCounter() {
        return this.carousel.lapCounter;
    }

    lineUpCells() {
        this.carousel.lineUpCells();
    }

    quicklyPositionContainer() {
        this.carousel.quicklyPositionContainer();
    }
    
    _id: string;
    _images: Images;
    touches: any;
    carousel: any;
    landscapeMode: any;
    minTimeout = 30;
    isVideoPlaying: boolean;
    _isCounter: boolean;
    _width: number;
    _cellWidth: number | '100%' = 200;
    isMoving: boolean;
    isNgContent: boolean;
    cellLength: number;
    dotsArr:any;

    get isLandscape(){
        return window.innerWidth > window.innerHeight;
    }

    get isSafari(): any {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('safari') !== -1) {
            return !(ua.indexOf('chrome') > -1);
        }
    }

    get counter() {
        let counter;

        if (this.loop) {
            counter = this.slideCounter % this.cellLength;
        } else {
            counter = this.slideCounter;
        }

        return counter + 1 + this.counterSeparator + this.cellLength;
    }

    get cellsElement() {
        return this.elementRef.nativeElement.querySelector('.carousel-cells');
    }

    @Input()
    set images(images: Images & any) {
        this._images = images;
    }
    get images(){
        return this._images;
    }

    @Output() events: EventEmitter<any> = new EventEmitter<any>();

    @Input() height: number = 200;
    @Input() width: number;
    @Input() loop: boolean = false;
    @Input() autoplay: boolean = false;
    @Input() autoplayInterval: number = 5000;
    @Input() pauseOnHover: boolean = true;
    @Input() dots: boolean = false;
    @Input() borderRadius: number;
    @Input() margin: number = 10;
    @Input() objectFit: 'contain' | 'cover' | 'none' = 'cover';
    @Input() minSwipeDistance: number = 10;
    @Input() transitionDuration: number = 200;
    @Input() transitionTimingFunction: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' = 'ease';
    @Input() videoProperties: any;
    @Input() counterSeparator: string = " / ";
    @Input() overflowCellsLimit: number = 3;
    @Input() listeners: 'auto' | 'mouse and touch' = 'mouse and touch';
    @Input() cellsToShow: number;
    @Input() cellsToScroll: number = 1;

    @Input('cellWidth') set cellWidth(value: number | '100%') {
        if (value){
            this._cellWidth = value;
        }
    }

    @Input('counter') set isCounter(value: boolean) {
        if (value){
            this._isCounter = value;
        }
    }
    get isCounter() {
        return this._isCounter && this.cellLength > 1;
    }

    get activeDotIndex() {
        return this.slideCounter % this.cellLength;
    }

    @Input() arrows: boolean = true;
    @Input() arrowsOutside: boolean;
    @Input() arrowsTheme: 'light' | 'dark' = 'light';

    get cellLimit() {
        if (this.carousel) {
            return this.carousel.cellLimit;
        }
    }

    @HostBinding('class.carousel') hostClassCarousel: boolean = true;
    @HostBinding('style.height') hostStyleHeight: string;
    @HostBinding('style.width') hostStyleWidth: string;

    @HostListener('window:resize', ['$event'])
    onWindowResize(event: any) {
        this.landscapeMode = this.isLandscape;
        this.ref.detectChanges();

        this.initCarousel();
        this.carousel.lineUpCells();
    }

    @HostListener('mousemove', ['$event'])
    onMousemove(event: MouseEvent) {
        if (this.autoplay && this.pauseOnHover) {
            this.carousel.stopAutoplay();
        }
    }

    @HostListener('mouseleave', ['$event'])
    onMouseleave(event: MouseEvent) {
        if (this.autoplay && this.pauseOnHover) {
            this.carousel.autoplay();
        }
    }

    constructor(
        private elementRef: ElementRef, 
        private ref: ChangeDetectorRef){
    }

    ngOnInit(){
        this.isNgContent = this.cellsElement.children.length > 0;

        this.touches = new Touches({
            element: this.cellsElement,
            listeners: this.listeners,
            mouseListeners: {
                "mousedown": "handleMousedown",
                "mouseup": "handleMouseup"
            }
        });

        this.touches.on('touchstart', this.handleTouchstart);
        this.touches.on('horizontal-swipe', this.handleHorizontalSwipe);
        this.touches.on('touchend', this.handleTouchend);
        this.touches.on('mousedown', this.handleTouchstart);
        this.touches.on('mouseup', this.handleTouchend);

        this.initCarousel();
        this.setDimensions();

        if (this.autoplay) {
            this.carousel.autoplay();
        }
    }

    ngAfterViewInit() {
        this.cellLength = this.getCellLength();
        this.dotsArr = Array(this.cellLength).fill(1);
        this.ref.detectChanges();
        this.carousel.lineUpCells();

        /* Start detecting changes in the DOM tree */
        this.detectDomChanges();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.width || changes.height || changes.images) {
            this.setDimensions();
            this.initCarousel();
            this.carousel.lineUpCells();
            this.ref.detectChanges();
        }
    }

    ngOnDestroy() {
        this.touches.destroy();
        this.carousel.destroy();
    }

    initCarousel() {
        this.carousel = new Carousel({
            element: this.elementRef.nativeElement.querySelector('.carousel-cells'),
            container: this.elementRef.nativeElement,
            images: this.images,
            cellWidth: this.getCellWidth(),
            loop: this.loop,
            autoplayInterval: this.autoplayInterval,
            overflowCellsLimit: this.overflowCellsLimit,
            visibleWidth: this.width,
            margin: this.margin,
            minSwipeDistance: this.minSwipeDistance,
            transitionDuration: this.transitionDuration,
            transitionTimingFunction: this.transitionTimingFunction,
            videoProperties: this.videoProperties
        });
    }

    detectDomChanges() {
        const observer = new MutationObserver((mutations) => {
            this.onDomChanges();
        });

        var config = { 
            attributes: true, 
            childList: true, 
            characterData: true 
        };
        observer.observe(this.elementRef.nativeElement, config);
    }

    onDomChanges() {
        this.cellLength = this.getCellLength();
        this.carousel.lineUpCells();
        this.ref.detectChanges();
    }

    setDimensions() {
        this.hostStyleHeight = this.height + 'px';
        this.hostStyleWidth = this.width + 'px';
    }

    getFile(index) {
        return this.carousel.getFile(index);
    }

    /* Touchstart */
    handleTouchstart = (event: any) => {
        //event.preventDefault();
        this.touches.addEventListeners("mousemove", "handleMousemove");
        this.carousel.handleTouchstart(event);
        this.isMoving = true;
    }

    /* Touchmove */
    handleHorizontalSwipe = (event: any) => {
        event.preventDefault();
        this.carousel.handleHorizontalSwipe(event);
    }

    /* Touchend */
    handleTouchend = (event: any) => {
        const touches = event.touches;
        this.carousel.handleTouchend(event);
        this.touches.removeEventListeners("mousemove", "handleMousemove");
        this.isMoving = false;
    }

    handleTransitionendCellContainer(event) {
        this.carousel.handleSlideEnd();
    }

    toggleVideo(video) {
        event.preventDefault();
        if (this.videoProperties.noPlay) {
            return;
        }

        if (video.paused) {
            video.play();
            this.isVideoPlaying = true;
        } else {
            video.pause();
            this.isVideoPlaying = false;
        }

        this.ref.detectChanges();
    }

    getCurrentIndex() {
        return this.carousel.slideCounter;
    }

    getCellWidth() {
        let elementWidth = this.elementRef.nativeElement.clientWidth;

        if (this.cellsToShow) {
            let margin = this.cellsToShow > 1 ? this.margin : 0;
            let totalMargin = margin * (this.cellsToShow - 1);
            return (elementWidth - totalMargin) / this.cellsToShow;
        }

        if (this._cellWidth === '100%') {

            return elementWidth;
        } else {
            return this._cellWidth;
        }
    }

    next() {
        this.carousel.next(this.cellsToScroll);
        this.carousel.stopAutoplay();
    }

    prev() {
        this.carousel.prev(this.cellsToScroll);
        this.carousel.stopAutoplay();
    }

    select(index: number) {
        this.carousel.select(index);
    }

    isNextArrowDisabled() {
        return this.carousel.isNextArrowDisabled();
    }

    isPrevArrowDisabled() {
        return this.carousel.isPrevArrowDisabled();
    }

    getCellLength() {
        if (this.images) {
            return this.images.length;
        } else {
            return this.cellsElement.children.length;
        }
    }
}