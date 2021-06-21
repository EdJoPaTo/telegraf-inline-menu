import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.navigate('Button', '..', {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/foo/bar/')
	t.deepEqual(keyboard, [])
})

test('parent menu', async t => {
	const menu = new MenuTemplate('whatever')
	menu.navigate('Button', '..')
	const keyboard = await menu.renderKeyboard(undefined, '/foo/bar/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/foo/'
	}]])
})

test('root menu', async t => {
	const menu = new MenuTemplate('whatever')
	menu.navigate('Button', '/')
	const keyboard = await menu.renderKeyboard(undefined, '/foo/bar/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/'
	}]])
})
