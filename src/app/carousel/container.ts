import {Properties as CarouselProperties} from './interfaces';

export class Container {
    /* The index of the new position relative to 
     * the active index, for example -1 or +1 
     */
    newPositionIndex: number = 0;
    isPositionCorrection: boolean;
    initialPositionX: number = 0;
    initialElementPositionX: number = 0;
    isLocked: boolean = true;
    pullLimit = 100;
    startTime;
    startX: number;
    moveX: number;
    isSwipeInProgress: boolean;

    get visibleWidth() {
        return this.utils.visibleWidth;
    }

    get overflowCellsLimit() {
        return this.utils.overflowCellsLimit;
    }

    get images() {
        return this.carouselProperties.images;
    }

    get element() {
        return this.carouselProperties.cellsElement;
    }

    get freeScroll() {
        return this.carouselProperties.freeScroll;
    }

    get fullCellWidth() {
        return this.carouselProperties.cellWidth + this.carouselProperties.margin;
    }

    get visibleCellsCount() {
        return Math.ceil(this.visibleWidth / this.fullCellWidth);
    }

    get transitionDuration() {
        return this.carouselProperties.transitionDuration;
    }

    get transitionTimingFunction() {
        return this.carouselProperties.transitionTimingFunction;
    }

    get cellLength() {
        if (this.images) {
            return this.images.length;
        } else {
            return this.cells.cellLength;
        }
    }

