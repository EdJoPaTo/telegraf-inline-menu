import test from 'ava'
import {Bot} from 'grammy'

import {MenuTemplate, MenuMiddleware} from '../source'

test('compiles', t => {
	const bot = new Bot('')

	const menuTemplate = new MenuTemplate('foo bar')

	const mm = new MenuMiddleware('/', menuTemplate)

	bot.use(mm)

	t.pass()
})
