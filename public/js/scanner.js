$(document).ready(function () {
  // Update current time and meal period
  function updateTimeAndMeal() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()

    // Format time
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    $("#current-time").text(timeString)

    // Determine current meal period
    let mealType = ""
    let mealClass = ""

    if (hours >= 7 && hours < 8) {
      mealType = "صبحانه"
      mealClass = "bg-info text-white"
    } else if (hours >= 12 && hours < 15) {
      mealType = "ناهار"
      mealClass = "bg-success text-white"
    } else if (hours >= 19 && hours < 21) {
      mealType = "شام"
      mealClass = "bg-primary text-white"
    } else {
      mealType = "خارج از زمان وعده‌های غذایی"
      mealClass = "bg-warning"
    }

    $("#current-meal")
      .text(`وعده فعلی: ${mealType}`)
      .attr("class", `meal-indicator ${mealClass}`)
  }

  // Update time every second
  updateTimeAndMeal()
  setInterval(updateTimeAndMeal, 1000)

  // Initialize barcode scanner
  const html5QrCode = new Html5Qrcode("scanner-video")
  const config = { fps: 10, qrbox: { width: 250, height: 150 } }

  // Start scanner
  html5QrCode
    .start({ facingMode: "environment" }, config, onScanSuccess)
    .catch(err => {
      console.error("Error starting scanner:", err)
      $("#scanner-container").append(
        `<div class="alert alert-warning">دوربین در دسترس نیست. لطفاً از ورود دستی استفاده کنید.</div>`
      )
    })

  // Handle successful scan
  function onScanSuccess(decodedText) {
    // Stop scanner temporarily
    html5QrCode.pause()

    // Process the scanned barcode
    processEmployeeId(decodedText)
  }

  // Handle manual input submission
  $("#manual-submit").on("click", function () {
    const employeeId = $("#manual-input").val().trim()
    if (employeeId) {
      processEmployeeId(employeeId)
    } else {
      showError("لطفاً شماره پرسنلی را وارد کنید.")
    }
  })

  // Process employee ID (from scan or manual input)
  function processEmployeeId(employeeId) {
    // Clear previous results
    $("#result-container").hide()
    $("#error-message").hide()

    // Call API to check reservation using fetch
    fetch(`/api/reservations/check-active/${employeeId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors like 404
          if (response.status === 404) {
            throw new Error("کارمند با این شماره پرسنلی یافت نشد.")
          }
          // Throw an error for other non-OK responses to be caught by .catch
          return response.json().then(errData => {
            throw new Error(
              errData.message || `HTTP error! status: ${response.status}`
            )
          })
        }
        return response.json() // Parse JSON body
      })
      .then(data => {
        // Process the successful response data
        if (data.success) {
          if (data.active) {
            showSuccess(data.data)
          } else {
            showError(
              `رزرو فعالی برای ${data.data.employee.first_name} ${data.data.employee.last_name} در وعده ${data.data.meal_type} یافت نشد.`
            )
          }
        } else {
          showError(data.message || "خطا در بررسی رزرو.")
        }
      })
      .catch(error => {
        // Handle fetch errors (network issues) and errors thrown from .then blocks
        console.error("Fetch error:", error)
        showError(error.message || "خطا در ارتباط با سرور.")
      })
      .finally(() => {
        // This block executes regardless of success or failure
        setTimeout(() => {
          html5QrCode.resume()
          $("#manual-input").val("")
        }, 3000)
      })
  }

  // Show success result
  function showSuccess(data) {
    $("#result-employee-id").text(data.employee.employee_id)
    $("#result-name").text(
      `${data.employee.first_name} ${data.employee.last_name}`
    )
    $("#result-date").text(new Date().toLocaleDateString("fa-IR"))
    $("#result-meal").text(
      data.meal_type === "breakfast"
        ? "صبحانه"
        : data.meal_type === "lunch"
        ? "ناهار"
        : "شام"
    )

    // Set token URL
    $("#print-token").attr("href", data.reservation.token_pdf || "#")

    // Show result container
    $("#result-container").show()
  }

  // Show error message
  function showError(message) {
    $("#error-message").text(message).show()

    // Hide error after 3 seconds
    setTimeout(() => {
      $("#error-message").hide()
    }, 3000)
  }

  // Handle print token button
  $("#print-token").on("click", function (e) {
    const tokenUrl = $(this).attr("href")
    if (tokenUrl && tokenUrl !== "#") {
      window.open(tokenUrl, "_blank")
    } else {
      e.preventDefault()
      showError("فایل ژتون در دسترس نیست.")
    }
  })
})
