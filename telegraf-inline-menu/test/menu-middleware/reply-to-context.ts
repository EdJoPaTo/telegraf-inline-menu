import {Context as TelegrafContext} from 'telegraf'
import test from 'ava'

import {MenuLike, Submenu} from '../../source/core/menu-like'

import {MenuMiddleware} from '../../source/menu-middleware'

test('replies main menu', async t => {
	t.plan(2)
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

	const mm = new MenuMiddleware('/', menu)

	const fakeContext: Partial<TelegrafContext> = {
		reply: async (text, extra) => {
			t.is(text, 'whatever')
			t.deepEqual(extra, {
				disable_web_page_preview: false,
				parse_mode: undefined,
				reply_markup: {
					inline_keyboard: []
				}
			})
			return Promise.resolve({} as any)
		}
	}

	await mm.replyToContext(fakeContext as any)
})

test('replies main menu explicitly', async t => {
	t.plan(2)
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

	const mm = new MenuMiddleware('/', menu)

	const fakeContext: Partial<TelegrafContext> = {
		reply: async (text, extra) => {
			t.is(text, 'whatever')
			t.deepEqual(extra, {
				disable_web_page_preview: false,
				parse_mode: undefined,
				reply_markup: {
					inline_keyboard: []
				}
			})
			return Promise.resolve({} as any)
		}
	}

	await mm.replyToContext(fakeContext as any, '/')
})

test('replies submenu', async t => {
	t.plan(2)
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

	const mm = new MenuMiddleware('/', menu)

	const fakeContext: Partial<TelegrafContext> = {
		reply: async (text, extra) => {
			t.is(text, 'submenu')
			t.deepEqual(extra, {
				disable_web_page_preview: false,
				parse_mode: undefined,
				reply_markup: {
					inline_keyboard: []
				}
			})
			return Promise.resolve({} as any)
		}
	}

	await mm.replyToContext(fakeContext as any, '/submenu/')
})

test('fails with out of scope path', async t => {
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

	const mm = new MenuMiddleware('/', menu)

	await t.throwsAsync(
		async () => mm.replyToContext({} as any, 'foo/'),
		{message: 'There is no menu which works with your supplied path: foo/'}
	)
})

test('fails when rootTrigger is a regex and path is not explicit', async t => {
	const menu: MenuLike<unknown> = {
		listSubmenus: () => new Set(),
		renderActionHandlers: () => new Set(),
		renderBody: () => 'whatever',
		renderKeyboard: () => []
	}

	const mm = new MenuMiddleware(/^tree(\d+)\//, menu)

	await t.throwsAsync(
		async () => {
			await mm.replyToContext({} as any)
		},
		{
			message: /absolute path explicitly as a string/
		}
	)
})
