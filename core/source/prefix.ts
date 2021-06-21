export interface PrefixOptions {
	/**
	 * Emoji which is used as prefix when true.
	 *
	 * Defaults to ✅
	 */
	readonly prefixTrue?: string;

	/**
	 * Emoji which is used as prefix when false.
	 *
	 * Defaults to 🚫
	 */
	readonly prefixFalse?: string;

	/**
	 * Do not show the prefix when true.
	 */
	readonly hideTrueEmoji?: boolean;

	/**
	 * Do not show the prefix when false.
	 */
	readonly hideFalseEmoji?: boolean;
}

export const emojiTrue = '✅'
export const emojiFalse = '🚫'

/**
 * Prefixes the text with a true / false emoji.
 * Can also be used with custom prefixes.
 * @param text text which should receive the prefix.
 * @param prefix true / false or a custom (string) prefix.
 * @param options optional options to customize emojis
 */
export function prefixEmoji(text: string, prefix: string | boolean | undefined, options: PrefixOptions = {}): string {
	const internalOptions = {
		...options,
		prefixTrue: options.prefixTrue ?? emojiTrue,
		prefixFalse: options.prefixFalse ?? emojiFalse
	}

	const prefixContent = applyOptionsToPrefix(prefix, internalOptions)
	return prefixText(text, prefixContent)
}

function applyOptionsToPrefix(prefix: string | boolean | undefined, options: PrefixOptions): string | undefined {
	const {
		prefixFalse,
		prefixTrue,
		hideFalseEmoji,
		hideTrueEmoji
	} = options

	if (prefix === true) {
		if (hideTrueEmoji) {
			return undefined
		}

		return prefixTrue
	}

	if (prefix === false) {
		if (hideFalseEmoji) {
			return undefined
		}

		return prefixFalse
	}

	return prefix
}

/**
 * Prefixes the text with the prefix.
 * If the prefix is undefined or '' the raw text is returned.
 * @param text text which should receive the prefix.
 * @param prefix prefix to end up in front of the text.
 */
export function prefixText(text: string, prefix: string | undefined): string {
	if (!prefix) {
		return text
	}

	return `${prefix} ${text}`
}
