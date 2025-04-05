const { db, runQuery } = require("../config/database")
const Reservation = require("./Reservation")

// Create tables if they don't exist
const initializeDatabase = async () => {
  try {
    console.log("Initializing database...")
    // Example usage:
    // await new Promise(res => {
    //   dropTables(err => {
    //     if (err) {
    //       console.error("Failed to drop tables:", err)
    //     } else {
    //       console.log("Tables dropped successfully.")
    //     }
    //     res()
    //   })
    // })
    // Employees table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        department TEXT,
        position TEXT,
        is_guest INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create new Reservations table with the simplified schema
    await runQuery(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        date INTEGER NOT NULL,
        breakfast INTEGER DEFAULT 0,
        lunch INTEGER DEFAULT 0,
        dinner INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        UNIQUE (employee_id, date)
      )
    `)
    // setTimeout(() => {
    //   addingData4test()
    // }, 100)

    console.log("Database initialized successfully")
  } catch (error) {
    throw new Error("Error initializing database:", error)
  }
  return db
}

module.exports = {
  initializeDatabase,
}

async function addingData4test() {
  // Add some test employees
  const employees = [
    {
      employee_id: "1100001",
      first_name: "محمد",
      last_name: "احمدی",
      department: "پذیرش",
      position: "مسئول پذیرش",
    },
    {
      employee_id: "1100002",
      first_name: "علی",
      last_name: "حسینی",
      department: "حسابداری",
      position: "حسابدار",
    },
    {
      employee_id: "1100003",
      first_name: "فاطمه",
      last_name: "محمدی",
      department: "پرستاری",
      position: "سرپرستار",
    },
    {
      employee_id: "1100004",
      first_name: "زهرا",
      last_name: "رضایی",
      department: "پرستاری",
      position: "پرستار",
    },
    {
      employee_id: "1100005",
      first_name: "حسین",
      last_name: "کریمی",
      department: "خدمات",
      position: "مسئول خدمات",
    },
  ]
  await runQuery("DELETE FROM employees")
  for (const emp of employees) {
    try {
      await runQuery(
        `INSERT OR IGNORE INTO employees (employee_id, first_name, last_name, department, position) 
           VALUES (?, ?, ?, ?, ?)`,
        [
          emp.employee_id,
          emp.first_name,
          emp.last_name,
          emp.department,
          emp.position,
        ]
      )
    } catch (err) {
      console.log(`Employee ${emp.employee_id} already exists, skipping.`)
    }
  }

  await Reservation.generateSampleReservations()

  console.log("test data added")
}
function dropTables(callback) {
  // Use the database connection to drop both tables
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS reservations", err => {
      if (err) {
        console.error('Error dropping "reservations" table:', err.message)
        return callback(err)
      }
      console.log('Dropped "reservations" table successfully.')

      db.run("DROP TABLE IF EXISTS employees", err => {
        if (err) {
          console.error('Error dropping "employees" table:', err.message)
          return callback(err)
        }
        console.log('Dropped "employees" table successfully.')
        callback(null) // Success
      })
    })
  })
}
