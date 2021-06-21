import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('button is added to keyboard', async t => {
	const menu = new MenuTemplate('whatever')

	menu.interact('Button', 'unique', {
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [
		[
			{
				text: 'Button',
				callback_data: '/unique'
			}
		]
	])
})

test('button is added to keyboard with text function', async t => {
	const menu = new MenuTemplate('whatever')

	menu.interact(() => 'Button', 'unique', {
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [
		[
			{
				text: 'Button',
				callback_data: '/unique'
			}
		]
	])
})

test('hidden button is not shown on keyboard', async t => {
	const menu = new MenuTemplate('whatever')

	menu.interact(() => 'Button', 'unique', {
		hide: () => true,
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('action is added with correct trigger', t => {
	const menu = new MenuTemplate('whatever')

	menu.interact('Button', 'unique', {
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = menu.renderActionHandlers(/^\//)
	t.is(actions.size, 1)

	const action = [...actions][0]!
	t.is(action.trigger.source, '^\\/unique$')
})

test('action can be called', async t => {
	t.plan(4)
	const menu = new MenuTemplate('whatever')

	menu.interact('Button', 'unique', {
		do: (context, path) => {
			t.is(context, undefined)
			t.is(path, '/unique')
			return 'wow'
		}
	})

	const actions = menu.renderActionHandlers(/^\//)
	t.is(actions.size, 1)

	const action = [...actions][0]!
	const result = await action.doFunction(undefined, '/unique')
	t.is(result, 'wow')
})

test('action can not be called when hidden', async t => {
	const menu = new MenuTemplate('whatever')

	menu.interact('Button', 'unique', {
		hide: () => true,
		do: () => {
			throw new Error('do not call this function when hidden')
		}
	})

	const actions = menu.renderActionHandlers(/^\//)
	t.is(actions.size, 1)

	const action = [...actions][0]!
	const result = await action.doFunction(undefined, '/unique')
	t.is(result, '.')
})
