import {ContextPathFunc} from '../generic-types'

export interface BasicOptions<Context> {
	/**
	 * Return true when the button(s) should be hidden and not to be called
	 */
	readonly hide?: ContextPathFunc<Context, boolean>;
}

export interface SingleButtonOptions<Context> extends BasicOptions<Context> {
	/**
	 * Decide whether the button should be in the last added row or in a new row. Own row per default, last row when true.
	 */
	readonly joinLastRow?: boolean;
}
