/**
 * Editor Constants
 * Style constants for the rich text editor based on the design specification.
 */

export const COLORS = {
  // Primary
  accentPurple: '#7A2EFF',
  sectionBoxBg: '#F3EDFF',
  black: '#000000',

  // Neutrals
  darkGray: '#555555',
  borderGray: '#D0D0D0',
  dividerGray: '#EAEAEA',

  // Semantic
  saveOrange: '#FF9500',
  white: '#FFFFFF',
} as const;

export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: '500' as const,
    color: COLORS.black,
    paddingBottom: 16,
  },
  h1: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.accentPurple,
    backgroundColor: COLORS.sectionBoxBg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  h2: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginTop: 12,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: COLORS.black,
    lineHeight: 24,
  },
} as const;

export const LAYOUT = {
  headerHeight: 64,
  toolbarHeight: 48,
  listIndent: 24,
  listItemSpacing: 8,
  editorBottomPadding: 80,
  headerButtonSize: 40,
  iconSize: 24,
  touchTargetSize: 44,
  buttonSpacing: 12,
} as const;
