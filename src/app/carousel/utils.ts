import {Properties as CarouselProperties} from './interfaces';

export class Utils {

    get images() {
        return this.carouselProperties.images;
    }

    get overflowCellsLimit() {
        if (this.images && this.isImagesLessCellLimit) {
            return Math.floor((this.images.length - this.visibleCellsCount) / 2);
        } else {
            return this.carouselProperties.overflowCellsLimit;
        }
    }

    get isImagesLessCellLimit() {
        return this.carouselProperties.overflowCellsLimit * 2 + this.visibleCellsCount > this.images.length;
    }

    get visibleCellsCount() {
        return Math.ceil(this.visibleWidth / this.fullCellWidth);
    }

    get fullCellWidth() {
        return this.carouselProperties.cellWidth + this.carouselProperties.margin;
    }

    get visibleWidth() {
        return this.carouselProperties.visibleWidth || this.carouselProperties.cellsElement.parentElement.clientWidth;
    }

    constructor(private carouselProperties: CarouselProperties) {

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