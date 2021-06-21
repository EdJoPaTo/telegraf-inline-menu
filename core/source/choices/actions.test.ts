import test from 'ava'

import {combineHideAndChoices} from './actions'

test('choices are not called when hide is true', async t => {
	const func = combineHideAndChoices('bla', () => {
		throw new Error('dont call choices when already hidden')
	}, () => true)

	const isHidden = await func(undefined, '/')
	t.is(isHidden, true)
})

test('does not hide when choice still available', async t => {
	const func = combineHideAndChoices('bla', ['a'], undefined)

	const path = '/foo/bar/bla:a'
	const isHidden = await func(undefined, path)
	t.is(isHidden, false)
})

test('does not hide when choice still available from function', async t => {
	const func = combineHideAndChoices('bla', () => ['a'], undefined)

	const path = '/foo/bar/bla:a'
	const isHidden = await func(undefined, path)
	t.is(isHidden, false)
})

test('hides when choice isnt available anymore', async t => {
	const func = combineHideAndChoices('bla', ['a'], undefined)

	const path = '/foo/bar/bla:wow'
	const isHidden = await func(undefined, path)
	t.is(isHidden, true)
})

test('does not hide submenu when choice still available from function', async t => {
	const func = combineHideAndChoices('bla', () => ['a'], undefined)

	const path = '/foo/bar/bla:a/'
	const isHidden = await func(undefined, path)
	t.is(isHidden, false)
})

test('unrelated path throws', async t => {
	const func = combineHideAndChoices('bla', () => ['a'], undefined)

	await t.throwsAsync(async () => func(undefined, 'hi there'), {
		message: 'could not read choice from path'
	})
})
