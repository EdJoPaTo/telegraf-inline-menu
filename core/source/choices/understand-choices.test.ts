import test from 'ava'

import {getChoiceKeysFromChoices, getChoiceTextByKey, ensureCorrectChoiceKeys} from './understand-choices'

test('getChoiceKeysFromChoices from array', t => {
	const choices = ['A', 'B', 1]
	const keys = getChoiceKeysFromChoices(choices)
	t.deepEqual(keys, ['A', 'B', '1'])
})

test('getChoiceKeysFromChoices from record', t => {
	const choices = {A: 'Aaa', B: 'Bbb', 1: '111'}
	const keys = getChoiceKeysFromChoices(choices)
	// A Record is not ordered. Numbers are always before text keys
	t.deepEqual(keys, ['1', 'A', 'B'])
})

test('getChoiceKeysFromChoices from map', t => {
	const choices: Map<string | number, string> = new Map()
	choices.set('A', 'Aaa')
	choices.set('B', 'Bbb')
	choices.set(1, '111')
	const keys = getChoiceKeysFromChoices(choices)
	t.deepEqual(keys, ['A', 'B', '1'])
})

test('getChoiceTextByKey from array', t => {
	const choices = ['A', 'B']
	const text = getChoiceTextByKey(choices, 'A')
	t.is(text, 'A')
})

test('getChoiceTextByKey from record', t => {
	const choices = {A: 'Aaa', B: 'Bbb'}
	const text = getChoiceTextByKey(choices, 'A')
	t.is(text, 'Aaa')
})

test('getChoiceTextByKey from map', t => {
	const choices: Map<string, string> = new Map()
	choices.set('A', 'Aaa')
	choices.set('B', 'Bbb')
	const text = getChoiceTextByKey(choices, 'A')
	t.is(text, 'Aaa')
})

test('getChoiceTextByKey from record but undefined', t => {
	const choices = {A: 'Aaa', B: 'Bbb'}
	const text = getChoiceTextByKey(choices, 'C')
	t.is(text, 'C')
})

test('getChoiceTextByKey from map but undefined', t => {
	const choices: Map<string, string> = new Map()
	choices.set('A', 'Aaa')
	choices.set('B', 'Bbb')
	const text = getChoiceTextByKey(choices, 'C')
	t.is(text, 'C')
})

test('ensureCorrectChoiceKeys correct keys are not a problem', t => {
	const choiceKeys = ['a', 'A', 'a:A', 'aaaaaaaaaaa']
	t.notThrows(() => {
		ensureCorrectChoiceKeys('', '/', choiceKeys)
	})
})

test('ensureCorrectChoiceKeys slash throws', t => {
	const choiceKeys = ['a/a']
	t.throws(
		() => {
			ensureCorrectChoiceKeys('prefix', '/path/', choiceKeys)
		},
		{message: /can not contain '\/'.+prefix.+\/path\//}
	)
})
