import {_} from "./codegen"

const DATE_TIME = /^(\d\d\d\d)-(\d\d)-(\d\d)(?:t|\s)(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:z|([+-]\d\d)(?::?(\d\d))?)$/i
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export default function validTimestamp(str: string): boolean {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  const matches: string[] | null = DATE_TIME.exec(str)
  if (!matches) return false
  const y: number = +matches[1]
  const m: number = +matches[2]
  const d: number = +matches[3]
  const hr: number = +matches[4]
  const min: number = +matches[5]
  const sec: number = +matches[6]
  const tzH: number = +(matches[7] || 0)
  const tzM: number = +(matches[8] || 0)
  return (
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    (d <= DAYS[m] ||
      // leap year: https://tools.ietf.org/html/rfc3339#appendix-C
      (m === 2 && d === 29 && (y % 100 === 0 ? y % 400 === 0 : y % 4 === 0))) &&
    ((hr <= 23 && min <= 59 && sec <= 59) ||
      // leap second
      (hr - tzH === 23 && min - tzM === 59 && sec === 60))
  )
}

validTimestamp.code = _`require("ajv/dist/compile/timestamp").default`
