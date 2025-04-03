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

module.exports = router
