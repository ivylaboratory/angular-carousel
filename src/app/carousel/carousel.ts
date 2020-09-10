export interface Properties {
    element: HTMLElement;
    container: HTMLElement;
    images: any;
    cellWidth: number;
    loop: boolean;
    autoplayInterval: number;
    overflowCellsLimit: number;
    visibleWidth: number;
    margin: number;
    minSwipeDistance: number;
    transitionDuration: number;
    transitionTimingFunction: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    videoProperties: any;
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

    /* The index of the new position relative to the active index, for example -1 or +1 */
    newContainerPositionIndex: number = 0;

    preliminarySlideCounter: number = 0;

    /* Scrolling Index (counter) */
    slideCounter: number = 0;

    previousSlideCounter: number = 0;
    isSlideInProgress: boolean;
    isMoveInProgress: boolean;
    isTouchstart: boolean;

    /* The slide length has been limited by the limitSlideLength() method */
    isSlideLengthLimited: boolean;

    isContainerPositionCorrection: boolean;
    containerInitialPositionX: number;
    isContentImages: boolean = true;
    visibleWidth: number;
    isLazyLoad: boolean = true;
    isContainerLocked: boolean = true;
    alignCells: "left" | "center" = "left";
    initialContainerPosition: number = 0;
    autoplayId: any;

    get cellLength() {
        if (this.images) {
            return this.images.length;
        } else {
            return this.cells.length;
        }
    }

    get totalContainerCellsCount() {
        if (this.images) {
            let cellLength = this.visibleCellsCount + this.overflowCellsLimit * 2;
            if (cellLength > this.images.length) {
                cellLength = this.images.length;
            }
            return cellLength;
        } else {
            return this.cellLength;
        }
    }

    get isFirstCell() {
        return this.slideCounter === 0;
    }

    get lastCellIndex() {
        return this.images.length ? (this.images.length - 1) : (this.cells.length - 1);
    }

    get overflowCellsLimit() {
        if (this.images && this.isImagesLessCellLimit) {
            return Math.floor((this.images.length - this.visibleCellsCount) / 2);
        } else {
            return this.properties.overflowCellsLimit;
        }
    }

    get isImagesLessCellLimit() {
        return this.properties.overflowCellsLimit * 2 + this.visibleCellsCount > this.images.length;
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
        this.startX = this.getStartX(event);
        this.containerInitialPositionX = this.getElementPosition()['left'] - this.getCarouselElementPosition()['left'];
        this.isMoveInProgress = true;
        this.stopTransformContainer();
    }

    stopTransformContainer() {
        this.transformPositionX(this.containerInitialPositionX, 0);
        this.setSlideCounter();
        this.isSlideInProgress = false;
        this.newContainerPositionIndex = 0;
        this.isSlideLengthLimited = undefined;
    }

    getStartX(event: any) {
        const touches = event.touches;
        let startX;

        if (touches) {
            startX = touches[0].clientX - this.getCarouselElementPosition()['left'];
        } else {
            startX = event.clientX - this.getCarouselElementPosition()['left'];
        }

        return startX;
    }

    handleHorizontalSwipe = (event: any) => {
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
        if (!this.isTouchstart) {
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

    /* Offset the container to show the last cell completely */
    getContainerPositionCorrection() {
        let correction = 0;

        if (this.properties.loop) {
            return 0;
        }

        if ((this.cellLength - this.preliminarySlideCounter) < this.visibleCellsCount || this.isSlideLengthLimited) {
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
        let containerWidth = this.totalContainerCellsCount * this.fullCellWidth;
        let totalImageWidth = this.cellLength * this.fullCellWidth;

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
        let counter = this.slideCounter;

        if (!this.isContainerLocked) {
            if (counter <= this.overflowCellsLimit) {
                return cellIndex;
            } else {
                let cellLimitOverflow = counter - this.overflowCellsLimit;
                imageIndex = positionIndex + cellLimitOverflow;

                if (this.images && this.properties.loop) {
                    imageIndex = imageIndex % this.images.length;
                }

                return imageIndex;
            }
        }

        if (this.alignCells === "left") {
            if (counter > this.overflowCellsLimit) {
                let cellLimitOverflow = counter - this.overflowCellsLimit;
                imageIndex = positionIndex + cellLimitOverflow;
            } else {
                imageIndex = cellIndex;
            }
        }

        if (imageIndex > this.lastCellIndex && !this.properties.loop) {
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

    next(length: number = 1) {
        this.newContainerPositionIndex = 0;
        this.direction = 'left';
        this.handleSlide(length);
    }

    prev(length: number = 1) {
        this.newContainerPositionIndex = 0;
        this.direction = 'right';
        this.handleSlide(length);
    }

    select(index: number) {
        this.slideCounter = index;
        this.quicklyPositionContainer();
    }

    handleSlide(customSlideLength: number = undefined) {
        let isUsingButton = customSlideLength;

        if (isUsingButton && this.isSlideInProgress) {
            return;
        }

        this.slideLength = customSlideLength ? customSlideLength : this.limitSlideLength(this.getSlideLength());

        if (this.direction === 'left') {
            this.handleLeftSlide();
        }

        if (this.direction === 'right') {
            this.handleRightSlide();
        }

        this.alignContainer();
    }

    handleLeftSlide() {
        this.preliminarySlideCounter = this.slideCounter + this.slideLength;
        let isLastSlide = this.detectLastSlide(this.slideCounter + this.slideLength);

        if (!isLastSlide) {
            this.newContainerPositionIndex = this.newContainerPositionIndex - this.slideLength;
            this.isSlideInProgress = true;

            if (this.isLazyLoad) {
                this.isContainerLocked = this.preliminarySlideCounter > this.overflowCellsLimit;

                if (this.detectContainerUnlock()) {
                    this.isContainerLocked = false;
                }
            }
        } else {
            this.slideLength = 0;
        }
    }

    handleRightSlide() {
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
        } else {
            this.slideLength = 0;
        }
    }

    getSlideLength() {
        let correction = this.getContainerPositionCorrection();
        let length = Math.floor((this.distanceAbs + correction) / this.fullCellWidth);

        if (this.distanceAbs % this.fullCellWidth >= this.minSwipeDistance) {
            length++;
        }
        return length;
    }

    /*  
     * Limits the length of the slide during calls to the next() and prev() 
     * methods if the specified position is outside the cell length 
     */
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
        if (this.properties.loop) {
            return false;
        } else {
            return (this.cellLength - slideCounter) < this.visibleCellsCount;
        }
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
        return (this.cellLength - this.preliminarySlideCounter) < (this.visibleCellsCount + this.overflowCellsLimit);
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
            if (this.images || !this.images && this.properties.loop) {
                this.quicklyPositionContainer();
            }
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

            // notice
            (cell as HTMLElement).style.width = this.properties.cellWidth+'px';
        };
    }

    getCellPositionX(index) {
        let positionIndex = this.getPositionIndex(index);
        return positionIndex * this.fullCellWidth;
    }

    getPositionIndex(cellIndex) {
        let counter = this.slideCounter;
        let cellLength = this.totalContainerCellsCount;
        let slideCounter = counter - this.overflowCellsLimit;
        let positionIndex;

        if (slideCounter > cellLength) {
            slideCounter = slideCounter % cellLength;
        }

        if (slideCounter < 0) {
            return cellIndex;
        } else {
            positionIndex = cellIndex - slideCounter;
            if (positionIndex < 0) {
                positionIndex = cellLength + positionIndex;
            }
        }

        return positionIndex;
    }

    getCenterPositionIndex() {
        return (this.totalContainerCellsCount - 1) / 2;
    }

    autoplay() {
        this.autoplayId = setInterval(() => {
            this.next(); 
        }, this.properties.autoplayInterval);
    }

    stopAutoplay() {
        if (this.autoplayId) {
            clearInterval(this.autoplayId);
        }
    }

    destroy() {
        this.stopAutoplay();
    }
}