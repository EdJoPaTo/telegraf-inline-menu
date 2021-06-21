import {CallbackButtonTemplate} from '../keyboard'
import {ContextPathFunc, ConstOrPromise, ConstOrContextPathFunc} from '../generic-types'
import {prefixEmoji} from '../prefix'

import {SingleButtonOptions} from './basic'

export type FormatStateFunction<Context> = (context: Context, text: string, state: boolean, path: string) => ConstOrPromise<string>

export interface ToggleOptions<Context> extends SingleButtonOptions<Context> {
	/**
	 * Function returning the current state.
	 */
	readonly isSet: ContextPathFunc<Context, boolean>;

	/**
	 * Function which is called when a user presses the button.
	 */
	readonly set: (context: Context, newState: boolean, path: string) => ConstOrPromise<string | boolean>;

	/**
	 * Format the button text which is visible to the user.
	 */
	readonly formatState?: FormatStateFunction<Context>;
}

export function generateToggleButton<Context>(text: ConstOrContextPathFunc<Context, string>, actionPrefix: string, options: ToggleOptions<Context>): ContextPathFunc<Context, CallbackButtonTemplate | undefined> {
	const formatFunction: FormatStateFunction<Context> = options.formatState ?? ((_, text, state) => prefixEmoji(text, state))
	return async (context, path) => {
		if (await options.hide?.(context, path)) {
			return undefined
		}

		const textResult = typeof text === 'function' ? await text(context, path) : text
		const state = await options.isSet(context, path)
		return {
			text: await formatFunction(context, textResult, state, path),
			relativePath: actionPrefix + ':' + (state ? 'false' : 'true')
		}
	}
}
