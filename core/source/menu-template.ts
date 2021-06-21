import {Body} from './body'
import {ButtonAction, ActionHive, ActionFunc} from './action-hive'
import {Choices, ChoicesRecord, generateChoicesButtons, combineHideAndChoices} from './choices'
import {ChooseOptions} from './buttons/choose'
import {ContextFunc, ContextPathFunc, ConstOrContextFunc, ConstOrContextPathFunc, RegExpLike} from './generic-types'
import {ensureTriggerChild} from './path'
import {Keyboard, ButtonTemplate, CallbackButtonTemplate, ButtonTemplateRow, InlineKeyboard} from './keyboard'
import {MenuLike, Submenu} from './menu-like'
import {PaginationOptions, createPaginationChoices, SetPageFunction} from './buttons/pagination'
import {SelectOptions, generateSelectButtons} from './buttons/select'
import {SingleButtonOptions} from './buttons/basic'
import {SubmenuOptions, ChooseIntoSubmenuOptions} from './buttons/submenu'
import {ToggleOptions, generateToggleButton} from './buttons/toggle'

export interface InteractionOptions<Context> extends SingleButtonOptions<Context> {
	/**
	 * Function which is called when the button is pressed
	 */
	readonly do: ActionFunc<Context>;
}

export class MenuTemplate<Context> {
	private readonly _body: ContextPathFunc<Context, Body>
	private readonly _keyboard: Keyboard<Context> = new Keyboard()
	private readonly _actions: ActionHive<Context> = new ActionHive()
	private readonly _submenus: Set<Submenu<Context>> = new Set()

	constructor(
		body: ConstOrContextPathFunc<Context, Body>
	) {
		this._body = typeof body === 'function' ? body : () => body
	}

	/**
	 * Creates the message body. Usage only recommended for advanced usage of this library.
	 * @param context Context to be supplied to the buttons on on creation
	 */
	async renderBody(context: Context, path: string): Promise<Body> {
		return this._body(context, path)
	}

	/**
	 * Creates the raw keyboard information. Usage only recommended for advanced usage of this library.
	 * @param context Context to be supplied to the buttons on on creation
	 * @param path Path within the menu. Will be used for the relativePaths
	 */
	async renderKeyboard(context: Context, path: string): Promise<InlineKeyboard> {
		return this._keyboard.render(context, path)
	}

	/**
	 * Creates the actions that the buttons of the template want to happen. Usage only recommended for advanced usage of this library.
	 * @param path Path within the menu. Will be used for the relativePaths
	 */
	renderActionHandlers(path: RegExpLike): ReadonlySet<ButtonAction<Context>> {
		return this._actions.list(path)
	}

	/**
	 * Lists the submenus used in this menu template. Usage only recommended for advanced usage of this library.
	 */
	listSubmenus(): ReadonlySet<Submenu<Context>> {
		return this._submenus
	}

	/**
	 * Allows for manual creation of a button in a very raw way of doing. Less user friendly but very customizable.
	 * @param button constant or function returning a button representation to be added to the keyboard
	 * @param options additional options
	 */
	manual(button: ConstOrContextPathFunc<Context, ButtonTemplate>, options: SingleButtonOptions<Context> = {}): void {
		const {hide} = options
		if (hide) {
			this._keyboard.add(Boolean(options.joinLastRow), async (context, path) => {
				if (await hide(context, path)) {
					return undefined
				}

				return typeof button === 'function' ? button(context, path) : button
			})
		} else {
			this._keyboard.add(Boolean(options.joinLastRow), button)
		}
	}

	/**
	 * Allows for manual creation of many buttons. Less user friendly but very customizable.
	 * @param creator function generating a keyboard part
	 */
	manualRow(creator: ContextPathFunc<Context, ButtonTemplateRow[]>): void {
		this._keyboard.addCreator(creator)
	}

