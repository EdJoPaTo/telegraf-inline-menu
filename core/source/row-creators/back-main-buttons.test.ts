import test from 'ava'

import {createBackMainMenuButtons} from './back-main-buttons'

test('creates no buttons in root menu', async t => {
	const func = createBackMainMenuButtons()
	const buttons = await func(undefined, '/')
	t.deepEqual(buttons, [[]])
})

test('creates no buttons in topmost menu', async t => {
	const func = createBackMainMenuButtons()
	const buttons = await func(undefined, 'foo/')
	t.deepEqual(buttons, [[]])
})

test('creates only main menu button when one deep', async t => {
	const func = createBackMainMenuButtons('back', 'main')
	const buttons = await func(undefined, '/foo/')
	t.deepEqual(buttons, [[{
		text: 'main',
		relativePath: '/'
	}]])
})

test('creates back button when when one deep but without main menu', async t => {
	const func = createBackMainMenuButtons('back', 'main')
	const buttons = await func(undefined, 'foo/bar/')
	t.deepEqual(buttons, [[{
		text: 'back',
		relativePath: '..'
	}]])
})

test('creates back and main button when when two deep', async t => {
	const func = createBackMainMenuButtons('back', 'main')
	const buttons = await func(undefined, '/foo/bar/')
	t.deepEqual(buttons, [[{
		text: 'back',
		relativePath: '..'
	}, {
		text: 'main',
		relativePath: '/'
	}]])
})

test('creates only back button when when two deep but without main menu', async t => {
	const func = createBackMainMenuButtons('back', 'main')
	const buttons = await func(undefined, 'foo/bar/deep/')
	t.deepEqual(buttons, [[{
		text: 'back',
		relativePath: '..'
	}]])
})

test('creates button texts in function', async t => {
	const func = createBackMainMenuButtons(() => 'back', () => 'main')
	const buttons = await func(undefined, '/foo/bar/')
	t.deepEqual(buttons, [[{
		text: 'back',
		relativePath: '..'
	}, {
		text: 'main',
		relativePath: '/'
	}]])
})
