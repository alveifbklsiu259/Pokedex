/// <reference types="react" />

// why does this work for images?
declare module "*.png" {
	const value: any;
	export = value;
}

declare module "*.svg" {
	const content: any;
	export default content;
}

declare module "*.gif" {
	const content: any;
	export default content;
}
// 1. how to define an empty array, say something can be an array of number or an empty array



interface TableColumn<T> {
    selector?: (row: T, rowIndex?: number | undefined) => React.JSX.Element
}
