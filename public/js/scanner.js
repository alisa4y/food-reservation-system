$(document).ready(function () {
  // --- State Variables ---
  let currentMealTimeKey = ""
  let isScannerRunning = false
  let html5QrCode = null

  // --- Initialize Scanner Object ---
  try {
    html5QrCode = new Html5Qrcode("scanner-video")
  } catch (err) {
    console.error("Error initializing Html5Qrcode:", err)
    // Use .append() as it correctly handles HTML strings
    $("#scanner-container").append(
      `<div class="alert alert-danger">فشل في تهيئة الماسح الضوئي. قد لا يدعم المتصفح الميزات المطلوبة.<br>راه اندازی اسکنر ناموفق بود. ممکن است مرورگر از ویژگی های مورد نیاز پشتیبانی نکند.</div>` // Arabic <br> Persian
    )
    $("#manual-input").prop("disabled", true)
    $("#manual-submit").prop("disabled", true)
  }

  // --- Helper Function for Bilingual Meal Names (with line breaks) ---
  function getBilingualMealName(mealKeyOrApiType) {
    const key = mealKeyOrApiType.toLowerCase()
    switch (key) {
      case "breakfast":
      case "فطور":
        return "فطور<br>صبحانه" // Arabic <br> Persian
      case "lunch":
      case "غداء":
        return "غداء<br>ناهار" // Arabic <br> Persian
      case "dinner":
      case "عشاء":
        return "عشاء<br>شام" // Arabic <br> Persian
      case "خارج":
        return "خارج أوقات الوجبات<br>خارج از زمان وعده" // Arabic <br> Persian
      default:
        return mealKeyOrApiType // Fallback
    }
  }
  function updateTimeAndMeal() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()

    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    $("#current-time").html(timeString) // Use html is fine

    let mealKey = ""
    // We don't need mealDisplay here anymore, we'll get names from the helper object
    let mealClass = ""
    let isMealTime = false

    // --- Define Meal Times (as before) ---
    const breakfastStart = 7 * 60
    const breakfastEnd = 8 * 60 + 30
    const lunchStart = 12 * 60
    const lunchEnd = 15 * 60
    const dinnerStart = 19 * 60
    const dinnerEnd = 21 * 60 + 30
    const currentTimeInMinutes = hours * 60 + minutes

    // --- Determine Meal Key and Class (as before) ---
    if (
      currentTimeInMinutes >= breakfastStart &&
      currentTimeInMinutes < breakfastEnd
    ) {
      mealKey = "فطور"
      mealClass = "bg-info text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= lunchStart &&
      currentTimeInMinutes < lunchEnd
    ) {
      mealKey = "غداء"
      mealClass = "bg-success text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= dinnerStart &&
      currentTimeInMinutes < dinnerEnd
    ) {
      mealKey = "عشاء"
      mealClass = "bg-primary text-white"
      isMealTime = true
    } else {
      mealKey = "خارج"
      mealClass = "bg-warning"
      isMealTime = false
    }

    currentMealTimeKey = mealKey // Keep the key for logical checks

    // --- Get Separate Meal Names ---
    const mealNames = getMealNames(mealKey) // Call the updated helper

    // --- Construct the Desired HTML String ---
    // Line 1: Arabic Label + Arabic Name
    // Line 2: Persian Label + Persian Name
    const mealIndicatorHtml = `الوجبة الحالية: ${mealNames.arabic}<br>وعده فعلی: ${mealNames.persian}`

    // --- Update UI for meal indicator ---
    $("#current-meal")
      .html(mealIndicatorHtml) // Set the new HTML format
      .attr("class", `meal-indicator ${mealClass}`) // Set the background/text class

    // --- Control Scanner and Manual Input Based on Meal Time (logic remains the same) ---
    if (html5QrCode) {
      if (isMealTime) {
        $("#manual-input").prop("disabled", false)
        $("#manual-submit").prop("disabled", false)
        $("#scanner-status-message").hide()

        if (!isScannerRunning) {
          startScanner()
        }
      } else {
        $("#manual-input").prop("disabled", true)
        $("#manual-submit").prop("disabled", true)
        // Use .html() for status message (as it was correct before)
        $("#scanner-status-message")
          .html(
            "المسح غير متاح خارج أوقات الوجبات<br>اسکن خارج از زمان وعده های غذایی در دسترس نیست"
          ) // Arabic <br> Persian
          .removeClass("alert-danger alert-warning alert-info")
          .addClass("alert-warning")
          .show()

        if (isScannerRunning) {
          stopScanner()
        }
      }
    }
  }

  function showSuccess(data) {
    // ... (employee id, name, date handling as before) ...

    // Get meal names using the new helper
    const mealNames = getMealNames(data.meal_type)

    // Display them separately or combined as needed in the results area
    // Example: Display combined with <br> in the results table
    // $("#result-meal").html(`${mealNames.arabic}<br>${mealNames.persian}`);
    // Or display only one, or display them in different elements if your HTML structure changes

    // FOR NOW, let's keep the combined <br> format in the success result area
    // as the request was specifically for the #current-meal indicator.
    // If you want the success result table to also follow the "Label: Name" format,
    // you'd update the HTML structure and the JS here.
    $("#result-meal").html(`${mealNames.arabic}<br>${mealNames.persian}`)

    // ... (token handling and showing container as before) ...
    $("#result-employee-id").text(data.employee.employee_id)
    $("#result-name").text(
      `${data.employee.first_name} ${data.employee.last_name}`
    )
    $("#result-date").text(
      data.reservation_date
        ? new Date(data.reservation_date).toLocaleDateString("ar-SA")
        : new Date().toLocaleDateString("ar-SA")
    )

    const tokenUrl = data.reservation?.token_pdf
    if (tokenUrl) {
      $("#print-token").attr("href", tokenUrl).show()
    } else {
      $("#print-token").attr("href", "#").hide()
    }

    $("#error-message").hide()
    $("#result-container")
      .removeClass("border-danger")
      .addClass("border-success")
      .show()
  }

  // --- Core Functions ---

  // --- Scanner Control Functions ---
  const config = { fps: 10, qrbox: { width: 250, height: 150 } }

  function startScanner() {
    if (!html5QrCode) return

    console.log("Attempting to start scanner...")
    $("#scanner-video").show()
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
        $("#scanner-status-message").hide()
      })
      .catch(err => {
        console.error("Error starting scanner:", err)
        isScannerRunning = false
        $("#scanner-video").hide()
        // Use .html() to render the <br>
        $("#scanner-status-message")
          .html(
            "لا يمكن بدء تشغيل الكاميرا. تحقق من الأذونات.<br>نمی‌توان دوربین را فعال کرد. مجوزها را بررسی کنید."
          ) // Arabic <br> Persian
          .removeClass("alert-warning alert-info")
          .addClass("alert-danger")
          .show()
      })
  }

  function stopScanner() {
    if (!html5QrCode || !isScannerRunning) return

    console.log("Attempting to stop scanner...")
    html5QrCode
      .stop()
      .then(() => {
        console.log("Scanner stopped successfully.")
        isScannerRunning = false
        $("#scanner-video").hide()
      })
      .catch(err => {
        console.error("Error stopping scanner:", err)
        isScannerRunning = false
        $("#scanner-video").hide()
        if (currentMealTimeKey === "خارج") {
          // Use .html() to render the <br>
          $("#scanner-status-message")
            .html(
              "المسح غير متاح خارج أوقات الوجبات<br>اسکن خارج از زمان وعده های غذایی در دسترس نیست"
            ) // Arabic <br> Persian
            .removeClass("alert-danger alert-info")
            .addClass("alert-warning")
            .show()
        }
      })
  }

  // --- Event Handlers ---
  function onScanSuccess(decodedText) {
    if (!isScannerRunning) return

    console.log(`Scan successful: ${decodedText}`)
    if (html5QrCode && isScannerRunning) {
      try {
        html5QrCode.pause(true)
      } catch (e) {
        console.warn("Could not pause scanner, might already be stopped:", e)
      }
    }
    processEmployeeId(decodedText)
  }

  function onScanFailure(error) {
    // console.warn(`QR code scan failed: ${error}`);
  }

  $("#manual-submit").on("click", function () {
    if (currentMealTimeKey === "خارج") {
      showError(
        "لا يمكن الإدخال اليدوي خارج أوقات الوجبات.<br>ورود دستی خارج از زمان وعده غذایی مجاز نیست."
      ) // Arabic <br> Persian
      return
    }

    const employeeId = $("#manual-input").val().trim()
    if (employeeId) {
      processEmployeeId(employeeId)
    } else {
      showError("يرجى إدخال رقم الموظف.<br>لطفا شماره کارمند را وارد کنید.") // Arabic <br> Persian
    }
  })

  function processEmployeeId(employeeId) {
    $("#result-container").hide()
    $("#error-message").hide()
    $("#loading-indicator").show()

    fetch(`/api/reservations/check-active/${employeeId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            return response
              .json()
              .then(errData => {
                throw new Error(
                  errData.message ||
                    "لم يتم العثور على موظف بهذا الرقم.<br>کارمندی با این شماره یافت نشد." // Arabic <br> Persian
                )
              })
              .catch(() => {
                throw new Error(
                  "لم يتم العثور على موظف بهذا الرقم.<br>کارمندی با این شماره یافت نشد."
                ) // Arabic <br> Persian
              })
          }
          return response.json().then(errData => {
            throw new Error(
              errData.message ||
                `خطأ في الخادم: ${response.status}<br>خطا در سرور: ${response.status}` // Arabic <br> Persian
            )
          })
        }
        return response.json()
      })
      .then(data => {
        if (data.success && data.active) {
          const reservationMealApiType = data.data.meal_type.toLowerCase()
          let expectedMealApiType = null

          if (currentMealTimeKey === "فطور") expectedMealApiType = "breakfast"
          else if (currentMealTimeKey === "غداء") expectedMealApiType = "lunch"
          else if (currentMealTimeKey === "عشاء") expectedMealApiType = "dinner"

          if (
            expectedMealApiType &&
            reservationMealApiType === expectedMealApiType
          ) {
            showSuccess(data.data)
          } else {
            const reservationMealDisplay = getBilingualMealName(
              reservationMealApiType
            )
            const currentMealDisplay = getBilingualMealName(currentMealTimeKey)
            showError(
              `الحجز الموجود (${reservationMealDisplay}) لا يتطابق مع وقت الوجبة الحالي (${currentMealDisplay}).<br>رزرو موجود (${reservationMealDisplay}) با زمان وعده فعلی (${currentMealDisplay}) مطابقت ندارد.` // Arabic <br> Persian
            )
          }
        } else if (data.success && !data.active) {
          const employeeName = data.data.employee
            ? `${data.data.employee.first_name} ${data.data.employee.last_name}`
            : `الموظف<br>کارمند ${employeeId}` // Arabic <br> Persian prefix
          const mealDisplayBilingual = getBilingualMealName(data.data.meal_type)
          showError(
            `لا يوجد حجز نشط لـ ${employeeName} في وجبة ${mealDisplayBilingual} لهذا اليوم.<br>رزرو فعالی برای ${employeeName} در وعده ${mealDisplayBilingual} امروز وجود ندارد.` // Arabic <br> Persian
          )
        } else {
          showError(
            data.message || "خطأ في التحقق من الحجز.<br>خطا در بررسی رزرو."
          ) // Arabic <br> Persian
        }
      })
      .catch(error => {
        console.error("Fetch error:", error)
        showError(
          error.message || "خطأ في الاتصال بالخادم.<br>خطا در اتصال به سرور."
        ) // Arabic <br> Persian
      })
      .finally(() => {
        $("#loading-indicator").hide()
        setTimeout(() => {
          if (
            html5QrCode &&
            isScannerRunning &&
            currentMealTimeKey !== "خارج"
          ) {
            try {
              html5QrCode.resume()
              console.log("Scanner resumed.")
            } catch (e) {
              console.error("Error resuming scanner:", e)
            }
          } else {
            console.log(
              "Scanner not resumed (outside meal time or was stopped)."
            )
          }
          $("#manual-input").val("")
        }, 3000)
      })
  }

  // Show error message - Use .html() to render <br> in the message
  function showError(message) {
    // IMPORTANT: Use .html() here to render the <br> tags correctly
    $("#error-message").html(message).show()
    $("#result-container").hide()
  }

  // Handle print token button
  $("#print-token").on("click", function (e) {
    const tokenUrl = $(this).attr("href")
    if (!tokenUrl || tokenUrl === "#") {
      e.preventDefault()
      showError("ملف القسيمة غير متوفر.<br>فایل رسید در دسترس نیست.") // Arabic <br> Persian
    }
  })

  // --- Initial Setup ---
  // Make sure your HTML placeholders use <br> if needed:
  // e.g., <div id="loading-indicator" style="display: none;">جار التحميل...<br>در حال بارگذاری...</div> <!-- Arabic <br> Persian -->

  updateTimeAndMeal()
  setInterval(updateTimeAndMeal, 1000)

  $("#result-container").hide()
  $("#error-message").hide()
  $("#scanner-video").hide()
  $("#loading-indicator").hide()
}) // End document ready
// --- Helper Function for Meal Names (returns object) ---
// Renamed for clarity, now returns an object with separate language names
function getMealNames(mealKeyOrApiType) {
  const key = mealKeyOrApiType.toLowerCase() // Ensure consistency
  switch (key) {
    case "breakfast":
    case "فطور": // Match our internal key
      return { arabic: "فطور", persian: "صبحانه" }
    case "lunch":
    case "غداء": // Match our internal key
      return { arabic: "غداء", persian: "ناهار" }
    case "dinner":
    case "عشاء": // Match our internal key
      return { arabic: "عشاء", persian: "شام" }
    case "خارج": // Match our internal key
      // For "outside", return the descriptive phrase for both
      return { arabic: "خارج أوقات الوجبات", persian: "خارج از زمان وعده" }
    default:
      // Fallback if somehow an unknown type is passed
      return { arabic: mealKeyOrApiType, persian: mealKeyOrApiType }
  }
}
