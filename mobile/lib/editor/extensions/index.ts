/**
 * Editor Extensions
 * Exports all custom TipTap extensions for the rich text editor.
 */

export { TitleExtension, default as TitleExtensionDefault } from './TitleExtension';
export { H1BoxedExtension, default as H1BoxedExtensionDefault } from './H1BoxedExtension';
export { H2PlainExtension, default as H2PlainExtensionDefault } from './H2PlainExtension';
export { BodyTextExtension, default as BodyTextExtensionDefault } from './BodyTextExtension';
export {
  ListItemExtension,
  BulletListExtension,
  OrderedListExtension,
  default as ListExtensionsDefault,
} from './ListExtensions';
export {
  getBlockExtensions,
  getEditorStyles,
  BLOCK_TYPE_NAMES,
  isHeadingType,
  isTitleBlock,
  isListType,
  default as editorConfigDefault,
} from './editorConfig';
