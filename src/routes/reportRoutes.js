const express = require("express")
const router = express.Router()
const Reservation = require("../models/Reservation")
const { generateExcelReport } = require("../utils/excelGenerator") // Assuming excel generator utility
const { generatePdfReport } = require("../utils/pdfGenerator") // Assuming pdf generator utility

// POST /api/reports - Fetch filtered and paginated report data with summary
router.post("/", async (req, res) => {
  try {
    // Extract filters and pagination from query parameters
    const {
      employeeId,
      name,
      department,
      startDate,
      endDate,
      mealShift,
      mealOut,
      page = 1,
      limit = 15, // Match frontend itemsPerPage
    } = req.body

    const filters = {
      employeeId,
      name,
      department,
      startDate: startDate,
      endDate: endDate,
      mealShift,
      mealOut,
    }

    // Remove undefined/empty filters
    Object.keys(filters).forEach(key =>
      filters[key] === undefined || filters[key] === ""
        ? delete filters[key]
        : {}
    )

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }

    // Fetch filtered and paginated data from the model
    // This method needs to be implemented/updated in Reservation.js
    const { reservations, totalItems } = await Reservation.searchWithPagination(
      filters,
      pagination
    )

    const summary = {
      totalReservations: totalItems,
      totalEmployees: 0, // Need to determine how to count unique employees from filtered reservations
      totalGuests: 0, // Need to determine how to count unique guests
      shiftMeals: { breakfast: 0, lunch: 0, dinner: 0 },
      outOfShiftMeals: { breakfast: 0, lunch: 0, dinner: 0 },
    }
    const shiftValue = [1, 3]
    const outShiftValue = [2, 4]
    const uniqueEmployeeIds = new Set()
    reservations.forEach(res => {
      if (res.employee_id) {
        uniqueEmployeeIds.add(res.employee_id)
        if (res.is_guest === 1) {
          summary.totalGuests++
        }
      }

      // Sum meal counts
      if (shiftValue.includes(res.breakfast)) summary.shiftMeals.breakfast++
      if (shiftValue.includes(res.lunch)) summary.shiftMeals.lunch++
      if (shiftValue.includes(res.dinner)) summary.shiftMeals.dinner++

      if (outShiftValue.includes(res.breakfast))
        summary.outOfShiftMeals.breakfast++
      if (outShiftValue.includes(res.lunch)) summary.outOfShiftMeals.lunch++
      if (outShiftValue.includes(res.dinner)) summary.outOfShiftMeals.dinner++
    })

    summary.totalEmployees = uniqueEmployeeIds.size // Count unique employees from filtered results

    const totalPages = Math.ceil(totalItems / pagination.limit)

    res.json({
      reservations,
      summary,
      totalItems,
      totalPages,
      currentPage: pagination.page,
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    res
      .status(500)
      .json({ message: "Failed to fetch reports", error: error.message })
  }
})

// GET /api/reports/export/excel - Export filtered data to Excel
router.get("/export/excel", async (req, res) => {
  try {
    const filters = req.body
    // Fetch ALL matching data (no pagination for export)
    const { reservations } = await Reservation.searchWithPagination(filters, {
      limit: null,
      page: null,
    }) // Assuming limit: null fetches all

    if (!reservations || reservations.length === 0) {
      return res.status(404).send("No data found for the selected filters.")
    }

    const excelBuffer = await generateExcelReport(reservations) // Implement this utility

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="food_report_${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    )
    res.send(excelBuffer)
  } catch (error) {
    console.error("Error exporting Excel report:", error)
    res
      .status(500)
      .send("Failed to export report to Excel. Error: " + error.message)
  }
})

// GET /api/reports/print - Generate a printable PDF report
router.get("/print", async (req, res) => {
  try {
    const filters = req.query // Reuse filters from query
    // Fetch ALL matching data (no pagination for print)
    const { reservations } = await Reservation.searchWithPagination(filters, {
      limit: null,
      page: null,
    }) // Assuming limit: null fetches all

    if (!reservations || reservations.length === 0) {
      return res.status(404).send("No data found for the selected filters.")
    }

    // Generate PDF (using pdfGenerator utility)
    const pdfBuffer = await generatePdfReport(reservations, filters) // Implement this utility

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `inline; filename="food_report_${
        new Date().toISOString().split("T")[0]
      }.pdf"` // inline to display in browser
    )
    res.send(pdfBuffer)
  } catch (error) {
    console.error("Error generating printable report:", error)
    res
      .status(500)
      .send("Failed to generate printable report. Error: " + error.message)
  }
})

module.exports = router
