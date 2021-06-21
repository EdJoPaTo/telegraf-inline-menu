import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('url', async t => {
	const menu = new MenuTemplate('whatever')
	menu.url('Button', 'https://edjopato.de')
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('url functions', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.url(
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'Button'
		},
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'https://edjopato.de'
		}
	)
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('url hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.url('Button', 'https://edjopato.de', {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('switchToChat', async t => {
	const menu = new MenuTemplate('whatever')
	menu.switchToChat('Button', 'bar')
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		switch_inline_query: 'bar'
	}]])
})

test('switchToChat functions', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.switchToChat(
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'Button'
		},
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'bar'
		}
	)
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		switch_inline_query: 'bar'
	}]])
})

test('switchToChat hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.switchToChat('Button', 'https://edjopato.de', {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('switchToCurrentChat', async t => {
	const menu = new MenuTemplate('whatever')
	menu.switchToCurrentChat('Button', 'bar')
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		switch_inline_query_current_chat: 'bar'
	}]])
})

test('switchToCurrentChat functions', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.switchToCurrentChat(
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'Button'
		},
		(context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return 'bar'
		}
	)
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		switch_inline_query_current_chat: 'bar'
	}]])
})

test('switchToCurrentChat hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.switchToCurrentChat('Button', 'https://edjopato.de', {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})
