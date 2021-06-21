import {Body} from './body'
import {ButtonAction} from './action-hive'
import {ContextPathFunc, RegExpLike} from './generic-types'
import {InlineKeyboard} from './keyboard'

export interface MenuLike<Context> {
	readonly renderBody: ContextPathFunc<Context, Body>;
	readonly renderKeyboard: ContextPathFunc<Context, InlineKeyboard>;
	readonly renderActionHandlers: (path: RegExpLike) => ReadonlySet<ButtonAction<Context>>;
	readonly listSubmenus: () => ReadonlySet<Submenu<Context>>;
}

export interface Submenu<Context> {
	readonly action: RegExpLike;
	readonly hide: undefined | ContextPathFunc<Context, boolean>;
	readonly menu: MenuLike<Context>;
}
