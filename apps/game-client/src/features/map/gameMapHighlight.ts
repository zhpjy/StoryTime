export type GameTerrainHighlightFilterConfig = {
  brightness: number
  saturation: number
}

export type GameTileHighlightOverlayStyle = {
  fillColor: number
  fillAlpha: number
  strokeColor: number
  strokeAlpha: number
  strokeWidth: number
}

export function getGameTerrainHighlightFilterConfig(isSelected: boolean, isHovered: boolean): GameTerrainHighlightFilterConfig | undefined {
  if (isSelected && isHovered) return { brightness: 1.05, saturation: 1.04 }
  if (isSelected) return { brightness: 1.03, saturation: 1.02 }
  if (isHovered) return { brightness: 1.04, saturation: 1.03 }
  return undefined
}

export function getGameTileHighlightOverlayStyle(isSelected: boolean, isHovered: boolean): GameTileHighlightOverlayStyle | undefined {
  if (isSelected && isHovered) return { fillColor: 0xf4d589, fillAlpha: 0.08, strokeColor: 0xf2d28c, strokeAlpha: 0.6, strokeWidth: 2 }
  if (isSelected) return { fillColor: 0xf1cf86, fillAlpha: 0.07, strokeColor: 0xedc879, strokeAlpha: 0.52, strokeWidth: 1.8 }
  if (isHovered) return { fillColor: 0xaec7e6, fillAlpha: 0.04, strokeColor: 0xc8d8ea, strokeAlpha: 0.36, strokeWidth: 1.4 }
  return undefined
}
