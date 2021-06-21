// Copied from typegram

/* eslint-disable @typescript-eslint/no-redeclare, @typescript-eslint/no-empty-interface */

export type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML'

export namespace Location {
	export interface CommonLocation {
		/** Longitude as defined by sender */
		longitude: number;
		/** Latitude as defined by sender */
		latitude: number;
		/** The radius of uncertainty for the location, measured in meters; 0-1500 */
		horizontal_accuracy?: number;
	}
	export interface LiveLocation extends CommonLocation {
		/** Time relative to the message sending date, during which the location can be updated, in seconds. For active live locations only. */
		live_period: number;
		/** The direction in which user is moving, in degrees; 1-360. For active live locations only. */
		heading: number;
		/** Maximum distance for proximity alerts about approaching another chat member, in meters. For sent live locations only. */
		proximity_alert_radius?: number;
	}
}

/** This object represents a point on the map. */
export type Location = Location.CommonLocation | Location.LiveLocation

/** This object represents a venue. */
export interface Venue {
/** Venue location. Can't be a live location */
	location: Location;
	/** Name of the venue */
	title: string;
	/** Address of the venue */
	address: string;
	/** Foursquare identifier of the venue */
	foursquare_id?: string;
	/** Foursquare type of the venue. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
	foursquare_type?: string;
	/** Google Places identifier of the venue */
	google_place_id?: string;
	/** Google Places type of the venue. (See supported types.) */
	google_place_type?: string;
}

export namespace InlineKeyboardButton {
	interface AbstractInlineKeyboardButton {
		/** Label text on the button */
		text: string;
	}
	export interface UrlButton extends AbstractInlineKeyboardButton {
		/** HTTP or tg:// url to be opened when button is pressed */
		url: string;
	}
	export interface LoginButton extends AbstractInlineKeyboardButton {
		/** An HTTP URL used to automatically authorize the user. Can be used as a replacement for the Telegram Login Widget. */
		login_url: LoginUrl;
	}
	export interface CallbackButton extends AbstractInlineKeyboardButton {
		/** Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes */
		callback_data: string;
	}
	export interface SwitchInlineButton extends AbstractInlineKeyboardButton {
		/** If set, pressing the button will prompt the user to select one of their chats, open that chat and insert the bot's username and the specified inline query in the input field. Can be empty, in which case just the bot's username will be inserted.

Note: This offers an easy way for users to start using your bot in inline mode when they are currently in a private chat with it. Especially useful when combined with switch_pm… actions – in this case the user will be automatically returned to the chat they switched from, skipping the chat selection screen. */
		switch_inline_query: string;
	}
	export interface SwitchInlineCurrentChatButton
		extends AbstractInlineKeyboardButton {
		/** If set, pressing the button will insert the bot's username and the specified inline query in the current chat's input field. Can be empty, in which case only the bot's username will be inserted.

This offers a quick way for the user to open your bot in inline mode in the same chat – good for selecting something from multiple options. */
		switch_inline_query_current_chat: string;
	}
	export interface GameButton extends AbstractInlineKeyboardButton {
		/** Description of the game that will be launched when the user presses the button.

NOTE: This type of button must always be the first button in the first row. */
		callback_game: CallbackGame;
	}
	export interface PayButton extends AbstractInlineKeyboardButton {
		/** Specify True, to send a Pay button.

NOTE: This type of button must always be the first button in the first row. */
		pay: boolean;
	}
}

/** This object represents one button of an inline keyboard. You must use exactly one of the optional fields. */
export type InlineKeyboardButton =
| InlineKeyboardButton.CallbackButton
| InlineKeyboardButton.GameButton
| InlineKeyboardButton.LoginButton
| InlineKeyboardButton.PayButton
| InlineKeyboardButton.SwitchInlineButton
| InlineKeyboardButton.SwitchInlineCurrentChatButton
| InlineKeyboardButton.UrlButton

/** This object represents a parameter of the inline keyboard button used to automatically authorize a user. Serves as a great replacement for the Telegram Login Widget when the user is coming from Telegram. All the user needs to do is tap/click a button and confirm that they want to log in.
Telegram apps support these buttons as of version 5.7. */
export interface LoginUrl {
/** An HTTP URL to be opened with user authorization data added to the query string when the button is pressed. If the user refuses to provide authorization data, the original URL without information about the user will be opened. The data added is the same as described in Receiving authorization data.

NOTE: You must always check the hash of the received data to verify the authentication and the integrity of the data as described in Checking authorization. */
	url: string;
	/** New text of the button in forwarded messages. */
	forward_text?: string;
	/** Username of a bot, which will be used for user authorization. See Setting up a bot for more details. If not specified, the current bot's username will be assumed. The url's domain must be the same as the domain linked with the bot. See Linking your domain to the bot for more details. */
	bot_username?: string;
	/** Pass True to request the permission for your bot to send messages to the user. */
	request_write_access?: boolean;
}

/** A placeholder, currently holds no information. Use BotFather to set up your game. */
export interface CallbackGame {}
