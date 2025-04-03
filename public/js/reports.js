document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const filterForm = document.getElementById("report-filter-form")
  const applyFilterBtn = document.getElementById("apply-filter-btn")
  const resetFilterBtn = document.getElementById("reset-filter-btn")
  const filteredCountSpan = document.getElementById("filtered-count")

  // Summary Stats Elements
  const totalReservationsSpan = document.getElementById("total-reservations")
  const totalEmployeesSpan = document.getElementById("total-employees")
  const totalGuestsSpan = document.getElementById("total-guests")
  const breakfastShiftCountSpan = document.getElementById(
    "breakfast-shift-count"
  )
  const lunchShiftCountSpan = document.getElementById("lunch-shift-count")
  const dinnerShiftCountSpan = document.getElementById("dinner-shift-count")
  const totalShiftCountSpan = document.getElementById("total-shift-count")
  const breakfastOutCountSpan = document.getElementById("breakfast-out-count")
  const lunchOutCountSpan = document.getElementById("lunch-out-count")
  const dinnerOutCountSpan = document.getElementById("dinner-out-count")
  const totalOutCountSpan = document.getElementById("total-out-count")

  // --- State ---
  let currentPage = 1
  const itemsPerPage = 15 // Adjust as needed

  // --- Functions ---

  /**
   * Fetches report data from the backend based on current filters and page.
   */
  const fetchReports = async () => {
    const filters = getFilters()
    const params = {
      ...filters,
      page: currentPage,
      limit: itemsPerPage,
    }

    try {
      const response = await fetch(`/api/reports`, {
        method: "POST",
        headers: {
          Accept: "application/json", // Expect JSON response
          "Content-Type": "application/json", // Must be explicitly set
        },
        body: JSON.stringify(params),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      updateSummaryStats(data.summary || {})
      updateReservationsTable({ data })
    } catch (error) {
      console.error("Error fetching reports:", error)
      // Display an error message to the user
      alert("خطا در بارگیری گزارشات. لطفا دوباره تلاش کنید.")
      updateSummaryStats({}) // Clear stats on error
    }
  }

  /**
   * Gathers filter values from the form.
   * @returns {object} An object containing the filter values.
   */
  const getFilters = () => {
    const employeeId = document.getElementById("employee-filter").value.trim()
    const name = document.getElementById("name-filter").value.trim()
    const department = document.getElementById("department-filter").value.trim()
    const startDate = document
      .getElementById("start-date")
      .valueAsDate.toLocaleDateString()
    const endDate = document
      .getElementById("end-date")
      .valueAsDate.toLocaleDateString()
    const mealShift = Array.from(
      document.querySelectorAll('input[name="meal-shift"]:checked')
    ).map(e => e.value)
    const mealOut = Array.from(
      document.querySelectorAll('input[name="meal-out"]:checked')
    ).map(e => e.value)

    const filters = {}
    if (employeeId) filters.employeeId = employeeId
    if (name) filters.name = name
    if (department) filters.department = department
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (mealShift) filters.mealShift = mealShift
    if (mealOut) filters.mealOut = mealOut

    return filters
  }

  /**
   * Updates the summary statistics section.
   * @param {object} summary - The summary statistics object.
   */
  const updateSummaryStats = summary => {
    totalReservationsSpan.textContent = summary.totalReservations || 0
    totalEmployeesSpan.textContent = summary.totalEmployees || 0
    totalGuestsSpan.textContent = summary.totalGuests || 0 // Assuming backend provides this

    // In-Shift Meals
    breakfastShiftCountSpan.textContent = summary.shiftMeals?.breakfast || 0
    lunchShiftCountSpan.textContent = summary.shiftMeals?.lunch || 0
    dinnerShiftCountSpan.textContent = summary.shiftMeals?.dinner || 0
    totalShiftCountSpan.textContent =
      (summary.shiftMeals?.breakfast || 0) +
      (summary.shiftMeals?.lunch || 0) +
      (summary.shiftMeals?.dinner || 0)

    // Out-of-Shift Meals
    breakfastOutCountSpan.textContent = summary.outOfShiftMeals?.breakfast || 0
    lunchOutCountSpan.textContent = summary.outOfShiftMeals?.lunch || 0
    dinnerOutCountSpan.textContent = summary.outOfShiftMeals?.dinner || 0
    totalOutCountSpan.textContent =
      (summary.outOfShiftMeals?.breakfast || 0) +
      (summary.outOfShiftMeals?.lunch || 0) +
      (summary.outOfShiftMeals?.dinner || 0)
  }

  // --- Event Listeners ---

  applyFilterBtn.addEventListener("click", () => {
    currentPage = 1 // Reset to first page when applying new filters
    fetchReports()
  })

  resetFilterBtn.addEventListener("click", () => {
    filterForm.reset()
    // Reset native date inputs
    document.getElementById("start-date").value = ""
    document.getElementById("end-date").value = ""
    // Reset radio buttons to default 'all'
    document.getElementById("meal-shift-all").checked = true
    document.getElementById("meal-out-all").checked = true
    currentPage = 1
    fetchReports() // Fetch with default/empty filters
  })

  // --- Export/Print Buttons (Placeholder - requires backend implementation) ---
  document.getElementById("export-excel-btn")?.addEventListener("click", () => {
    const filters = getFilters()
    const params = new URLSearchParams(filters)
    window.location.href = `/api/reports/export/excel?${params.toString()}`
  })

  document.getElementById("print-report-btn")?.addEventListener("click", () => {
    // Option 1: Print current view (simple)
    // window.print();

    // Option 2: Generate a printable report on the backend (more control)
    const filters = getFilters()
    const params = new URLSearchParams(filters)
    window.open(`/api/reports/print?${params.toString()}`, "_blank")
  })
})
