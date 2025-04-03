const { db, runQuery, getAllRows, getRow } = require("../config/database")

class Employee {
  // Get all employees
  static async getAll() {
    try {
      return await getAllRows("SELECT * FROM employees ORDER BY id DESC")
    } catch (error) {
      console.error("Error getting employees:", error)
      throw error
    }
  }

  // Get employee by ID
  static async getById(employeeId) {
    try {
      return await getRow(
        "SELECT * FROM employees WHERE id = ? OR employee_id = ?",
        [employeeId, employeeId]
      )
    } catch (error) {
      console.error("Error getting employee by ID:", error)
      throw error
    }
  }

  // Create new employee
  static async create(employeeData) {
    try {
      const {
        employee_id,
        first_name,
        last_name,
        department,
        position,
        is_guest,
      } = employeeData

      return await runQuery(
        `INSERT INTO employees (employee_id, first_name, last_name, department, position, is_guest)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          employee_id,
          first_name,
          last_name,
          department,
          position,
          is_guest ? 1 : 0,
        ]
      )
    } catch (error) {
      console.error("Error creating employee:", error)
      throw error
    }
  }

  // Update employee
  static async update(employeeId, employeeData) {
    try {
      const { first_name, last_name, department, position, is_guest } =
        employeeData

      return await runQuery(
        `UPDATE employees 
         SET first_name = ?, last_name = ?, department = ?, position = ?, is_guest = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          first_name,
          last_name,
          department,
          position,
          is_guest ? 1 : 0,
          employeeId,
        ]
      )
    } catch (error) {
      console.error("Error updating employee:", error)
      throw error
    }
  }

  // Delete employee
  static async delete(employeeId) {
    try {
      return await runQuery("DELETE FROM employees WHERE id = ?", [employeeId])
    } catch (error) {
      console.error("Error deleting employee:", error)
      throw error
    }
  }

  static async search(query) {
    try {
      // Use parameterized queries with proper Unicode handling
      const searchPattern = `%${query}%`

      return await getAllRows(
        `
        SELECT * FROM employees 
        WHERE 
          employee_id LIKE ? COLLATE NOCASE OR
          first_name LIKE ? COLLATE NOCASE OR
          last_name LIKE ? COLLATE NOCASE OR
          department LIKE ? COLLATE NOCASE OR
          position LIKE ? COLLATE NOCASE
        ORDER BY id DESC
      `,
        [
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
        ]
      )
    } catch (error) {
      console.error("Error searching employees:", error)
      throw error
    }
  }
  // Get total count of employees
  static async getTotalCount() {
    try {
      const result = await getRow("SELECT COUNT(*) AS total FROM employees", [])
      return result.total
    } catch (error) {
      console.error("Error getting employee total count:", error)
      throw error
    }
  }
  // Import employees from array
  static async importFromArray(employeesArray) {
    try {
      const stmt = db.prepare(
        `INSERT INTO employees (employee_id, first_name, last_name, department, position, is_guest)
         VALUES (?, ?, ?, ?, ?, ?)`
      )

      let successCount = 0

      for (const emp of employeesArray) {
        try {
          stmt.run(
            emp.employee_id,
            emp.first_name || null,
            emp.last_name || null,
            emp.department || null,
            emp.position || null,
            emp.is_guest ? 1 : 0
          )
          successCount++
        } catch (err) {
          console.error(`Error importing employee ${emp.employee_id}:`, err)
        }
      }

      stmt.finalize()
      return successCount
    } catch (error) {
      console.error("Error importing employees:", error)
      throw error
    }
  }
}

module.exports = Employee
