import test from 'ava'

import {MenuTemplate} from '../source/menu-template'

test('interact do', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.interact('Button', 'unique', {})
	}, {message: /You have to specify/})
})

test('choose do', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.choose('unique', [], {})
	}, {message: /You have to specify/})
})

test('select set', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.select('unique', [], {
			isSet: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('select isSet', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.select('unique', [], {
			set: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('toggle set', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.toggle('Button', 'unique', {
			isSet: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('toggle isSet', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.toggle('Button', 'unique', {
			set: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('pagination getCurrentPage', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.pagination('unique', {
			getTotalPages: () => {
				throw new Error('dont call this function')
			},
			setPage: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('pagination getTotalPages', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.pagination('unique', {
			getCurrentPage: () => {
				throw new Error('dont call this function')
			},
			setPage: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})

test('pagination setPage', t => {
	const menu = new MenuTemplate('whatever')
	t.throws(() => {
		// @ts-expect-error
		menu.pagination('unique', {
			getCurrentPage: () => {
				throw new Error('dont call this function')
			},
			getTotalPages: () => {
				throw new Error('dont call this function')
			}
		})
	}, {message: /You have to specify/})
})
