import {ManyChoicesOptions} from '../choices'

import {SingleButtonOptions} from './basic'

export interface SubmenuOptions<Context> extends SingleButtonOptions<Context> {
}

export interface ChooseIntoSubmenuOptions<Context> extends ManyChoicesOptions<Context> {
}
