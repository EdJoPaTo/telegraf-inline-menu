import test from 'ava'

import {generateSelectButtons} from './select'

test('empty choices no buttons', async t => {
	const func = generateSelectButtons('pre', [], {
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})

	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [])
})

test('is set creates false button', async t => {
	const func = generateSelectButtons('pre', ['a'], {
		isSet: () => true,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})

	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: '✅ a',
		relativePath: 'preF:a'
	}]])
})

test('is not set creates true button', async t => {
	const func = generateSelectButtons('pre', ['a'], {
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})

	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'a',
		relativePath: 'preT:a'
	}]])
})

test('showFalseEmoji also prefixes currently false buttons', async t => {
	const func = generateSelectButtons('pre', ['a'], {
		showFalseEmoji: true,
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})

	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: '🚫 a',
		relativePath: 'preT:a'
	}]])
})

test('creates pagination buttons', async t => {
	const func = generateSelectButtons('pre', ['a', 'b', 'c'], {
		columns: 1,
		maxRows: 1,
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		},
		setPage: () => {
			throw new Error('no need to call setPage on keyboard creation')
		}
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [
		[{
			text: 'a',
			relativePath: 'preT:a'
		}],
		[{
			text: '1',
			relativePath: 'preP:1'
		}, {
			text: '▶️ 2',
			relativePath: 'preP:2'
		}, {
			text: '⏩ 3',
			relativePath: 'preP:3'
		}]
	])
})

test('show keys of page 2', async t => {
	const func = generateSelectButtons('pre', ['a', 'b', 'c'], {
		columns: 1,
		maxRows: 1,
		getCurrentPage: () => 2,
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'b',
		relativePath: 'preT:b'
	}]])
})

test('choice function is run', async t => {
	t.plan(4)
	const choiceFunction = (context: string): string[] => {
		t.pass()
		return [context]
	}

	const func = generateSelectButtons('pre', choiceFunction, {
		isSet: () => false,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})

	t.deepEqual(await func('a', '/'), [[{
		text: 'a',
		relativePath: 'preT:a'
	}]])
	t.deepEqual(await func('b', '/'), [[{
		text: 'b',
		relativePath: 'preT:b'
	}]])
})

test('hidden does not render any buttons', async t => {
	const choiceFunction = (): never => {
		throw new Error('hidden -> dont call choices')
	}

	const func = generateSelectButtons('pre', choiceFunction, {
		hide: () => true,
		isSet: () => {
			throw new Error('dont call as its hidden')
		},
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		}
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [])
})

test('format state', async t => {
	const func = generateSelectButtons('pre', ['a'], {
		isSet: () => true,
		set: () => {
			throw new Error('no need to call set on keyboard creation')
		},
		formatState: (_context, textResult, state, key) => {
			t.is(textResult, 'a')
			t.is(state, true)
			t.is(key, 'a')
			return 'lalala'
		}
	})

	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'lalala',
		relativePath: 'preF:a'
	}]])
})
