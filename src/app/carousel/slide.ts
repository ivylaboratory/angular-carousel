import {Properties as CarouselProperties} from './interfaces';

export interface Properties {
    carouselProperties: CarouselProperties;
}

export class Slide {
    slideLength: number;
    isSlideInProgress: boolean;
    direction: 'left' | 'right';
    counter: number = 0;
    _counter: number = 0;
    distance;
    distanceAbs;
    visibleWidth: number;
    isNotClickOnArrow: boolean;
    initialPositionX: number = 0;
    currentPositionX: number = 0;

    /* The slide length has been limited by the limitSlideLength() method */
    isSlideLengthLimited: boolean;

    get fullCellWidth() {
        return this.carouselProperties.cellWidth + this.carouselProperties.margin;
    }

    get margin() {
        return this.carouselProperties.margin;
    }

    get minSwipeDistance() {
        return this.carouselProperties.minSwipeDistance;
    }

    get visibleCellsCount() {
        return Math.ceil(this.visibleWidth / this.fullCellWidth);
    }

    get visibleCellsOverflowContainer() {
        return (this.visibleCellsCount * this.fullCellWidth - this.margin) > this.visibleWidth;
    }

    /* The position to which the container returns after each slide 
     * in the light DUM tree mode. 
     */
    get fixedContainerPosition() {
        return -(this.overflowCellsLimit * this.fullCellWidth);
    }

    get overflowCellsLimit() {
        return this.carouselProperties.overflowCellsLimit;
    }

    get images() {
        return this.carouselProperties.images;
    }

    get cellLength() {
        if (this.isLightDOM) {
            return this.cells.cellLengthInLightDOMMode;
        } else {
            if (this.images) {
                return this.images.length;
            } else {
                return this.cells.cellLength;
            }
        }
    }

    get isLightDOM() {
        return this.carouselProperties.lightDOM || this.carouselProperties.loop;
    }

    constructor(private carouselProperties: CarouselProperties,
        private utils,
        private cells,
        private container) {

        this.init();
    }

    init() {
        this.visibleWidth = this.carouselProperties.visibleWidth || this.carouselProperties.hostElement.clientWidth;
    }

    handleTouchstart(event) {
        /* Touchstart event is not called for arrow */
        this.isNotClickOnArrow = true;
        this.isSlideLengthLimited = undefined;

        if (!this.isSlideInProgress) {
            this.initialPositionX = this.container.getCurrentPositionX();
        }
    }

    handleTouchend(event) {
        if (!this.isNotClickOnArrow) {
            return;
        }
        this.currentPositionX = this.container.getCurrentPositionX();
        this.distanceAbs = Math.abs(this.initialPositionX - this.currentPositionX);
        this.distance = this.initialPositionX - this.currentPositionX;
        this.direction = this.getDirection();
        this.isNotClickOnArrow = undefined;
        this.handleSlide();
    }

    handleTransitionend() {
        this.setCounter();
        this.isSlideInProgress = false;

        if (this.isLightDOM) {
            this.alignContainerFast();
        }
    }

    detectClickOnArrow(event) {
        return event.target.classList.contains("carousel-arrow");
    }

    handleSlide(customSlideLength: number = undefined) {
        let isUsingButton = customSlideLength;
        let newPositionX;

        if (isUsingButton && this.isSlideInProgress || !this.direction) {
            return;
        }

        /* Custom slide length is used in arrows */
        if (customSlideLength) {
            this.slideLength = this.limitSlideLength(customSlideLength);

            if (!this.isSlideInProgress) {
                this.initialPositionX = this.container.getCurrentPositionX();
            }
        } else {
            this.slideLength = this.getSlideLength(this.distanceAbs);
        }

        /* Store intermediate counter value */
        this._counter = this.getPreliminaryCounter();

        if (this.direction === 'left') {
            if (!customSlideLength) {
                this.slideLength = this.limitSlideLength(this.getSlideLength(this.distanceAbs));
            }

            this._counter = this.getPreliminaryCounter();
            let isSlidesEnd = this.isSlidesEnd(this._counter);
            newPositionX = this.getPositionByIndex(this._counter);

            if (isSlidesEnd) {
                this._counter = this.counter;

                newPositionX = this.getPositionByIndex(this.counter);
                this.slideLength = 0;
            }
        }

        if (this.direction === 'right') {
            if (!customSlideLength) {
                this.slideLength = this.getSlideLength(this.distanceAbs);
            }

            if (this._counter < 0) {
                this._counter = this.counter;
                this.slideLength = this.counter;
            }

            newPositionX = this.getPositionByIndex(this.counter - this.slideLength);
        }

        if (this.container.getCurrentPositionX() !== newPositionX) {
            this.isSlideInProgress = true;
            this.container.transformPositionX(newPositionX);
        }
    }

