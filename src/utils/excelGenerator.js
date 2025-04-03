const ExcelJS = require("exceljs")

async function generateExcelReport(reservations, filters = {}) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Food Reservation System"
  workbook.lastModifiedBy = "Food Reservation System"
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet("Food Reservations Report")

  // --- Add Title and Filters ---
  worksheet.addRow(["Food Reservations Report"]).font = {
    size: 16,
    bold: true,
  }
  worksheet.mergeCells("A1:H1") // Merge across potential columns
  worksheet.addRow([]) // Spacer row

  // Add filter information if available
  const filterEntries = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== "" && value !== null
  )
  if (filterEntries.length > 0) {
    worksheet.addRow(["Applied Filters:"]).font = { bold: true }
    filterEntries.forEach(([key, value]) => {
      // Simple formatting for keys
      const formattedKey = key
        .replace(/([A-Z])/g, " $1") // Add space before capitals
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      worksheet.addRow([`${formattedKey}:`, value])
    })
    worksheet.addRow([]) // Spacer row
  }

  // --- Define Columns ---
  worksheet.columns = [
    { header: "Employee ID", key: "employee_id", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Breakfast", key: "breakfast", width: 15 },
    { header: "Lunch", key: "lunch", width: 15 },
    { header: "Dinner", key: "dinner", width: 15 },
  ]

  // --- Style Header Row ---
  worksheet.getRow(worksheet.lastRow.number).font = { bold: true }
  worksheet.getRow(worksheet.lastRow.number).alignment = {
    vertical: "middle",
    horizontal: "center",
  }
  worksheet.getRow(worksheet.lastRow.number).eachCell(cell => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }, // Light grey background
    }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
  })

  // --- Add Data Rows ---
  reservations.forEach(res => {
    worksheet.addRow({
      employee_id: res.employee_id,
      name: res.name || "N/A",
      date: res.date, // Format date
      breakfast: res.breakfast,
      lunch: res.lunch,
      dinner: res.dinner,
    })
  })

  // --- Apply Borders to Data Cells ---
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Start applying borders after the header row
    if (rowNumber > worksheet.lastRow.number - reservations.length) {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
    }
  })

  // --- Generate Buffer ---
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

module.exports = { generateExcelReport }