	/**
	 * Allows for manual creation of actions. Less user friendly but very customizable.
	 * Is probably used together with manualRow.
	 * @param trigger regular expression which is appended to the menu path.
	 * @param action function which is called when the trigger is matched.
	 * @example
	 * menuTemplate.manualRow((context, path) => [[{text: 'Page 2', relativePath: 'custom-pagination:2'}, {text: 'Page 3', relativePath: 'custom-pagination:3'}]])
	 * menuTemplate.manualAction(/custom-pagination:(\d+)$/, (context, path) => {
	 *   console.log('manualAction', path, context.match![1])
	 *   return '.'
	 * })
	 */
	manualAction(trigger: RegExpLike, action: ActionFunc<Context>): void {
		this._actions.add(trigger, action, undefined)
	}

	/**
	 * Add an url button to the keyboard
	 * @param text text to be displayed on the button
	 * @param url url where this button should be heading
	 * @param options additional options
	 */
	url(text: ConstOrContextPathFunc<Context, string>, url: ConstOrContextPathFunc<Context, string>, options: SingleButtonOptions<Context> = {}): void {
		this.manual(async (context, path) => ({
			text: typeof text === 'function' ? await text(context, path) : text,
			url: typeof url === 'function' ? await url(context, path) : url
		}), options)
	}

	/**
	 * Add a switch_inline_query button to the keyboard
	 * @param text text to be displayed on the button
	 * @param query query that is shown next to the bot username. Can be empty ('')
	 * @param options additional options
	 */
	switchToChat(text: ConstOrContextPathFunc<Context, string>, query: ConstOrContextPathFunc<Context, string>, options: SingleButtonOptions<Context> = {}): void {
		this.manual(async (context, path) => ({
			text: typeof text === 'function' ? await text(context, path) : text,
			switch_inline_query: typeof query === 'function' ? await query(context, path) : query
		}), options)
	}

	/**
	 * Add a switch_inline_query_current_chat button to the keyboard
	 * @param text text to be displayed on the button
	 * @param query query that is shown next to the bot username. Can be empty ('')
	 * @param options additional options
	 */
	switchToCurrentChat(text: ConstOrContextPathFunc<Context, string>, query: ConstOrContextPathFunc<Context, string>, options: SingleButtonOptions<Context> = {}): void {
		this.manual(async (context, path) => ({
			text: typeof text === 'function' ? await text(context, path) : text,
			switch_inline_query_current_chat: typeof query === 'function' ? await query(context, path) : query
		}), options)
	}

	// TODO: add login_url, callback_game, pay for easier access (like url button)
	// see https://core.telegram.org/bots/api#inlinekeyboardbutton

	/**
	 * Button which only purpose is to move around the menu on click.
	 * The relative path is inspired by the cd command.
	 * If you want to execute a function on click use `menuTemplate.interact(…)` instead.
	 * @param text text to be displayed on the button
	 * @param relativePath relative target path like 'child/', '..' or '../sibling/
	 * @param options additional options
	 *
	 * @example menuTemplate.navigate('back to parent menu', '..')
	 * @example menuTemplate.navigate('to the root menu', '/')
	 * @example menuTemplate.navigate('to a sibling menu', '../sibling/')
	 */
	navigate(text: ConstOrContextPathFunc<Context, string>, relativePath: string, options: SingleButtonOptions<Context> = {}): void {
		this._keyboard.add(Boolean(options.joinLastRow), generateCallbackButtonTemplate(text, relativePath, options.hide))
	}

	/**
	 * Add a button to which a function is executed on click.
	 * You can update the menu afterwards by returning a relative path. If you only want to update the menu or move around use `menuTemplate.navigate(…)` instead.
	 * @param text text to be displayed on the button
	 * @param action unique identifier for this button within the menu template
	 * @param options additional options. Requires `do` as you want to do something when the user pressed the button.
	 * @example
	 * menuTemplate.interact('Knock Knock', 'unique', {
	 *   do: async context => {
	 *     await context.answerCbQuery('Who is there?')
	 *     return false // Do not update the menu afterwards
	 *   }
	 * })
	 * @example
	 * menuTemplate.interact('Update the current menu afterwards', 'unique', {
	 *   do: async context => {
	 *     // do what you want to do
	 *     return '.' // . like the current one -> this menu
	 *   }
	 * })
	 */
	interact(text: ConstOrContextPathFunc<Context, string>, action: string, options: InteractionOptions<Context>): void {
		if ('doFunc' in options) {
			throw new TypeError('doFunc was renamed to do')
		}

		if (typeof options.do !== 'function') {
			throw new TypeError('You have to specify `do` in order to have an interaction for this button. If you only want to navigate use `menuTemplate.navigate(…)` instead.')
		}

		this._actions.add(new RegExp(action + '$'), options.do, options.hide)
		this._keyboard.add(Boolean(options.joinLastRow), generateCallbackButtonTemplate(text, action, options.hide))
	}

