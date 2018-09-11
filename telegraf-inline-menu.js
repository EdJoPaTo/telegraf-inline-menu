const {Composer, Extra, Markup} = require('telegraf')

const ActionCode = require('./action-code')
const {getRowsOfButtons} = require('./align-buttons')
const {buildKeyboard} = require('./build-keyboard')
const {enabledEmoji, enabledEmojiTrue} = require('./enabled-emoji')

class TelegrafInlineMenu {
  constructor(code, text, backButtonText, mainMenuButtonText) {
    this.code = new ActionCode(code)
    this.mainText = text
    this.backButtonText = backButtonText
    this.mainMenuButtonText = mainMenuButtonText

    this.bot = new Composer()
    this.buttons = []

    this.bot.action(this.code.get(), ctx => this.setMenuNow(ctx))
  }

  getNeededLastRowButtons() {
    const lastButtonRow = []

    // When there is a parent…
    // When there is a main menu, display main menu button first, back with depth >= 2
    // When there is no main menu instantly display back button
    if (this.parent && this.parent.code.get() !== 'main') {
      const backButtonText = goUpUntilTrue(this, menu => menu.backButtonText).result
      if (backButtonText) {
        const actionCode = this.code.parent().get()
        lastButtonRow.push({
          text: backButtonText,
          actionCode
        })
      }
    }

    const mainmenu = goUpUntilTrue(this, menu => menu.code.get() === 'main')
    if (this.parent && mainmenu) {
      const mainMenuButtonText = goUpUntilTrue(this, menu => menu.mainMenuButtonText).result
      if (mainMenuButtonText) {
        lastButtonRow.push({
          text: mainMenuButtonText,
          actionCode: 'main'
        })
      }
    }

    return lastButtonRow
  }

  async generate(ctx) {
    let text = this.mainText
    if (typeof this.mainText === 'function') {
      text = await this.mainText(ctx)
    }

    const buttons = [...this.buttons]
    const lastButtonRow = this.getNeededLastRowButtons()
    if (lastButtonRow.length > 0) {
      buttons.push(lastButtonRow)
    }

    const keyboardMarkup = await buildKeyboard(buttons, ctx)
    const extra = Extra.markdown().markup(keyboardMarkup)
    return {text, extra}
  }

  async replyMenuNow(ctx) {
    const {text, extra} = await this.generate(ctx)
    return ctx.reply(text, extra)
  }

  async setMenuNow(ctx) {
    const {text, extra} = await this.generate(ctx)
    return ctx.editMessageText(text, extra)
      .catch(error => {
        if (error.description === 'Bad Request: message is not modified') {
          // This is kind of ok.
          // Not changed stuff should not be sended but sometimes it happens…
          console.warn('menu is not modified', this.code)
        } else {
          throw error
        }
      })
  }

  middleware() {
    return this.bot.middleware()
  }

  hideMiddleware(hide, ...fns) {
    // This is the opposite of Composer.optional
    return Composer.branch(hide, Composer.safePassThru(), Composer.compose(fns))
  }

  addButton(button, ownRow = true) {
    if (ownRow) {
      this.buttons.push([
        button
      ])
    } else {
      const lastRow = this.buttons[this.buttons.length - 1]
      lastRow.push(button)
    }
  }

  manual(action, text, {hide, joinLastRow, root} = {}) {
    const actionCode = root ? new ActionCode(action) : this.code.concat(action)
    this.addButton({
      text,
      actionCode: actionCode.get(),
      hide
    }, !joinLastRow)
  }

  button(action, text, doFunc, {hide, joinLastRow} = {}) {
    if (!hide) {
      hide = () => false
    }

    const actionCode = this.code.concat(action).get()
    this.addButton({
      text,
      actionCode,
      hide
    }, !joinLastRow)

    this.bot.action(actionCode, this.hideMiddleware(hide, async ctx => {
      await doFunc(ctx)
      return this.setMenuNow(ctx)
    }))
  }

  urlButton(text, url, {hide, joinLastRow} = {}) {
    this.addButton({
      text,
      url,
      hide
    }, !joinLastRow)
  }

  switchToChatButton(text, value, {hide, joinLastRow} = {}) {
    this.addButton({
      text,
      switchToChat: value,
      hide
    }, !joinLastRow)
  }

  switchToCurrentChatButton(text, value, {hide, joinLastRow} = {}) {
    this.addButton({
      text,
      switchToCurrentChat: value,
      hide
    }, !joinLastRow)
  }

  submenu(text, submenu, {hide, joinLastRow} = {}) {
    if (!hide) {
      hide = () => false
    }

    if (submenu.code.parent().get() !== this.code.get()) {
      throw new Error('submenu is not directly below this menu')
    }

    submenu.parent = this

    const actionCode = submenu.code.get()
    this.addButton({
      text,
      actionCode,
      hide
    }, !joinLastRow)
    this.bot.use(this.hideMiddleware(hide, submenu))
  }

