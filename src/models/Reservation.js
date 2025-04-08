const { db, runQuery, getAllRows, getRow } = require("../config/database")
const { parseDate } = require("../utils/tools")

const breakfastStart = 7 * 60
const breakfastEnd = 8 * 60 + 30
const lunchStart = 12 * 60
const lunchEnd = 15 * 60
const dinnerStart = 19 * 60
const dinnerEnd = 21 * 60 + 30

class Reservation {
  // Get all reservations
  static async getAll() {
    try {
      return await getAllRows(`
        SELECT r.*, e.first_name, e.last_name, e.is_guest 
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
        ORDER BY r.date DESC, r.id DESC
      `)
    } catch (error) {
      console.error("Error getting reservations:", error)
      throw error
    }
  }

  // Get reservation by ID
  static async getById(id) {
    try {
      return await getRow(
        `
        SELECT r.*, e.first_name, e.last_name, e.is_guest, e.department, e.position
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
        WHERE r.id = ?
      `,
        [id]
      )
    } catch (error) {
      console.error("Error getting reservation by ID:", error)
      throw error
    }
  }

  // Get reservations by employee ID
  static async getByEmployeeId(employeeId) {
    try {
      return await getAllRows(
        `
        SELECT r.*, e.first_name, e.last_name, e.is_guest
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
        WHERE r.employee_id = ?
        ORDER BY r.date DESC
      `,
        [employeeId]
      )
    } catch (error) {
      console.error("Error getting reservations by employee ID:", error)
      throw error
    }
  }

  // Get reservation by employee ID and date
  static async getByEmployeeIdAndDate(employeeId, date) {
    try {
      return await getRow(
        `
        SELECT r.*, e.first_name, e.last_name, e.is_guest
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
        WHERE r.employee_id = ? AND r.date = ?
      `,
        [employeeId, parseDate(date)]
      )
    } catch (error) {
      console.error("Error getting reservation by employee ID and date:", error)
      throw error
    }
  }

  // Create new reservation
  static async create(reservationData) {
    try {
      const { employee_id, date, breakfast, lunch, dinner } = reservationData

      return await runQuery(
        `INSERT INTO reservations (
          employee_id, date, 
          breakfast, lunch, dinner
        ) VALUES (?, ?, ?, ?, ?)`,
        [employee_id, parseDate(date), breakfast || 0, lunch || 0, dinner || 0]
      )
    } catch (error) {
      console.error("Error creating reservation:", error)
      throw error
    }
  }