	/**
	 * Add a button to a submenu
	 * @param text text to be displayed on the button
	 * @param action unique identifier for this button within the menu template
	 * @param submenu submenu to be entered on click
	 * @param options additional options
	 * @example
	 * const submenuTemplate = new MenuTemplate('I am a submenu')
	 * submenuTemplate.interact('Text', 'unique', {
	 *   do: async ctx => ctx.answerCbQuery('You hit a button in a submenu')
	 * })
	 * submenuTemplate.manualRow(createBackMainMenuButtons())
	 *
	 * menuTemplate.submenu('enter submenu', 'unique', submenuTemplate)
	 */
	submenu(text: ConstOrContextPathFunc<Context, string>, action: string, submenu: MenuLike<Context>, options: SubmenuOptions<Context> = {}): void {
		ensureTriggerChild(action)
		const actionRegex = new RegExp(action + '/')
		if ([...this._submenus].map(o => o.action.source).includes(actionRegex.source)) {
			throw new Error(`There is already a submenu with the action "${action}". Change the action in order to access both menus.`)
		}

		this._submenus.add({
			action: actionRegex,
			hide: options.hide,
			menu: submenu
		})
		this._keyboard.add(Boolean(options.joinLastRow), generateCallbackButtonTemplate(text, action + '/', options.hide))
	}

	/**
	 * Let the user choose one of many options and execute a function for the one the user picked
	 * @param actionPrefix prefix which is used to create a unique identifier for each of the resulting buttons
	 * @param choices choices the user can pick from
	 * @param options additional options. Requires `do` as you want to do something when the user pressed a button.
	 */
	choose(actionPrefix: string, choices: ConstOrContextFunc<Context, Choices>, options: ChooseOptions<Context>): void {
		if ('doFunc' in options) {
			throw new TypeError('doFunc was renamed to do')
		}

		if (typeof options.do !== 'function') {
			throw new TypeError('You have to specify `do` in order to have an interaction for the buttons.')
		}

		const trigger = new RegExp(actionPrefix + ':(.+)$')
		this._actions.add(
			trigger,
			async (context, path) => options.do(context, getKeyFromPath(trigger, path)),
			options.disableChoiceExistsCheck ? options.hide : combineHideAndChoices(actionPrefix, choices, options.hide)
		)

		if (options.setPage) {
			const pageTrigger = new RegExp(actionPrefix + 'P:(\\d+)$')
			this._actions.add(pageTrigger, setPageAction(pageTrigger, options.setPage), options.hide)
		}

		this._keyboard.addCreator(generateChoicesButtons(actionPrefix, false, choices, options))
	}

