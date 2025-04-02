const express = require("express")
const router = express.Router()
const Employee = require("../models/Employee")
const multer = require("multer")
const upload = multer({ dest: "uploads/" })
const exceljs = require("exceljs")
const fs = require("fs")
const path = require("path")

// Get all employees or search employees
router.get("/", async (req, res) => {
  try {
    const searchTerm = req.query.search
    let employees
    if (searchTerm) {
      employees = await Employee.search(searchTerm)
    } else {
      employees = await Employee.getAll()
    }
    res.json({ success: true, data: employees })
  } catch (error) {
    console.error("Error fetching/searching employees:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch employees" })
  }
})

// Get employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id)
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" })
    }
    res.json({ success: true, data: employee })
  } catch (error) {
    console.error("Error fetching employee:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch employee" })
  }
})

// Create new employee
router.post("/", async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      department,
      position,
      is_guest,
    } = req.body

    // Validate required fields
    if (!employee_id) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID is required" })
    }

    // For non-guests, validate other fields
    if (!is_guest && (!first_name || !last_name)) {
      return res.status(400).json({
        success: false,
        message:
          "First name and last name are required for non-guest employees",
      })
    }

    const result = await Employee.create({
      employee_id,
      first_name: first_name || null,
      last_name: last_name || null,
      department: department || null,
      position: position || null,
      is_guest: is_guest || false,
    })

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: { id: result.id },
    })
  } catch (error) {
    console.error("Error creating employee:", error)

    // Handle duplicate employee ID
    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      return res
        .status(409)
        .json({ success: false, message: "Employee ID already exists" })
    }

    res
      .status(500)
      .json({ success: false, message: "Failed to create employee" })
  }
})

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { first_name, last_name, department, position, is_guest } = req.body
    const employeeId = req.params.id

    // Check if employee exists
    const employee = await Employee.getById(employeeId)
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" })
    }

    // For non-guests, validate other fields
    if (!is_guest && (!first_name || !last_name)) {
      return res.status(400).json({
        success: false,
        message:
          "First name and last name are required for non-guest employees",
      })
    }

    const result = await Employee.update(employeeId, {
      first_name: first_name || null,
      last_name: last_name || null,
      department: department || null,
      position: position || null,
      is_guest: is_guest || false,
    })

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: { changes: result.changes },
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to update employee" })
  }
})

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    const employeeId = req.params.id

    // Check if employee exists
    const employee = await Employee.getById(employeeId)
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" })
    }

    const result = await Employee.delete(employeeId)
    res.json({
      success: true,
      message: "Employee deleted successfully",
      data: { changes: result.changes },
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to delete employee" })
  }
})

// Search employees
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query
    const employees = await Employee.search(query)
    res.json({ success: true, data: employees })
  } catch (error) {
    console.error("Error searching employees:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to search employees" })
  }
})

// Import employees from Excel
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
    const employees = []

    // Skip header row
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        const employee = {
          employee_id: row.getCell(1).value?.toString().trim(),
          first_name: row.getCell(2).value?.toString().trim(),
          last_name: row.getCell(3).value?.toString().trim(),
          department: row.getCell(4).value?.toString().trim(),
          position: row.getCell(5).value?.toString().trim(),
          is_guest: +(row.getCell(6).value == 1),
        }

        // Only add if employee_id exists
        if (employee.employee_id) {
          employees.push(employee)
        }
      }
    })

    // Delete the temporary file
    fs.unlinkSync(filePath)

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid employees found in the file",
      })
    }

    const successCount = await Employee.importFromArray(employees)

    res.json({
      success: true,
      message: `Successfully imported ${successCount} out of ${employees.length} employees`,
      data: { total: employees.length, imported: successCount },
    })
  } catch (error) {
    console.error("Error importing employees:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to import employees" })
  }
})

module.exports = router
