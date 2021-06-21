import {Telegraf, Context as TelegrafContext} from 'telegraf'
import test from 'ava'

import {MenuLike} from '../../source/core/menu-like'

import {MenuMiddleware} from '../../source/menu-middleware'

type MyContext = TelegrafContext

test('non callback queries are passing through', async t => {
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu)

	const bot = new Telegraf<MyContext>('')
	bot.telegram.getMe = async () => ({} as any)
	bot.use(mm.middleware())

	bot.use(() => {
		t.pass()
	})

	await bot.handleUpdate({
		update_id: 666,
		message: {
			text: '42',
			chat: {} as any,
			from: {} as any,
			message_id: 666,
			date: 666
		}
	})
})

test('irrelevant callback queries are passing through', async t => {
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu)

	const bot = new Telegraf<MyContext>('')
	bot.telegram.getMe = async () => ({} as any)
	bot.use(mm.middleware())

	bot.use(() => {
		t.pass()
	})

	await bot.handleUpdate({
		update_id: 666,
		callback_query: {
			id: '666',
			from: {} as any,
			chat_instance: '666',
			data: '666'
		}
	})
})

test('default root path is responded', async t => {
	t.plan(2)
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (_menu, _context, path) => {
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

test('custom root path is responded', async t => {
	t.plan(2)
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('custom/', menu, {
		sendMenu: async (_menu, _context, path) => {
			t.is(path, 'custom/')
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
			data: 'custom/'
		}
	})
})

test('custom regex root path is responded', async t => {
	t.plan(2)
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware(/^tree(\d+)\//, menu, {
		sendMenu: async (_menu, _context, path) => {
			t.is(path, 'tree42/')
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
			data: 'tree42/'
		}
	})
})

test('default root path does not trigger custom root path', async t => {
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('custom/', menu)

	const bot = new Telegraf<MyContext>('')
	bot.telegram.getMe = async () => ({} as any)
	bot.use(mm.middleware())

	bot.use(() => {
		t.pass()
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

test('not existing path below is responded with root menu', async t => {
	t.plan(2)
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware('/', menu, {
		sendMenu: async (_menu, _context, path) => {
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
			data: '/what'
		}
	})
})
