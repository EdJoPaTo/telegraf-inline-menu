import test from 'ava'

import {
	prefixText
} from './prefix'

test('no prefix', t => {
	const result = prefixText('42', undefined)
	t.is(result, '42')
})

test('value text & prefix', t => {
	const result = prefixText('42', '6')
	t.is(result, '6 42')
})