  toggle(action, text, setFunc, {isSetFunc, hide, joinLastRow} = {}) {
    if (!hide) {
      hide = () => false
    }
    console.assert(isSetFunc, `Use menu.toggle(${action}) with isSetFunc. Not using it is depricated. If you cant provide it use menu.button instead.`, 'menu prefix:', this.code, 'toggle text:', text)

    const set = async (ctx, newVal) => {
      await setFunc(ctx, newVal)
      return this.setMenuNow(ctx)
    }

    const actionCode = this.code.concat(action)
    const actionCodeTrue = actionCode.concat('true').get()
    const actionCodeFalse = actionCode.concat('false').get()
    this.bot.action(actionCodeTrue, this.hideMiddleware(hide, ctx => set(ctx, true)))
    this.bot.action(actionCodeFalse, this.hideMiddleware(hide, ctx => set(ctx, false)))
    // This will be used when isSetFunc is not available (depricated)
    this.bot.action(actionCode.get(), this.hideMiddleware(hide, ctx => set(ctx)))

    const textPrefix = isSetFunc ? async ctx => enabledEmoji(await isSetFunc(ctx)) : undefined

    const resultActionCode = isSetFunc ? async ctx => {
      return (await isSetFunc(ctx)) ? actionCodeFalse : actionCodeTrue
    } : actionCode.get()

    this.addButton({
      text,
      textPrefix,
      actionCode: resultActionCode,
      hide
    }, !joinLastRow)
  }

  list(action, options, setFunc, optionalArgs = {}) {
    return this.select(action, options, setFunc, optionalArgs)
  }

  select(action, options, setFunc, optionalArgs = {}) {
    if (!optionalArgs.hide) {
      optionalArgs.hide = () => false
    }
    const {isSetFunc, hide} = optionalArgs

    const actionCodeBase = this.code.concat(action)
    const actionCode = actionCodeBase.concat(/(.+)/).get()
    this.bot.action(actionCode, async ctx => {
      const key = ctx.match[1]
      if (hide && (await hide(ctx, key))) {
        return ctx.answerCbQuery()
      }
      if (isSetFunc && (await isSetFunc(ctx, key))) {
        // Value is already set. ignore
        return ctx.answerCbQuery()
      }
      await setFunc(ctx, key)
      return this.setMenuNow(ctx)
    })

    if (typeof options === 'function') {
      this.buttons.push(async ctx => {
        const optionsResult = await options(ctx)
        return generateSelectButtons(actionCodeBase, optionsResult, optionalArgs)
      })
    } else {
      const result = generateSelectButtons(actionCodeBase, options, optionalArgs)
      result.forEach(o => this.buttons.push(o))
    }
  }

  question(action, buttonText, setFunc, {hide, questionText, joinLastRow} = {}) {
    if (!questionText) {
      questionText = buttonText
    }

    const actionCode = this.code.concat(action).get()

    this.bot.on('message', Composer.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === questionText, async ctx => {
      const answer = ctx.message.text
      await setFunc(ctx, answer)
      return this.replyMenuNow(ctx)
    }))

    this.bot.action(actionCode, this.hideMiddleware(hide, ctx => {
      const extra = Extra.markup(Markup.forceReply())
      return Promise.all([
        ctx.reply(questionText, extra),
        ctx.deleteMessage()
      ])
    }))

    this.addButton({
      text: buttonText,
      actionCode,
      hide
    }, !joinLastRow)
  }
}

function generateSelectButtons(actionCodeBase, options, {isSetFunc, prefixFunc, hide, columns}) {
  const isArray = Array.isArray(options)
  const keys = isArray ? options : Object.keys(options)
  const buttons = keys.map(key => {
    const actionCode = actionCodeBase.concat(key).get()
    const text = isArray ? key : options[key]
    let textPrefix
    if (prefixFunc) {
      textPrefix = ctx => {
        return prefixFunc(ctx, key)
      }
    } else if (isSetFunc) {
      textPrefix = async ctx => {
        const result = await isSetFunc(ctx, key)
        return result ? enabledEmojiTrue : ''
      }
    }
    const hideKey = ctx => hide(ctx, key)
    return {
      text,
      textPrefix,
      actionCode,
      hide: hideKey
    }
  })
  return getRowsOfButtons(buttons, columns)
}

function goUpUntilTrue(start, func) {
  const result = func(start)
  if (result) {
    return {result, hit: start}
  }
  if (start.parent) {
    return goUpUntilTrue(start.parent, func)
  }
  return undefined
}

module.exports = TelegrafInlineMenu