	/**
	 * Submenu which is entered when a user picks one of many choices
	 * @param actionPrefix prefix which is used to create a unique identifier for each of the resulting buttons
	 * @param choices choices the user can pick from. Also see `menuTemplate.choose(…)` for examples on choices
	 * @param submenu submenu to be entered when one of the choices is picked
	 * @param options additional options
	 * @example
	 * const submenu = new MenuTemplate<MyContext>(ctx => `Welcome to ${ctx.match[1]}`)
	 * submenu.interact('Text', 'unique', {
	 *   do: async ctx => {
	 *     console.log('Take a look at ctx.match. It contains the chosen city', ctx.match)
	 *     await ctx.answerCbQuery('You hit a button in a submenu')
	 *     return false
	 *   }
	 * })
	 * submenu.manualRow(createBackMainMenuButtons())
	 *
	 * menu.chooseIntoSubmenu('unique', ['Gotham', 'Mos Eisley', 'Springfield'], submenu)
	 */
	chooseIntoSubmenu(actionPrefix: string, choices: ConstOrContextFunc<Context, Choices>, submenu: MenuLike<Context>, options: ChooseIntoSubmenuOptions<Context> = {}): void {
		ensureTriggerChild(actionPrefix)
		const actionRegex = new RegExp(actionPrefix + ':([^/]+)/')
		if ([...this._submenus].map(o => o.action.source).includes(actionRegex.source)) {
			throw new Error(`There is already a submenu with the action "${actionPrefix}". Change the action in order to access both menus.`)
		}

		this._submenus.add({
			action: actionRegex,
			hide: options.disableChoiceExistsCheck ? options.hide : combineHideAndChoices(actionPrefix, choices, options.hide),
			menu: submenu
		})

		if (options.setPage) {
			const pageTrigger = new RegExp(actionPrefix + 'P:(\\d+)$')
			this._actions.add(pageTrigger, setPageAction(pageTrigger, options.setPage), options.hide)
		}

		this._keyboard.addCreator(generateChoicesButtons(actionPrefix, true, choices, options))
	}

	/**
	 * Let the user select one (or multiple) options from a set of choices
	 * @param actionPrefix prefix which is used to create a unique identifier for each of the resulting buttons
	 * @param choices choices the user can pick from. Also see `menuTemplate.choose(…)` for examples on choices
	 * @param options additional options. Requires `set` and `isSet`.
	 * @example
	 * // User can select exactly one
	 * menuTemplate.select('unique', ['at home', 'at work', 'somewhere else'], {
	 *   isSet: (context, key) => context.session.currentLocation === key,
	 *   set: (context, key) => {
	 *     context.session.currentLocation = key
	 *     return true
	 *   }
	 * })
	 * @example
	 * // User can select one of multiple options
	 * menuTemplate.select('unique', ['has arms', 'has legs', 'has eyes', 'has wings'], {
	 *   showFalseEmoji: true,
	 *   isSet: (context, key) => Boolean(context.session.bodyparts[key]),
	 *   set: (context, key, newState) => {
	 *     context.session.bodyparts[key] = newState
	 *     return true
	 *   }
	 * })
	 */
	select(actionPrefix: string, choices: ConstOrContextFunc<Context, Choices>, options: SelectOptions<Context>): void {
		if ('setFunc' in options || 'isSetFunc' in options) {
			throw new TypeError('setFunc and isSetFunc were renamed to set and isSet')
		}

		if (typeof options.set !== 'function' || typeof options.isSet !== 'function') {
			throw new TypeError('You have to specify `set` and `isSet` in order to work with select. If you just want to let the user choose between multiple options use `menuTemplate.choose(…)` instead.')
		}

		const trueTrigger = new RegExp(actionPrefix + 'T:(.+)$')
		this._actions.add(
			trueTrigger,
			async (context, path) => {
				const key = getKeyFromPath(trueTrigger, path)
				return options.set(context, key, true)
			},
			options.disableChoiceExistsCheck ? options.hide : combineHideAndChoices(actionPrefix + 'T', choices, options.hide)
		)

		const falseTrigger = new RegExp(actionPrefix + 'F:(.+)$')
		this._actions.add(
			falseTrigger,
			async (context, path) => {
				const key = getKeyFromPath(falseTrigger, path)
				return options.set(context, key, false)
			},
			options.disableChoiceExistsCheck ? options.hide : combineHideAndChoices(actionPrefix + 'F', choices, options.hide)
		)

		if (options.setPage) {
			const pageTrigger = new RegExp(actionPrefix + 'P:(\\d+)$')
			this._actions.add(pageTrigger, setPageAction(pageTrigger, options.setPage), options.hide)
		}

		this._keyboard.addCreator(generateSelectButtons(actionPrefix, choices, options))
	}

