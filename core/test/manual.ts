import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('manual', async t => {
	const menu = new MenuTemplate('whatever')
	menu.manual({text: 'Button', url: 'https://edjopato.de'})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('manual function', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.manual((context, path) => {
		t.is(context, 'foo')
		t.is(path, '/')
		return {text: 'Button', url: 'https://edjopato.de'}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('manual hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.manual({text: 'Button', url: 'https://edjopato.de'}, {
		hide: () => true
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('manual hidden false', async t => {
	// This is the default but somehow it is not understood correctly by the coverage analyse
	const menu = new MenuTemplate('whatever')
	menu.manual({text: 'Button', url: 'https://edjopato.de'}, {
		hide: () => false
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('manual hidden false function', async t => {
	// This is the default but somehow it is not understood correctly by the coverage analyse
	const menu = new MenuTemplate<string>('whatever')
	menu.manual((context, path) => {
		t.is(context, 'foo')
		t.is(path, '/')
		return {text: 'Button', url: 'https://edjopato.de'}
	}, {
		hide: () => false
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		url: 'https://edjopato.de'
	}]])
})

test('manualRow empty input no button', async t => {
	const menu = new MenuTemplate('whatever')
	menu.manualRow(() => [])
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('manualRow buttons end up in keyboard', async t => {
	const menu = new MenuTemplate('whatever')
	menu.manualRow(() => [[
		{text: 'Button1', url: 'https://edjopato.de'},
		{text: 'Button2', relativePath: 'foo'}
	]])
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[
		{text: 'Button1', url: 'https://edjopato.de'},
		{text: 'Button2', callback_data: '/foo'}
	]])
})

test('manualAction trigger', t => {
	const menu = new MenuTemplate('whatever')
	menu.manualAction(/unique:(\d+)$/, () => {
		throw new Error('do not call this function')
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)

	t.is(actions[0]!.trigger.source, '^\\/unique:(\\d+)$')
})

test('manualAction is triggered', async t => {
	t.plan(4)
	const menu = new MenuTemplate<string>('whatever')
	menu.manualAction(/unique:(\d+)$/, (context, path) => {
		t.is(context, 'foo')
		t.is(path, '/unique:2')
		return '.'
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)

	const result = await actions[0]!.doFunction('foo', '/unique:2')
	t.is(result, '.')
})
