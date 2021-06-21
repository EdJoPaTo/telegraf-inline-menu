import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('interaction doFunc', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.interact('Button', 'unique', {
			// @ts-expect-error
			doFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {
		message: /renamed to do/
	})
})

test('select set', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.select('unique', [], {
			// @ts-expect-error
			setFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /renamed to/})
})

test('choose do', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.choose('unique', [], {
			// @ts-expect-error
			doFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /renamed to/})
})

test('select isSet', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.select('unique', [], {
			// @ts-expect-error
			isSetFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /renamed to/})
})

test('toggle set', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.toggle('Button', 'unique', {
			// @ts-expect-error
			setFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /renamed to/})
})

test('toggle isSet', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		menu.toggle('Button', 'unique', {
			// @ts-expect-error
			isSetFunc: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /renamed to/})
})
