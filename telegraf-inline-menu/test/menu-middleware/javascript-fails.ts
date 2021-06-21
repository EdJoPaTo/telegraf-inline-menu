import {Telegraf, Context as TelegrafContext} from 'telegraf'
import test from 'ava'

import {ButtonAction} from '../../source/core/action-hive'
import {MenuLike} from '../../source/core/menu-like'

import {MenuMiddleware} from '../../source/menu-middleware'

test('not supply reply as a middleware directly', async t => {
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu)

	// I cant catch the error here so I am triggering it manually
	// bot.use(mm.replyToContext)

	const next = async () => Promise.resolve()

	await t.throwsAsync(
		async () => {
			// @ts-expect-error
			await mm.replyToContext({} as any, next)
		}, {
			message: /not supply this as a middleware directly/
		}
	)
})

test('action is run and no path to update afterwards is returned', async t => {
	t.plan(2)
	const action: ButtonAction<TelegrafContext> = {
		trigger: /^\/what$/,
		// @ts-expect-error
		doFunction: () => {
			t.pass()
			// Not returning something is the issue here
		}
	}
	const menu: MenuLike<TelegrafContext> = {
		listSubmenus: () => new Set([]),
		renderActionHandlers: () => new Set([action]),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}
	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async () => {
			throw new Error('dont update menu as error is expected')
		}
	})

	const bot = new Telegraf('')
	bot.telegram.getMe = async () => ({} as any)
	bot.context.reply = () => {
		throw new Error('Use sendMenu instead')
	}

	bot.context.answerCbQuery = async () => {
		t.pass()
		return Promise.resolve(true)
	}

	bot.use(mm.middleware())

	bot.use(() => {
		t.fail()
	})

	// False positive
	// eslint-disable-next-line promise/prefer-await-to-then
	bot.catch(error => {
		if (error instanceof Error) {
			t.is(error.message, 'You have to return in your do function if you want to update the menu afterwards or not. If not just use return false.')
		} else {
			t.fail('error is not of instance Error')
		}
	})

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/what'
		}
	})
})

test('action is run and an empty path to update afterwards is returned throws', async t => {
	t.plan(2)
	const action: ButtonAction<TelegrafContext> = {
		trigger: /^\/what$/,
		doFunction: () => {
			t.pass()
			return ''
		}
	}
	const menu: MenuLike<TelegrafContext> = {
		listSubmenus: () => new Set([]),
		renderActionHandlers: () => new Set([action]),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}
	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async () => {
			throw new Error('dont update menu as error is expected')
		}
	})

	const bot = new Telegraf('')
	bot.telegram.getMe = async () => ({} as any)
	bot.context.reply = () => {
		throw new Error('Use sendMenu instead')
	}

	bot.context.answerCbQuery = async () => {
		t.pass()
		return Promise.resolve(true)
	}

	bot.use(mm.middleware())

	bot.use(() => {
		t.fail()
	})

	// False positive
	// eslint-disable-next-line promise/prefer-await-to-then
	bot.catch(error => {
		if (error instanceof Error) {
			t.is(error.message, 'You have to return in your do function if you want to update the menu afterwards or not. If not just use return false.')
		} else {
			t.fail('error is not of instance Error')
		}
	})

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/what'
		}
	})
})
