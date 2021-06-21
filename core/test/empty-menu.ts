import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('has no buttons', async t => {
	const menu = new MenuTemplate('whatever')
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('has no actions', t => {
	const menu = new MenuTemplate('whatever')
	const actions = menu.renderActionHandlers(/^\//)
	t.deepEqual(actions, new Set())
})

test('has no submenus', t => {
	const menu = new MenuTemplate('whatever')
	const submenus = menu.listSubmenus()
	t.deepEqual(submenus, new Set())
})
