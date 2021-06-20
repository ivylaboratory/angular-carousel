import {Properties as CarouselProperties, Image} from './interfaces';

export interface Cell {
    index: number,
    positionX: number,
    img: {
        image: Image,
        imageIndex: number
    }
}

export class ImageUtils {
    cellStack: Cell[] = [];
    element:any;

    constructor(element: HTMLElement | undefined) {
        this.element = element;
    }

    getImages() {
        return this.cellStack.filter(this.filter);
    }

    filter(cell: Cell) {
        return cell.img !== undefined;
    }
}

export class Cells {
    cells: HTMLCollection | undefined;
    element!: HTMLElement;
    visibleWidth: number | undefined;
    counter: number = 0;
    imageUtils;

    get images() {
        return this.carouselProperties.images;
    }

    get cellLength() {
        return this.cells ? this.cells.length : 0;
    }

    get fullCellWidth() {
        return this.carouselProperties.cellWidth + this.carouselProperties.margin;
    }

    get cellLengthInLightDOMMode() {
        if (this.images) {
            let cellLength = this.numberOfVisibleCells + this.overflowCellsLimit * 2;

            if (cellLength > this.images.length) {
                cellLength = this.images.length;
            }
            return cellLength;
        } else {
            return this.cellLength;
        }
    }

    get numberOfVisibleCells() {
        return this.utils.numberOfVisibleCells;
    }

    get overflowCellsLimit() {
        return this.utils.overflowCellsLimit;
    }

    get isLightDOM() {
        return this.carouselProperties.lightDOM || this.carouselProperties.loop;
    }

    constructor(
        private carouselProperties: CarouselProperties,
        private utils: any) {

        this.imageUtils = new ImageUtils(this.element);
        this.init(carouselProperties);
    }

    updateProperties(carouselProperties: CarouselProperties) {
        this.carouselProperties = carouselProperties;
    }

    lineUp() {
        const cells = this.element ? this.element.children : [];
        this.imageUtils.cellStack = [];

        for (var i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let positionX = this.getCellPositionInContainer(i);
            (cell as HTMLElement).style.transform = 'translateX(' + positionX + 'px)';
            (cell as HTMLElement).style.width = this.carouselProperties.cellWidth + 'px';

            if (this.getImage(i)) {
                this.imageUtils.cellStack.push({
                    index: i,
                    positionX,
                    img: this.getImage(i)!['image']
                });
            }
        };
    }

    ifSequenceOfCellsIsChanged() {
        const cells:any = this.element.children;
        return cells[0]['style'].transform !== 'translateX(0px)';
    }

    getCellPositionInContainer(cellIndexInDOMTree: number) {
        let positionIndex = this.getCellIndexInContainer(cellIndexInDOMTree);
        return positionIndex * this.fullCellWidth;
    }

    getCellIndexInContainer(cellIndexInDOMTree: number) {
        let positionIndex;

        if (!this.isLightDOM) {
            return cellIndexInDOMTree;
        }

        let cellLength = this.cellLengthInLightDOMMode;
        let counter = this.counter - this.overflowCellsLimit;

        if (counter > cellLength) {
            counter = counter % cellLength;
        }

        if (counter < 0) {
            return cellIndexInDOMTree;
        } else {
            positionIndex = cellIndexInDOMTree - counter;
            if (positionIndex < 0) {
                positionIndex = cellLength + positionIndex;
            }
        }

        return positionIndex;
    }

    getImage(cellIndex: number) {
        if (!this.images) {
            return;
        }

        let imageIndex = this.getImageIndex(cellIndex);
        let file = this.images[imageIndex];

        if (file && !file.type) {
            file.type = 'image';
        }

        return {
            image: this.images[imageIndex],
            imageIndex
        };
    }

    getImageIndex(cellIndexInDOMTree: number) {
        const positionIndex = this.getCellIndexInContainer(cellIndexInDOMTree);
        let imageIndex;

        if (this.counter > this.overflowCellsLimit) {
            let cellLimitOverflow = this.counter - this.overflowCellsLimit;
            imageIndex = positionIndex + cellLimitOverflow;

            if (this.images && this.carouselProperties.loop) {
                imageIndex = imageIndex % this.images.length;
            }
        } else {
            imageIndex = cellIndexInDOMTree;
        }

        return imageIndex;
    }

    setCounter(value: number) {
        this.counter = value;
    }

    init(carouselProperties: CarouselProperties) {
        this.element = this.carouselProperties.cellsElement;
        this.cells = this.element.children;
        this.visibleWidth = this.carouselProperties.visibleWidth || this.element!.parentElement!.clientWidth;
    }
}