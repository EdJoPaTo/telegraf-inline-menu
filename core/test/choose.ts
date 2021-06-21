import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('buttons hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.choose('unique', ['Button'], {
		hide: () => true,
		do: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('buttons', async t => {
	const menu = new MenuTemplate('whatever')
	menu.choose('unique', ['Button'], {
		do: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/unique:Button'
	}]])
})

test('action triggers', t => {
	const menu = new MenuTemplate('whatever')
	menu.choose('unique', ['Button'], {
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	t.log(actions)
	t.is(actions.length, 1)

	t.is(actions[0]!.trigger.source, '^\\/unique:(.+)$')
})

test('action hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.choose('unique', ['Button'], {
		hide: () => true,
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result = await actions[0]?.doFunction(undefined, '/unique:Button')
	t.is(result, '.')
})

test('action existing button', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.choose('unique', ['Button'], {
		do: (context, key) => {
			t.is(context, 'bla')
			t.is(key, 'Button')
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result = await actions[0]?.doFunction('bla', '/unique:Button')
	t.is(result, 'wow')
})

test('action not existing button', async t => {
	const menu = new MenuTemplate('whatever')
	menu.choose('unique', ['Button'], {
		do: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result = await actions[0]?.doFunction(undefined, '/unique:Tree')
	t.is(result, '.')
})

test('action not existing button check disabled', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.choose('unique', ['Button'], {
		disableChoiceExistsCheck: true,
		do: (context, key) => {
			t.is(context, 'bla')
			t.is(key, 'Tree')
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result = await actions[0]?.doFunction('bla', '/unique:Tree')
	t.is(result, 'wow')
})

test('with pagnination buttons', async t => {
	const menu = new MenuTemplate('foo')
	menu.choose('unique', ['Button', 'Tree'], {
		columns: 1,
		maxRows: 1,
		setPage: () => {
			throw new Error('dont set the page on rendering buttons')
		},
		do: () => {
			throw new Error('dont run the do function when pagination is of interest')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [
		[{
			text: 'Button',
			callback_data: '/unique:Button'
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
	menu.choose('unique', ['Button', 'Tree'], {
		columns: 1,
		maxRows: 1,
		setPage: (context, page) => {
			t.is(context, 'bla')
			t.is(page, 2)
		},
		do: () => {
			throw new Error('dont call the do function when pagination is of interest')
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 2)
	const pageAction = actions.find(o => o.trigger.source.includes('uniqueP:'))!
	const result = await pageAction.doFunction('bla', '/uniqueP:2')
	t.is(result, '.')
})
