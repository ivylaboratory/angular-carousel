import {Properties as CarouselProperties} from './interfaces';

export class Utils {

    get images() {
        return this.carouselProperties.images;
    }

    get margin() {
        return this.carouselProperties.margin;
    }

    get overflowCellsLimit() {
        if (this.images && this.isImagesLessCellLimit) {
            let overflowCellsLimit = Math.floor((this.images.length - this.numberOfVisibleCells) / 2);

            if (overflowCellsLimit < 0) {
                overflowCellsLimit = 0;
            }
            
            return overflowCellsLimit;
        } else {
            return this.carouselProperties.overflowCellsLimit;
        }
    }

    get isImagesLessCellLimit() {
        return this.carouselProperties.overflowCellsLimit * 2 + this.numberOfVisibleCells > this.images.length;
    }

    get numberOfVisibleCells() {
        return Math.ceil(this.visibleWidth / this.fullCellWidth);
    }

    get visibleCellsOverflowContainer() {
        return (this.numberOfVisibleCells * this.fullCellWidth - this.margin) > this.visibleWidth;
    }

    get fullCellWidth() {
        return this.carouselProperties.cellWidth + this.carouselProperties.margin;
    }

    get visibleWidth() {
        return this.carouselProperties.visibleWidth || this.carouselProperties.cellsElement.parentElement.clientWidth;
    }

    constructor(private carouselProperties: CarouselProperties) {

    }

    updateProperties(carouselProperties: CarouselProperties) {
        this.carouselProperties = carouselProperties;
    }

    getStartX(event: any) {
        const touches = event.touches;
        const carouselElementPosition = this.getCarouselElementPosition()['left'];
        let startX;

        if (touches) {
            startX = touches[0].clientX - carouselElementPosition;
        } else {
            startX = event.clientX - carouselElementPosition;
        }

        return startX;
    }

    getMoveX(event: any) {
        const touches = event.touches;
        const carouselElementPositionX = this.getCarouselElementPosition()['left'];

        if (touches) {
            return touches[0].clientX - carouselElementPositionX;
        } else {
            return event.clientX - carouselElementPositionX;
        }
    }

    getCarouselElementPosition() {
        return this.carouselProperties.hostElement.getBoundingClientRect();
    }
}