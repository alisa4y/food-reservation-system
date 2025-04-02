$(document).ready(function () {
  // --- State Variables ---
  let currentMealType = "" // Store the current meal type globally within the scope
  let isScannerRunning = false // Track if the scanner is currently active
  let html5QrCode = null // Initialize scanner variable

  // --- Initialize Scanner Object ---
  // We initialize it here but don't start it yet.
  try {
    html5QrCode = new Html5Qrcode("scanner-video")
  } catch (err) {
    console.error("Error initializing Html5Qrcode:", err)
    $("#scanner-container").append(
      `<div class="alert alert-danger">فشل في تهيئة الماسح الضوئي. قد لا يدعم المتصفح الميزات المطلوبة.</div>` // Arabic: Failed to initialize scanner. Browser might not support required features.
    )
    // Disable manual input too if scanner fails to initialize fundamentally
    $("#manual-input").prop("disabled", true)
    $("#manual-submit").prop("disabled", true)
  }

  // --- Core Functions ---

  // Update current time and meal period, and control scanner state
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
    let isMealTime = false // Flag to indicate if it's currently a meal time

    // Define Meal Times (adjust as needed)
    const breakfastStart = 7 * 60 // 7:00 AM in minutes
    const breakfastEnd = 8 * 60 + 30 // 8:30 AM in minutes
    const lunchStart = 12 * 60 // 12:00 PM
    const lunchEnd = 15 * 60 // 3:00 PM (15:00)
    const dinnerStart = 19 * 60 // 7:00 PM (19:00)
    const dinnerEnd = 21 * 60 + 30 // 9:30 PM (21:30)
    const currentTimeInMinutes = hours * 60 + minutes

    if (
      currentTimeInMinutes >= breakfastStart &&
      currentTimeInMinutes < breakfastEnd
    ) {
      mealType = "فطور" // Breakfast
      mealClass = "bg-info text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= lunchStart &&
      currentTimeInMinutes < lunchEnd
    ) {
      mealType = "غداء" // Lunch
      mealClass = "bg-success text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= dinnerStart &&
      currentTimeInMinutes < dinnerEnd
    ) {
      mealType = "عشاء" // Dinner
      mealClass = "bg-primary text-white"
      isMealTime = true
    } else {
      mealType = "خارج أوقات الوجبات" // Outside meal times
      mealClass = "bg-warning"
      isMealTime = false
    }

    // Update global meal type
    currentMealType = mealType

    // Update UI for meal indicator
    $("#current-meal")
      .text(`الوجبة الحالية: ${mealType}`) // Arabic: Current Meal
      .attr("class", `meal-indicator ${mealClass}`)

    // --- Control Scanner and Manual Input Based on Meal Time ---
    if (html5QrCode) {
      // Only proceed if scanner was initialized
      if (isMealTime) {
        // It's meal time - enable scanning and manual input
        $("#manual-input").prop("disabled", false)
        $("#manual-submit").prop("disabled", false)
        $("#scanner-status-message").hide() // Hide any 'disabled' message

        // Start scanner only if it's not already running
        if (!isScannerRunning) {
          startScanner()
        }
      } else {
        // It's *not* meal time - disable scanning and manual input
        $("#manual-input").prop("disabled", true)
        $("#manual-submit").prop("disabled", true)
        $("#scanner-status-message")
          .text("المسح غير متاح خارج أوقات الوجبات") // Arabic: Scanning not available outside meal times
          .removeClass("alert-danger alert-warning alert-info") // Remove other alerts
          .addClass("alert-warning") // Add warning style
          .show()

        // Stop scanner only if it's currently running
        if (isScannerRunning) {
          stopScanner()
        }
      }
    }
  }

  // --- Scanner Control Functions ---
  const config = { fps: 10, qrbox: { width: 250, height: 150 } }

  function startScanner() {
    if (!html5QrCode) return // Safety check

    console.log("Attempting to start scanner...")
    $("#scanner-video").show() // Make sure video element is visible
    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      )
      .then(() => {
        console.log("Scanner started successfully.")
        isScannerRunning = true
        $("#scanner-status-message").hide() // Hide any previous status
      })
      .catch(err => {
        console.error("Error starting scanner:", err)
        isScannerRunning = false // Ensure state is correct
        $("#scanner-video").hide() // Hide video element if start failed
        $("#scanner-status-message")
          .text("لا يمكن بدء تشغيل الكاميرا. تحقق من الأذونات.") // Arabic: Cannot start camera. Check permissions.
          .removeClass("alert-warning alert-info") // Remove other alerts
          .addClass("alert-danger") // Use danger style for error
          .show()
        // Optionally disable manual input if camera is fundamentally broken
        // $("#manual-input").prop("disabled", true);
        // $("#manual-submit").prop("disabled", true);
      })
  }

  function stopScanner() {
    if (!html5QrCode || !isScannerRunning) return // Only stop if initialized and running

    console.log("Attempting to stop scanner...")
    html5QrCode
      .stop()
      .then(() => {
        console.log("Scanner stopped successfully.")
        isScannerRunning = false
        $("#scanner-video").hide() // Hide video element when stopped
        // Message indicating scanning is off is handled by updateTimeAndMeal
      })
      .catch(err => {
        // This might happen if stop is called before start finishes, etc.
        console.error("Error stopping scanner:", err)
        // Even if stopping failed, we assume it's not usable
        isScannerRunning = false
        $("#scanner-video").hide()
        // Update status message just in case
        if (currentMealType === "خارج أوقات الوجبات") {
          $("#scanner-status-message")
            .text("المسح غير متاح خارج أوقات الوجبات")
            .removeClass("alert-danger alert-info")
            .addClass("alert-warning")
            .show()
        }
      })
  }

  // --- Event Handlers ---

  // Handle successful scan
  function onScanSuccess(decodedText) {
    if (!isScannerRunning) return // Should not happen if logic is correct, but good failsafe

    console.log(`Scan successful: ${decodedText}`)
    // Temporarily pause scanner to process result and prevent multiple scans
    // Using pause/resume might be smoother than stop/start here
    html5QrCode.pause(true) // true indicates viewfinder should freeze

    // Process the scanned barcode (no need to check meal time here anymore)
    processEmployeeId(decodedText)
  }

  // Optional: Handle scan failures (e.g., QR code not found in frame)
  function onScanFailure(error) {
    // console.warn(`QR code scan failed: ${error}`);
    // No action needed usually, the scanner keeps trying
  }

  // Handle manual input submission
  $("#manual-submit").on("click", function () {
    // Double-check if it's meal time (though button should be disabled)
    if (currentMealType === "خارج أوقات الوجبات") {
      showError("لا يمكن الإدخال اليدوي خارج أوقات الوجبات.") // Arabic: Manual input not allowed outside meal times.
      return
    }

    const employeeId = $("#manual-input").val().trim()
    if (employeeId) {
      processEmployeeId(employeeId)
    } else {
      showError("يرجى إدخال رقم الموظف.") // Arabic: Please enter employee ID.
    }
  })

  // Process employee ID (from scan or manual input)
  function processEmployeeId(employeeId) {
    // Clear previous results and errors
    $("#result-container").hide()
    $("#error-message").hide()
    $("#loading-indicator").show() // Show loading indicator

    // Call API to check reservation using fetch
    fetch(`/api/reservations/check-active/${employeeId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors like 404 more specifically
          if (response.status === 404) {
            // Try to parse potential JSON error message from backend
            return response
              .json()
              .then(errData => {
                throw new Error(
                  errData.message || "لم يتم العثور على موظف بهذا الرقم."
                ) // Arabic: Employee with this ID not found.
              })
              .catch(() => {
                // If parsing JSON fails, use a generic 404 message
                throw new Error("لم يتم العثور على موظف بهذا الرقم.") // Arabic: Employee with this ID not found.
              })
          }
          // Throw an error for other non-OK responses to be caught by .catch
          return response.json().then(errData => {
            throw new Error(
              errData.message || `خطأ في الخادم: ${response.status}` // Arabic: Server error
            )
          })
        }
        return response.json() // Parse JSON body
      })
      .then(data => {
        // Process the successful response data
        if (data.success && data.active) {
          // Check if the reservation meal type matches the *current* meal type
          // (e.g., prevent using a lunch reservation during breakfast time)
          const reservationMeal = data.data.meal_type.toLowerCase() // e.g., 'lunch'
          const expectedMeal =
            currentMealType === "فطور"
              ? "breakfast"
              : currentMealType === "غداء"
              ? "lunch"
              : currentMealType === "عشاء"
              ? "dinner"
              : null

          if (expectedMeal && reservationMeal === expectedMeal) {
            showSuccess(data.data)
          } else {
            const mealArabic =
              reservationMeal === "breakfast"
                ? "الفطور"
                : reservationMeal === "lunch"
                ? "الغداء"
                : "العشاء"
            const currentMealArabic = currentMealType // Already in Arabic
            showError(
              `الحجز الموجود (${mealArabic}) لا يتطابق مع وقت الوجبة الحالي (${currentMealArabic}).`
            ) // Arabic: Existing reservation (Meal) does not match current meal time (Current Meal).
          }
        } else if (data.success && !data.active) {
          // Reservation found but not active for the current meal time determined by the API
          const employeeName = data.data.employee
            ? `${data.data.employee.first_name} ${data.data.employee.last_name}`
            : `الموظف ${employeeId}` // Use name if available
          const mealArabic =
            data.data.meal_type === "breakfast"
              ? "الفطور"
              : data.data.meal_type === "lunch"
              ? "الغداء"
              : "العشاء"
          showError(
            `لا يوجد حجز نشط لـ ${employeeName} في وجبة ${mealArabic} لهذا اليوم.`
          ) // Arabic: No active reservation found for [Name] for [Meal] today.
        } else {
          // API call was successful but indicated failure logically
          showError(data.message || "خطأ في التحقق من الحجز.") // Arabic: Error checking reservation.
        }
      })
      .catch(error => {
        // Handle fetch errors (network issues) and errors thrown from .then blocks
        console.error("Fetch error:", error)
        showError(error.message || "خطأ في الاتصال بالخادم.") // Arabic: Error connecting to server.
      })
      .finally(() => {
        // This block executes regardless of success or failure
        $("#loading-indicator").hide() // Hide loading indicator
        // Resume scanner after a delay, but only if it should be running
        setTimeout(() => {
          if (html5QrCode && isScannerRunning) {
            // Check if it should be running
            try {
              html5QrCode.resume()
              console.log("Scanner resumed.")
            } catch (e) {
              console.error("Error resuming scanner:", e)
              // Maybe try to restart if resume fails? Or just log it.
            }
          }
          $("#manual-input").val("") // Clear manual input
        }, 3000) // 3 second delay
      })
  }

  // Show success result
  function showSuccess(data) {
    $("#result-employee-id").text(data.employee.employee_id)
    $("#result-name").text(
      `${data.employee.first_name} ${data.employee.last_name}`
    )
    // Use API date if available, otherwise current date
    $("#result-date").text(
      data.reservation_date
        ? new Date(data.reservation_date).toLocaleDateString("ar-SA")
        : new Date().toLocaleDateString("ar-SA")
    ) // Arabic locale
    $("#result-meal").text(
      data.meal_type === "breakfast"
        ? "فطور" // Breakfast
        : data.meal_type === "lunch"
        ? "غداء" // Lunch
        : "عشاء" // Dinner
    )

    // Set token URL - ensure it exists
    const tokenUrl = data.reservation?.token_pdf // Use optional chaining
    if (tokenUrl) {
      $("#print-token").attr("href", tokenUrl).show()
    } else {
      $("#print-token").attr("href", "#").hide() // Hide button if no URL
    }

    // Show result container and hide error
    $("#error-message").hide()
    $("#result-container")
      .removeClass("border-danger")
      .addClass("border-success")
      .show() // Use border color for visual cue
  }

  // Show error message
  function showError(message) {
    $("#error-message").text(message).show()
    $("#result-container").hide() // Hide success container on error

    // Optionally add a red border to the result area placeholder
    //$("#result-container").removeClass('border-success').addClass('border-danger').show(); // Show container with error indication

    // No automatic hide, let the user see the error until next scan/input
    /* setTimeout(() => {
      $("#error-message").hide();
    }, 3000); */
  }

  // Handle print token button
  $("#print-token").on("click", function (e) {
    const tokenUrl = $(this).attr("href")
    if (!tokenUrl || tokenUrl === "#") {
      e.preventDefault() // Prevent navigating to '#'
      showError("ملف القسيمة غير متوفر.") // Arabic: Token file not available.
    } else {
      // Allow default behavior (opening link) or open in new tab:
      // window.open(tokenUrl, '_blank');
      // e.preventDefault(); // Prevent default if using window.open
    }
  })

  // --- Initial Setup ---
  // Add placeholders for status messages and loading indicator in your HTML:
  // e.g., before <div id="scanner-video">...</div>
  // <div id="scanner-status-message" class="alert" style="display: none;"></div>
  // e.g., somewhere appropriate
  // <div id="loading-indicator" style="display: none;">جار التحميل...</div> // Arabic: Loading...

  updateTimeAndMeal() // Initial call to set time, meal, and initial scanner state
  setInterval(updateTimeAndMeal, 1000) // Update time and check scanner state every second

  // Hide result container initially
  $("#result-container").hide()
  $("#error-message").hide()
  $("#scanner-video").hide() // Hide video until scanner starts
  $("#loading-indicator").hide() // Hide loading indicator
}) // End document ready
