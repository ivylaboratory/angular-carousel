export interface Properties {
    element: HTMLElement;
    listeners?: 'auto' | 'mouse and touch';
    touchListeners?: any;
    mouseListeners?: any;
    otherListeners?: any;
    resize?: boolean;
}

export type EventType = undefined | 'touchend' | 'pan' | 'pinch' | 'horizontal-swipe' | 'vertical-swipe' | 'tap' | 'longtap';
export type TouchHandler = 'handleTouchstart' | 'handleTouchmove' | 'handleTouchend';
export type MouseHandler = 'handleMousedown' | 'handleMousemove' | 'handleMouseup';

export class Touches {
    properties: Properties;
    element: HTMLElement;
    elementPosition: ClientRect;
    eventType: EventType = undefined;
    handlers: any = {};
    startX = 0;
    startY = 0;
    lastTap = 0;
    doubleTapTimeout: any;
    doubleTapMinTimeout = 300;
    tapMinTimeout = 200;
    touchstartTime = 0;
    i: number = 0;
    isMousedown = false;

    _touchListeners: any = {
        "touchstart": "handleTouchstart",
        "touchmove": "handleTouchmove",
        "touchend": "handleTouchend"
    }
    _mouseListeners: any = {
        "mousedown": "handleMousedown",
        "mousemove": "handleMousemove",
        "mouseup": "handleMouseup",
        "wheel": "handleWheel"
    }
    _otherListeners: any = {
        "resize": "handleResize"
    }

    get touchListeners() {
        return this.properties.touchListeners ? this.properties.touchListeners : this._touchListeners;
    }

    get mouseListeners() {
        return this.properties.mouseListeners ? this.properties.mouseListeners : this._mouseListeners;
    }

    get otherListeners() {
        return this.properties.otherListeners ? this.properties.otherListeners : this._otherListeners;
    }

    constructor(properties: Properties) {
        this.properties = properties;
        this.element = this.properties.element;
        this.elementPosition = this.getElementPosition();

        this.toggleEventListeners('addEventListener');
    }

    destroy() {
        this.toggleEventListeners('removeEventListener');
    }

    toggleEventListeners(action: 'addEventListener' | 'removeEventListener') {
        let listeners;

        if (this.properties.listeners === 'mouse and touch') {
            listeners = Object.assign(this.touchListeners, this.mouseListeners);
        } else {
            listeners = this.detectTouchScreen() ? this.touchListeners : this.mouseListeners;
        }

        if (this.properties.resize) {
            listeners = Object.assign(listeners, this.otherListeners);
        }

        for (var listener in listeners) {
            const handler: MouseHandler = listeners[listener];

            // Window
            if (listener === "resize") {
                if (action === 'addEventListener') {
                    window.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    window.removeEventListener(listener, this[handler], false);
                }
            // Document
            } else if (listener === 'mouseup' || listener === "mousemove") {
                if (action === 'addEventListener') {
                    document.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    document.removeEventListener(listener, this[handler], false);
                }
            // Element
            } else {
                if (action === 'addEventListener') {
                    this.element.addEventListener(listener, this[handler], false);
                }
                if (action === 'removeEventListener') {
                    this.element.removeEventListener(listener, this[handler], false);
                }
            }
        }
    }

    addEventListeners(listener: string, handler: string) {
        window.addEventListener(listener, this[handler], false);
    }

    removeEventListeners(listener: string, handler: string) {
        window.removeEventListener(listener, this[handler], false);
    }

    /*
     * Listeners
     */

    /* Touchstart */

    handleTouchstart = (event: any) => {
        this.elementPosition = this.getElementPosition();
        this.touchstartTime = new Date().getTime();

        if (this.eventType === undefined) {
            this.getTouchstartPosition(event);
        }

        this.runHandler("touchstart", event);
    }


    /* Touchmove */

    handleTouchmove = (event: any) => {
        const touches = event.touches;

        // Pan
        if (this.detectPan(touches)) {
            this.runHandler("pan", event);
        }

        // Pinch
        if (this.detectPinch(event)) {
            this.runHandler("pinch", event);
        }

        // Linear swipe
        switch (this.detectLinearSwipe(event)) {
            case "horizontal-swipe":
                event.swipeType = "horizontal-swipe";
                this.runHandler("horizontal-swipe", event);
                break;
            case "vertical-swipe":
                event.swipeType = "vertical-swipe";
                this.runHandler("vertical-swipe", event);
                break;
        }

        // Linear swipe
        if (this.detectLinearSwipe(event) ||
            this.eventType === 'horizontal-swipe' ||
            this.eventType === 'vertical-swipe') {

            this.handleLinearSwipe(event);
        }
    }

    handleLinearSwipe(event: any) {
        //event.preventDefault();

        this.i++;

        if (this.i > 3) {
            this.eventType = this.getLinearSwipeType(event);
        }

        if (this.eventType === 'horizontal-swipe') {
            this.runHandler('horizontal-swipe', event);
        }

        if (this.eventType === 'vertical-swipe') {
            this.runHandler('vertical-swipe', event);
        }
    }


    /* Touchend */

