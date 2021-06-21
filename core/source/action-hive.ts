import {combineTrigger, ensureTriggerChild} from './path'
import {ContextPathFunc, RegExpLike, ConstOrPromise} from './generic-types'

export type ActionFunc<Context> = (context: Context, path: string) => ConstOrPromise<string | boolean>

export interface ButtonAction<Context> {
	readonly trigger: RegExpLike;
	readonly doFunction: ActionFunc<Context>;
}

export class ActionHive<Context> {
	private readonly _actions: Set<ButtonAction<Context>> = new Set()

	add(trigger: RegExpLike, doFunction: ActionFunc<Context>, hide: undefined | ContextPathFunc<Context, boolean>): void {
		ensureTriggerChild(trigger)

		const alreadyExisting = [...this._actions]
			.map(o => o.trigger.source)
			.includes(trigger.source)
		if (alreadyExisting) {
			throw new Error(`The action "${trigger.source.slice(0, -1)}" you wanna add was already added. When you hit the button only the first one will be used and not both. This one can not be accessed then. Change the action code to something different.`)
		}

		this._actions.add({
			trigger,
			doFunction: async (context, path) => {
				if (await hide?.(context, path)) {
					return '.'
				}

				return doFunction(context, path)
			}
		})
	}

	list(path: RegExpLike): ReadonlySet<ButtonAction<Context>> {
		const result: Set<ButtonAction<Context>> = new Set()
		for (const {trigger, doFunction} of this._actions) {
			result.add({
				trigger: combineTrigger(path, trigger),
				doFunction
			})
		}

		return result
	}
}
