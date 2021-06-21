import test from 'ava'

import {
	prefixEmoji,
	emojiFalse,
	emojiTrue
} from './prefix'

test('no prefix', t => {
	const result = prefixEmoji('42', undefined)
	t.is(result, '42')
})

test('value text & prefix truthy still passthrough', t => {
	const result = prefixEmoji('42', '6')
	t.is(result, '6 42')
})

test('value text & prefix true', t => {
	const result = prefixEmoji('42', true)
	t.is(result, emojiTrue + ' 42')
})

test('value text & prefix false', t => {
	const result = prefixEmoji('42', false)
	t.is(result, emojiFalse + ' 42')
})

test('value text & prefix true hidden', t => {
	const result = prefixEmoji('42', true, {hideTrueEmoji: true})
	t.is(result, '42')
})

test('value text & prefix false hidden', t => {
	const result = prefixEmoji('42', false, {hideFalseEmoji: true})
	t.is(result, '42')
})

test('own true prefix', t => {
	const result = prefixEmoji('42', true, {
		prefixTrue: 'foo'
	})
	t.is(result, 'foo 42')
})

test('own false prefix', t => {
	const result = prefixEmoji('42', false, {
		prefixFalse: 'bar'
	})
	t.is(result, 'bar 42')
})
