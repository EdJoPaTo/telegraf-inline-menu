# Telegraf/grammY Inline Menu

This menu library is made to easily create an inline menu for your Telegram bot.

![Example shown as a gif](media/example-food.gif)

# Installation

```bash
npm install telegraf-inline-menu
```

```bash
npm install grammY-inline-menu
```

Consider using TypeScript with this library as it helps with finding some common mistakes faster.

A good starting point for TypeScript Telegram bots might be this repo: [EdJoPaTo/telegram-typescript-bot-template](https://github.com/EdJoPaTo/telegram-typescript-bot-template)

# Examples

## Basic Example

```ts
import {Telegraf} from 'telegraf'
import {MenuTemplate, MenuMiddleware} from 'telegraf-inline-menu'
// or
import {Bot} from 'grammy'
import {MenuTemplate, MenuMiddleware} from 'grammy-inline-menu'

const menuTemplate = new MenuTemplate<MyContext>(ctx => `Hey ${ctx.from.first_name}!`)

menuTemplate.interact('I am excited!', 'a', {
	do: async ctx => {
		await ctx.reply('As am I!')
		return false
	}
})

const bot = new Telegraf(process.env.BOT_TOKEN)

const menuMiddleware = new MenuMiddleware('/', menuTemplate)
bot.command('start', ctx => menuMiddleware.replyToContext(ctx))
bot.use(menuMiddleware)

bot.launch()
```

## More interesting one

![Example shown as a gif](media/example-food.gif)

Look at the code here: [TypeScript](examples/main-typescript.ts) / [JavaScript (consider using TypeScript)](examples/main-javascript.js)

# Migrate from version 4 to version 5

If your project still uses version 4 of this library see [v4 documentation](https://github.com/EdJoPaTo/telegraf-inline-menu/blob/v4.0.1/README.md) and consider refactoring to version 5.

List of things to migrate:

- `TelegrafInlineMenu` was split into multiple classes.
  When you used `new TelegrafInlineMenu(text)`, you will use `new MenuTemplate(body)` now.
- Applying the menu to the bot via `bot.use` changed. This can now be done with the `MenuMiddleware`. Check the [Basic Example](#Basic-Example)
- `button` and `simpleButton` are combined and renamed into `interact`. See [How can I run a simple method when pressing a button?](#how-can-i-run-a-simple-method-when-pressing-a-button)
- `selectSubmenu` was renamed to `chooseIntoSubmenu`
- `select` was split into `choose` and `select`. See [Whats the difference between choose and select?](#Whats-the-difference-between-choose-and-select)
- `question` is moved into a separate library. See [Didnt this menu had a question function?](#Didnt-this-menu-had-a-question-function)
- The menu does not automatically add back and main menu buttons anymore.
  Use `menuTemplate.manualRow(createBackMainMenuButtons())` for that at each menu which should include these buttons.
- `setCommand` and `replyMenuMiddleware` were replaced by multiple different functions. See [Can I send the menu manually?](#Can-I-send-the-menu-manually)

# Migrate from version 5 to version 6

Version 6 switched from Telegraf 3.38 to 4.0. See the [Telegraf migration guide for this set of changes](https://github.com/telegraf/telegraf/releases/tag/v4.0.0).

telegraf-inline-menu is relatively unaffected by this.
The only change required besides the Telegraf changes is the change of `ctx.match`.
Simply add `match` to your `MyContext` type:
```ts
export interface MyContext extends TelegrafContext {
	readonly match: RegExpExecArray | undefined;
	…
}
```

Telegraf knows when match is available or not.
The default Context does not have match anymore.
telegraf-inline-menu should also know this in a future release.

# How does it work

Telegrams inline keyboards have buttons.
These buttons have a text and callback data.

When a button is hit, the callback data is sent to the bot.
You know this from Telegraf from `bot.action` (or `bot.callbackQuery` for grammY).

This library both creates the buttons and listens for callback data events.
When a button is pressed and its callback data is occurring the function relevant to the button is executed.

In order to handle tree like menu structures with submenus the buttons itself use a tree like structure to differentiate between the buttons.
Imagine it as the file structure on a PC.

The main menu uses `/` as callback data.
A button in the main menu will use `/my-button` as callback data.
When you create a submenu it will end with a `/` again: `/my-submenu/`.

This way the library knows what do to when an action occurs:
If the callback data ends with a `/` it will show the corresponding menu.
If it does not end with a `/` it is an interaction to be executed.

You can use a middleware in order to see which callback data is used when you hit a button:

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
Don't be scared by the output and try to find where you can find the structure in the source code.
When you hit a button, the specific callback data will be matched by one of the regular expressions.
Also try to create a new button and find it within the tree.

If you want to manually send your submenu `/my-submenu/` you have to supply the same path that is used when you press the button in the menu.

## Improve the docs

If you have any questions on how the library works head out to the issues and ask ahead.
You can also join the [Telegraf chat](https://t.me/TelegrafJSChat) or [grammY chat](https://t.me/grammyjs) in order to talk about the questions on your mind.

When you think there is something to improve on this explanation, feel free to open a Pull Request!
I am already stuck in my bubble on how this is working.
You are the expert on getting the knowledge about this library.
Let's improve things together!

# FAQ

## Can I use HTML / MarkdownV2 in the message body?

Maybe this is also useful: [npm package telegram-format](https://github.com/EdJoPaTo/telegram-format)

```ts
const menuTemplate = new MenuTemplate<MyContext>(ctx => {
	const text = '_Hey_ *there*!'
	return {text, parse_mode: 'Markdown'}
})
```

## Can the menu body be some media?

The menu body can be an object containing `media` and `type` for media.
The `media` and `type` is the same as [Telegrams InputMedia](https://core.telegram.org/bots/api#inputmedia).
The media is just passed over to your bot framework so check their documentation on how to work with files: [Telegraf](https://telegraf.js.org/#/?id=working-with-files) or [grammY](https://grammy.dev/guide/files.html#sending-files).

Each [example](telegraf-inline-menu/examples/main-typescript.ts) features a media submenu with all currently supported media types.

```ts
const menuTemplate = new MenuTemplate<MyContext>((ctx, path) => {
	// Do something

	return {
		type: 'photo',
		media: {
			source: `./${ctx.from.id}.jpg`
		},
		text: 'Some *caption*',
		parse_mode: 'Markdown'
	}
})
```

The argument of the `MenuTemplate` can be passed a body or a function returning a body.
A body can be a string or an object with options like seen above.
When using as a function the arguments are the context and the path of the menu when called.

## How can I run a simple method when pressing a button?

```ts
menuTemplate.interact('Text', 'unique', {
	do: async ctx => {
		await ctx.answerCbQuery('yaay')
		return false
	}
})
```

## Why do I have to return a boolean or string for the do/set function?

You can control if you want to update the menu afterwards or not.
When the user presses a button which changes something in the menu text, you want the user to see the updated content.
You can return a relative path to go to afterwards or a simple boolean (yes = `true`, no = `false`).

Using paths can become super handy.
For example when you want to return to the parent menu you can use the path `..`.
Or to a sibling menu with `../sibling`.

If you just want to navigate without doing logic, you should prefer `.navigate(…)`.

```ts
menuTemplate.interact('Text', 'unique', {
	do: async ctx => {
		await ctx.answerCbQuery('go to parent menu after doing some logic')
		return '..'
	}
})
```

## How to use a dynamic text of a button?

This is often required when translating ([telegraf-i18n](https://github.com/telegraf/telegraf-i18n) or [@grammyjs/i18n](https://github.com/grammyjs/i18n)) your bot.

Also check out other buttons like [toggle](#how-can-i-toggle-a-value-easily) as they do some formatting of the button text for you.

```ts
menuTemplate.interact(ctx => ctx.i18n.t('button'), 'unique', {
	do: async ctx => {
		await ctx.answerCbQuery(ctx.i18n.t('reponse'))
		return '.'
	}
})
```

## How can I show an url button?

```ts
menuTemplate.url('Text', 'https://edjopato.de')
```

## How can I display two buttons in the same row?

Use `joinLastRow` in the second button

```ts
menuTemplate.interact('Text', 'unique', {
	do: async ctx => {
		await ctx.answerCbQuery('yaay')
		return false
	}
})

menuTemplate.interact('Text', 'unique', {
	joinLastRow: true,
	do: async ctx => {
		await ctx.answerCbQuery('yaay')
		return false
	}
})
```

## How can I toggle a value easily?

```ts
menuTemplate.toggle('Text', 'unique', {
	isSet: ctx => ctx.session.isFunny,
	set: (ctx, newState) => {
		ctx.session.isFunny = newState
		return true
	}
})
```

## How can I select one of many values?

```ts
menuTemplate.select('unique', ['human', 'bird'], {
	isSet: (ctx, key) => ctx.session.choice === key,
	set: (ctx, key) => {
		ctx.session.choice = key
		return true
	}
})
```

## How can I toggle many values?

```ts
menuTemplate.select('unique', ['has arms', 'has legs', 'has eyes', 'has wings'], {
	showFalseEmoji: true,
	isSet: (ctx, key) => Boolean(ctx.session.bodyparts[key]),
	set: (ctx, key, newState) => {
		ctx.session.bodyparts[key] = newState
		return true
	}
})
```

## How can I interact with many values based on the pressed button?

```ts
menuTemplate.choose('unique', ['walk', 'swim'], {
	do: async (ctx, key) => {
		await ctx.answerCbQuery(`Lets ${key}`)
		// You can also go back to the parent menu afterwards for some 'quick' interactions in submenus
		return '..'
	}
})
```

## Whats the difference between choose and select?

If you want to do something based on the choice, use `menuTemplate.choose(…)`.
If you want to change the state of something, select one out of many options for example, use `menuTemplate.select(…)`.

`menuTemplate.select(…)` automatically updates the menu on pressing the button and shows what it currently selected.
`menuTemplate.choose(…)` runs the method you want to run.

## How can I use dynamic text for many values with choose or select?

One way of doing so is via `Record<string, string>` as input for the choices:

```ts
const choices: Record<string, string> = {
	a: 'Alphabet',
	b: 'Beta',
	c: 'Canada'
}

menuTemplate.choose('unique', choices, …)
```

You can also use the `buttonText` function for `.choose(…)` or `formatState` for `.select(…)` (and `.toggle(…)`)

```ts
menuTemplate.choose('unique', ['a', 'b'], {
	do: …,
	buttonText: (context, text) => {
		return text.toUpperCase()
	}
})
```

## I have too much content for one message. Can I use a pagination?

`menuTemplate.pagination` is basically a glorified `choose`.
You can supply the amount of pages you have and what's your current page is, and it tells you which page the user what's to see.
Splitting your content into pages is still your job to do.
This allows you for all kinds of variations on your side.

```ts
menuTemplate.pagination('unique', {
	getTotalPages: () => 42,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})
```

## My choose/select has too many choices. Can I use a pagination?

When you don't use a pagination, you might have noticed that not all of your choices are displayed.
Per default only the first page is shown.
You can select the amount of rows and columns via `maxRows` and `columns`.
The pagination works similar to `menuTemplate.pagination` but you do not need to supply the amount of total pages as this is calculated from your choices.

```ts
menuTemplate.choose('eat', ['cheese', 'bread', 'salad', 'tree', …], {
	columns: 1,
	maxRows: 2,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})
```

## How can I use a submenu?

```ts
const submenu = new MenuTemplate<MyContext>('I am a submenu')
submenuTemplate.interact('Text', 'unique', {
	do: async ctx => ctx.answerCbQuery('You hit a button in a submenu')
})
submenuTemplate.manualRow(createBackMainMenuButtons())

menuTemplate.submenu('Text', 'unique', submenuTemplate)
```

## How can I use a submenu with many choices?

```ts
const submenuTemplate = new MenuTemplate<MyContext>(ctx => `You chose city ${ctx.match[1]}`)
submenuTemplate.interact('Text', 'unique', {
	do: async ctx => {
		console.log('Take a look at ctx.match. It contains the chosen city', ctx.match)
		await ctx.answerCbQuery('You hit a button in a submenu')
		return false
	}
})
submenuTemplate.manualRow(createBackMainMenuButtons())

menuTemplate.chooseIntoSubmenu('unique', ['Gotham', 'Mos Eisley', 'Springfield'], submenuTemplate)
```

## Can I close the menu?

You can delete the message like you would do with Telegraf/grammY: `ctx.deleteMessage()`.
Keep in mind: You can not delete messages which are older than 48 hours.

`deleteMenuFromContext` tries to help you with that:
It tries to delete the menu.
If that does not work the keyboard is removed from the message, so the user will not accidentally press something.

```ts
menuTemplate.interact('Delete the menu', 'unique', {
	do: async context => {
		await deleteMenuFromContext(context)
		// Make sure not to try to update the menu afterwards. You just deleted it and it would just fail to update a missing message.
		return false
	}
})
```

## Can I send the menu manually?

If you want to send the root menu use `ctx => menuMiddleware.replyToContext(ctx)`

```ts
const menuMiddleware = new MenuMiddleware('/', menuTemplate)
bot.command('start', ctx => menuMiddleware.replyToContext(ctx))
```

You can also specify a path to the `replyToContext` function for the specific submenu you want to open.
See [How does it work](#how-does-it-work) to understand which path you have to supply as the last argument.

```ts
const menuMiddleware = new MenuMiddleware('/', menuTemplate)
bot.command('start', ctx => menuMiddleware.replyToContext(ctx, path))
```

You can also use sendMenu functions like `replyMenuToContext` to send a menu manually.

```ts
import {MenuTemplate, replyMenuToContext} from 'telegraf-inline-menu'
const settingsMenu = new MenuTemplate('Settings')
bot.command('settings', async ctx => replyMenuToContext(settingsMenu, ctx, '/settings/'))
```

## Can I send the menu from external events?

When sending from external events you still have to supply the context to the message or some parts of your menu might not work as expected!

See [How does it work](#how-does-it-work) to understand which path you have to supply as the last argument of `generateSendMenuToChatFunction`.

```ts
const sendMenuFunction = generateSendMenuToChatFunction(bot.telegram, menu, '/settings/')

async function externalEventOccured() {
	await sendMenuFunction(userId, context)
}
```

## Didnt this menu had a question function?

Yes. It was moved into a separate library with version 5 as it made the source code overly complicated.

When you want to use it check [telegraf-stateless-question](https://github.com/EdJoPaTo/telegraf-stateless-question).

```ts
import {getMenuOfPath} from 'telegraf-inline-menu'

const myQuestion = new TelegrafStatelessQuestion<MyContext>('unique', async (context, additionalState) => {
	const answer = context.message.text
	console.log('user responded with', answer)
	await replyMenuToContext(menuTemplate, context, additionalState)
})

bot.use(myQuestion.middleware())

menuTemplate.interact('Question', 'unique', {
	do: async (context, path) => {
		const text = 'Tell me the answer to the world and everything.'
		const additionalState = getMenuOfPath(path)
		await myQuestion.replyWithMarkdown(context, text, additionalState)
		return false
	}
})
```

# Documentation

The methods should have explaining documentation by itself.
Also, there should be multiple @example entries in the docs to see different ways of using the method.

If you think the jsdoc / README can be improved just go ahead and create a Pull Request.
Let's improve things together!