	/**
	 * Shows a row of pagination buttons.
	 * When the user presses one of the buttons `setPage` is called with the specified button.
	 * In order to determine which is the current page and how many pages there are `getCurrentPage` and `getTotalPages` are called to which you have to return the current value
	 * @param actionPrefix prefix which is used to create a unique identifier for each of the resulting buttons
	 * @param options additional options. Requires `getCurrentPage`, `getTotalPages` and `setPage`.
	 */
	pagination(actionPrefix: string, options: PaginationOptions<Context>): void {
		if (typeof options.getCurrentPage !== 'function' || typeof options.getTotalPages !== 'function' || typeof options.setPage !== 'function') {
			throw new TypeError('You have to specify `getCurrentPage`, `getTotalPages` and `setPage`.')
		}

		const paginationChoices: ContextFunc<Context, ChoicesRecord> = async context => {
			const totalPages = await options.getTotalPages(context)
			const currentPage = await options.getCurrentPage(context)
			return createPaginationChoices(totalPages, currentPage)
		}

		const trigger = new RegExp(actionPrefix + ':(\\d+)$')
		this._actions.add(trigger, setPageAction(trigger, options.setPage), options.hide)
		this._keyboard.addCreator(generateChoicesButtons(actionPrefix, false, paginationChoices, {
			columns: 5,
			hide: options.hide
		}))
	}

	/**
	 * Toogle a value when the button is pressed.
	 * If you want to toggle multiple values use `menuTemplate.select(…)`
	 * @param text text to be displayed on the button
	 * @param actionPrefix unique identifier for this button within the menu template
	 * @param options additional options. Requires `set` and `isSet`.
	 * @example
	 * menuTemplate.toggle('Text', 'unique', {
	 *   isSet: context => Boolean(context.session.isFunny),
	 *   set: (context, newState) => {
	 *     context.session.isFunny = newState
	 *     return true
	 *   }
	 * })
	 * @example
	 * // You can use a custom format for the state instead of the default emoji
	 * menuTemplate.toggle('Lamp', 'unique', {
	 *   formatState: (context, text, state) => `${text}: ${state ? 'on' : 'off'}`,
	 *   isSet: context => Boolean(context.session.lamp),
	 *   set: (context, newState) => {
	 *     context.session.lamp = newState
	 *     return true
	 *   }
	 * })
	 */
	toggle(text: ConstOrContextPathFunc<Context, string>, actionPrefix: string, options: ToggleOptions<Context>): void {
		if ('setFunc' in options || 'isSetFunc' in options) {
			throw new TypeError('setFunc and isSetFunc were renamed to set and isSet')
		}

		if (typeof options.set !== 'function' || typeof options.isSet !== 'function') {
			throw new TypeError('You have to specify `set` and `isSet` in order to work with toggle. If you just want to implement something more generic use `interact`')
		}

		this._actions.add(
			new RegExp(actionPrefix + ':true$'),
			async (context, path) => options.set(context, true, path),
			options.hide
		)

		this._actions.add(
			new RegExp(actionPrefix + ':false$'),
			async (context, path) => options.set(context, false, path),
			options.hide
		)

		this._keyboard.add(Boolean(options.joinLastRow), generateToggleButton(text, actionPrefix, options))
	}
}

function generateCallbackButtonTemplate<Context>(text: ConstOrContextPathFunc<Context, string>, relativePath: string, hide: undefined | ContextPathFunc<Context, boolean>): ContextPathFunc<Context, CallbackButtonTemplate | undefined> {
	return async (context, path) => {
		if (await hide?.(context, path)) {
			return undefined
		}

		return {
			relativePath,
			text: typeof text === 'function' ? await text(context, path) : text
		}
	}
}

function getKeyFromPath(trigger: RegExpLike, path: string): string {
	const match = new RegExp(trigger.source, trigger.flags).exec(path)
	const key = match?.[1]
	if (!key) {
		throw new Error(`Could not read key from path '${path}' for trigger '${trigger.source}'`)
	}

	return key
}

function setPageAction<Context>(pageTrigger: RegExpLike, setPage: SetPageFunction<Context>): ActionFunc<Context> {
	return async (context, path) => {
		const key = getKeyFromPath(pageTrigger, path)
		const page = Number(key)
		await setPage(context, page)
		return '.'
	}
}
