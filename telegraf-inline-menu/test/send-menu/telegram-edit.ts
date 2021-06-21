import {Context as TelegrafContext, Telegram} from 'telegraf'
import test from 'ava'

import {MenuTemplate} from '../../source'
import {MEDIA_TYPES} from '../../source/core/body'

import {generateEditMessageIntoMenuFunction} from '../../source/send-menu'

test('text', async t => {
	const menu = new MenuTemplate<TelegrafContext>('whatever')

	const fakeTelegram: Partial<Telegram> = {
		editMessageText: async (chatId, messageId, inlineMessageId, text, extra) => {
			t.is(chatId, 13)
			t.is(messageId, 37)
			t.is(inlineMessageId, undefined)
			t.is(text, 'whatever')
			t.deepEqual(extra, {
				disable_web_page_preview: false,
				parse_mode: undefined,
				reply_markup: {
					inline_keyboard: []
				}
			})
			return Promise.resolve(true)
		}
	}

	const editIntoFunction = generateEditMessageIntoMenuFunction(fakeTelegram as any, menu, '/')

	const fakeContext: Partial<TelegrafContext> = {
		callbackQuery: {
			id: '666',
			from: undefined as any,
			chat_instance: '666',
			data: '666'
		}
	}

	await editIntoFunction(13, 37, fakeContext as any)
})

for (const mediaType of MEDIA_TYPES) {
	test('media ' + mediaType, async t => {
		const menu = new MenuTemplate<TelegrafContext>({media: 'whatever', type: mediaType})

		const fakeTelegram: Partial<Telegram> = {
			editMessageMedia: async (chatId: unknown, messageId: unknown, inlineMessageId: unknown, media: unknown, extra: unknown) => {
				t.is(chatId, 13)
				t.is(messageId, 37)
				t.is(inlineMessageId, undefined)
				t.deepEqual(media, {
					media: 'whatever',
					type: mediaType,
					caption: undefined,
					parse_mode: undefined
				})
				t.deepEqual(extra, {
					reply_markup: {
						inline_keyboard: []
					}
				})
				return Promise.resolve(true)
			}
		}

		const editIntoFunction = generateEditMessageIntoMenuFunction(fakeTelegram as any, menu, '/')

		const fakeContext: Partial<TelegrafContext> = {
			callbackQuery: {
				id: '666',
				from: undefined as any,
				chat_instance: '666',
				data: '666'
			}
		}

		await editIntoFunction(13, 37, fakeContext as any)
	})
}

test('location', async t => {
	const menu = new MenuTemplate<TelegrafContext>({location: {latitude: 53.5, longitude: 10}, live_period: 666})

	const editIntoFunction = generateEditMessageIntoMenuFunction({} as any, menu, '/')

	const fakeContext: Partial<TelegrafContext> = {
		callbackQuery: {
			id: '666',
			from: undefined as any,
			chat_instance: '666',
			data: '666'
		}
	}

	await t.throwsAsync(async () => {
		await editIntoFunction(13, 37, fakeContext as any)
	}, {
		message: /can not edit into a location body/
	})
})

test('venue', async t => {
	const menu = new MenuTemplate<TelegrafContext>({venue: {location: {latitude: 53.5, longitude: 10}, title: 'A', address: 'B'}})

	const editIntoFunction = generateEditMessageIntoMenuFunction({} as any, menu, '/')

	const fakeContext: Partial<TelegrafContext> = {
		callbackQuery: {
			id: '666',
			from: undefined as any,
			chat_instance: '666',
			data: '666'
		}
	}

	await t.throwsAsync(async () => {
		await editIntoFunction(13, 37, fakeContext as any)
	}, {
		message: /can not edit into a venue body/
	})
})
