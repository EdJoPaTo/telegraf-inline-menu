import test from 'ava'
import {Context as TelegrafContext} from 'telegraf'

import {MenuTemplate} from '../../source'
import {MEDIA_TYPES} from '../../source/core/body'

import {replyMenuToContext} from '../../source/send-menu'

for (const mediaType of MEDIA_TYPES) {
	test('reply media ' + mediaType, async t => {
		t.plan(2)
		const menu = new MenuTemplate<TelegrafContext>({media: 'whatever', type: mediaType})

		const replyFunction = async (media: unknown, extra: unknown) => {
			t.is(media, 'whatever')
			t.deepEqual(extra, {
				caption: undefined,
				parse_mode: undefined,
				reply_markup: {
					inline_keyboard: []
				}
			})
			return Promise.resolve(undefined as any)
		}

		const fakeContext: Partial<TelegrafContext> = {
			callbackQuery: {
				id: '666',
				from: undefined as any,
				chat_instance: '666',
				data: '666'
			},
			replyWithAnimation: replyFunction,
			replyWithAudio: replyFunction,
			replyWithDocument: replyFunction,
			replyWithPhoto: replyFunction,
			replyWithVideo: replyFunction
		}

		await replyMenuToContext(menu, fakeContext as any, '/')
	})
}
