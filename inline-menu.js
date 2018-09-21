const {Composer, Extra, Markup} = require('telegraf')

const ActionCode = require('./action-code')
const {getRowsOfButtons} = require('./align-buttons')
const {buildKeyboard} = require('./build-keyboard')
const {prefixEmoji} = require('./prefix')
const {createHandlerMiddleware, isCallbackQueryActionFunc} = require('./middleware-helper')

class TelegrafInlineMenu {
  constructor(text) {
    this.menuText = text
    this.buttons = []
    this.commands = []
    this.handlers = []
  }

  setCommand(commands) {
    if (!Array.isArray(commands)) {
      commands = [commands]
    }
    this.commands = this.commands.concat(commands)
    return this
  }

  addButton(button, ownRow = true) {
    if (ownRow || this.buttons.length === 0) {
      this.buttons.push([
        button
      ])
    } else {
      const lastRow = this.buttons[this.buttons.length - 1]
      lastRow.push(button)
    }
  }

  addHandler(obj) {
    if (obj.action && !(obj.action instanceof ActionCode)) {
      throw new TypeError('action has to be an ActionCode')
    }
    this.handlers.push(obj)
  }

  async generate(ctx, actionCode, options) {
    options.log('generate…', actionCode.get())
    const text = typeof this.menuText === 'function' ? (await this.menuText(ctx)) : this.menuText

    let actualActionCode
    if (ctx.callbackQuery) {
      const expectedPartCount = options.depth
      const actualParts = ctx.callbackQuery.data.split(':')
      // Go up to the menu that shall be opened
      while (actualParts.length > expectedPartCount) {
        actualParts.pop()
      }
      const menuAction = actualParts.join(':')
      actualActionCode = new ActionCode(menuAction)
      options.log('generate with actualActionCode', actualActionCode.get(), actionCode.get(), ctx.callbackQuery.data)
    } else {
      actualActionCode = actionCode
    }

    const buttons = [...this.buttons]
    const lastButtonRow = generateBackButtonsAsNeeded(actualActionCode, options)
    if (lastButtonRow.length > 0) {
      buttons.push(lastButtonRow)
    }

    const keyboardMarkup = await buildKeyboard(buttons, actualActionCode, ctx)
    options.log('buttons', keyboardMarkup.inline_keyboard)
    const extra = Extra.markdown().markup(keyboardMarkup)
    return {text, extra}
  }

  async setMenuNow(ctx, actionCode, options) {
    const {text, extra} = await this.generate(ctx, actionCode, options)
    if (ctx.updateType !== 'callback_query') {
      return ctx.reply(text, extra)
    }
    return ctx.editMessageText(text, extra)
      .catch(error => {
        if (error.description === 'Bad Request: message is not modified') {
          // This is kind of ok.
          // Not changed stuff should not be sended but sometimes it happens…
          console.warn('menu is not modified. Think about preventing this. Happened while setting menu', actionCode.get())
        } else {
          console.error('setMenuNow failed', actionCode.get(), error)
        }
      })
  }

  init(options = {}) {
    if (options.actionCode && options.actionCode.indexOf(':') >= 0) {
      throw new Error('ActionCode has to start at the base level (without ":")')
    }
    const actionCode = new ActionCode(options.actionCode || 'main')
    delete options.actionCode
    options.hasMainMenu = actionCode.get() === 'main'
    options.depth = options.hasMainMenu ? 0 : 1
    // Debug
    // options.log = (...args) => console.log(new Date(), ...args)
    options.log = options.log || (() => {})
    options.log('init', options)
    const middleware = this.middleware(actionCode, options)
    options.log('init finished')
    return middleware
  }

