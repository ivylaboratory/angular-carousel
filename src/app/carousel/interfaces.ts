export interface Images {
    [index: number]: { 
    	path: string; 
    	width?: number; 
    	height?: number;
    	//type?: 'image' | 'video'
    };
}

export interface Image {
    path: string; 
    width?: number; 
    height?: number;
}