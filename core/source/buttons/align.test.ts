import test from 'ava'

import {getRowsOfButtons, maximumButtonsPerPage, getButtonsAsRows, getButtonsOfPage} from './align'

function generateCharArray(charA: string, charZ: string): string[] {
	// https://stackoverflow.com/questions/24597634/how-to-generate-an-array-of-alphabet-in-jquery/24597663#24597663
	const a = []
	let i = charA.charCodeAt(0)
	const j = charZ.charCodeAt(0)
	for (; i <= j; ++i) {
		a.push(String.fromCharCode(i))
	}

	return a
}

test('getRowsOfButtons example', t => {
	const result = getRowsOfButtons(
		generateCharArray('A', 'Z'),
		2, 3,
		2
	)
	t.deepEqual(result, [
		['G', 'H'],
		['I', 'J'],
		['K', 'L']
	])
})

test('getRowsOfButtons example with defaults', t => {
	const result = getRowsOfButtons(
		generateCharArray('A', 'E')
	)
	t.deepEqual(result, [
		['A', 'B', 'C', 'D', 'E']
	])
})

test('getButtonsAsRows less buttons than columns', t => {
	const result = getButtonsAsRows(generateCharArray('A', 'E'), 6)
	t.deepEqual(result, [
		['A', 'B', 'C', 'D', 'E']
	])
})

test('getButtonsAsRows buttons for three colums', t => {
	const result = getButtonsAsRows(generateCharArray('A', 'F'), 2)
	t.deepEqual(result, [
		['A', 'B'],
		['C', 'D'],
		['E', 'F']
	])
})

test('getButtonsAsRows buttons for three colums but last not full', t => {
	const result = getButtonsAsRows(generateCharArray('A', 'E'), 2)
	t.deepEqual(result, [
		['A', 'B'],
		['C', 'D'],
		['E']
	])
})

test('getButtonsAsRows default columns', t => {
	const result = getButtonsAsRows(generateCharArray('A', 'H'))
	t.deepEqual(result, [
		['A', 'B', 'C', 'D', 'E', 'F'],
		['G', 'H']
	])
})

test('getButtonsAsRows without buttons', t => {
	const result = getButtonsAsRows([])
	t.deepEqual(result, [])
})

test('getButtonsOfPage default args', t => {
	const result = getButtonsOfPage(generateCharArray('A', 'E'))
	t.deepEqual(result, [
		'A', 'B', 'C', 'D', 'E'
	])
})

test('getButtonsOfPage without buttons', t => {
	const result = getButtonsOfPage([])
	t.deepEqual(result, [])
})

test('getButtonsOfPage trim by maxRows', t => {
	const result = getButtonsOfPage(generateCharArray('A', 'Z'), 1, 5)
	t.deepEqual(result, [
		'A', 'B', 'C', 'D', 'E'
	])
})

test('getButtonsOfPage second page', t => {
	const result = getButtonsOfPage(generateCharArray('A', 'Z'), 1, 3, 2)
	t.deepEqual(result, [
		'D', 'E', 'F'
	])
})

test('getButtonsOfPage partial last page', t => {
	const result = getButtonsOfPage(generateCharArray('A', 'E'), 1, 3, 2)
	t.deepEqual(result, [
		'D', 'E'
	])
})

test('getButtonsOfPage last possible page instead of wanted', t => {
	const result = getButtonsOfPage(generateCharArray('A', 'F'), 1, 3, 3)
	t.deepEqual(result, [
		'D', 'E', 'F'
	])
})

test('maximumButtonsPerPage example', t => {
	t.is(maximumButtonsPerPage(2, 3), 6)
	t.is(maximumButtonsPerPage(4, 4), 16)
})

test('maximumButtonsPerPage default', t => {
	t.is(maximumButtonsPerPage(), 60)
})