  middleware(actionCode, options) {
    if (!actionCode) {
      throw new Error('use this menu with .init(): but.use(menu.init(args))')
    }
    if (!options) {
      // This Error is not needed as this function is (should) only be called internally.
      // But as options is only used later the root of the error is not that easy to find without Error.
      throw new Error('options has to be set')
    }
    if (actionCode.isDynamic()) {
      if (this.commands.length > 0) {
        throw new Error('commands can not point on dynamic submenus. Happened in menu ' + actionCode.get() + ' with the following commands: ' + this.commands.join(', '))
      }
      const handlerNotActions = this.handlers.filter(o => !o.action)
      if (handlerNotActions.length > 0) {
        throw new Error('a dynamic submenu can only contain buttons. A question for example does not work. Happened in menu ' + actionCode.get())
      }
    }

    options.log('middleware triggered', actionCode.get(), options, this)
    options.log('add action reaction', actionCode.get(), 'setMenu')
    const setMenuFunc = (ctx, reason) => {
      options.log('set menu', actionCode.get(), reason, this)
      return this.setMenuNow(ctx, actionCode, options)
    }
    const functions = []
    functions.push(Composer.action(actionCode.get(), ctx => setMenuFunc(ctx, 'menu action')))
    if (this.commands.length > 0) {
      functions.push(Composer.command(this.commands, ctx => setMenuFunc(ctx, 'command')))
    }

    const subOptions = {
      ...options,
      setParentMenuFunc: setMenuFunc,
      depth: options.depth + 1
    }

    const handlerFuncs = this.handlers
      .map(handler => {
        const middlewareOptions = {}
        middlewareOptions.hide = handler.hide
        middlewareOptions.only = handler.only

        const childActionCode = handler.action && actionCode.concat(handler.action)

        let middleware
        if (handler.action) {
          if (handler.submenu) {
            middleware = handler.submenu.middleware(childActionCode, subOptions)
          } else {
            // Run the setMenuFunc even when action is hidden.
            // As the button should be hidden already the user must have an old menu
            // Update the menu to show the user why this will not work
            middlewareOptions.runAfterFuncEvenWhenHidden = true
            middlewareOptions.only = isCallbackQueryActionFunc(childActionCode, handler.only)

            options.log('add action reaction', childActionCode.get(), handler.middleware)
            middleware = handler.middleware
          }
        } else {
          middleware = handler.middleware
        }
        if (handler.setParentMenuAfter || handler.setMenuAfter) {
          const reason = 'after handler ' + (childActionCode || actionCode).get()
          if (handler.setParentMenuAfter) {
            if (!options.setParentMenuFunc) {
              throw new Error('Action will not be able to set parent menu as there is no parent menu: ' + actionCode.get())
            }
            middlewareOptions.afterFunc = ctx => options.setParentMenuFunc(ctx, reason)
          } else {
            middlewareOptions.afterFunc = ctx => setMenuFunc(ctx, reason)
          }
        }
        return createHandlerMiddleware(middleware, middlewareOptions)
      })
    const handlerFuncsFlattened = [].concat(...handlerFuncs)

    return Composer.compose([
      ...functions,
      ...handlerFuncsFlattened
    ])
  }

  basicButton(text, {
    action,
    hide,
    root,
    switchToChat,
    switchToCurrentChat,
    url,

    joinLastRow
  }) {
    this.addButton({
      action,
      hide,
      root,
      switchToChat,
      switchToCurrentChat,
      url,

      text
    }, !joinLastRow)
    return this
  }

  urlButton(text, url, additionalArgs = {}) {
    return this.basicButton(text, {...additionalArgs, url})
  }

  switchToChatButton(text, value, additionalArgs = {}) {
    return this.basicButton(text, {...additionalArgs, switchToChat: value})
  }

  switchToCurrentChatButton(text, value, additionalArgs = {}) {
    return this.basicButton(text, {...additionalArgs, switchToCurrentChat: value})
  }

  manual(text, action, additionalArgs = {}) {
    return this.basicButton(text, {...additionalArgs, action})
  }

  // This button does not update the menu after being pressed
  simpleButton(text, action, additionalArgs) {
    if (!additionalArgs.doFunc) {
      throw new Error('doFunc is not set. set it or use menu.manual')
    }
    this.addHandler({
      action: new ActionCode(action),
      hide: additionalArgs.hide,
      middleware: additionalArgs.doFunc,
      setParentMenuAfter: additionalArgs.setParentMenuAfter,
      setMenuAfter: additionalArgs.setMenuAfter
    })
    return this.manual(text, action, additionalArgs)
  }

  button(text, action, additionalArgs) {
    additionalArgs.setMenuAfter = true
    return this.simpleButton(text, action, additionalArgs)
  }

  question(text, action, additionalArgs) {
    const {questionText, setFunc, hide} = additionalArgs
    if (!questionText) {
      throw new Error('questionText is not set. set it')
    }
    if (!setFunc) {
      throw new Error('setFunc is not set. set it')
    }

    const parseQuestionAnswer = async ctx => {
      const answer = ctx.message.text
      await setFunc(ctx, answer)
    }

    this.addHandler({
      hide,
      setMenuAfter: true,
      only: ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === questionText,
      middleware: parseQuestionAnswer
    })

    const hitQuestionButton = ctx => {
      const extra = Extra.markup(Markup.forceReply())
      return Promise.all([
        ctx.reply(questionText, extra),
        ctx.deleteMessage()
          .catch(error => {
            if (/can't be deleted/.test(error)) {
              // Looks like message is to old to be deleted
              return
            }
            console.error('deleteMessage on question button failed', error)
          })
      ])
    }
    return this.simpleButton(text, action, {
      ...additionalArgs,
      doFunc: hitQuestionButton
    })
  }