    next(length: number = 1) {
        this.direction = 'left';
        this.handleSlide(length);
    }

    prev(length: number = 1) {
        this.direction = 'right';
        this.handleSlide(length);
    }

    select(index: number) {
        if (index > this.cellLength - 1) {
            return;
        }

        if (index > this.counter) {
            let length = index - this.counter;
            this.next(length);
        }

        if (index < this.counter) {
            let length = this.counter - index;
            this.prev(length);
        }
    }

    getPreliminaryCounter() {
        if (this.direction === 'left') {
            return this.counter + this.slideLength;
        }

        if (this.direction === 'right') {
            return this.counter - this.slideLength;
        }
    }

    /*  
     * Limits the length of the slide during calls to the next() and prev() 
     * methods if the specified position is outside the cell length 
     */
    limitSlideLength(slideLength: number) {
        if (slideLength > 1) {
            for (var i = 0; i < slideLength; i++) {
                let newCounter = this.counter + (slideLength - i);

                if (!this.isSlidesEnd(newCounter)) {
                    slideLength = slideLength - i;
                    this.isSlideLengthLimited = i > 0;
                    break;
                }
            }
        }
        return slideLength;
    }

    /* Offset the container to show the last cell completely */
    getPositionCorrection(counter) {
        let correction = 0;
        let isLastSlide = this.isLastSlide(counter);

        if (this.carouselProperties.loop || this.direction === "right") {
            return 0;
        }

        if (this.isSlideLengthLimited || isLastSlide) {
            let cellsWidth = this.cells.cellLengthInLightDOMMode * this.fullCellWidth;

            if (this.visibleWidth < cellsWidth) {
                correction = -(this.visibleCellsCount * this.fullCellWidth - this.visibleWidth - this.margin);
            }

            if (correction >= -this.margin) {
                correction = 0;
            }
        }

        return correction;
    }

    getSlideLength(distanceAbs) {
        let isLastSlide = this.isLastSlide(this.counter);

        /* If the last cell does not fit entirely, then the 
         * length of the swipe to the left, from the extreme 
         * right position, may be shorter than usual. 
         */
        if (isLastSlide && this.direction === "right") {
            distanceAbs = distanceAbs + this.visibleWidth % this.fullCellWidth;
        }

        let length = Math.floor(distanceAbs / this.fullCellWidth);

        if (distanceAbs % this.fullCellWidth >= this.minSwipeDistance) {
            length++;
        }

        return length;
    }

    getDistanceAbs() {
        return Math.abs(this.initialPositionX - this.currentPositionX);
    }

    getDirection() {
        const direction = Math.sign(this.initialPositionX - this.currentPositionX);

        if (direction === -1) {
            return 'right';
        }
        if (direction === 1) {
            return 'left';
        }
    }

    isSlidesEnd(counter: number) {
        let margin = this.visibleCellsOverflowContainer ? 1 : 0;
        let imageLength = this.images ? this.images.length : this.cells.cellLength;

        if (this.carouselProperties.loop) {
            return false;
        } else {
            return (imageLength - counter + margin) < this.visibleCellsCount;
        }
    }

    isLastSlide(counter: number) {
        return this.isSlidesEnd(counter + 1)
    }

    setCounter() {
        if (this.direction === 'left') {
            this.counter = this.counter + this.slideLength;
        }

        if (this.direction === 'right') {
            this.counter = this.counter - this.slideLength;
        }
    }

