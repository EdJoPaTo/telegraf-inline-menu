import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('buttons hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.select('unique', ['Button'], {
		hide: () => true,
		isSet: () => {
			throw new Error('do not call this function when hidden')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard(undefined, '/')
	t.deepEqual(keyboard, [])
})

test('button true', async t => {
	t.plan(3)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: (context, key) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			return true
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: '✅ Button',
		callback_data: '/uniqueF:Button'
	}]])
})

test('button false', async t => {
	t.plan(3)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: (context, key) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			return false
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: 'Button',
		callback_data: '/uniqueT:Button'
	}]])
})

test('button false with emoji', async t => {
	t.plan(3)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		showFalseEmoji: true,
		isSet: (context, key) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			return false
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: '🚫 Button',
		callback_data: '/uniqueT:Button'
	}]])
})

test('action triggers', t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	t.log(actions)
	t.is(actions.length, 2)

	const triggers = new Set(actions.map(o => o.trigger.source))
	t.true(triggers.has('^\\/uniqueT:(.+)$'))
	t.true(triggers.has('^\\/uniqueF:(.+)$'))
})

test('action hidden', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		hide: () => true,
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result0 = await actions[0]?.doFunction('foo', '/uniqueT:Button')
	t.is(result0, '.')

	const result1 = await actions[1]?.doFunction('foo', '/uniqueF:Button')
	t.is(result1, '.')
})

test('action skipped when not existing', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result0 = await actions[0]?.doFunction('foo', '/uniqueT:Tree')
	t.is(result0, '.')

	const result1 = await actions[1]?.doFunction('foo', '/uniqueF:Tree')
	t.is(result1, '.')
})

test('action true', async t => {
	t.plan(4)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: (context, key, newState) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			t.is(newState, true)
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	const action = actions.find(o => o.trigger.source.includes('uniqueT'))!
	const result = await action.doFunction('foo', '/uniqueT:Button')
	t.is(result, 'wow')
})

test('action false', async t => {
	t.plan(4)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: (context, key, newState) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			t.is(newState, false)
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	const action = actions.find(o => o.trigger.source.includes('uniqueF'))!
	const result = await action.doFunction('foo', '/uniqueF:Button')
	t.is(result, 'wow')
})

test('action true not existing check disabled', async t => {
	t.plan(4)
	const menu = new MenuTemplate<string>('whatever')
	menu.select('unique', ['Button'], {
		disableChoiceExistsCheck: true,
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: (context, key, newState) => {
			t.is(context, 'foo')
			t.is(key, 'Tree')
			t.is(newState, true)
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	const action = actions.find(o => o.trigger.source.includes('uniqueT'))!
	const result = await action.doFunction('foo', '/uniqueT:Tree')
	t.is(result, 'wow')
})

test('with pagnination buttons', async t => {
	const menu = new MenuTemplate<string>('foo')
	menu.select('unique', ['Button', 'Tree'], {
		columns: 1,
		maxRows: 1,
		setPage: () => {
			throw new Error('dont set the page on rendering buttons')
		},
		isSet: (context, key) => {
			t.is(context, 'foo')
			t.is(key, 'Button')
			return false
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [
		[{
			text: 'Button',
			callback_data: '/uniqueT:Button'
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
	menu.select('unique', ['Button', 'Tree'], {
		columns: 1,
		maxRows: 1,
		setPage: (context, page) => {
			t.is(context, 'bla')
			t.is(page, 2)
		},
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const actions = [...menu.renderActionHandlers(/^\//)]
	t.is(actions.length, 3)
	const pageAction = actions.find(o => o.trigger.source.includes('uniqueP:'))!
	const result = await pageAction.doFunction('bla', '/uniqueP:2')
	t.is(result, '.')
})
