import {Composer, Context as TelegrafContext} from 'telegraf'
import {Message} from 'typegram'

import {ActionFunc} from './core/action-hive'
import {combineTrigger, createRootMenuTrigger, combinePath} from './core/path'
import {ContextPathFunc, RegExpLike} from './core/generic-types'
import {MenuLike} from './core/menu-like'
import {SendMenuFunc, editMenuOnContext, replyMenuToContext} from './send-menu'

type Responder<Context> = MenuResponder<Context> | ActionResponder<Context>

interface MenuResponder<Context> {
	readonly type: 'menu';
	readonly trigger: RegExpLike;
	readonly canEnter: ContextPathFunc<Context, boolean>;
	readonly menu: MenuLike<Context>;
	readonly submenuResponders: ReadonlyArray<MenuResponder<Context>>;
	readonly actionResponders: ReadonlyArray<ActionResponder<Context>>;
}

interface ActionResponder<Context> {
	readonly type: 'action';
	readonly trigger: RegExpLike;
	readonly do: ActionFunc<Context>;
}

export interface Options<Context> {
	/**
	 * Function which is used to send and update the menu.
	 *
	 * Defaults to `editMenuOnContext`
	 */
	readonly sendMenu?: SendMenuFunc<Context>;
}

export class MenuMiddleware<Context extends TelegrafContext> {
	private readonly _sendMenu: SendMenuFunc<Context>

	private readonly _responder: MenuResponder<Context>

	constructor(
		public readonly rootTrigger: string | RegExpLike,
		readonly rootMenu: MenuLike<Context>,
		readonly options: Options<Context> = {}
	) {
		const rootTriggerRegex = createRootMenuTrigger(rootTrigger)
		this._responder = createResponder(rootTriggerRegex, () => true, rootMenu)

		this._sendMenu = options.sendMenu ?? editMenuOnContext
	}

	/**
	 * Send the root menu to the context. Shortcut for `replyMenuToContext(…)`
	 * @param context Context where the root menu should be replied to
	 * @example
	 * const menuMiddleware = new MenuMiddleware('/', menuTemplate)
	 * bot.command('start', async ctx => menuMiddleware.replyToContext(ctx))
	 */
	async replyToContext(context: Context, path = this.rootTrigger): Promise<Message> {
		if (typeof path === 'function') {
			// Happens when a JS User does this as next is the second argument and not a string:
			// ctx.command('start', menuMiddleware.replyToContext)
			throw new TypeError('Do not supply this as a middleware directly. Supply it as a function `ctx => menuMiddleware.replyToContext(ctx)`')
		}

		if (typeof path !== 'string') {
			// Happens when the rootTrigger is a RegExp
			throw new TypeError('You have to specify an absolute path explicitly as a string in the second argument.')
		}

		const {match, responder} = await getLongestMatchMenuResponder(context, path, this._responder)
		if (!match) {
			throw new Error('There is no menu which works with your supplied path: ' + path)
		}

		return replyMenuToContext(responder.menu, context, path)
	}

	/**
	 * The tree structure can be shown for debugging purposes.
	 * You can take a look on the menu you created.
	 */
	tree(): string {
		return 'Menu Tree\n' + responderTree(this._responder)
	}

	middleware(): (context: Context, next: () => Promise<void>) => void {
		const composer = new Composer<Context>()

		const trigger = new RegExp(this._responder.trigger.source, this._responder.trigger.flags)
		// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
		composer.action(trigger, async (context, next) => {
			if (!('data' in context.callbackQuery)) {
				return next()
			}

			const path = context.callbackQuery.data

			let target: string | undefined = path

			if (!path.endsWith('/')) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const {match, responder} = await getLongestMatchActionResponder(context as any, path, this._responder)
				if (match?.[0] && responder.type === 'action') {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					(context as any).match = match
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					const afterwardsTarget = await responder.do(context as any, match[0])

					if (typeof afterwardsTarget === 'string' && afterwardsTarget) {
						target = combinePath(path, afterwardsTarget)
					} else if (afterwardsTarget === true) {
						target = combinePath(path, '.')
					} else if (afterwardsTarget === false) {
						target = undefined
					} else {
						throw new Error('You have to return in your do function if you want to update the menu afterwards or not. If not just use return false.')
					}
				}
			}

			if (target) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const {match, responder} = await getLongestMatchMenuResponder(context as any, target, this._responder)
				if (!match?.[0]) {
					// TODO: think about using next() in this case?
					throw new Error(`There is no menu "${target}" which can be reached in this menu`)
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				(context as any).match = match
				const targetPath = match[0]
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				await this._sendMenu(responder.menu as any, context as any, targetPath)
				await context.answerCbQuery()
					.catch(catchCallbackOld)
			}
		})

