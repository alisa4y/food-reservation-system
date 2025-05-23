$(document).ready(function () {
  // Load reservations on page load
  loadReservations()

  // Add reservation button click
  $("#add-reservation-btn").on("click", function () {
    // Reset form
    $("#reservation-form")[0].reset()
    $("#reservation-id").val("")
    $("#employee-id-prefix").val("110")
    $("#employee-id-suffix").val("")
    $("#breakfast-status").val("0")
    $("#lunch-status").val("0")
    $("#dinner-status").val("0")

    // const date = document
    //   .getElementById("reservation-date")
    //   .valueAsDate.toLocaleDateString("en-GB")

    // $("#reservation-date").val(date)

    $("#reservation-modal-label").text("افزودن رزرو")
    $("#reservation-modal").modal("show")
  })

  // Save reservation button click
  $("#save-reservation-btn").on("click", function () {
    // Get form data
    const id = $("#reservation-id").val()
    const employeeIdPrefix = $("#employee-id-prefix").val()
    const employeeIdSuffix = $("#employee-id-suffix").val()
    const employeeId = employeeIdPrefix + employeeIdSuffix
    const date = document
      .getElementById("reservation-date")
      .valueAsDate.toLocaleDateString("en-GB")
    const breakfast = parseInt($("#breakfast-status").val())
    const lunch = parseInt($("#lunch-status").val())
    const dinner = parseInt($("#dinner-status").val())

    // Validate form
    if (!employeeIdPrefix || !employeeIdSuffix) {
      alert("لطفاً شماره پرسنلی را وارد کنید.")
      return
    }

    if (!date) {
      alert("لطفاً تاریخ را وارد کنید.")
      return
    }

    // Prepare data - date is already in YYYY-MM-DD format from the input
    const data = {
      employee_id: employeeId,
      date: date, // Send YYYY-MM-DD string, server should handle parsing
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner,
    }

    // Send request using fetch
    fetch(id ? `/api/reservations/${id}` : "/api/reservations", {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          // Close modal
          $("#reservation-modal").modal("hide")
          // Reload reservations
          loadReservations()
          // Show success message
          alert(id ? "رزرو با موفقیت ویرایش شد." : "رزرو با موفقیت افزوده شد.")
        } else {
          alert(responseData.message || "خطا در ذخیره رزرو.")
        }
      })
      .catch(error => {
        console.error("Error saving reservation:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Edit reservation button click
  $(document).on("click", ".edit-reservation-btn", function () {
    const id = $(this).data("id")

    // Get reservation data using fetch
    fetch(`/api/reservations/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          const reservation = responseData.data

          // Fill form
          $("#reservation-id").val(reservation.id)

          // Split employee_id into prefix and suffix
          const employeeId = reservation.employee_id
          if (employeeId && employeeId.length >= 3) {
            $("#employee-id-prefix").val(employeeId.substring(0, 3))
            $("#employee-id-suffix").val(employeeId.substring(3))
          } else {
            $("#employee-id-prefix").val("110")
            $("#employee-id-suffix").val(employeeId)
          }

          let formattedDate = showDate(reservation.date)
          const [day, month, year] = formattedDate.split("/")
          $("#reservation-date").val(`${year}-${month}-${day}`)

          $("#breakfast-status").val(reservation.breakfast)
          $("#lunch-status").val(reservation.lunch)
          $("#dinner-status").val(reservation.dinner)

          // Show modal
          $("#reservation-modal-label").text("ویرایش رزرو")
          $("#reservation-modal").modal("show")
        } else {
          alert(responseData.message || "خطا در دریافت اطلاعات رزرو.")
        }
      })
      .catch(error => {
        console.error("Error fetching reservation for edit:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // View reservation button click
  $(document).on("click", ".view-reservation-btn", function () {
    const id = $(this).data("id")

    // Get reservation data using fetch
    fetch(`/api/reservations/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          const reservation = responseData.data

          // Fill view modal
          $("#view-employee-id").text(reservation.employee_id)
          $("#view-employee-name").text(
            `${reservation.first_name || ""} ${reservation.last_name || ""}`
          )
          $("#view-position").text(reservation.position || "نامشخص")
          $("#view-department").text(reservation.department || "نامشخص")

          const dateStr = showDate(reservation.date)
          const dayName = getPersianDayOfWeek(reservation.date) // Or remove this if day name isn't provided/needed
          $("#view-date").text(dateStr)
          $("#view-day").text(dayName) // Keep or remove based on server data

          $("#view-is-guest").text(reservation.is_guest ? "بله" : "خیر") // Assuming is_guest field exists

          // Display meal statuses
          $("#view-breakfast").html(getMealStatusText(reservation.breakfast))
          $("#view-lunch").html(getMealStatusText(reservation.lunch))
          $("#view-dinner").html(getMealStatusText(reservation.dinner))

          // Show modal
          $("#view-modal").modal("show")
        } else {
          alert(responseData.message || "خطا در دریافت اطلاعات رزرو.")
        }
      })
      .catch(error => {
        console.error("Error fetching reservation for view:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Delete reservation button click
  let reservationToDeleteId = null
  $(document).on("click", ".delete-reservation-btn", function () {
    reservationToDeleteId = $(this).data("id")
    $("#delete-modal").modal("show")
  })

  // Confirm delete button click
  $("#confirm-delete-btn").on("click", function () {
    if (reservationToDeleteId) {
      fetch(`/api/reservations/${reservationToDeleteId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      })
        .then(response => response.json())
        .then(responseData => {
          if (responseData.success) {
            $("#delete-modal").modal("hide")
            loadReservations() // Reload the list
            alert("رزرو با موفقیت حذف شد.")
            reservationToDeleteId = null // Reset ID
          } else {
            alert(responseData.message || "خطا در حذف رزرو.")
          }
        })
        .catch(error => {
          console.error("Error deleting reservation:", error)
          alert("خطا در ارتباط با سرور.")
        })
    }
  })

  // Import Excel button click
  $("#import-excel-btn").on("click", function () {
    $("#import-form")[0].reset() // Reset form
    $("#import-modal").modal("show")
  })

  // Upload Excel button click
  $("#upload-excel-btn").on("click", function () {
    const fileInput = $("#excel-file")[0]
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("لطفاً یک فایل اکسل انتخاب کنید.")
      return
    }

    const file = fileInput.files[0]
    const formData = new FormData()
    formData.append("file", file)

    // Send request using fetch
    fetch("/api/reservations/import", {
      method: "POST",
      body: formData, // fetch handles FormData correctly
      headers: {
        Accept: "application/json", // Expect JSON response
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          $("#import-modal").modal("hide")
          loadReservations() // Reload the list
          alert(
            `بارگذاری موفقیت آمیز بود. ${
              responseData.imported || 0
            } رزرو اضافه شد.`
          )
        } else {
          alert(responseData.message || "خطا در بارگذاری فایل اکسل.")
        }
      })
      .catch(error => {
        console.error("Error importing Excel file:", error)
        alert("خطا در ارتباط با سرور هنگام بارگذاری فایل.")
      })
  })

  // Search button click
  $("#search-btn").on("click", function () {
    const searchQuery = $("#search-input").val().trim()
    if (searchQuery) {
      fetch("/api/reservations/search".toString(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json", // Must be explicitly set
        },
        body: JSON.stringify({
          employeeId: searchQuery,
          name: searchQuery,
          department: searchQuery,
          position: searchQuery,
        }),
      })
        .then(response => response.json())
        .then(responseData => {
          if (responseData.success) {
            updateReservationsTable(responseData, true)
          } else {
            alert(responseData.message || "خطا در جستجو.")
          }
        })
        .catch(error => {
          console.error("Error searching reservations:", error)
          alert("خطا در ارتباط با سرور.")
        })
    } else {
      // If search is empty, load all reservations
      loadReservations(1)
    }
  })

  $("#search-input").on("keypress", function (e) {
    if (e.which === 13) {
      // Enter key
      $("#search-btn").click()
    }
  })

  // Filter button click
  $("#filter-btn").on("click", function () {
    let searchQuery = document.getElementById("date-filter")

    if (!searchQuery.valueAsDate) {
      return loadReservations(1)
    } else searchQuery = searchQuery.valueAsDate.toLocaleDateString("en-GB")

    if (searchQuery) {
      fetch("/api/reservations/search".toString(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json", // Must be explicitly set
        },
        body: JSON.stringify({
          startDate: searchQuery,
          endDate: searchQuery,
        }),
      })
        .then(response => response.json())
        .then(responseData => {
          if (responseData.success) {
            updateReservationsTable(responseData, true)
          } else {
            alert(responseData.message || "خطا در جستجو.")
          }
        })
        .catch(error => {
          console.error("Error searching reservations:", error)
          alert("خطا در ارتباط با سرور.")
        })
    } else {
      // If search is empty, load all reservations
      loadReservations(1)
    }
  })
  $("#date-filter").on("change", function () {
    $("#filter-btn").click()
  })

  // Pagination click
  $(document).on("click", ".page-link", function (e) {
    e.preventDefault()
    const page = $(this).data("page")
    if (page) {
      loadReservations(page)
    }
  })
}) // End of document ready

// Function to load reservations
function loadReservations(page = 1, limit = 10) {
  const searchQuery = $("#search-input").val().trim()
  const dateFilter = $("#date-filter").val() // Already in YYYY-MM-DD format

  // Construct URL with query parameters
  const url = new URL("/api/reservations", window.location.origin)
  url.searchParams.append("page", String(page))
  url.searchParams.append("limit", String(limit))
  if (searchQuery) {
    url.searchParams.append("search", searchQuery)
  }
  if (dateFilter) {
    url.searchParams.append("date", dateFilter) // Use YYYY-MM-DD directly
  }

  // Send request using fetch
  fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then(response => response.json())
    .then(responseData => {
      if (responseData.success) {
        updateReservationsTable(responseData, true)
      } else {
        alert(responseData.message || "خطا در بارگذاری رزروها.")
        $("#reservations-table-body")
          .empty()
          .append(
            '<tr><td colspan="7" class="text-center text-danger">خطا در بارگذاری اطلاعات.</td></tr>'
          )
      }
    })
    .catch(error => {
      console.error("Error loading reservations:", error)
      alert("خطا در ارتباط با سرور.")
      $("#reservations-table-body")
        .empty()
        .append(
          '<tr><td colspan="7" class="text-center text-danger">خطا در ارتباط با سرور.</td></tr>'
        )
    })
}

// }
