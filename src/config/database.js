const sqlite3 = require("sqlite3").verbose()
const path = require("path")

// Create database connection
const dbPath = path.join(__dirname, "food_reservation.db")
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error("Error connecting to database:", err.message)
    throw err
  }
  console.log("Connected to the SQLite database.")
})

// Run query (for INSERT, UPDATE, DELETE)
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        console.error("Error executing query:", err.message)
        reject(err)
      } else {
        resolve({ id: this.lastID, changes: this.changes })
      }
    })
  })
}

// Get all rows (for SELECT multiple rows)
const getAllRows = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Error executing query:", err.message)
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

// Get single row (for SELECT single row)
const getRow = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error("Error executing query:", err.message)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

module.exports = {
  db,
  runQuery,
  getAllRows,
  getRow,
}
