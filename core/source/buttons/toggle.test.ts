import test from 'ava'

import {generateToggleButton} from './toggle'

test('hidden does not render any button', async t => {
	const func = generateToggleButton('text', 'pre', {
		hide: () => true,
		isSet: () => {
			throw new Error('do not call as its hidden')
		},
		set: () => {
			throw new Error('do not call as its hidden')
		}
	})

	const button = await func(undefined, 'wow/')
	t.is(button, undefined)
})

test('is true button', async t => {
	const func = generateToggleButton('text', 'pre', {
		isSet: () => true,
		set: () => {
			throw new Error('do not call as the button is not hit')
		}
	})

	const button = await func(undefined, 'wow/')
	t.deepEqual(button, {
		text: '✅ text',
		relativePath: 'pre:false'
	})
})

test('is false button', async t => {
	const func = generateToggleButton('text', 'pre', {
		isSet: () => false,
		set: () => {
			throw new Error('do not call as the button is not hit')
		}
	})

	const button = await func(undefined, 'wow/')
	t.deepEqual(button, {
		text: '🚫 text',
		relativePath: 'pre:true'
	})
})

test('own format', async t => {
	const func = generateToggleButton('text', 'pre', {
		isSet: () => true,
		set: () => {
			throw new Error('do not call as the button is not hit')
		},
		formatState: (_context, text, state) => {
			t.is(text, 'text')
			t.is(state, true)
			return 'lalala'
		}
	})

	const button = await func(undefined, 'wow/')
	t.deepEqual(button, {
		text: 'lalala',
		relativePath: 'pre:false'
	})
})

test('async text', async t => {
	const func = generateToggleButton(() => 'text', 'pre', {
		isSet: () => true,
		set: () => {
			throw new Error('do not call as the button is not hit')
		}
	})

	const button = await func(undefined, 'wow/')
	t.deepEqual(button, {
		text: '✅ text',
		relativePath: 'pre:false'
	})
})
