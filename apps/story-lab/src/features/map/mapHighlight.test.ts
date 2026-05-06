import { describe, expect, it } from 'vitest'
import { getTerrainHighlightFilterConfig, getTileHighlightOverlayStyle } from './mapHighlight'

describe('mapHighlight', () => {
  it('uses subtle terrain filter changes for hover and selection states', () => {
    expect(getTerrainHighlightFilterConfig(false, false)).toBeUndefined()
    expect(getTerrainHighlightFilterConfig(false, true)).toMatchObject({
      brightness: 1.04,
      saturation: 1.03,
    })
    expect(getTerrainHighlightFilterConfig(true, false)).toMatchObject({
      brightness: 1.03,
      saturation: 1.02,
    })
    expect(getTerrainHighlightFilterConfig(true, true)).toMatchObject({
      brightness: 1.05,
      saturation: 1.04,
    })
  })

  it('draws selection emphasis with a restrained overlay instead of strong texture tinting', () => {
    expect(getTileHighlightOverlayStyle(false, false)).toBeUndefined()
    expect(getTileHighlightOverlayStyle(false, true)).toMatchObject({
      fillAlpha: 0.04,
      strokeAlpha: 0.36,
      strokeWidth: 1.4,
    })
    expect(getTileHighlightOverlayStyle(true, false)).toMatchObject({
      fillAlpha: 0.07,
      strokeAlpha: 0.52,
      strokeWidth: 1.8,
    })
    expect(getTileHighlightOverlayStyle(true, true)).toMatchObject({
      fillAlpha: 0.08,
      strokeAlpha: 0.6,
      strokeWidth: 2,
    })
  })
})
