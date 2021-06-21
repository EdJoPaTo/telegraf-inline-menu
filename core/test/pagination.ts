import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('buttons hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.pagination('unique', {
		hide: () => true,
		getCurrentPage: () => {
			throw new Error('do not call this function when hidden')
		},
		getTotalPages: () => {
			throw new Error('do not call this function when hidden')
		},
		setPage: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('action hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.pagination('unique', {
		hide: () => true,
		getCurrentPage: () => {
			throw new Error('do not call this function when hidden')
		},
		getTotalPages: () => {
			throw new Error('do not call this function when hidden')
		},
		setPage: () => {
			throw new Error('do not call this function')
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)

	const result = await actions[0]!.doFunction('foo', '/unique:1')
	t.is(result, '.')
})

test('buttons 2 pages', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.pagination('unique', {
		getCurrentPage: context => {
			t.is(context, 'foo')
			return 1
		},
		getTotalPages: context => {
			t.is(context, 'foo')
			return 2
		},
		setPage: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[
		{
			text: '1',
			callback_data: '/unique:1'
		},
		{
			text: '▶️ 2',
			callback_data: '/unique:2'
		}
	]])
})

test('action trigger', t => {
	const menu = new MenuTemplate('whatever')
	menu.pagination('unique', {
		getCurrentPage: () => {
			throw new Error('do not call this function')
		},
		getTotalPages: () => {
			throw new Error('do not call this function')
		},
		setPage: () => {
			throw new Error('do not call this function')
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)

	t.is(actions[0]!.trigger.source, '^\\/unique:(\\d+)$')
})

test('action sets page', async t => {
	t.plan(4)
	const errorMessage = 'The current status is not relevant when setting the page. It is validated when its important anyway.'
	const menu = new MenuTemplate<string>('whatever')
	menu.pagination('unique', {
		getCurrentPage: () => {
			t.fail(errorMessage)
			throw new Error(errorMessage)
		},
		getTotalPages: () => {
			t.fail(errorMessage)
			throw new Error(errorMessage)
		},
		setPage: (context, page) => {
			t.is(context, 'foo')
			t.is(page, 2)
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 1)

	const result = await actions[0]!.doFunction('foo', '/unique:2')
	t.is(result, '.')
})
