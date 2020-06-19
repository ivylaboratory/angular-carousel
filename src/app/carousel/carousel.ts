import { Subject } from 'rxjs';

export interface Properties {
    element: HTMLElement;
    container: HTMLElement;
    images: any;
    cellWidth: number;
    overflowCellsLimit: number;
    visibleWidth: number;
    margin: number;
    minSwipeDistance: number;
    transitionDuration: number;
    transitionTimingFunction: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    videoProperties: any;
    slideCounterChange$: Subject<number>
}

export class Carousel {
    properties: Properties;
    element: HTMLElement;
    startX: number;
    moveX: number;
    direction: 'left' | 'right';
    slideLength: number;
    distanceAbs: number;
    initialPositionX: number = 0;
    cells: HTMLCollection;

    newContainerPositionIndex: number = 0; // The index of the new position relative to the active index, for example -1 or +1
    preliminarySlideCounter: number = 0;
    slideCounter: number = 0; // Scrolling Index (counter)
    previousSlideCounter: number = 0;

    isSlideInProgress: boolean;
    isMoveInProgress: boolean;
    isTransitionInProgress: boolean;
    isTouchstart: boolean;
    isSlideLengthLimited: boolean;
    isContainerPositionCorrection: boolean;

    containerInitialPositionX: number;
    isContentImages: boolean = true;
    visibleWidth: number;
    totalContainerCellsCount: number;
    isLazyLoad: boolean = true;
    isContainerLocked: boolean = false;
    alignCells: "left" | "center" = "left";
    initialContainerPosition: number = 0;

    get isFirstCell() {
        return this.slideCounter === 0;
    }

    get lastCellIndex() {
        return this.images.length ? (this.images.length - 1) : (this.cells.length - 1);
    }

    get overflowCellsLimit() {
        return this.properties.overflowCellsLimit;
    }

    get cellLimit() {
        return this.visibleCellsCount + this.overflowCellsLimit * 2;
    }

    get images() {
        return this.properties.images;
    }

    get margin() {
        return this.properties.margin;
    }

    get minSwipeDistance() {
        return this.properties.minSwipeDistance;
    }

    get transitionDuration() {
        return this.properties.transitionDuration;
    }

    get transitionTimingFunction() {
        return this.properties.transitionTimingFunction;
    }

    get fullCellWidth() {
        return this.properties.cellWidth + this.margin;
    }

    get visibleCellsCount() {
        return Math.ceil(this.visibleWidth / this.fullCellWidth);
    }

    get lapCounter() {
        return Math.floor(this.slideCounter / this.totalContainerCellsCount);
    }

    get visibleCellsOverflowContainer() {
        return (this.visibleCellsCount * this.fullCellWidth -this.margin) > this.visibleWidth;
    }

    constructor(properties: Properties) {
        this.element = properties.element;
        this.properties = properties;
        this.cells = this.element.children;
        this.visibleWidth = this.properties.visibleWidth || this.element.parentElement.clientWidth;

        this.setContainerWidth();
        this.alignContainer(0);
    }

    handleTouchstart = (event: any) => {
        this.isTouchstart = true;

        if (this.isSlideInProgress) {
            return;
        }

        const touches = event.touches;
        if (touches) {
            this.startX = touches[0].clientX - this.getCarouselElementPosition()['left'];
        } else {
            this.startX = event.clientX - this.getCarouselElementPosition()['left'];
        }
        this.containerInitialPositionX = this.getElementPosition()['left'] - this.getCarouselElementPosition()['left'];
        this.isMoveInProgress = true;
    }

    handleHorizontalSwipe = (event: any) => {
        if (this.isSlideInProgress) {
            return;
        }

        const touches = event.touches;
        if (touches) {
            this.moveX = touches[0].clientX - this.getCarouselElementPosition()['left'];
        } else {
            this.moveX = event.clientX - this.getCarouselElementPosition()['left'];
        }
        this.distanceAbs = this.getDistanceAbs();
        this.direction = this.getDirection();

        this.moveContainer();
    }

    handleTouchend = (event: any) => {
        if (this.isSlideInProgress || !this.isTouchstart) {
            this.isTouchstart = false;
            return;
        }

        this.isMoveInProgress = false;

        if (this.detectSlide()) {
            this.handleSlide();
        } else {
            this.newContainerPositionIndex = 0;
            this.alignContainer();
        }

        this.startX = this.moveX = this.distanceAbs = undefined;
        this.isTouchstart = false;
    }

    /* Move */
    moveContainer() {
        let positionX = this.getMovePositionX();
        this.transformPositionX(positionX, 0);
    }

    getMovePositionX() {
        const distance = this.getDistance();
        return this.containerInitialPositionX - distance;
    }

    /* Align */
    alignContainer(duration: number = this.transitionDuration) {
        let positionX = this.getContainerPosition();

        this.transformPositionX(positionX, duration);
        this.setInitialContainerPosition(positionX);
    }

