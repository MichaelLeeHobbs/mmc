import { describe, it, expect } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// utils.js references the namespace globals declared by the other files, so load
// them all into one shared context (order: deps first, then utils.js).
// assert.js is needed because dateUtils.js references the `assert` global.
const sandbox = loadTemplates([
  'Globals/assert.js',
  'Globals/stringUtils.js',
  'Globals/arrayUtils.js',
  'Globals/dateUtils.js',
  'Globals/jsonUtils.js',
  'Globals/errorUtils.js',
  'Globals/validationUtils.js',
  'Globals/channelUtils.js',
  'Globals/utils.js',
])

const {
  utils,
  dateUtils,
  stringUtils,
  jsonUtils,
  arrayUtils,
  errorUtils,
  validationUtils,
  channelUtils,
} = sandbox

describe('utils bridge', () => {
  it('exposes the exact namespace mapping from utils.js', () => {
    expect(utils.date).toBe(dateUtils)
    expect(utils.string).toBe(stringUtils)
    expect(utils.json).toBe(jsonUtils)
    expect(utils.array).toBe(arrayUtils)
    expect(utils.error).toBe(errorUtils)
    expect(utils.validation).toBe(validationUtils)
    expect(utils.channel).toBe(channelUtils)
  })

  it('has exactly the seven documented keys', () => {
    expect(Object.keys(utils).sort()).toEqual(
      ['array', 'channel', 'date', 'error', 'json', 'string', 'validation']
    )
  })

  it('routes through to a real namespace method (date.getAge)', () => {
    const today = new Date()
    const dobStr =
      String(today.getFullYear() - 25) +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    expect(utils.date.getAge(dobStr)).toBe(25)
  })
})
