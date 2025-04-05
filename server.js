// Update server.js to use simplified authentication and layout
const express = require("express")
const path = require("path")
const cors = require("cors")
const morgan = require("morgan")
const helmet = require("helmet")
const bodyParser = require("body-parser")
const expressLayouts = require("express-ejs-layouts")

// Import authentication middleware
const { isLocalAccess } = require("./src/middleware/auth")

// Initialize express app
const app = express()
const PORT = process.env.PORT || 3000

// Initialize database
require("./src/config/init-db")

// Middleware
app.use(cors())
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for development, enable in production
  })
)
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Static files
app.use(express.static(path.join(__dirname, "public")))

// View engine setup
app.use(expressLayouts)
app.set("views", path.join(__dirname, "src/views"))
app.set("view engine", "ejs")
app.set("layout", "layouts/main")

// Import routes
const employeeRoutes = require("./src/routes/employeeRoutes")
const reservationRoutes = require("./src/routes/reservationRoutes")
const reportRoutes = require("./src/routes/reportRoutes")
const scannerRoutes = require("./src/routes/scannerRoutes")
const Employee = require("./src/models/Employee")
const Reservation = require("./src/models/Reservation")

// Apply authentication middleware
app.use(isLocalAccess)

// Use routes
app.use("/api/employees", employeeRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/reports", reportRoutes)
app.use("/scanner", scannerRoutes)

// Root route
app.get("/", (req, res) => {
  res.redirect("/scanner")
})

// Admin panel routes
app.get("/admin", async (req, res) => {
  try {
    // Added try-catch for better error handling
    const employees = await Employee.getTotalCount() // Fetches employee count
    const todayDate = new Date()
    const tomorrow = new Date(todayDate)
    tomorrow.setDate(todayDate.getDate() + 1)

    const todayReserves =
      (
        await Reservation.searchWithPagination({
          startDate: todayDate,
          endDate: tomorrow,
        })
      ).reservations.length || 0 // Fetches today's reservations count
    const totalReserves = await Reservation.getTotalCount() // Fetches total reservations count

    // The count object includes employees, todayReserves, and totalReserves
    res.render("admin/dashboard", {
      title: "Admin Dashboard", // Add a title
      count: { employees, todayReserves, totalReserves },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    // Render an error page or send an error response
    res.status(500).render("error", {
      layout: "layouts/main", // Use a general layout for errors
      title: "Error",
      message: "Failed to load dashboard data.",
      error: process.env.NODE_ENV === "development" ? error : {},
    })
  }
})

app.get("/admin/employees", (req, res) => {
  res.render("admin/employees", { title: "مدیریت کارمندان" })
})

app.get("/admin/reservations", (req, res) => {
  res.render("admin/reservations", { title: "مدیریت رزروها" })
})

app.get("/admin/reports", (req, res) => {
  res.render("admin/reports", { title: "گزارش‌ها" })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)

  if (req.xhr || req.path.startsWith("/api")) {
    res.status(500).json({ success: false, message: "Something broke!" })
  } else {
    res.status(500).render("error", {
      title: "خطا",
      message: "مشکلی پیش آمده است!",
      error: process.env.NODE_ENV === "development" ? err : {},
    })
  }
})

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

module.exports = app