    getContainerPosition() {
        let correction = this.getContainerPositionCorrection();

        this.isContainerPositionCorrection = correction != 0;
        return (this.initialContainerPosition + this.newContainerPositionIndex * this.fullCellWidth) + correction;
    }

    setInitialContainerPosition(position) {
        let correction = this.getContainerPositionCorrection();
        this.initialContainerPosition = position - correction;
    }

    getContainerPositionCorrection() {
        let correction = 0;

        if ((this.images.length - this.preliminarySlideCounter) < this.visibleCellsCount || this.isSlideLengthLimited) {
            if (this.visibleWidth < this.totalContainerCellsCount * this.fullCellWidth) {
                correction = - (this.visibleCellsCount * this.fullCellWidth - this.visibleWidth - this.margin);
            }

            if (correction >= - this.margin) {
                correction = 0;
            }
        }

        return correction;
    }

    /* Quickly center */
    quicklyPositionContainer() {
        let correction = this.getContainerPositionCorrection();
        const initialPosition = this.getNewContainerPosition() + correction;
        this.transformPositionX(initialPosition, 0);
        this.setInitialContainerPosition(initialPosition);
    }

    getNewContainerPosition() {
        if (this.slideCounter > this.overflowCellsLimit) {
            if (this.alignCells === "left") {
                this.lineUpCells();
                return -(this.overflowCellsLimit * this.fullCellWidth);
            }
        }

        if (this.slideCounter <= this.overflowCellsLimit) {
            if (this.previousSlideCounter > this.overflowCellsLimit) {
                this.lineUpCells();
            }
            return -(this.slideCounter * this.fullCellWidth);
        }
    }

    setContainerWidth() {
        const containerWidth = this.getContainerWidth();
        this.element.style.width = containerWidth + "px";
    }

    getContainerWidth() {
        this.totalContainerCellsCount = this.visibleCellsCount + this.overflowCellsLimit * 2;
        let containerWidth = this.totalContainerCellsCount * this.fullCellWidth;
        let totalImageWidth = this.images.length * this.fullCellWidth;

        if (totalImageWidth < containerWidth) {
            containerWidth = totalImageWidth;
        }

        return containerWidth;
    }

    getFile(cellIndex) {
        let imageIndex = this.getFileIndex(cellIndex); 
        let file = this.images[imageIndex];

        if (file && !file.type) {
            file.type = 'image';
        }

        return {
            image: this.images[imageIndex],
            imageIndex
        };
    }

    getFileIndex(cellIndex: number) {
        const positionIndex = this.getPositionIndex(cellIndex);
        const numberLeftCells = (this.totalContainerCellsCount - 1) / 2;
        let imageIndex;

        if (!this.isContainerLocked) {
            if (this.slideCounter <= this.overflowCellsLimit) {
                return cellIndex;
            } else {
                let cellLimitOverflow = this.slideCounter - this.overflowCellsLimit;
                imageIndex = positionIndex + cellLimitOverflow;
                return imageIndex;
            }
        }

        if (this.alignCells === "left") {
            if (this.slideCounter > this.overflowCellsLimit) {
                let cellLimitOverflow = this.slideCounter - this.overflowCellsLimit;
                imageIndex = positionIndex + cellLimitOverflow;
            } else {
                imageIndex = cellIndex;
            }
        }

        if (imageIndex > this.lastCellIndex) {
            return false;
        }

        return imageIndex;
    }

    transformPositionX(value, duration = this.transitionDuration) {
        this.element.style.transition = 'transform ' + duration + 'ms ' + this.transitionTimingFunction;
        this.element.style.transform = 'translateX(' + value + 'px)';
    }

    detectSlide() {
        return this.distanceAbs >= this.minSwipeDistance;
    }

    next() {
        if (this.isSlideInProgress) {
            return;
        }

        this.direction = 'left';
        this.handleSlide(1);
    }

    prev() {
        if (this.isSlideInProgress) {
            return;
        }

        this.direction = 'right';
        this.handleSlide(1);
    }

    handleSlide(slideLength: number = undefined): void {
        this.slideLength = this.getSlideLength();
        this.slideLength = slideLength ? slideLength : this.limitSlideLength(this.slideLength);

        if (this.direction === 'left' && !this.isSlideInProgress) {
            this.preliminarySlideCounter = this.slideCounter + this.slideLength;

            if (!this.detectLastSlide(this.slideCounter + this.slideLength)) {
                this.newContainerPositionIndex = this.newContainerPositionIndex - this.slideLength;
                this.isSlideInProgress = true;

                if (this.isLazyLoad) {
                    this.isContainerLocked = this.preliminarySlideCounter > this.overflowCellsLimit;

                    if (this.detectContainerUnlock()) {
                        this.isContainerLocked = false;
                    }
                }
            }
        }

        if (this.direction === 'right' && !this.isSlideInProgress) {
            if (this.slideCounter - this.slideLength < 0) {
                this.slideLength = this.slideCounter;
            }

            this.preliminarySlideCounter = this.slideCounter - this.slideLength;

            if (!this.isFirstCell) {
                this.newContainerPositionIndex = this.newContainerPositionIndex + this.slideLength;
                this.isSlideInProgress = true;

                if (this.isLazyLoad) {
                    if (this.preliminarySlideCounter > this.overflowCellsLimit) {
                        this.isContainerLocked = true;
                    } else {
                        this.isContainerLocked = false;
                    }

                    if (this.detectContainerUnlock()) {
                        this.isContainerLocked = false;
                    }
                }
            }
        }

        this.alignContainer();
    }

