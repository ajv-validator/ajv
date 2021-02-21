const rxJsonParse = /position\s(\d+)$/

export default function jsonParse(s: string, pos: number): [unknown, number] {
  let endPos: number | undefined
  if (pos) s = s.slice(pos)
  try {
    return [JSON.parse(s), pos + s.length]
  } catch (e) {
    const matches = rxJsonParse.exec(e.message)
    if (!matches) throw e
    endPos = +matches[1]
    s = s.slice(0, endPos)
    return [JSON.parse(s), pos + endPos]
  }
}
