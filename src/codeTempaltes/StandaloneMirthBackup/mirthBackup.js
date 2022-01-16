/**
 * Creates a Mirth backup, hourly, daily, weekly and monthly. Overwrites the previous backup with the same name.
 * For example On Tuesday backup hour_17_backup.xml was created then on Wednesday would be overwritten at hour 17.
 * Over the course of a year the total size of Mirth backup could exceed 1GB for very large Mirth installs.
 *
 * Requires the following File Writer destinations:
 * Name: hourly,    File name: ${hourlyFileName}
 * Name: daily,     File name: ${dailyFileName}
 * Name: weekly,    File name: ${weeklyFileName}
 * Name: monthly,   File name: ${monthlyFileName}
 * Destinations should be configured to write ${message.encodedData} to disk
 *
 * Backup file names:
 * Hourly: hour_{hour number}_backup.xml
 * Daily: day_{name of the day of the week}_backup.xml
 * Weekly: week_{week of year number}_backup.xml
 * Monthly: month_{name of the month}_backup.xml
 * Per Poll Backup: YYYYMMDDTHHMM.backup.xml
 *
 * If keepDaily is true then the daily backups will not be overwritten weekly and the daily backup names
 * will change to: day_{day number of year}_backup.xml
 * This will significantly increase storage requirements. Expect multiple gigabytes for very large Mirth installs.
 *
 * Usage
 * 1. Create a Channel and set dependencies to: StandaloneMirthBackup
 * 2. Set source to JavaScript Reader Polling that polls hourly.
 * 3. Set the script to: return 'polling' // we have to return something or the transformer won't run
 * 4. Set the transformer to: mirthBackup(false/true) // if true then keeps daily backups for one year else overwrite them weekly
 * 5. Create the following File Writer destinations: hourly, daily, weekly, monthly. See above for details
 *
 * @param {boolean} [keepDaily=false]
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function mirthBackup(keepDaily) {
    const newBackupData = {
        hour: (new Date()).getHours(),
        daily: keepDaily ? getDayOfYear() : getDayName(),
        week: getWeekNumber(),
        month: getMonthName(),
    }
    const backupData = $gc('backupData') || {hour: null, daily: null, week: null, month: null}

    const [config, backupDT] = getMirthConfig()
    msg = config
    $c('backupFileName', String(backupDT).replace(/[:-]/g, '').replace(' ', 'T') + '.backup.xml')

    if (backupData.hour !== newBackupData.hour) {
        $c('hourlyFileName', ['hour_', newBackupData.hour, '_backup.xml'].join(''))
    } else {
        destinationSet.remove(['hourly'])
    }

    if (backupData.daily !== newBackupData.daily) {
        $c('dailyFileName', ['day_', newBackupData.daily, '_backup.xml'].join(''))
    } else {
        destinationSet.remove(['daily'])
    }

    if (backupData.week !== newBackupData.week) {
        $c('weeklyFileName', ['week_', newBackupData.week, '_backup.xml'].join(''))
    } else {
        destinationSet.remove(['weekly'])
    }

    if (backupData.month !== newBackupData.month) {
        $c('monthlyFileName', ['month_', newBackupData.month, '_backup.xml'].join(''))
    } else {
        destinationSet.remove(['monthly'])
    }

    $gc('backupData', newBackupData)
}

if (typeof module === 'object') {
    module.exports = mirthBackup
}