    getSlideLength() {
        let correction = this.getContainerPositionCorrection();
        let length = Math.floor((this.distanceAbs + correction) / this.fullCellWidth);

        if (this.distanceAbs % this.fullCellWidth >= this.minSwipeDistance) {
            length++;
        }
        return length;
    }

    limitSlideLength(slideLength: number) {
        if (slideLength > 1) {

            for (var i = 0; i < slideLength; i++) {
                let newSlideCounter = this.slideCounter + (slideLength - i);

                if (!this.detectLastSlide(newSlideCounter)) {
                    slideLength = slideLength - i;
                    this.isSlideLengthLimited = i > 0;
                    break;
                }
            }
        }
        return slideLength;
    }

    detectLastSlide(slideCounter: number) {
        return (this.images.length - slideCounter) < this.visibleCellsCount;
    }

    isNextArrowDisabled() {
        if (this.visibleCellsOverflowContainer) {
            return this.detectLastSlide(this.slideCounter + 1) && this.isContainerPositionCorrection;
        } else {
            return this.detectLastSlide(this.slideCounter + 1);
        }
    }

    isPrevArrowDisabled() {
        return this.slideCounter === 0;
    }

    detectContainerUnlock() {
        return (this.images.length - this.preliminarySlideCounter) < (this.visibleCellsCount + this.overflowCellsLimit);
    }

    handleSlideEnd() {
        if (this.isSlideInProgress) {
            this.transformSlideEnd();

            this.isSlideInProgress = false;
            this.newContainerPositionIndex = 0;
            this.isSlideLengthLimited = undefined;
        }
    }

    transformSlideEnd() {
        if (this.isLazyLoad) {
            this.setSlideCounter();
            this.quicklyPositionContainer();
        }

        this.previousSlideCounter = this.slideCounter;
    }

    setSlideCounter() {
        if (this.direction === 'left') {
            this.slideCounter = this.slideCounter + this.slideLength;
        }

        if (this.direction === 'right') {
            this.slideCounter = this.slideCounter - this.slideLength;
        }

        this.direction = undefined;
        this.slideLength = 0;
        this.properties.slideCounterChange$.next(this.slideCounter);
    }

    resetTransition() {
        this.element.style.transition = '';
    }

    getElementPosition() {
        return this.element.getBoundingClientRect();
    }

    getCarouselElementPosition() {
        return this.properties.container.getBoundingClientRect();
    }

    getDistance() {
        return this.startX - this.moveX;
    }

    getDistanceAbs() {
        return Math.abs(this.startX - this.moveX);
    }

    getDirection() {
        const direction = Math.sign(this.startX - this.moveX);

        if (direction === -1) {
            return 'right';
        }
        if (direction === 1) {
            return 'left';
        }
    }

    lineUpCells() {
        const cells = this.element.children;

        for (var i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let positionX = this.getCellPositionX(i);
            (cell as HTMLElement).style.transform = 'translateX(' + positionX + 'px)';
        };
    }

    getCellPositionX(index) {
        let positionIndex = this.getPositionIndex(index);
        return positionIndex * this.fullCellWidth;
    }

    getPositionIndex(cellIndex) {
        let slideCounter = this.slideCounter - this.overflowCellsLimit;
        let positionIndex;

        if (slideCounter > this.totalContainerCellsCount) {
            slideCounter = slideCounter % this.totalContainerCellsCount;
        }

        if (slideCounter < 0) {
            return cellIndex;
        } else {
            positionIndex = cellIndex - slideCounter;
            if (positionIndex < 0) {
                positionIndex = this.totalContainerCellsCount + positionIndex;
            }
        }

        return positionIndex;
    }

    get containerOverflowRightCount() {
        let totalOverflowCellsCount = this.images.length - this.totalContainerCellsCount;
        let overflowRight = 0;

        if (totalOverflowCellsCount > 0) {
            overflowRight = totalOverflowCellsCount - (this.previousSlideCounter - this.overflowCellsLimit);

            if (overflowRight > 0) {
                return overflowRight;
            }
        }

        return overflowRight;
    }

    getCenterPositionIndex() {
        return (this.totalContainerCellsCount - 1) / 2;
    }
}