    get cellLengthInLightDOMMode() {
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

    get tooFewCells() {
        return this.visibleCellsCount > this.cellLength;
    }

    get disabled() {
        return this.tooFewCells;
    }

    get margin() {
        return this.carouselProperties.margin;
    }

    get isLightDOM() {
        return this.carouselProperties.lightDOM || this.carouselProperties.loop;
    }

    constructor(private carouselProperties: CarouselProperties,
        private utils,
        private cells) {

        this.init()
    }

    init() {
        this.setWidth();
    }

    handleTouchstart() {
        this.startX = this.utils.getStartX(event);
        this.startTime = new Date().getTime();
        this.initialElementPositionX = this.getInitialElementPositionX();
    }

    handleHorizontalSwipe() {
        if (this.disabled) {
            return;
        }

        if (!this.isSwipeInProgress) {
            this.startX = this.utils.getStartX(event);
            this.startTime = new Date().getTime();
            this.initialElementPositionX = this.getInitialElementPositionX();
        }

        this.isSwipeInProgress = true;
        this.moveX = this.utils.getMoveX(event);
        this.move();
    }

    handleTouchend(simpleProcessing: boolean = false) {
        if (this.disabled) {
            return;
        }

        /* If touchend was passed to the Slide class */
        if (simpleProcessing) {
            this.isSwipeInProgress = false;
            return;
        }

        this.isSwipeInProgress = false;
        this.finishMoving();
        this.clearInitialValues();
    }

    move() {
        let positionX = this.getMovePositionX();
        const isPulled = this.detectPulled();
        const direction = this.getDirection();

        if (isPulled) {
            if (isPulled.edge === "left" && direction === "right" ||
                isPulled.edge === "right" && direction === "left") {
                positionX = this.slowdownOnPull(positionX);
            }
        }

        this.transformPositionX(positionX, 0);

        if (this.freeScroll) {
            this.initialPositionX = positionX;
        }

        if (isPulled) {
            if (isPulled.edge === 'left' && isPulled.overflowX > this.pullLimit) {
                this.initialPositionX = 0;
            }
            if (isPulled.edge === 'right' && isPulled.overflowX > this.pullLimit) {
                this.initialPositionX = positionX;
            }
        }
    }

    getMovePositionX() {
        const distance = this.getDistance();
        return this.initialElementPositionX - distance;
    }

    getDistance() {
        return this.startX - this.moveX;
    }

    /* If the container is pulled out of the left or right border */
    detectPulled() {
        const currentPositionX = this.getCurrentPositionX();

        if (currentPositionX > 0) {
            return {
                edge: 'left',
                positionX: currentPositionX,
                overflowX: Math.abs(currentPositionX)
            }
        }

        if (currentPositionX < this.getEndPosition()) {
            return {
                edge: 'right',
                positionX: currentPositionX,
                overflowX: Math.abs(currentPositionX - this.getEndPosition())
            }
        }
    }

    slowdownOnPull(_positionX) {
        let distance = Math.abs(this.getDistance());
        const endPosition = this.getEndPosition();
        const isPulled = this.detectPulled();
        const decelerationRatio = 3 + isPulled.overflowX / 50;
        let positionX;

        if (isPulled.edge === 'left') {

            if (this.initialElementPositionX < 0) {
                distance = distance - Math.abs(this.initialElementPositionX);
            }

            const rubberPositionX = distance / decelerationRatio;
            positionX = rubberPositionX;

            if (this.initialElementPositionX > 0) {
                positionX = this.initialElementPositionX + rubberPositionX;
            }

            if (positionX > this.pullLimit) {
                positionX = this.pullLimit;
            }
        }

        if (isPulled.edge === 'right') {
            const rubberPositionX = endPosition + (((this.initialElementPositionX - distance) - endPosition) / decelerationRatio);
            const containerWidth = this.getWidth();

            positionX = rubberPositionX;

            if (this.initialElementPositionX < -(containerWidth - this.visibleWidth)) {
                positionX = ((containerWidth - this.visibleWidth) + this.initialElementPositionX) + rubberPositionX;
            }

            if (positionX < endPosition - this.pullLimit) {
                positionX = endPosition - this.pullLimit;
            }
        }

        return positionX;
    }

    finishMoving() {
        const positionX = this.getMovePositionX();
        let newPositionX;

        if (this.freeScroll) {
            newPositionX = this.getInertia();
        }

        /* Align container while pulling */
        newPositionX = this.getAlignedPositionOnPull(newPositionX);

        this.transformPositionX(newPositionX);
        this.setInitialPosition(positionX);
    }

    /* Returns the new position of the container with inertia */
    getInertia() {
        const distance = this.getDistance();
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.startTime;
        let inertia = (distance / tapLength) * 100;

        return this.initialPositionX - inertia;
    }

    getAlignedPositionOnPull(newPositionX) {
        const direction = this.getDirection();

        if (direction === 'left') {
            let endPosition = this.getEndPosition();
            if (newPositionX < endPosition) {
                return endPosition;
            }
        }
        if (direction === 'right') {
            if (newPositionX > 0) {
                return 0;
            }
        }

        return newPositionX;
    }

    getCurrentPositionX() {
        const parentPosition = this.element.parentElement.getBoundingClientRect();
        const position = this.element.getBoundingClientRect();
        return position.left - parentPosition.left;
    }

    getEndPosition() {
        if (this.isLightDOM) {
            let imagesInContainer = this.cells.imageUtils.getImages();
            return -(imagesInContainer.length * this.fullCellWidth - this.visibleWidth - this.margin);
        } else {
            const width = this.getWidth();
            const visibleWidth = this.element.parentElement.clientWidth;
            return visibleWidth - width;
        }
    }

    transformPositionX(value, duration = this.transitionDuration) {
        if (value === undefined) {
            return;
        }

        this.element.style.transition = 'transform ' + duration + 'ms ' + this.transitionTimingFunction;
        this.element.style.transform = 'translateX(' + value + 'px)';
    }

    getWidth() {
        let width = this.cellLengthInLightDOMMode * this.fullCellWidth;
        let totalImageWidth = this.cellLength * this.fullCellWidth;

        if (totalImageWidth < width) {
            width = totalImageWidth;
        }

        return this.isLightDOM ? width : totalImageWidth;
    }

    setWidth() {
        const width = this.getWidth();
        this.element.style.width = width + "px";
    }

    setInitialPosition(position) {
        this.initialPositionX = position;
    }

    getElementPosition() {
        return this.element.getBoundingClientRect();
    }

    getInitialElementPositionX() {
        const carouselElementPosition = this.utils.getCarouselElementPosition()['left'];
        return this.getElementPosition()['left'] - carouselElementPosition;
    }

    clearInitialValues() {
        this.startX = this.moveX = undefined;
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
}