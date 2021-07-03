/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */

import {Context as TelegrafContext, Api as Telegram} from 'grammy'
import {InputMedia, Message} from 'grammy/out/platform'

import {Body, TextBody, MediaBody, LocationBody, isMediaBody, isLocationBody, isTextBody, getBodyText, isVenueBody, VenueBody} from './core/body'
import {ensurePathMenu} from './core/path'
import {InlineKeyboard} from './core/keyboard'
import {MenuLike} from './core/menu-like'

/**
 * Generic Method which is able to send a menu to a context (given a path where it is)
 */
export type SendMenuFunc<Context> = (menu: MenuLike<Context>, context: Context, path: string) => Promise<unknown>

/**
 * Method which is able to send a menu to a chat.
 * Generated via `generateSendMenuToChatFunction`.
 */
export type SendMenuToChatFunction<Context> = (chatId: string | number, context: Context, extra?: Readonly<Record<string, unknown>>) => Promise<Message>

/**
 * Method which is able to edit a message in a chat into a menu.
 * Generated via `generateEditMessageIntoMenuFunction`.
 */
export type EditMessageIntoMenuFunction<Context> = (chatId: number | string, messageId: number, context: Context, extra?: Readonly<Record<string, unknown>>) => Promise<Message | true>

/**
 * Reply a menu to a context as a new message
 * @param menu menu to be shown
 * @param context current Telegraf context to reply the menu to it
 * @param path path of the menu
 * @param extra optional additional Telegraf Extra options
 */
export async function replyMenuToContext<Context extends TelegrafContext>(menu: MenuLike<Context>, context: Context, path: string, extra: Readonly<Record<string, unknown>> = {}): Promise<Message> {
	ensurePathMenu(path)
	const body = await menu.renderBody(context, path)
	const keyboard = await menu.renderKeyboard(context, path)
	return replyRenderedMenuPartsToContext(body, keyboard, context, extra)
}

/**
 * Edit the context into the menu. If thats not possible the current message is deleted and a new message is replied
 * @param menu menu to be shown
 * @param context current Telegraf context to edit the menu into
 * @param path path of the menu
 * @param extra optional additional Telegraf Extra options
 */
export async function editMenuOnContext<Context extends TelegrafContext>(menu: MenuLike<Context>, context: Context, path: string, extra: Readonly<Record<string, unknown>> = {}): Promise<Message | boolean> {
	ensurePathMenu(path)
	const body = await menu.renderBody(context, path)
	const keyboard = await menu.renderKeyboard(context, path)

	const message = context.callbackQuery?.message
	if (!message) {
		return replyRenderedMenuPartsToContext(body, keyboard, context, extra)
	}

	if (isMediaBody(body)) {
		if ('animation' in message || 'audio' in message || 'document' in message || 'photo' in message || 'video' in message) {
			const media: InputMedia = {
				type: body.type,
				media: body.media,
				caption: body.text,
				parse_mode: body.parse_mode
			}

			return context.editMessageMedia(media, createEditMediaExtra(keyboard, extra))
				// eslint-disable-next-line promise/prefer-await-to-then
				.catch(catchMessageNotModified)
		}
	} else if (isLocationBody(body) || isVenueBody(body)) {
		// Dont edit the message, just recreate it.
	} else if (isTextBody(body)) {
		const text = getBodyText(body)
		if ('text' in message) {
			return context.editMessageText(text, createTextExtra(body, keyboard, extra))
				// eslint-disable-next-line promise/prefer-await-to-then
				.catch(catchMessageNotModified)
		}
	} else {
		throw new TypeError('The body has to be a string or an object containing text or media. Check the telegraf-inline-menu Documentation.')
	}

	// The current menu is incompatible: delete and reply new one
	const [repliedMessage] = await Promise.all([
		replyRenderedMenuPartsToContext(body, keyboard, context, extra),
		deleteMenuFromContext(context)
	])
	return repliedMessage
}

/**
 * Delete the message on the context.
 * If thats not possible the reply markup (keyboard) is removed. The user can not press any buttons on that old message.
 * @param context context of the message to be deleted
 */
export async function deleteMenuFromContext<Context extends TelegrafContext>(context: Context): Promise<void> {
	try {
		await context.deleteMessage()
	} catch {
		await context.editMessageReplyMarkup(undefined)
	}
}

/**
 * Deletes to menu of the current context and replies a new one ensuring the menu is at the end of the chat.
 * @param menu menu to be shown
 * @param context current Telegraf context to send the menu to
 * @param path path of the menu
 * @param extra optional additional Telegraf Extra options
 */
export async function resendMenuToContext<Context extends TelegrafContext>(menu: MenuLike<Context>, context: Context, path: string, extra: Readonly<Record<string, unknown>> = {}): Promise<Message> {
	const [menuMessage] = await Promise.all([
		replyMenuToContext(menu, context, path, extra),
		deleteMenuFromContext(context)
	])
	return menuMessage
}

function catchMessageNotModified(error: unknown): false {
	if (error instanceof Error && error.message.includes('message is not modified')) {
		// ignore
		return false
	}

	throw error
}

