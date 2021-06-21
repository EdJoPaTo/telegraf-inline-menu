import {CallbackButtonTemplate} from '../keyboard'
import {ConstOrPromise, ConstOrContextFunc} from '../generic-types'
import {getChoiceKeysFromChoices, ensureCorrectChoiceKeys} from '../choices/understand-choices'
import {ManyChoicesOptions, Choices, createChoiceTextFunction, generateChoicesPaginationButtons} from '../choices'
import {prefixEmoji} from '../prefix'

import {getButtonsOfPage, getButtonsAsRows} from './align'

export type IsSetFunction<Context> = (context: Context, key: string) => ConstOrPromise<boolean>
export type SetFunction<Context> = (context: Context, key: string, newState: boolean) => ConstOrPromise<string | boolean>
export type FormatStateFunction<Context> = (context: Context, textResult: string, state: boolean, key: string) => ConstOrPromise<string>

export interface SelectOptions<Context> extends ManyChoicesOptions<Context> {
	/**
	 * Show an emoji for the choices currently false.
	 * This is helpful to show the user there can be selected multiple choices at the same time.
	 */
	readonly showFalseEmoji?: boolean;

	/**
	 * Function returning the current state of a given choice.
	 */
	readonly isSet: IsSetFunction<Context>;

	/**
	 * Function which is called when a user selects a choice.
	 * Arguments include the choice (`key`) and the new `state` which is helpful for multiple toggles.
	 */
	readonly set: SetFunction<Context>;

	/**
	 * Format the button text which is visible to the user.
	 */
	readonly formatState?: FormatStateFunction<Context>;
}

export function generateSelectButtons<Context>(actionPrefix: string, choices: ConstOrContextFunc<Context, Choices>, options: SelectOptions<Context>): (context: Context, path: string) => Promise<CallbackButtonTemplate[][]> {
	return async (context, path) => {
		if (await options.hide?.(context, path)) {
			return []
		}

		const choicesConstant = typeof choices === 'function' ? await choices(context) : choices
		const choiceKeys = getChoiceKeysFromChoices(choicesConstant)
		ensureCorrectChoiceKeys(actionPrefix, path, choiceKeys)
		const textFunction = createChoiceTextFunction(choicesConstant, options.buttonText)
		const formatFunction: FormatStateFunction<Context> = options.formatState ?? ((_, textResult, state) => prefixEmoji(textResult, state, {hideFalseEmoji: !options.showFalseEmoji}))
		const currentPage = await options.getCurrentPage?.(context)
		const keysOfPage = getButtonsOfPage(choiceKeys, options.columns, options.maxRows, currentPage)
		const buttonsOfPage = await Promise.all(keysOfPage
			.map(async key => {
				const textResult = await textFunction(context, key)
				const state = await options.isSet(context, key)
				const text = await formatFunction(context, textResult, state, key)

				const dropinLetter = state ? 'F' : 'T'
				const relativePath = actionPrefix + dropinLetter + ':' + key
				return {text, relativePath}
			})
		)
		const rows = getButtonsAsRows(buttonsOfPage, options.columns)

		if (options.setPage) {
			rows.push(generateChoicesPaginationButtons(actionPrefix, choiceKeys.length, currentPage, options))
		}

		return rows
	}
}