		return composer.middleware()
	}
}

function catchCallbackOld(error: unknown): void {
	if (error instanceof Error && error.message.includes('query is too old and response timeout expired')) {
		// ignore
		return
	}

	throw error
}

function responderMatch<Context>(responder: Responder<Context>, path: string): RegExpExecArray | null {
	return new RegExp(responder.trigger.source, responder.trigger.flags).exec(path)
}

async function getLongestMatchMenuResponder<Context extends TelegrafContext>(context: Context, path: string, current: MenuResponder<Context>): Promise<{match: RegExpExecArray | null; responder: MenuResponder<Context>}> {
	for (const sub of current.submenuResponders) {
		const match = responderMatch(sub, path)
		if (!match?.[0]) {
			continue
		}

		// Telegraf users expect context.match to contain the relevant match
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		(context as any).match = match

		// eslint-disable-next-line no-await-in-loop
		if (await sub.canEnter(context, match[0])) {
			return getLongestMatchMenuResponder(context, path, sub)
		}
	}

	const match = responderMatch(current, path)
	return {match, responder: current}
}

async function getLongestMatchActionResponder<Context extends TelegrafContext>(context: Context, path: string, current: MenuResponder<Context>): Promise<{match: RegExpExecArray | null; responder: Responder<Context>}> {
	const currentMatch = responderMatch(current, path)

	for (const sub of current.submenuResponders) {
		const match = responderMatch(sub, path)
		if (!match?.[0]) {
			continue
		}

		// Telegraf users expect context.match to contain the relevant match
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		(context as any).match = match

		// eslint-disable-next-line no-await-in-loop
		if (await sub.canEnter(context, match[0])) {
			return getLongestMatchActionResponder(context, path, sub)
		}

		return {match: currentMatch, responder: current}
	}

	for (const sub of current.actionResponders) {
		const match = responderMatch(sub, path)
		if (!match) {
			continue
		}

		return {match, responder: sub}
	}

	return {match: currentMatch, responder: current}
}

function createResponder<Context extends TelegrafContext>(menuTrigger: RegExpLike, canEnter: ContextPathFunc<Context, boolean>, menu: MenuLike<Context>): MenuResponder<Context> {
	const actionResponders = [...menu.renderActionHandlers(menuTrigger)]
		.map(({trigger, doFunction}): ActionResponder<Context> => ({
			type: 'action',
			trigger,
			do: doFunction
		}))

	const submenuResponders = [...menu.listSubmenus()]
		.map((submenu): MenuResponder<Context> => {
			const submenuTrigger = combineTrigger(menuTrigger, submenu.action)

			const canEnterSubmenu: ContextPathFunc<Context, boolean> = async (context, path) => {
				if (await submenu.hide?.(context, path)) {
					return false
				}

				return true
			}

			return createResponder(submenuTrigger, canEnterSubmenu, submenu.menu)
		})

	return {
		type: 'menu',
		trigger: menuTrigger,
		canEnter,
		menu,
		actionResponders,
		submenuResponders
	}
}

function responderTree<Context>(responder: MenuResponder<Context>, indention = ''): string {
	let text = treeLine(indention, responder.type, responder.trigger.source)

	const subIndention = '  ' + indention

	for (const action of responder.actionResponders) {
		text += treeLine(subIndention, action.type, action.trigger.source)
	}

	for (const submenu of responder.submenuResponders) {
		text += responderTree(submenu, subIndention)
	}

	return text
}

function treeLine(indention: string, type: string, regexSource: string): string {
	let text = indention + type

	const offset = Math.max(1, 30 - text.length)
	for (let i = 0; i < offset; i++) {
		text += ' '
	}

	text += regexSource
		.replace(/\\\//g, '/')
		.replace(/^\^/, '')
		.replace(/\$$/, '')
	text += '\n'
	return text
}
