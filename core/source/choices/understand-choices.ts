import {Choices, ChoicesArray, ChoicesMap} from './types'

export function choicesIsArray(choices: Choices): choices is ChoicesArray {
	return Array.isArray(choices)
}

export function choicesIsMap(choices: Choices): choices is ChoicesMap {
	return choices instanceof Map
}

export function getChoiceKeysFromChoices(choices: Choices): string[] {
	if (choicesIsArray(choices)) {
		return choices.map(o => String(o))
	}

	if (choicesIsMap(choices)) {
		return [...choices.keys()].map(o => String(o))
	}

	return Object.keys(choices)
}

export function getChoiceTextByKey(choices: Choices, key: string): string {
	if (choicesIsArray(choices)) {
		return key
	}

	if (choicesIsMap(choices)) {
		return choices.get(key) ?? key
	}

	const choice = choices[key]
	if (choice) {
		return choice
	}

	return key
}

export function ensureCorrectChoiceKeys(actionPrefix: string, path: string, choiceKeys: readonly string[]): void {
	const containSlashExample = choiceKeys.find(o => o.includes('/'))
	if (containSlashExample) {
		throw new Error(`Choices can not contain '/'. Found '${containSlashExample}' in action '${actionPrefix}' at path '${path}'.`)
	}
}
