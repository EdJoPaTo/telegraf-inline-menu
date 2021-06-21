import {ContextFunc, ConstOrPromise} from '../generic-types'

import {BasicOptions} from './basic'

export type SetPageFunction<Context> = (context: Context, page: number) => ConstOrPromise<void>
export type GetCurrentPageFunction<Context> = ContextFunc<Context, number | undefined>
export type GetTotalPagesFunction<Context> = ContextFunc<Context, number>

export interface GenericPaginationOptions<Context> {
	/**
	 * Function which is called when the user chooses a new page.
	 * This is used to store the user selection.
	 *
	 * @example
	 * setPage: (ctx, page) => {
	 *   ctx.session.page = page
	 * }
	 */
	readonly setPage: SetPageFunction<Context>;

	/**
	 * Function which returns the current page.
	 * This is used to get the last user selection from your store.
	 *
	 * Defaults to page 1 when undefined or not a finite number.
	 *
	 * @example
	 * getCurrentPage: ctx => ctx.session.page
	 */
	readonly getCurrentPage: GetCurrentPageFunction<Context>;
}

export interface PaginationOptions<Context> extends BasicOptions<Context>, GenericPaginationOptions<Context> {
	/**
	 * Returns the amount of pages which are available.
	 *
	 * @example
	 * getTotalPages: ctx => amountOfElements / ITEMS_PER_PAGE
	 */
	readonly getTotalPages: GetTotalPagesFunction<Context>;
}

/**
 * Creates Choices for the paginator
 * @param  totalPages  total amount of pages. Array.length is a good way to return this one.
 * @param  currentPage current page. Has to be between [1..totalPages]
 * @return returns the Choices
 */
export function createPaginationChoices(totalPages: number, currentPage: number | undefined): Record<number, string> {
	// Numbers have to be within
	// currentPage in [1..totalPages]
	const totalPagesFixed = Math.ceil(totalPages)
	const currentPageFinite = (typeof currentPage === 'number' && Number.isFinite(currentPage)) ? currentPage : 1
	const currentPageFixed = Math.max(1, Math.min(totalPagesFixed, Math.floor(currentPageFinite)))

	const buttons: Record<number, string> = {}
	if (!Number.isFinite(totalPagesFixed) || !Number.isFinite(currentPageFixed) || totalPagesFixed < 2) {
		return buttons
	}

	const before = currentPageFixed - 1
	const after = currentPageFixed + 1

	if (currentPageFixed > 1) {
		if (before > 1) {
			buttons[1] = '1 ⏪'
		}

		buttons[before] = `${before} ◀️`
	}

	buttons[currentPageFixed] = String(currentPageFixed)

	if (currentPageFixed < totalPagesFixed) {
		buttons[after] = `▶️ ${after}`

		if (after < totalPagesFixed) {
			buttons[totalPagesFixed] = `⏩ ${totalPagesFixed}`
		}
	}

	return buttons
}
