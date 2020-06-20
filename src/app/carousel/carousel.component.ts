import {ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, OnDestroy, SimpleChanges} from '@angular/core';

import {Images} from './interfaces';
import {Touches} from './touches';
import {Carousel} from './carousel';
import { Subject } from 'rxjs';


@Component({
    selector: 'carousel, [carousel]',
    exportAs: 'carousel',
	templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.sass']
})

export class CarouselComponent implements OnDestroy {
    
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
    slideCounterChange$: Subject<number> = new Subject();

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
        return this.carousel.slideCounter + 1 + this.counterSeparator + this.images.length;
    }

    @Input()
    set images(images: Images & any) {
        this._images = images;
    }
    get images(){
        return this._images;
    }

    get isNgContent(){
        return this.elementRef.nativeElement.querySelector('.carousel-content-wrapper').children.length > 0;
    }

    @Output() events: EventEmitter<any> = new EventEmitter<any>();
    @Output() slideCounterChange: EventEmitter<number> = new EventEmitter<number>();
    @Input() height: number = 200;
    @Input() width: number;
    @Input() borderRadius: number;
    @Input() margin: number = 10;
    @Input() objectFit: 'contain' | 'cover' = 'cover';
    @Input() minSwipeDistance: number = 50;
    @Input() transitionDuration: number = 200;
    @Input() transitionTimingFunction: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' = 'ease';
    @Input() videoProperties: any;
    @Input() counterSeparator: string = " / ";
    @Input() overflowCellsLimit: number = 3;
    @Input() listeners: 'auto' | 'mouse and touch' = 'mouse and touch';

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
        return this._isCounter && this.images.length > 1;
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

    constructor(
        private elementRef: ElementRef, 
        private ref: ChangeDetectorRef){
    }

    ngOnInit(){
        this.touches = new Touches({
            element: this.elementRef.nativeElement.querySelector('.carousel-cells'),
            listeners: this.listeners
        });

        this.touches.on('touchstart', this.handleTouchstart);
        this.touches.on('horizontal-swipe', this.handleHorizontalSwipe);
        this.touches.on('touchend', this.handleTouchend);
        this.touches.on('mousedown', this.handleTouchstart);
        this.touches.on('mouseup', this.handleTouchend);
        this.touches.on('tap', this.handleTap);

        this.initCarousel();
        this.setDimensions();

        this.slideCounterChange$.subscribe(index => this.slideCounterChange.emit(index));
    }

    ngAfterViewInit() {
        this.carousel.lineUpCells();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.width || changes.height) {
            this.setDimensions();
            this.initCarousel();
            this.carousel.lineUpCells();
        }
    }

    ngOnDestroy() {
        this.touches.destroy();
        this.slideCounterChange$.complete();
    }

    initCarousel() {
        this.carousel = new Carousel({
            element: this.elementRef.nativeElement.querySelector('.carousel-cells'),
            container: this.elementRef.nativeElement,
            images: this.images,
            cellWidth: this.getCellWidth(),
            overflowCellsLimit: this.overflowCellsLimit,
            visibleWidth: this.width,
            margin: this.margin,
            minSwipeDistance: this.minSwipeDistance,
            transitionDuration: this.transitionDuration,
            transitionTimingFunction: this.transitionTimingFunction,
            videoProperties: this.videoProperties,
            slideCounterChange$: this.slideCounterChange$
        });
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
        event.preventDefault();
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
        this.carousel.handleTouchend(event);
        this.isMoving = false;
    }

    /* Tap */
    handleTap = (event: any) => {
        const i = this.carousel.slideCounter;
        const cellIndex = this.carousel.currentCellIndex;
        const fileIndex = this.carousel.getFileIndex(i);
        const file = this.carousel.getFile(cellIndex);
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

    getCellWidth(): number {
        if (this._cellWidth === '100%') {
            return this.elementRef.nativeElement.clientWidth;
        } else {
            return this._cellWidth;
        }
    }

    next() {
        this.carousel.next(1);
    }

    prev() {
        this.carousel.prev(1);
    }

    isNextArrowDisabled() {
        return this.carousel.isNextArrowDisabled();
    }

    isPrevArrowDisabled() {
        return this.carousel.isPrevArrowDisabled();
    }
}