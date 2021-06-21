import test from 'ava'

import {ActionHive, ActionFunc} from './action-hive'

test('add nothing is empty', t => {
	const a = new ActionHive()

	const result = a.list(/^foo\//)
	t.is(result.size, 0)
})

test('add simple doFunction', t => {
	const a = new ActionHive()

	const doFunction = (): never => {
		throw new Error('dont call the action function on list')
	}

	a.add(/bar$/, doFunction, undefined)

	const resultSet = a.list(/^foo\//)
	t.is(resultSet.size, 1)
	const result = [...resultSet][0]!

	t.truthy(new RegExp(result.trigger.source, result.trigger.flags).exec('foo/bar'))

	t.is(result.trigger.source, '^foo\\/bar$')
	t.is(result.trigger.flags, '')
})

test('doFunction without hide runs doFunction', async t => {
	t.plan(3)
	const a = new ActionHive<string>()

	const doFunction: ActionFunc<string> = (context, path) => {
		t.is(context, 'bob')
		t.is(path, 'foo/bar')
		return 'wow'
	}

	a.add(/bar$/, doFunction, undefined)

	const resultSet = a.list(/^foo\//)
	const result = [...resultSet][0]

	const target = await result?.doFunction('bob', 'foo/bar')
	t.is(target, 'wow')
})

test('doFunction with hide false runs doFunction', async t => {
	t.plan(3)
	const a = new ActionHive<string>()

	const doFunction: ActionFunc<string> = (context, path) => {
		t.is(context, 'bob')
		t.is(path, 'foo/bar')
		return 'wow'
	}

	a.add(/bar$/, doFunction, () => false)

	const resultSet = a.list(/^foo\//)
	const result = [...resultSet][0]

	const target = await result?.doFunction('bob', 'foo/bar')
	t.is(target, 'wow')
})

test('doFunction with hide true skips doFunction and returns update menu path .', async t => {
	t.plan(1)
	const a = new ActionHive<string>()

	const doFunction: ActionFunc<string> = (context, path) => {
		t.is(context, 'bob')
		t.is(path, 'foo/bar')
		return 'wow'
	}

	a.add(/bar$/, doFunction, () => true)

	const resultSet = a.list(/^foo\//)
	const result = [...resultSet][0]

	const target = await result?.doFunction('bob', 'foo/bar')
	t.is(target, '.')
})

test('adding two times the same trigger throws', t => {
	const a = new ActionHive()

	const doFunction: ActionFunc<unknown> = () => {
		throw new Error('the do Function has not to be called')
	}

	a.add(/foo$/, doFunction, undefined)
	t.throws(() => {
		a.add(/foo$/, doFunction, undefined)
	}, {
		message: /already added.+action/
	})
})
