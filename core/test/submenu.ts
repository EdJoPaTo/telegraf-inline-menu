import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('submenu is listed', t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.submenu('Button', 'unique', submenu)
	const submenus = [...menu.listSubmenus()]
	t.is(submenus.length, 1)
	t.is(submenus[0]!.action.source, 'unique\\/')
})

test('button hidden', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.submenu('Button', 'unique', submenu, {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('button', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.submenu('Button', 'unique', submenu)
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/unique/'
	}]])
})

test('two same action codes throws', t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.submenu('Button', 'unique', submenu)

	t.notThrows(() => {
		menu.submenu('Button', 'different', submenu)
	})
	t.throws(() => {
		menu.submenu('Button', 'unique', submenu)
	}, {
		message: /already a submenu with the action/
	})
})
