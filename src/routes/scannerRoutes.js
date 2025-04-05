const express = require("express")
const router = express.Router()
const path = require("path")
const Reservation = require("../models/Reservation")
const Employee = require("../models/Employee")
const { generateMealToken } = require("../utils/pdfGenerator")

// Scanner page
router.get("/", (req, res) => {
  res.render("scanner/index", {
    title: "اسکنر بارکد",
    layout: false, // Don't use admin layout for scanner page
  })
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
