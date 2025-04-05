function parseDate(date) {
  return parseInt(
    date
      .toLocaleDateString("en-GB")
      .split("/")
      .map(s => s.padStart(2, 0))
      .reverse()
      .join("")
  )
}
function parseDateStr(str) {
  const [day, month, year] = str.split("/")
  return new Date(year, month - 1, day)
}

module.exports = {
  parseDate,
  parseDateStr,
}
