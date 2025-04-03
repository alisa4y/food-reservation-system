const express = require("express")
const router = express.Router()
const Reservation = require("../models/Reservation")
const Employee = require("../models/Employee")
const multer = require("multer")
const upload = multer({ dest: "uploads/" })
const exceljs = require("exceljs")
const fs = require("fs")
const { generateMealToken } = require("../utils/pdfGenerator")

// Get all reservations
router.get("/", async (req, res) => {
  try {
    const reservations = await Reservation.getAll()

    res.json({ success: true, data: reservations })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reservations" })
  }
})

// Get reservation by ID
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.getById(req.params.id)
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" })
    }
    res.json({ success: true, data: reservation })
  } catch (error) {
    console.error("Error fetching reservation:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reservation" })
  }
})

// Get reservations by employee ID
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const reservations = await Reservation.getByEmployeeId(
      req.params.employeeId
    )
    res.json({ success: true, data: reservations })
  } catch (error) {
    console.error("Error fetching reservations by employee ID:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reservations" })
  }
})

// Create new reservation
router.post("/", async (req, res) => {
  try {
    const { employee_id, date, breakfast, lunch, dinner } = req.body
    // Validate required fields
    if (!employee_id || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID and date are required" })
    }

    // Check if employee exists
    const employee = await Employee.getById(employee_id)
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" })
    }

    // Check if reservation already exists for this employee and date
    const existingReservation = await Reservation.getByEmployeeIdAndDate(
      employee_id,
      date
    )
    if (existingReservation) {
      return res.status(409).json({
        success: false,
        message: "Reservation already exists for this employee and date",
      })
    }

    const result = await Reservation.create({
      employee_id,
      date,
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner,
    })

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: { id: result.id },
    })
  } catch (error) {
    console.error("Error creating reservation:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to create reservation" })
  }
})

// Update reservation
router.put("/:id", async (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body
    const id = req.params.id

    // Check if reservation exists
    const reservation = await Reservation.getById(id)
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" })
    }

    const result = await Reservation.update(id, {
      breakfast: parseInt(breakfast),
      lunch: parseInt(lunch),
      dinner: parseInt(dinner),
    })

    res.json({
      success: true,
      message: "Reservation updated successfully",
      data: { changes: result.changes },
    })
  } catch (error) {
    console.error("Error updating reservation:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to update reservation" })
  }
})

// Delete reservation
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id

    // Check if reservation exists
    const reservation = await Reservation.getById(id)
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" })
    }

    const result = await Reservation.delete(id)
    res.json({
      success: true,
      message: "Reservation deleted successfully",
      data: { changes: result.changes },
    })
  } catch (error) {
    console.error("Error deleting reservation:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to delete reservation" })
  }
})

// Search reservations
router.post("/filter", async (req, res) => {
  try {
    const filters = req.body
    const reservations = await Reservation.searchWithPagination({
      ...filters,
    })
    res.json({ success: true, data: reservations })
  } catch (error) {
    console.error("Error searching reservations:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to search reservations" })
  }
})
router.post("/search", async (req, res) => {
  try {
    const filters = req.body
    const reservations = await Reservation.searchAny({
      ...filters,
    })
    res.json({ success: true, data: reservations })
  } catch (error) {
    console.error("Error searching reservations:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to search reservations" })
  }
})
// Import reservations from Excel
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" })
    }

    const filePath = req.file.path
    const workbook = new exceljs.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.getWorksheet(1)
    const reservations = []

    // Skip header row
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        const reservation = {
          employee_id: row.getCell(1).value?.toString().trim(),
          date: row.getCell(2).value,
          breakfast: +(parseInt(row.getCell(3).value) == 1),
          lunch: +(parseInt(row.getCell(4).value) == 1),
          dinner: +(parseInt(row.getCell(5).value) == 1),
        }

        // Only add if employee_id and date exist
        if (reservation.employee_id && reservation.date) {
          reservations.push(reservation)
        }
      }
    })

    // Delete the temporary file
    fs.unlinkSync(filePath)

    if (reservations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid reservations found in the file",
      })
    }

    const successCount = await Reservation.importFromArray(reservations)

    res.json({
      success: true,
      message: `Successfully imported ${successCount} out of ${reservations.length} reservations`,
      data: { total: reservations.length, imported: successCount },
    })
  } catch (error) {
    console.error("Error importing reservations:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to import reservations" })
  }
})

// Check active reservation for barcode scanning
router.get("/check-active/:employeeId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId

    // Check if employee exists
    const employee = await Employee.getById(employeeId)
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" })
    }

    const result = await Reservation.checkActiveReservation(employeeId)

    if (result.active) {
      // Generate token PDF
      const token = await generateMealToken(
        result.reservation,
        result.mealType,
        result.reservation.id
      )
      return res.json({
        success: true,
        active: true,
        data: {
          employee: {
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            is_guest: employee.is_guest,
          },
          meal_type: result.mealType,
          reservation: {
            ...result.reservation,
            token_pdf: token.toString("base64"),
          },
        },
      })
    } else {
      let message = result.message
      if (result.consumed) {
        message = `این وعده غذایی (${
          result.mealType === "breakfast"
            ? "صبحانه"
            : result.mealType === "lunch"
            ? "ناهار"
            : "شام"
        }) قبلاً مصرف شده و ژتون آن چاپ شده است.`
      }

      return res.json({
        success: true,
        active: false,
        consumed: result.consumed || false,
        data: {
          employee: {
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            is_guest: employee.is_guest,
          },
          meal_type: result.mealType,
          message: message,
        },
      })
    }
  } catch (error) {
    console.error("Error checking active reservation:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to check active reservation" })
  }
})

module.exports = router