async function replyRenderedMenuPartsToContext<Context extends TelegrafContext>(body: Body, keyboard: InlineKeyboard, context: Context, extra: Readonly<Record<string, unknown>>): Promise<Message> {
	if (isMediaBody(body)) {
		const mediaExtra = createSendMediaExtra(body, keyboard, extra)

		// eslint-disable-next-line default-case
		switch (body.type) {
			case 'animation':
				return context.replyWithAnimation(body.media, mediaExtra)
			case 'audio':
				return context.replyWithAudio(body.media, mediaExtra)
			case 'document':
				return context.replyWithDocument(body.media, mediaExtra)
			case 'photo':
				return context.replyWithPhoto(body.media, mediaExtra)
			case 'video':
				return context.replyWithVideo(body.media, mediaExtra)
		}
	}

	if (isLocationBody(body)) {
		return context.replyWithLocation(body.location.latitude, body.location.longitude, createLocationExtra(body, keyboard, extra))
	}

	if (isVenueBody(body)) {
		const {location, title, address} = body.venue
		return context.replyWithVenue(location.latitude, location.longitude, title, address, createVenueExtra(body, keyboard, extra))
	}

	if (isTextBody(body)) {
		const text = getBodyText(body)
		return context.reply(text, createTextExtra(body, keyboard, extra))
	}

	throw new Error('The body has to be a string or an object containing text or media. Check the telegraf-inline-menu Documentation.')
}

/**
 * Generate a function to send the menu towards a chat from external events
 * @param telegram The Telegram object to do the API calls with later on
 * @param menu menu to be shown
 * @param path path of the menu
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function generateSendMenuToChatFunction<Context>(telegram: Readonly<Telegram>, menu: MenuLike<Context>, path: string): SendMenuToChatFunction<Context> {
	return async (chatId, context, extra = {}) => {
		const body = await menu.renderBody(context, path)
		const keyboard = await menu.renderKeyboard(context, path)

		if (isMediaBody(body)) {
			const mediaExtra = createSendMediaExtra(body, keyboard, extra)

			// eslint-disable-next-line default-case
			switch (body.type) {
				case 'animation':
					return telegram.sendAnimation(chatId, body.media, mediaExtra)
				case 'audio':
					return telegram.sendAudio(chatId, body.media, mediaExtra)
				case 'document':
					return telegram.sendDocument(chatId, body.media, mediaExtra)
				case 'photo':
					return telegram.sendPhoto(chatId, body.media, mediaExtra)
				case 'video':
					return telegram.sendVideo(chatId, body.media, mediaExtra)
			}
		}

		if (isLocationBody(body)) {
			return telegram.sendLocation(chatId, body.location.latitude, body.location.longitude, createLocationExtra(body, keyboard, extra))
		}

		if (isVenueBody(body)) {
			const {location, title, address} = body.venue
			return telegram.sendVenue(chatId, location.latitude, location.longitude, title, address, createVenueExtra(body, keyboard, extra))
		}

		if (isTextBody(body)) {
			const text = getBodyText(body)
			return telegram.sendMessage(chatId, text, createTextExtra(body, keyboard, extra))
		}

		throw new Error('The body has to be a string or an object containing text or media. Check the telegraf-inline-menu Documentation.')
	}
}

/**
 * Edit the message into the the menu.
 * This fails when the current message is not compatible with the menu (you cant edit a media message into a text message and vice versa)
 * @param telegram The Telegram object to do the API calls with later on
 * @param menu menu to be shown
 * @param path path of the menu
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function generateEditMessageIntoMenuFunction<Context>(telegram: Readonly<Telegram>, menu: MenuLike<Context>, path: string): EditMessageIntoMenuFunction<Context> {
	return async (chatId, messageId, context, extra = {}) => {
		const body = await menu.renderBody(context, path)
		const keyboard = await menu.renderKeyboard(context, path)

		if (isMediaBody(body)) {
			const media: InputMedia = {
				type: body.type,
				media: body.media,
				caption: body.text,
				parse_mode: body.parse_mode
			}

			const mediaExtra = createEditMediaExtra(keyboard, extra)
			return telegram.editMessageMedia(chatId, messageId, media, mediaExtra)
		}

		if (isLocationBody(body)) {
			throw new Error('You can not edit into a location body. You have to send the menu as a new message.')
		}

		if (isVenueBody(body)) {
			throw new Error('You can not edit into a venue body. You have to send the menu as a new message.')
		}

		if (isTextBody(body)) {
			const text = getBodyText(body)
			return telegram.editMessageText(chatId, messageId, text, createTextExtra(body, keyboard, extra))
		}

		throw new Error('The body has to be a string or an object containing text or media. Check the telegraf-inline-menu Documentation.')
	}
}

function createTextExtra(body: string | TextBody, keyboard: InlineKeyboard, base: Readonly<Record<string, unknown>>) {
	return {
		...base,
		parse_mode: typeof body === 'string' ? undefined : body.parse_mode,
		disable_web_page_preview: typeof body !== 'string' && body.disable_web_page_preview,
		reply_markup: {
			inline_keyboard: keyboard.map(o => [...o])
		}
	}
}

function createSendMediaExtra(body: MediaBody, keyboard: InlineKeyboard, base: Readonly<Record<string, unknown>>) {
	return {
		...base,
		parse_mode: body.parse_mode,
		caption: body.text,
		reply_markup: {
			inline_keyboard: keyboard.map(o => [...o])
		}
	}
}

function createEditMediaExtra(keyboard: InlineKeyboard, base: Readonly<Record<string, unknown>>) {
	return {
		...base,
		reply_markup: {
			inline_keyboard: keyboard.map(o => [...o])
		}
	}
}

function createLocationExtra(body: LocationBody, keyboard: InlineKeyboard, base: Readonly<Record<string, unknown>>) {
	return {
		...base,
		live_period: body.live_period,
		reply_markup: {
			inline_keyboard: keyboard.map(o => [...o])
		}
	}
}

function createVenueExtra(body: VenueBody, keyboard: InlineKeyboard, base: Readonly<Record<string, unknown>>) {
	return {
		...base,
		foursquare_id: body.venue.foursquare_id,
		foursquare_type: body.venue.foursquare_type,
		reply_markup: {
			inline_keyboard: keyboard.map(o => [...o])
		}
	}
}
