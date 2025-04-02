const { initializeDatabase } = require("../models/db")

// Initialize the database when the application starts
;(async () => {
  try {
    const result = await initializeDatabase()
  } catch (error) {
    console.error("Error initializing database:", error)
  }
})()
