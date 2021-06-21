import {Telegraf, Context as TelegrafContext} from 'telegraf'
import test from 'ava'

import {MenuLike, Submenu} from '../../source/core/menu-like'

import {MenuMiddleware} from '../../source/menu-middleware'

// TODO: Ugly workaround. This library should know better...
type MyContext = TelegrafContext & {match: RegExpExecArray | null | undefined}

test('root path responds main menu', async t => {
	const submenuMenu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'submenu',
		renderKeyboard: () => []
	}
	const submenu: Submenu<unknown> = {
		action: /submenu\//,
		hide: () => false,
		menu: submenuMenu
	}
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set([submenu]),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (menu, _context, path) => {
			t.is(menu.listSubmenus().size, 1)
			t.is(path, '/')
			return Promise.resolve()
		}
	})

	const bot = new Telegraf<MyContext>('')
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

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/'
		}
	})
})

test('submenu path responds submenu when not hidden', async t => {
	const submenuMenu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'submenu',
		renderKeyboard: () => []
	}
	const submenu: Submenu<unknown> = {
		action: /submenu\//,
		hide: () => false,
		menu: submenuMenu
	}
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set([submenu]),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (menu, _context, path) => {
			t.is(menu.listSubmenus().size, 0)
			t.is(path, '/submenu/')
			return Promise.resolve()
		}
	})

	const bot = new Telegraf<MyContext>('')
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

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/submenu/'
		}
	})
})

test('submenu path responds submenu when no hide function', async t => {
	const submenuMenu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'submenu',
		renderKeyboard: () => []
	}
	const submenu: Submenu<unknown> = {
		action: /submenu\//,
		hide: undefined,
		menu: submenuMenu
	}
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set([submenu]),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (menu, _context, path) => {
			t.is(menu.listSubmenus().size, 0)
			t.is(path, '/submenu/')
			return Promise.resolve()
		}
	})

	const bot = new Telegraf<MyContext>('')
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

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/submenu/'
		}
	})
})

test('submenu path responds main menu when hidden', async t => {
	const submenuMenu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'submenu',
		renderKeyboard: () => []
	}
	const submenu: Submenu<unknown> = {
		action: /submenu\//,
		hide: () => true,
		menu: submenuMenu
	}
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set([submenu]),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (menu, _context, path) => {
			t.is(menu.listSubmenus().size, 1)
			t.is(path, '/')
			return Promise.resolve()
		}
	})

	const bot = new Telegraf<MyContext>('')
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

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '/submenu/'
		}
	})
})
