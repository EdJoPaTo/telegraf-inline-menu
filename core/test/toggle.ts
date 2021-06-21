import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('button hidden', async t => {
	const menu = new MenuTemplate('whatever')
	menu.toggle('Button', 'unique', {
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
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		isSet: (context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return true
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: '✅ Button',
		callback_data: '/unique:false'
	}]])
})

test('button false', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		isSet: (context, path) => {
			t.is(context, 'foo')
			t.is(path, '/')
			return false
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})
	const keyboard = await menu.renderKeyboard('foo', '/')
	t.deepEqual(keyboard, [[{
		text: '🚫 Button',
		callback_data: '/unique:true'
	}]])
})

test('action triggers', t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		hide: () => true,
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
	t.true(triggers.has('^\\/unique:true$'))
	t.true(triggers.has('^\\/unique:false$'))
})

test('action hidden', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		hide: () => true,
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: () => {
			throw new Error('do not call this function')
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]

	const result0 = await actions[0]?.doFunction('foo', '/unique:true')
	t.is(result0, '.')

	const result1 = await actions[1]?.doFunction('foo', '/unique:true')
	t.is(result1, '.')
})

test('action true', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: (context, newState, path) => {
			t.is(context, 'foo')
			t.is(newState, true)
			t.is(path, '/unique:true')
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	const action = actions.find(o => o.trigger.source.includes('true'))!
	const result = await action.doFunction('foo', '/unique:true')
	t.is(result, 'wow')
})

test('action false', async t => {
	const menu = new MenuTemplate<string>('whatever')
	menu.toggle('Button', 'unique', {
		isSet: () => {
			throw new Error('do not call this function')
		},
		set: (context, newState, path) => {
			t.is(context, 'foo')
			t.is(newState, false)
			t.is(path, '/unique:false')
			return 'wow'
		}
	})

	const actions = [...menu.renderActionHandlers(/^\//)]
	const action = actions.find(o => o.trigger.source.includes('false'))!
	const result = await action.doFunction('foo', '/unique:false')
	t.is(result, 'wow')
})
