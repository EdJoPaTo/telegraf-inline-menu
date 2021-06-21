import test from 'ava'

import {generateChoicesButtons} from './buttons'

test('empty choices no buttons', async t => {
	const func = generateChoicesButtons('pre', false, [], {})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [])
})

test('single choice one button', async t => {
	const func = generateChoicesButtons('pre', false, ['a'], {})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'a',
		relativePath: 'pre:a'
	}]])
})

test('single choice into submenu', async t => {
	const func = generateChoicesButtons('pre', true, ['a'], {})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'a',
		relativePath: 'pre:a/'
	}]])
})

test('creates pagination buttons', async t => {
	const func = generateChoicesButtons('pre', false, ['a', 'b', 'c'], {
		columns: 1,
		maxRows: 1,
		setPage: () => {
			throw new Error('no need to call setPage on keyboard creation')
		}
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [
		[{
			text: 'a',
			relativePath: 'pre:a'
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
	const func = generateChoicesButtons('pre', false, ['a', 'b', 'c'], {
		columns: 1,
		maxRows: 1,
		getCurrentPage: () => 2
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'b',
		relativePath: 'pre:b'
	}]])
})

test('choice function is run', async t => {
	t.plan(4)
	const choiceFunction = (context: string): string[] => {
		t.pass()
		return [context]
	}

	const func = generateChoicesButtons('pre', false, choiceFunction, {})

	t.deepEqual(await func('a', '/'), [[{
		text: 'a',
		relativePath: 'pre:a'
	}]])
	t.deepEqual(await func('b', '/'), [[{
		text: 'b',
		relativePath: 'pre:b'
	}]])
})

test('choice can have text by itself', async t => {
	const func = generateChoicesButtons('pre', false, {a: 'Aaa'}, {})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'Aaa',
		relativePath: 'pre:a'
	}]])
})

test('choice buttonText is used', async t => {
	const func = generateChoicesButtons('pre', false, ['a'], {
		buttonText: () => 'Aaa'
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[{
		text: 'Aaa',
		relativePath: 'pre:a'
	}]])
})

test('hidden does not render any buttons', async t => {
	const choiceFunction = (): never => {
		throw new Error('hidden -> dont call choices')
	}

	const func = generateChoicesButtons('pre', false, choiceFunction, {
		hide: (context, path) => {
			t.is(context, undefined)
			t.is(path, '/')
			return true
		}
	})
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [])
})