  // Update reservation
  static async update(id, reservationData) {
    try {
      const { breakfast, lunch, dinner } = reservationData

      return await runQuery(
        `UPDATE reservations 
         SET breakfast = ?, lunch = ?, dinner = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [breakfast || 0, lunch || 0, dinner || 0, id]
      )
    } catch (error) {
      console.error("Error updating reservation:", error)
      throw error
    }
  }

  // Delete reservation
  static async delete(id) {
    try {
      return await runQuery("DELETE FROM reservations WHERE id = ?", [id])
    } catch (error) {
      console.error("Error deleting reservation:", error)
      throw error
    }
  }
  // New method for searching with pagination and specific filters
  static async searchAny(filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page, 10) || 1
      const limit = parseInt(pagination.limit, 10)
      const offset = limit ? (page - 1) * limit : 0

      let baseQuery = `
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
      `
      const conditions = []
      const params = []

      // Employee ID filter
      if (filters.employeeId) {
        conditions.push("e.employee_id = ?")
        params.push(filters.employeeId)
      }

      // Name filter with case-insensitive matching
      if (filters.name) {
        conditions.push(
          "(e.first_name LIKE ? COLLATE NOCASE OR e.last_name LIKE ? COLLATE NOCASE)"
        )
        params.push(`%${filters.name}%`, `%${filters.name}%`)
      }

      // Department filter with case-insensitive matching
      if (filters.department) {
        conditions.push("e.department LIKE ? COLLATE NOCASE")
        params.push(`%${filters.department}%`)
      }
      if (filters.position) {
        conditions.push("e.position LIKE ? COLLATE NOCASE")
        params.push(`%${filters.department}%`)
      }
      // date range filter
      if (filters.startDate) {
        conditions.push("r.date = ?")
        params.push(parseDate(filters.startDate))
      }
      if (filters.endDate) {
        conditions.push("r.date = ?")
        params.push(parseDate(filters.endDate))
      }

      let whereClause =
        conditions.length > 0 ? ` WHERE ${conditions.join(" OR ")}` : ""

      const validMealTypes = ["breakfast", "lunch", "dinner"]

      // Helper function to process meal filters
      const processMealFilter = (filterValue, inClause) => {
        if (!filterValue) return

        // Handle both array and single value inputs
        const meals = Array.isArray(filterValue) ? filterValue : [filterValue]
        const validMeals = meals.filter(m => validMealTypes.includes(m))

        if (validMeals.length > 0) {
          const conditions = validMeals.map(m => `r.${m} IN (${inClause})`)
          whereClause += ` OR (${conditions.join(" OR ")})`
        }
      }

      // Process mealShift filter (in-shift meals)
      processMealFilter(filters.mealShift, "1, 3")

      // Process mealOut filter (out-of-shift meals)
      processMealFilter(filters.mealOut, "2, 4")

      // --- Count Query ---
      const countQuery = `SELECT COUNT(r.id) AS totalItems ${baseQuery} ${whereClause}`
      const countResult = await getRow(countQuery, params)
      const totalItems = countResult.totalItems || 0

      // --- Data Query ---
      let dataQuery = `
        SELECT
          r.id as reservation_id, r.date,
          r.breakfast, r.lunch, r.dinner,
          e.employee_id, e.first_name, e.last_name, e.department, e.position, e.is_guest
        ${baseQuery}
        ${whereClause}
        ORDER BY r.date DESC, r.id DESC
      `

      // if (limit) {
      //   dataQuery += ` LIMIT ? OFFSET ?`
      //   params.push(limit, offset)
      // }

      const rawReservations = await getAllRows(dataQuery, params)

      // --- Process results ---
      const reservations = rawReservations.map(row => ({
        id: row.reservation_id,
        date: row.date,
        employee_id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        department: row.department,
        position: row.position,
        is_guest: row.is_guest,
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
      }))

      return { reservations, totalItems }
    } catch (error) {
      console.error("Error searching reservations with pagination:", error)
      throw error
    }
  }
  // New method for searching with pagination and specific filters
  static async searchWithPagination(filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page, 10) || 1
      const limit = parseInt(pagination.limit, 10)
      const offset = limit ? (page - 1) * limit : 0

      let baseQuery = `
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
      `
      let whereClause = " WHERE 1=1 "
      const params = []

      // Employee ID filter
      if (filters.employeeId) {
        whereClause += " AND e.employee_id = ?"
        params.push(filters.employeeId)
      }

      // Name filter with case-insensitive matching
      if (filters.name) {
        whereClause +=
          " AND (e.first_name LIKE ? COLLATE NOCASE OR e.last_name LIKE ? COLLATE NOCASE)"
        params.push(`%${filters.name}%`, `%${filters.name}%`)
      }

      // Department filter with case-insensitive matching
      if (filters.department) {
        whereClause += " AND e.department LIKE ? COLLATE NOCASE"
        params.push(`%${filters.department}%`)
      }
      if (filters.position) {
        whereClause += " AND e.position LIKE ? COLLATE NOCASE"
        params.push(`%${filters.department}%`)
      }
      // date range filter
      if (filters.startDate) {
        whereClause += " AND r.date >= ?"
        params.push(parseDate(filters.startDate))
      }
      if (filters.endDate) {
        whereClause += " AND r.date < ?"
        params.push(parseDate(filters.endDate))
      }

      const validMealTypes = ["breakfast", "lunch", "dinner"]

      // Helper function to process meal filters
      const processMealFilter = (filterValue, inClause) => {
        if (!filterValue) return

        // Handle both array and single value inputs
        const meals = Array.isArray(filterValue) ? filterValue : [filterValue]
        const validMeals = meals.filter(m => validMealTypes.includes(m))

        if (validMeals.length > 0) {
          const conditions = validMeals.map(m => `r.${m} IN (${inClause})`)
          whereClause += ` AND (${conditions.join(" OR ")})`
        }
      }

      // Process mealShift filter (in-shift meals)
      processMealFilter(filters.mealShift, "1, 3")

      // Process mealOut filter (out-of-shift meals)
      processMealFilter(filters.mealOut, "2, 4")

      // --- Count Query ---
      const countQuery = `SELECT COUNT(r.id) AS totalItems ${baseQuery} ${whereClause}`
      const countResult = await getRow(countQuery, params)
      const totalItems = countResult.totalItems || 0

      // --- Data Query ---
      let dataQuery = `
        SELECT
          r.id as reservation_id, r.date,
          r.breakfast, r.lunch, r.dinner,
          e.employee_id, e.first_name, e.last_name, e.department, e.position, e.is_guest
        ${baseQuery}
        ${whereClause}
        ORDER BY r.date DESC, r.id DESC
      `

      // if (limit) {
      //   dataQuery += ` LIMIT ? OFFSET ?`
      //   params.push(limit, offset)
      // }

      const rawReservations = await getAllRows(dataQuery, params)

      // --- Process results ---
      const reservations = rawReservations.map(row => ({
        id: row.reservation_id,
        date: row.date,
        employee_id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        department: row.department,
        position: row.position,
        is_guest: row.is_guest,
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
      }))

      return { reservations, totalItems }
    } catch (error) {
      console.error("Error searching reservations with pagination:", error)
      throw error
    }
  }
  // Check if employee has active reservation for current meal
  static async checkActiveReservation(employeeId) {
    try {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      // --- Define Meal Times (as before) ---
      const currentTimeInMinutes = hours * 60 + minutes

      let mealType = "lunch"
      let mealField = "lunch"

      // --- Determine Meal Key and Class (as before) ---
      if (
        currentTimeInMinutes >= breakfastStart &&
        currentTimeInMinutes < breakfastEnd
      ) {
        mealType = "breakfast"
        mealField = "breakfast"
      } else if (
        currentTimeInMinutes >= lunchStart &&
        currentTimeInMinutes < lunchEnd
      ) {
        mealType = "lunch"
        mealField = "lunch"
      } else if (
        currentTimeInMinutes >= dinnerStart &&
        currentTimeInMinutes < dinnerEnd
      ) {
        mealType = "dinner"
        mealField = "dinner"
      } else {
        return { active: false, message: "Not currently in a meal time" }
      }

      // Check for reservation
      const currentDate = parseDate(new Date())
      const reservation = await getRow(
        `
        SELECT r.*, e.first_name, e.last_name, e.is_guest
        FROM reservations r
        JOIN employees e ON r.employee_id = e.employee_id
        WHERE r.employee_id = ? AND r.date = ? AND (r.${mealField} = 1 OR r.${mealField} = 2)
      `,
        [employeeId, currentDate]
      )

      if (reservation) {
        const isInShift = reservation[mealField] === 1

        // disable for testing
        await runQuery(
          `UPDATE reservations
           SET ${mealField} = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [isInShift ? 3 : 4, reservation.id]
        )

        return {
          active: true,
          reservation,
          mealType,
          mealField,
          isInShift,
          message: `Active ${mealType} reservation found`,
        }
      } else {
        // Check if it was already consumed
        const consumedReservation = await getRow(
          `
          SELECT r.*, e.first_name, e.last_name, e.is_guest
          FROM reservations r
          JOIN employees e ON r.employee_id = e.employee_id
          WHERE r.employee_id = ? AND r.date = ? AND (r.${mealField} = 3 OR r.${mealField} = 4)
        `,
          [employeeId, currentDate]
        )

        if (consumedReservation) {
          return {
            active: false,
            mealType,
            consumed: true,
            message: `${mealType} reservation already consumed today`,
          }
        }

        return {
          active: false,
          mealType,
          consumed: false,
          message: `No active ${mealType} reservation found`,
        }
      }
    } catch (error) {
      console.error("Error checking active reservation:", error)
      throw error
    }
  }
  // Mark reservation as consumed
  static async markAsConsumed(id, mealType, isInShift) {
    try {
      const newValue = isInShift ? 3 : 4 // 3 for consumed in shift, 4 for consumed out of shift

      return await runQuery(
        `UPDATE reservations 
         SET ${mealType} = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newValue, id]
      )
    } catch (error) {
      console.error("Error marking reservation as consumed:", error)
      throw error
    }
  }
  // Import reservations from array
  static async importFromArray(reservationsArray) {
    let successCount = 0
    const stmt = db.prepare(`
      INSERT INTO reservations (
        employee_id, date, 
        breakfast, lunch, dinner
      ) VALUES (?, ?, ?, ?, ?)
    `)

    // Promisify the statement execution
    const runStatement = params => {
      return new Promise((resolve, reject) => {
        stmt.run(params, err => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    for (const res of reservationsArray) {
      try {
        await runStatement([
          res.employee_id,
          parseDate(res.date),
          res.breakfast || 0,
          res.lunch || 0,
          res.dinner || 0,
        ])
        successCount++
      } catch (err) {
        console.error(
          `Error importing reservation for ${res.employee_id} on ${parseDate(
            res.date
          )}:`,
          err.message
        )
        // Continue processing remaining reservations
      }
    }

    stmt.finalize()

    return successCount
  }
  // Get total count of employees
  static async getTotalCount() {
    try {
      const result = await getRow(
        "SELECT COUNT(*) AS total FROM reservations",
        []
      )
      return result.total
    } catch (error) {
      console.error("Error getting employee total count:", error)
      throw error
    }
  }
  // Clear all reservations
  static async clearReservations() {
    try {
      await runQuery("DELETE FROM reservations")
    } catch (error) {
      console.error("Error clearing reservations:", error)
      throw error
    }
  }
  // Generate random date between today and next week
  static generateRandomDate() {
    const today = new Date()
    const daysToAdd = Math.floor(Math.random() * 7)
    const date = new Date(today)
    date.setDate(today.getDate() + daysToAdd)
    return date
  }
  // Generate sample reservations data
  static generateSampleData(count = 100) {
    const reservations = []
    const employeeIdRange = 5 // Generates 1100001 to 1100020

    for (let i = 0; i < count; i++) {
      const employeeId = `110000${
        Math.floor(Math.random() * employeeIdRange) + 1
      }`.padEnd(7, "0") // Ensure 7-digit format

      reservations.push({
        employee_id: employeeId,
        date: this.generateRandomDate(),
        breakfast: Math.floor(Math.random() * 5), // 0-4
        lunch: Math.floor(Math.random() * 5),
        dinner: Math.floor(Math.random() * 5),
      })
    }

    return reservations
  }

  // Main method to reset and generate samples
  static async generateSampleReservations() {
    try {
      await this.clearReservations()
      const sampleData = this.generateSampleData(40)
      return await this.importFromArray(sampleData)
    } catch (error) {
      console.error("Error generating sample reservations:", error)
      throw error
    }
  }
}

module.exports = Reservation
