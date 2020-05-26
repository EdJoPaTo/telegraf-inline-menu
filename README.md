# Telegraf Inline Menu

[![NPM Version](https://img.shields.io/npm/v/telegraf-inline-menu.svg)](https://www.npmjs.com/package/telegraf-inline-menu)
[![node](https://img.shields.io/node/v/telegraf-inline-menu.svg)](https://www.npmjs.com/package/telegraf-inline-menu)
[![Build Status](https://travis-ci.org/EdJoPaTo/telegraf-inline-menu.svg?branch=master)](https://travis-ci.org/EdJoPaTo/telegraf-inline-menu)
[![Dependency Status](https://david-dm.org/EdJoPaTo/telegraf-inline-menu/status.svg)](https://david-dm.org/EdJoPaTo/telegraf-inline-menu)
[![Peer Dependency Status](https://david-dm.org/EdJoPaTo/telegraf-inline-menu/peer-status.svg)](https://david-dm.org/EdJoPaTo/telegraf-inline-menu?type=peer)
[![Dev Dependency Status](https://david-dm.org/EdJoPaTo/telegraf-inline-menu/dev-status.svg)](https://david-dm.org/EdJoPaTo/telegraf-inline-menu?type=dev)

This menu library is made to easily create an inline menu for your Telegram bot.

TODO: Gif


# This is the documentation of the upcoming version 5. [If you are interested in version 4 see its documentation](https://github.com/EdJoPaTo/telegraf-inline-menu/blob/v4.0.1/README.md)

Version 5 is not yet stable.
Some things are still missing and the documentation is not fully there yet.
If you want to test it out I appreciate the feedback!

# Installation

```
$ npm install telegraf-inline-menu
```

or using `yarn`:

```
$ yarn add telegraf-inline-menu
```

# Examples

## Basic Example

```ts
const {Telegraf} = require('telegraf')
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu')
// or
import {Telegraf} from 'telegraf'
import {MenuTemplate, MenuMiddleware} from 'telegraf-inline-menu'

const menu = new MenuTemplate<MyContext>(ctx => `Hey ${ctx.from.first_name}!`)

menu.interact('I am excited!', 'a', {
  do: async ctx => ctx.reply('As am I!')
})

const bot = new Telegraf(process.env.BOT_TOKEN)

const menuMiddleware = new MenuMiddleware('/', menu)
bot.command('start', ctx => menuMiddleware.replyToContext(ctx))
bot.use(menuMiddleware)

bot.launch()
```

## More interesting one

TODO: Gif

Look at the code here : [TypeScript](examples/main-typescript.ts) / [JavaScript (not yet available)](examples/main-javascript.js)

# Migrate from version 4 to version 5

Incomplete list of things to migrate:

- `TelegrafInlineMenu` was splitted into multiple Classes.
  When you used `new TelegrafInlineMenu(text)` you will use `new MenuTemplate(body)` now.
- Applying the menu to the bot via `bot.use` changed. This can now be done with the `MenuMiddleware`. Check the [Basic Example](#Basic-Example)
- `button` and `simpleButton` are combined and renamed into `interact`. See [How can I run a simple method when pressing a button?](#how-can-i-run-a-simple-method-when-pressing-a-button)
- `selectSubmenu` was renamed to `chooseIntoSubmenu`
- `select` was splitted into `choose` and `select`. See [Whats the difference between choose and select?](#Whats-the-difference-between-choose-and-select)
- `question` is moved into a seperate library. see [Didnt this menu had a question function?](#Didnt-this-menu-had-a-question-function)
- The menu does not automatically add back and main menu buttons anymore.
  Use `menu.manualRow(createBackMainMenuButtons())` for that at each menu which should include these buttons.
- `setCommand` and `replyMenuMiddleware` were replaced by multiple different functions. See [Can I send the menu manually?](#Can-I-send-the-menu-manually)

# How does it work

Telegrams inline keyboards have buttons.
These buttons have a text and callback data.

When a button is hit the callback data is sent to the bot.
You know this from Telegraf from `bot.action`.

This library both creates the buttons and listens for callback data events.
When a button is pressed and its callback data is occuring the function relevant to the button is executed.

In order to handle tree like menu structures with submenus the buttons itself use a tree like structure to differentiate between the buttons.
Imagine it as the file structure on a PC.

The main menu uses `/` as callback data.
A button in the main menu will use `/my-button` as callback data.
When you create a submenu it will end with a `/` again: `/my-submenu/`.

This way the library knows what do to when an action occurs:
If the callback data ends with a `/` it will show the corresponding menu.
If it does not end with a `/` it is an interaction to be executed.

You can use a Telegraf middleware in order to see which callback data is used when you hit a button:

```ts
bot.use((ctx, next) => {
	if (ctx.callbackQuery) {
		console.log('callback data just happened', ctx.callbackQuery.data)
	}

	return next()
})

bot.use(menuMiddleware)
```

You can also take a look on all the regular expressions the menu middleware is using to notice a button click with `console.log(menuMiddleware.tree())`.
Dont be scared by the output and try to find where you can find the structure in the sourcecode.
When you hit a button the specific callback data will be matched by one of the regular expressions.
Also try to create a new button and find it within the tree.

If you want to manually send your submenu `/my-submenu/` you have to supply the same path that is used when you press the button in the menu.

## Improve the docs

If you have any questions on how the library works head out to the issues and ask ahead.
You can also join the [Telegraf community chat](https://t.me/TelegrafJSChat) in order to talk about the questions on your mind.

When you think there is something to improve on this explanation, feel free to open a Pull Request!
I already get stuck in my bubble on how this is working.
You are the expert on getting the knowledge about this library.
Lets improve things together!

# FAQ

## Can I use HTML / MarkdownV2 in the message body?

Maybe this is also useful: [npm package telegram-format](https://github.com/EdJoPaTo/telegram-format)

```ts
const menu = new MenuTemplate<MyContext>(ctx => {
	const text = '_Hey_ *there*!'
	return {text, parse_mode: 'Markdown'}
})
```

## How can I run a simple method when pressing a button?

```ts
menu.interact('Text', 'unique', {
	do: async ctx => ctx.answerCbQuery('yaay')
})
```

## How does the menu update after running my interaction?

Return the relative path to the menu you wanna show.
This is '.' most of the times as you want to return to the current menu.

```ts
menu.interact('Text', 'unique', {
	do: async ctx => {
		await ctx.answerCbQuery('yaay')
		return '.'
	}
})
```

## How can I show an url button?
```ts
menu.url('Text', 'https://edjopato.de')
```

## How can I display two buttons in the same row?

Use `joinLastRow` in the second button

```ts
menu.interact('Text', 'unique', {
	do: async ctx => ctx.answerCbQuery('yaay')
})

menu.interact('Text', 'unique', {
	joinLastRow: true,
	do: async ctx => ctx.answerCbQuery('yaay')
})
```

## How can I toggle a value easily?

```ts
menu.toggle('Text', 'unique', {
	isSet: ctx => ctx.session.isFunny,
	set: (ctx, newState) => {
		ctx.session.isFunny = newState
	}
})
```

## How can I select one of many values?

```ts
menu.select('unique', ['human', 'bird'], {
	isSet: (ctx, key) => ctx.session.choice === key,
	set: (ctx, key) => {
		ctx.session.choice = key
	}
})
```

## How can I toggle many values?

```ts
menu.select('unique', ['has arms', 'has legs', 'has eyes'], {
	multiselect: true,
	isSet: (ctx, key) => ctx.session.choice[key],
	set: (ctx, key, newState) => {
		ctx.session.choice[key] = newState
	}
})
```

## How can I interact with many values based on the pressed button?

```ts
menu.choose('unique', ['walk', 'swim'], {
	do: async (ctx, key) => {
		await ctx.answerCbQuery(`Lets ${key}`)
		// You can also go back to the parent menu afterwards for some 'quick' interactions in submenus
		return '..'
	}
})
```

## Whats the difference between choose and select?

If you want to do something based on the choice use `menu.choose`.
If you want to change the state of something, select one out of many options for example, use `menu.select`.

`menu.select` automatically updates the menu on pressing the button and shows what it currently selected.
`menu.choose` runs the method you want to run.

## How can I use a submenu?

```ts
const submenu = new MenuTemplate<MyContext>('I am a submenu')
submenu.interact('Text', 'unique', {
	do: async ctx => ctx.answerCbQuery('You hit a button in a submenu')
})
submenu.manualRow(createBackMainMenuButtons())

menu.submenu('Text', 'unique', submenu)
```

## How can I use a submenu with many choices?

```ts
const submenu = new MenuTemplate<MyContext>(ctx => `You chose city ${ctx.match[1]}`)
submenu.interact('Text', 'unique', {
	do: async ctx => {
		console.log('Take a look at ctx.match. It contains the chosen city', ctx.match)
		return ctx.answerCbQuery('You hit a button in a submenu')
	}
})
submenu.manualRow(createBackMainMenuButtons())

menu.chooseIntoSubmenu('unique', ['Gotham', 'Mos Eisley', 'Springfield'], submenu)
```

## Can I send the menu manually?

If you want to send the root menu use `menuMiddleware.replyToContext()`

```ts
const menuMiddleware = new MenuMiddleware('/', menu)
bot.command('start', ctx => menuMiddleware.replyToContext(ctx))
```

If you want to send a submenu use `replyMenuToContext`.
See [How does it work](#how-does-it-work) to understand which path you have to supply as the last argument.

```ts
import {MenuTemplate, replyMenuToContext} from 'telegraf-inline-menu'
const settingsMenu = new MenuTemplate('Settings')
bot.command('settings', async ctx => replyMenuToContext(settingsMenu, ctx, '/settings/'))
```

## Can I send the menu from external events?

When sending from external events you still have to supply the context to the message or some parts of your menu might not work as expected!

See [How does it work](#how-does-it-work) to understand which path you have to supply as the last argument of `generateSendMenuToChatFunction`.

```ts
const sendMenuFunction = generateSendMenuToChatFunction(menu, '/settings/')

async function externalEventOccured() {
	await sendMenuFunction(bot.telegram, userId, context)
}
```

## Didnt this menu had a question function?

Yes. It was moved into a seperate library with version 5 as it made the source code overly complicated.

When you want to use it check [telegraf-stateless-question](https://github.com/EdJoPaTo/telegraf-stateless-question).

```ts
const myQuestion = new TelegrafStatelessQuestion<MyContext>('unique', async context => {
	const answer = context.message.text
	console.log('user responded with', answer)
	await replyMenuToContext(menu, context, '/use/path/from/where/you/came/')
})

bot.use(myQuestion.middleware())

menu.interact('Question', 'unique', {
	do: async context => {
		await myQuestion.replyWithMarkdown(context, 'Tell me the answer to the world and everything.')
	}
})
```

# Documentation

The methods should have explaining documentation by itself.
Also there should be multiple @example entries in the docs to see different ways of using the method.
(At least soon…)

You can help and create a Pull Request if you think the documentation can be improved.