    getPositionByIndex(_counter) {
        let correction = this.getPositionCorrection(this.counter + this.slideLength);
        let position;

        if (correction !== 0) {
            correction = correction + this.fullCellWidth
        }

        if (this.direction === 'right') {
            correction = 0;
        }

        if (this.isLightDOM && this.isLightDOMMode(_counter) ||
            this.isLightDOM && this.ifLeftDOMModeAtEnd(_counter)) {

            let initialPosition = this.getPositionWithoutCorrection(this.initialPositionX);
            let counterDifference = _counter - this.counter;
            position = initialPosition - ((counterDifference * this.fullCellWidth) - correction);
        } else {
            position = -((_counter * this.fullCellWidth) - correction);
        }

        position = this.provideSafePosition(position);

        return position;
    }

    provideSafePosition(position) {
        const endPosition = this.container.getEndPosition();

        if (this.direction === 'left') {
            if (position > 0) {
                position = 0;
            }
        }

        if (this.direction === 'right') {
            if (position < endPosition) {
                position = endPosition;
            }
        }

        return position;
    }

    getPositionWithoutCorrection(value) {
        let remainder = value % this.fullCellWidth;

        if (remainder !== 0) {
            return value - (this.fullCellWidth + remainder);
        } else {
            return value;
        }
    }

    isNextArrowDisabled() {
        return this.isLastSlide(this.counter);
    }

    isPrevArrowDisabled() {
        return this.counter === 0;
    }

    alignContainerFast() {
        if (this.isLightDOMMode(this.counter)) {
            let positionX = this.fixedContainerPosition;
            this.container.transformPositionX(positionX, 0);

            this.cells.setCounter(this.counter);
            this.cells.lineUp();
        } else if (this.ifLeftDOMModeToBeginning(this.counter)) {
            /* If we have already exited the light DOM mode but 
             * the cells are still out of place 
             */
            if (this.cells.ifSequenceOfCellsIsChanged()) {
                let positionX = -(this.counter * this.fullCellWidth);
                this.container.transformPositionX(positionX, 0);

                this.cells.setCounter(this.counter);
                this.cells.lineUp();
            }
        } else if (this.ifLeftDOMModeAtEnd(this.counter)) {
            let containerPositionX = this.container.getCurrentPositionX();
            let containerWidth = this.container.getWidth();
            this.visibleWidth;

            if (this.isLastSlide(this.counter) &&
                containerWidth + containerPositionX >= this.visibleWidth) {
                return;
            }

            let correction = this.getPositionCorrection(this.counter);

            if (correction !== 0) {
                correction = correction + this.fullCellWidth
            }

            if (this.direction === 'right') {
                correction = 0;
            }

            let positionX = this.fixedContainerPosition + correction;

            this.container.transformPositionX(positionX, 0);
            this.cells.setCounter(this.counter);
            this.cells.lineUp();
        }
    }

    isLightDOMMode(counter) {
        let flag;
        let remainderOfCells = this.images.length - this.overflowCellsLimit - this.visibleCellsCount;

        if (!this.isLightDOM) {
            return false;
        }

        if (counter > this.overflowCellsLimit && this.direction === "left" &&
            counter <= remainderOfCells) {
            flag = true;
        }

        if (counter >= this.overflowCellsLimit && this.direction === "right" &&
            counter < remainderOfCells) {
            flag = true;
        }

        if (this.counter > this.overflowCellsLimit && this.direction === "left" &&
            this.counter <= remainderOfCells) {
            flag = true;
        }

        if (this.counter >= this.overflowCellsLimit && this.direction === "right" &&
            this.counter < remainderOfCells) {
            flag = true;
        }

        return flag;
    }

    ifLeftDOMModeAtEnd(counter) {
        let flag;
        let remainderOfCells = this.images.length - this.overflowCellsLimit - this.visibleCellsCount;

        if (counter >= remainderOfCells) {
            flag = true;
        }

        if (this.counter >= remainderOfCells) {
            flag = true;
        }

        return flag;
    }

    ifLeftDOMModeToBeginning(counter) {
        let flag;

        if (counter <= this.overflowCellsLimit) {
            flag = true;
        }

        if (this.counter <= this.overflowCellsLimit) {
            flag = true;
        }

        return flag;
    }
}