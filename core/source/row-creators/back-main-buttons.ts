import {CallbackButtonTemplate} from '../keyboard'
import {ConstOrContextPathFunc} from '../generic-types'

export function createBackMainMenuButtons<Context>(backButtonText: ConstOrContextPathFunc<Context, string> = '🔙back…', mainMenuButtonText: ConstOrContextPathFunc<Context, string> = '🔝main menu'): (context: Context, path: string) => Promise<CallbackButtonTemplate[][]> {
	return async (context, path) => {
		const hasMainMenu = mainMenuButtonText && path.startsWith('/')
		const parts = path.split('/').length
		const row: CallbackButtonTemplate[] = []

		if (parts >= (hasMainMenu ? 4 : 3)) {
			row.push({
				text: typeof backButtonText === 'function' ? await backButtonText(context, path) : backButtonText,
				relativePath: '..'
			})
		}

		if (hasMainMenu && parts >= 3) {
			row.push({
				text: typeof mainMenuButtonText === 'function' ? await mainMenuButtonText(context, path) : mainMenuButtonText,
				relativePath: '/'
			})
		}

		return [row]
	}
}
