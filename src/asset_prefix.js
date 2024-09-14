const IS_DEV = process.env.NODE_ENV === 'development'
export const ASSET_PREFIX = IS_DEV ? '' : 'https://wow-classic.atlasforge.gg'
export const LINK_PREFIX = IS_DEV ? '' : '/cyberpunk-2077'