import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('string body is passed through', async t => {
	const menu = new MenuTemplate('foobar')
	const body = await menu.renderBody(undefined, '/')
	t.is(body, 'foobar')
})

test('string function body is passed through', async t => {
	const menu = new MenuTemplate(() => 'foobar')
	const body = await menu.renderBody(undefined, '/')
	t.is(body, 'foobar')
})

test('complex body is passed through', async t => {
	const menu = new MenuTemplate({text: 'foobar', parse_mode: 'Markdown'})
	const body = await menu.renderBody(undefined, '/')
	t.deepEqual(body, {text: 'foobar', parse_mode: 'Markdown'})
})
