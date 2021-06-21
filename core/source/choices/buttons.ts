import {CallbackButtonTemplate} from '../keyboard'
import {ConstOrContextFunc} from '../generic-types'

import {createPaginationChoices} from '../buttons/pagination'
import {getButtonsOfPage, getButtonsAsRows, maximumButtonsPerPage} from '../buttons/align'

import {Choices, ManyChoicesOptions, ChoiceTextFunc} from './types'
import {getChoiceKeysFromChoices, getChoiceTextByKey, ensureCorrectChoiceKeys} from './understand-choices'

export function generateChoicesButtons<Context>(actionPrefix: string, isSubmenu: boolean, choices: ConstOrContextFunc<Context, Choices>, options: ManyChoicesOptions<Context>): (context: Context, path: string) => Promise<CallbackButtonTemplate[][]> {
	return async (context, path) => {
		if (await options.hide?.(context, path)) {
			return []
		}

		const choicesConstant = typeof choices === 'function' ? await choices(context) : choices
		const choiceKeys = getChoiceKeysFromChoices(choicesConstant)
		ensureCorrectChoiceKeys(actionPrefix, path, choiceKeys)
		const textFunction = createChoiceTextFunction(choicesConstant, options.buttonText)
		const currentPage = await options.getCurrentPage?.(context)
		const keysOfPage = getButtonsOfPage(choiceKeys, options.columns, options.maxRows, currentPage)
		const buttonsOfPage = await Promise.all(keysOfPage
			.map(async key => {
				const text = await textFunction(context, key)
				const relativePath = actionPrefix + ':' + key + (isSubmenu ? '/' : '')
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

export function generateChoicesPaginationButtons<Context>(actionPrefix: string, choiceKeys: number, currentPage: number | undefined, options: ManyChoicesOptions<Context>): CallbackButtonTemplate[] {
	const entriesPerPage = maximumButtonsPerPage(options.columns, options.maxRows)
	const totalPages = choiceKeys / entriesPerPage
	const pageRecord = createPaginationChoices(totalPages, currentPage)
	const pageKeys = Object.keys(pageRecord).map(o => Number(o))
	const pageButtons = pageKeys
		.map((page): CallbackButtonTemplate => ({
			relativePath: `${actionPrefix}P:${page}`,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			text: pageRecord[page]!
		}))

	return pageButtons
}

export function createChoiceTextFunction<Context>(choices: Choices, buttonText: undefined | ChoiceTextFunc<Context>): ChoiceTextFunc<Context> {
	if (buttonText) {
		return buttonText
	}

	return (_, key) => getChoiceTextByKey(choices, key)
}
