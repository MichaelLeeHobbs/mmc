import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const REL = 'StandaloneMirthBackup/mirthBackup.js'

// Build java/com mocks so getMirthConfig() returns a deterministic
// [serializedConfig, backupDate] without touching a real JVM.
function makeJavaCom(backupDate) {
  const configObj = { setDate: vi.fn() }
  const serialize = vi.fn(() => '<serializedConfig/>')

  const java = {
    text: {
      SimpleDateFormat: function (pattern) {
        this.pattern = pattern
        this.format = () => backupDate
      },
    },
    util: {
      Date: function () {},
    },
  }

  const com = {
    mirth: {
      connect: {
        model: {
          converters: {
            ObjectXMLSerializer: { getInstance: () => ({ serialize }) },
          },
        },
        server: {
          controllers: {
            ControllerFactory: {
              getFactory: () => ({
                createConfigurationController: () => ({
                  getServerConfiguration: () => configObj,
                }),
              }),
            },
          },
        },
      },
    },
  }

  return { java, com, configObj, serialize }
}

function load(backupData, backupDate = '2026-05-28 17:30:45') {
  const { java, com } = makeJavaCom(backupDate)
  const destinationSet = { remove: vi.fn() }
  const sandbox = loadTemplate(REL, { java, com, destinationSet, msg: null })
  if (backupData !== undefined) {
    sandbox.$gc('backupData', backupData)
  }
  return sandbox
}

describe('getMirthConfig', () => {
  it('serializes the server config and stamps the backup date', () => {
    const { java, com, configObj, serialize } = makeJavaCom('2026-05-28 09:00:00')
    const sandbox = loadTemplate(REL, { java, com, msg: null, destinationSet: { remove: vi.fn() } })
    const { getMirthConfig } = sandbox.module.exports
    const [config, backupDate] = getMirthConfig()
    expect(configObj.setDate).toHaveBeenCalledWith('2026-05-28 09:00:00')
    expect(serialize).toHaveBeenCalledWith(configObj)
    expect(config).toBe('<serializedConfig/>')
    expect(backupDate).toBe('2026-05-28 09:00:00')
  })
})

describe('mirthBackup date rotation', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('sets backupFileName from the backup date (colons/dashes removed, space -> T)', () => {
    const sandbox = load(null, '2026-05-28 17:30:45')
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(false)
    expect(sandbox.$c('backupFileName')).toBe('20260528T173045.backup.xml')
  })

  it('returns the serialized config (assigned to msg)', () => {
    const sandbox = load(null)
    const { mirthBackup } = sandbox.module.exports
    expect(mirthBackup(false)).toBe('<serializedConfig/>')
  })

  it('writes all four *FileName values when prior backupData is empty/null', () => {
    const sandbox = load(null)
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(false)
    expect(sandbox.$c('hourlyFileName')).toMatch(/^hour_\d+_backup\.xml$/)
    expect(sandbox.$c('dailyFileName')).toMatch(
      /^day_(sunday|monday|tuesday|wednesday|thursday|friday|saturday)_backup\.xml$/
    )
    expect(sandbox.$c('weeklyFileName')).toMatch(/^week_\d+_backup\.xml$/)
    expect(sandbox.$c('monthlyFileName')).toMatch(/^month_[a-z]+_backup\.xml$/)
    // Nothing removed because every value changed (null !== current).
    expect(sandbox.destinationSet.remove).not.toHaveBeenCalled()
  })

  it('persists newBackupData to $gc after running', () => {
    const sandbox = load(null)
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(false)
    const saved = sandbox.$gc('backupData')
    const now = new Date()
    expect(saved.hour).toBe(now.getHours())
    expect(saved.month).toBe(
      ['january', 'february', 'march', 'april', 'may', 'june', 'july',
       'august', 'september', 'october', 'november', 'december'][now.getMonth()]
    )
    expect(saved.daily).toBe(
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()]
    )
  })

  it('removes destinations whose value is unchanged from the prior run', () => {
    // Seed backupData with the SAME values mirthBackup will compute this run, so
    // every comparison reports "unchanged" -> every destination is removed and
    // no *FileName is written.
    const now = new Date()
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
      'august', 'september', 'october', 'november', 'december']
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    const oneJan = new Date(now.getFullYear(), 0, 1)
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((now.getDay() + 1 + numberOfDays) / 7)

    const same = {
      hour: now.getHours(),
      daily: days[now.getDay()],
      week,
      month: months[now.getMonth()],
    }

    const sandbox = load(same)
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(false)

    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['hourly'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['daily'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['weekly'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['monthly'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledTimes(4)

    // No filename keys written for unchanged buckets.
    expect(sandbox.$c('hourlyFileName')).toBeUndefined()
    expect(sandbox.$c('dailyFileName')).toBeUndefined()
    expect(sandbox.$c('weeklyFileName')).toBeUndefined()
    expect(sandbox.$c('monthlyFileName')).toBeUndefined()
  })

  it('changes only the hourly bucket when only the hour differs', () => {
    const now = new Date()
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
      'august', 'september', 'october', 'november', 'december']
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const oneJan = new Date(now.getFullYear(), 0, 1)
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((now.getDay() + 1 + numberOfDays) / 7)

    const prior = {
      hour: (now.getHours() + 1) % 24, // different hour
      daily: days[now.getDay()],
      week,
      month: months[now.getMonth()],
    }

    const sandbox = load(prior)
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(false)

    // hour changed -> filename written, hourly NOT removed
    expect(sandbox.$c('hourlyFileName')).toBe('hour_' + now.getHours() + '_backup.xml')
    // others unchanged -> removed
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['daily'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['weekly'])
    expect(sandbox.destinationSet.remove).toHaveBeenCalledWith(['monthly'])
    expect(sandbox.destinationSet.remove).not.toHaveBeenCalledWith(['hourly'])
  })

  it('keepDaily uses a numeric day-of-year for the daily filename', () => {
    const sandbox = load(null)
    const { mirthBackup } = sandbox.module.exports
    mirthBackup(true)
    // With keepDaily true, daily is getDayOfYear() (a number) -> day_<number>_backup.xml
    expect(sandbox.$c('dailyFileName')).toMatch(/^day_-?\d+_backup\.xml$/)
  })
})