    handleTouchend = (event: any) => {
        const touches = event.touches;

        // Double Tap
        if (this.detectDoubleTap()) {
            this.runHandler("double-tap", event);
        }

        // Tap
        this.detectTap();

        this.runHandler("touchend", event);
        this.eventType = 'touchend';

        if (touches && touches.length === 0) {
            this.eventType = undefined;
            this.i = 0;
        }
    }


    /* Mousedown */

    handleMousedown = (event: any) => {
        this.isMousedown = true;
        this.elementPosition = this.getElementPosition();
        this.touchstartTime = new Date().getTime();

        if (this.eventType === undefined) {
            this.getMousedownPosition(event);
        }

        this.runHandler("mousedown", event);
    }


    /* Mousemove */

    handleMousemove = (event: any) => {
        //event.preventDefault();
        
        if (!this.isMousedown) {
            return;
        }

        // Pan
        this.runHandler("pan", event);

        // Linear swipe
        switch (this.detectLinearSwipe(event)) {
            case "horizontal-swipe":
                event.swipeType = "horizontal-swipe";
                this.runHandler("horizontal-swipe", event);
                break;
            case "vertical-swipe":
                event.swipeType = "vertical-swipe";
                this.runHandler("vertical-swipe", event);
                break;
        }

        // Linear swipe
        if (this.detectLinearSwipe(event) ||
            this.eventType === 'horizontal-swipe' ||
            this.eventType === 'vertical-swipe') {

            this.handleLinearSwipe(event);
        }
    }


    /* Mouseup */

    handleMouseup = (event: any) => {

        // Tap
        this.detectTap();

        this.isMousedown = false;
        this.runHandler("mouseup", event);
        this.eventType = undefined;
        this.i = 0;
    }


    /* Wheel */

    handleWheel = (event: any) => {
        this.runHandler("wheel", event);
    }

    /* Resize */

    handleResize = (event: any) => {
        this.runHandler("resize", event);
    }

    runHandler(eventName: any, response: any) {
        if (this.handlers[eventName]) {
            this.handlers[eventName](response);
        }
    }


    /*
     * Detection
     */

    detectPan(touches: any) {
        return touches.length === 1 && !this.eventType || this.eventType === 'pan';
    }

    detectDoubleTap() {
        if (this.eventType != undefined) {
            return;
        }

        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;

        clearTimeout(this.doubleTapTimeout);

        if (tapLength < this.doubleTapMinTimeout && tapLength > 0) {
            return true;
        } else {
            this.doubleTapTimeout = setTimeout(() => {
                clearTimeout(this.doubleTapTimeout);
            }, this.doubleTapMinTimeout);
        }
        this.lastTap = currentTime;
    }

    detectTap(): void {
        if (this.eventType != undefined) {
            return;
        }

        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.touchstartTime;

        if (tapLength > 0) {
            if (tapLength < this.tapMinTimeout) {
                this.runHandler("tap", event);
            } else {
                this.runHandler("longtap", event);
            }
        }
    }

    detectPinch(event: any) {
        const touches = event.touches;
        return (touches.length === 2 && this.eventType === undefined) || this.eventType === 'pinch';
    }

    detectLinearSwipe(event: any) {
        const touches = event.touches;

        if (touches) {
            if (touches.length === 1 && !this.eventType || this.eventType === 'horizontal-swipe' || this.eventType === 'vertical-swipe') {
                return this.getLinearSwipeType(event);
            }
        } else {
            if (!this.eventType || this.eventType === 'horizontal-swipe' || this.eventType === 'vertical-swipe') {
                return this.getLinearSwipeType(event);
            }
        }
    }

    getLinearSwipeType(event: any) {
        if (this.eventType !== 'horizontal-swipe' && this.eventType !== 'vertical-swipe') {
            const movementX = Math.abs(this.moveLeft(0, event) - this.startX);
            const movementY = Math.abs(this.moveTop(0, event) - this.startY);

            if ((movementY * 3) > movementX) {
                return 'vertical-swipe';
            } else {
                return 'horizontal-swipe';
            }
        } else {
            return this.eventType;
        }
    }

    getElementPosition() {
        return this.element.getBoundingClientRect();
    }

    getTouchstartPosition(event: any) {
        this.startX = event.touches[0].clientX - this.elementPosition.left;
        this.startY = event.touches[0].clientY - this.elementPosition.top;
    }

    getMousedownPosition(event: any) {
        this.startX = event.clientX - this.elementPosition.left;
        this.startY = event.clientY - this.elementPosition.top;
    }

    moveLeft(index: any, event: any) {
        const touches = event.touches;

        if (touches) {
            return touches[index].clientX - this.elementPosition.left;
        } else {
            return event.clientX - this.elementPosition.left;
        }
    }

    moveTop(index: any, event: any) {
        const touches = event.touches;

        if (touches) {
            return touches[index].clientY - this.elementPosition.top;
        } else {
            return event.clientY - this.elementPosition.top;
        }
    }

    detectTouchScreen() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function(query: any) {
            return window.matchMedia(query).matches;
        }

        if (('ontouchstart' in window)) {
            return true;
        }

        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }


    /* Public properties and methods */
    on(event: EventType, handler: Function) {
        if (event) {
            this.handlers[event] = handler;
        }
    }
}