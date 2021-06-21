import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('submenu is listed', t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', [], submenu)
	const submenus = [...menu.listSubmenus()]
	t.is(submenus.length, 1)
	t.is(submenus[0]!.action.source, 'unique:([^/]+)\\/')
})

test('submenu hidden', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button'], submenu, {
		hide: () => true
	})
	const submenus = [...menu.listSubmenus()]
	const isHidden = await submenus[0]?.hide?.(undefined, '/unique:Button/')
	t.true(isHidden)
})

test('submenu not existing hides', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button'], submenu)
	const submenus = [...menu.listSubmenus()]
	const isHidden = await submenus[0]?.hide?.(undefined, '/unique:Tree/')
	t.true(isHidden)
})

test('submenu not existing check disabled does not hide', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button'], submenu, {
		disableChoiceExistsCheck: true
	})
	const submenus = [...menu.listSubmenus()]
	const isHidden = await submenus[0]?.hide?.(undefined, '/unique:Button/')
	t.falsy(isHidden)
})

test('button hidden', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button'], submenu, {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('button', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button'], submenu)
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/unique:Button/'
	}]])
})

test('two same action codes throws', t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', [], submenu)

	t.notThrows(() => {
		menu.chooseIntoSubmenu('different', [], submenu)
	})
	t.throws(() => {
		menu.chooseIntoSubmenu('unique', [], submenu)
	}, {
		message: /already a submenu with the action/
	})
})

test('with pagnination buttons', async t => {
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button', 'Tree'], submenu, {
		columns: 1,
		maxRows: 1,
		setPage: () => {
			throw new Error('dont set the page on rendering buttons')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [
		[{
			text: 'Button',
			callback_data: '/unique:Button/'
		}],
		[
			{
				text: '1',
				callback_data: '/uniqueP:1'
			},
			{
				text: '▶️ 2',
				callback_data: '/uniqueP:2'
			}
		]
	])
})

test('set page action', async t => {
	t.plan(4)
	const menu = new MenuTemplate('foo')
	const submenu = new MenuTemplate('bar')
	menu.chooseIntoSubmenu('unique', ['Button', 'Tree'], submenu, {
		columns: 1,
		maxRows: 1,
		setPage: (context, page) => {
			t.is(context, 'bla')
			t.is(page, 2)
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)
	const pageAction = actions[0]!
	const result = await pageAction.doFunction('bla', '/uniqueP:2')
	t.is(result, '.')
})
