const DATE_TIME_SEPARATOR = /t|\s/i
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/
const TIME = /^(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:z|([+-]\d\d)(?::?(\d\d))?)$/i
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export default function validDate(str: string): boolean {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  const dateTime: string[] = str.split(DATE_TIME_SEPARATOR)
  return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1])
}

function isLeapYear(year: number): boolean {
  // https://tools.ietf.org/html/rfc3339#appendix-C
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function date(str: string): boolean {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  const matches: string[] | null = DATE.exec(str)
  if (!matches) return false
  const year: number = +matches[1]
  const month: number = +matches[2]
  const day: number = +matches[3]
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month])
  )
}

function time(str: string): boolean {
  const matches: string[] | null = TIME.exec(str)
  if (!matches) return false

  const hour: number = +matches[1]
  const minute: number = +matches[2]
  const second: number = +matches[3]
  const tzHour: number = +(matches[4] || 0)
  const tzMin: number = +(matches[5] || 0)
  return (
    (hour <= 23 && minute <= 59 && second <= 59) ||
    (hour - tzHour === 23 && minute - tzMin === 59 && second === 60)
  )
}