  select(action, options, additionalArgs) {
    const {setFunc, submenu, hide} = additionalArgs
    if (setFunc && submenu) {
      throw new Error('setFunc and submenu can not be set at the same time.')
    }
    if (submenu && hide) {
      // The submenu is a middleware that can do other things than callback_data
      // question is an example: the reply to the text does not indicate the actionCode.
      // Without the exact actionCode its not possible to determine the selected key(s) which is needed for hide(…, key)
      throw new Error('hiding a dynamic submenu is not possible')
    }

    const keyFromCtx = ctx => ctx.match[ctx.match.length - 1]
    const handler = {
      action: new ActionCode(new RegExp(`${action}-([^:]+)`))
    }

    if (additionalArgs.hide) {
      handler.hide = ctx => hide(ctx, keyFromCtx(ctx))
    }

    if (setFunc) {
      const hitSelectButton = ctx => setFunc(ctx, keyFromCtx(ctx))
      handler.middleware = hitSelectButton
      handler.setParentMenuAfter = additionalArgs.setParentMenuAfter
      handler.setMenuAfter = true
    } else if (submenu) {
      handler.submenu = submenu
    } else {
      throw new Error('Neither setFunc or submenu are set. Provide one of them.')
    }

    this.addHandler(handler)

    if (typeof options === 'function') {
      this.buttons.push(async ctx => {
        const optionsResult = await options(ctx)
        return generateSelectButtons(action, optionsResult, additionalArgs)
      })
    } else {
      const result = generateSelectButtons(action, options, additionalArgs)
      result.forEach(o => this.buttons.push(o))
    }

    return this
  }

  toggle(text, action, additionalArgs) {
    if (!additionalArgs.setFunc) {
      throw new Error('setFunc is not set. set it')
    }
    if (!additionalArgs.isSetFunc) {
      throw new Error('isSetFunc is not set. set it')
    }
    const textFunc = ctx =>
      prefixEmoji(text, additionalArgs.isSetFunc, {
        ...additionalArgs
      }, ctx)

    const actionFunc = async ctx => {
      const currentState = await additionalArgs.isSetFunc(ctx)
      return currentState ? action + '-false' : action + '-true'
    }

    const baseHandler = {
      hide: additionalArgs.hide,
      setMenuAfter: true
    }

    const toggleTrue = ctx => additionalArgs.setFunc(ctx, true)
    const toggleFalse = ctx => additionalArgs.setFunc(ctx, false)

    this.addHandler({...baseHandler,
      action: new ActionCode(action + '-true'),
      middleware: toggleTrue
    })

    this.addHandler({...baseHandler,
      action: new ActionCode(action + '-false'),
      middleware: toggleFalse
    })

    return this.manual(textFunc, actionFunc, additionalArgs)
  }

  submenu(text, action, submenu, additionalArgs = {}) {
    this.manual(text, action, additionalArgs)
    this.addHandler({
      action: new ActionCode(action),
      hide: additionalArgs.hide,
      submenu
    })
    return submenu
  }
}

function generateSelectButtons(actionBase, options, {
  columns,
  hide,
  isSetFunc,
  maxRows,
  multiselect,
  prefixFunc
}) {
  const isArray = Array.isArray(options)
  const keys = isArray ? options : Object.keys(options)
  const buttons = keys.map(key => {
    const action = new ActionCode(actionBase + '-' + key)
    const text = isArray ? key : options[key]
    const textFunc = ctx =>
      prefixEmoji(text, prefixFunc || isSetFunc, {
        hideFalseEmoji: !multiselect
      }, ctx, key)
    const hideKey = ctx => hide && hide(ctx, key)
    return {
      text: textFunc,
      action,
      hide: hideKey
    }
  })
  return getRowsOfButtons(buttons, columns, maxRows)
}

function generateBackButtonsAsNeeded(actionCode, {
  depth,
  hasMainMenu,
  backButtonText,
  mainMenuButtonText
}) {
  if (actionCode.get() === 'main' || depth === 0) {
    return []
  }
  const buttons = []
  if (depth > 1 && backButtonText) {
    buttons.push({
      text: backButtonText,
      action: actionCode.parent().get(),
      root: true
    })
  }
  if (depth > 0 && hasMainMenu && mainMenuButtonText) {
    buttons.push({
      text: mainMenuButtonText,
      action: 'main',
      root: true
    })
  }
  return buttons
}

module.exports = TelegrafInlineMenu
