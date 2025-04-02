const jalaali = require("jalaali-js")

// Function to convert Persian date string to milliseconds
function parsePersianDate(persianDateStr) {
  // Expected format: "۱۴۰۲/۰۷/۱۵" or "1402/07/15"
  let parts = persianDateStr.split("/")
  if (parts.length !== 3) {
    throw new Error("Invalid Persian date format. Expected YYYY/MM/DD.")
  }

  // Convert Persian digits to English
  let persianYear = parseInt(persianToEnglishDigits(parts[0]), 10)
  let persianMonth = parseInt(persianToEnglishDigits(parts[1]), 10)
  let persianDay = parseInt(persianToEnglishDigits(parts[2]), 10)

  // Convert to Gregorian
  const gDate = jalaali.toGregorian(persianYear, persianMonth, persianDay)

  // Create JavaScript Date object (JS months are 0-indexed)
  const gregorianDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd)

  return gregorianDate.toLocaleDateString()
}

module.exports = {
  parsePersianDate,
}

function persianToEnglishDigits(persianStr) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹" // Persian numerals
  return persianStr
    .replace(/[۰-۹]/g, digit => persianDigits.indexOf(digit))
    .replace("\\", "/")
}
