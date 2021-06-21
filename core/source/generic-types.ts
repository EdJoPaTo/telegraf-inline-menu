export type ConstOrPromise<T> = T | Promise<T>

export type ContextFunc<Context, ReturnType> = (context: Context) => ConstOrPromise<ReturnType>
export type ContextPathFunc<Context, ReturnType> = (context: Context, path: string) => ConstOrPromise<ReturnType>

export type ConstOrContextFunc<Context, ReturnType> = ReturnType | ContextFunc<Context, ReturnType>
export type ConstOrContextPathFunc<Context, ReturnType> = ReturnType | ContextPathFunc<Context, ReturnType>

export interface RegExpLike {
	readonly source: string;
	readonly flags?: string;
}

export function isObject(something: unknown): something is Record<string, unknown> {
	return typeof something === 'object' && something !== null
}

export function hasTruthyKey(something: unknown, key: string): boolean {
	return isObject(something) && key in something && Boolean(something[key])
}

export function isRegExpExecArray(something: unknown): something is RegExpExecArray {
	if (!Array.isArray(something)) {
		return false
	}

	if (typeof something[0] !== 'string') {
		return false
	}

	if (!('index' in something && 'input' in something)) {
		return false
	}

	return true
}

// TODO: remove when .filter(o => o !== undefined) works.
export function filterNonNullable<T>(): (o: T) => o is NonNullable<T> {
	return (o): o is NonNullable<T> => o !== null && o !== undefined
}
