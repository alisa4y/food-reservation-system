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

  let mealKey = ""
  let mealClass = ""
  let isMealTime = false

  function updateTimeAndMeal() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()

    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    $("#current-time").html(timeString) // Use html is fine

    setCurrentMeal()

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
  const breakfastStart = 7 * 60
  const breakfastEnd = 8 * 60 + 30
  const lunchStart = 12 * 60
  const lunchEnd = 15 * 60
  const dinnerStart = 19 * 60
  const dinnerEnd = 21 * 60 + 30

  function setCurrentMeal() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // --- Define Meal Times (as before) ---
    const currentTimeInMinutes = hours * 60 + minutes

    // --- Determine Meal Key and Class (as before) ---
    if (
      currentTimeInMinutes >= breakfastStart &&
      currentTimeInMinutes < breakfastEnd
    ) {
      mealKey = "breakfast"
      mealClass = "bg-info text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= lunchStart &&
      currentTimeInMinutes < lunchEnd
    ) {
      mealKey = "lunch"
      mealClass = "bg-success text-white"
      isMealTime = true
    } else if (
      currentTimeInMinutes >= dinnerStart &&
      currentTimeInMinutes < dinnerEnd
    ) {
      mealKey = "dinner"
      mealClass = "bg-primary text-white"
      isMealTime = true
    } else {
      mealKey = "out"
      mealClass = "bg-warning"
      isMealTime = false
    }
  }
  function showSuccess(data) {
    // ... (employee id, name, date handling as before) ...

    // Get meal names using the new helper
    const mealNames = getMealNames(data.meal_type)

    $("#result-meal").html(`${mealNames.arabic}<br>${mealNames.persian}`)

    // ... (token handling and showing container as before) ...
    $("#result-employee-id").text(data.employee.employee_id)
    $("#result-name").text(
      `${data.employee.first_name} ${data.employee.last_name}`
    )
    $("#result-date").text(
      data.reservation_date
        ? new Date(data.reservation_date).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB")
    )
    const base64String = data.reservation?.token_pdf
    if (base64String) {
      const fileName = `token_${data.employee.employee_id}_${data.meal_type}.pdf`
      const binaryString = atob(base64String)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const pdfBlob = new Blob([bytes], { type: "application/pdf" })

      // 4. Create an Object URL for the Blob
      const objectUrl = URL.createObjectURL(pdfBlob)

      // --- Options for Printing/Displaying ---

      // Option A: Open in a new tab (browser PDF viewer handles printing)
      // window.open(objectUrl, "_blank")
      // return
      // Option B: Create a link and simulate click for download

      const link = document.createElement("a")
      link.href = objectUrl
      link.download = fileName // Suggest a filename
      document.body.appendChild(link) // Required for Firefox
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl) // Clean up the Object URL after use if downloading

      // Option C: Embed in an iframe and try to print (can be tricky due to security)

      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      iframe.src = objectUrl // Load the PDF blob URL
      iframe.style.display = "none" // Hide the iframe
      iframe.src = objectUrl
      iframe.onload = () => {
        try {
          console.log("Attempting kiosk print...")
          iframe.contentWindow.print() // Trigger print
          console.log("Print command issued.")
          // Clean up after a short delay
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(objectUrl)
            console.log("Iframe and Object URL cleaned up.")
          }, 2000) // Adjust delay if needed
        } catch (e) {
          console.error("Kiosk printing failed:", e)
          // Provide fallback or error message if necessary
          // alert(
          //   "Printing failed. Please check printer connection and Chrome kiosk settings."
          // )
          // Clean up even on error
          setTimeout(() => {
            try {
              document.body.removeChild(iframe)
            } catch {}
            URL.revokeObjectURL(objectUrl)
          }, 500)
        }
      }
      iframe.onerror = err => {
        console.error("Failed to load PDF into iframe:", err)
        // alert("Failed to load PDF for printing.")
        URL.revokeObjectURL(objectUrl)
      }
      document.body.appendChild(iframe)

      // If NOT downloading immediately, you might want to revoke the object URL later
      // when it's no longer needed to free up memory. For opening in a new tab,
      // the browser handles it until the tab is closed.
      // // URL.revokeObjectURL(objectUrl);
      // $("#print-token").attr("href", fileName ).show()
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
        if (currentMealTimeKey === "out") {
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
    if (currentMealTimeKey === "out") {
      showError(
        "لا يمكن المسح خارج أوقات الوجبات.<br> خارج از زمان وعده غذایی مجاز نیست."
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

    fetch(`/scanner/check-active/${employeeId}`, {
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
                  "لم يتم العثور على موظف بهذا الرقم.<br>کارمندی با این شماره یافت نشد."
                ) // Arabic <br> Persian
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

          return showSuccess(data.data)

          const reservationMealDisplay = getBilingualMealName(
            reservationMealApiType
          )
          const currentMealDisplay = getBilingualMealName(currentMealTimeKey)
          showError(
            `الحجز الموجود (${reservationMealDisplay}) لا يتطابق مع وقت الوجبة الحالي (${currentMealDisplay}).<br>رزرو موجود (${reservationMealDisplay}) با زمان وعده فعلی (${currentMealDisplay}) مطابقت ندارد.` // Arabic <br> Persian
          )
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
          if (html5QrCode && isScannerRunning && currentMealTimeKey !== "out") {
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

  const nums = []
  const clearNums = debounce(() => {
    nums.length = 0
  }, 500)
  window.addEventListener("keypress", e => {
    if (currentMealTimeKey === "out") {
      showError(
        "لا يمكن الإدخال اليدوي خارج أوقات الوجبات.<br>ورود دستی خارج از زمان وعده غذایی مجاز نیست."
      ) // Arabic <br> Persian
      return
    }
    nums.push(e.key)
    clearNums()
    if (nums.length === 7) {
      const employeeId = nums.join("")
      nums.length = 0

      alert(`processing id: ${employeeId}`)
      processEmployeeId(employeeId)
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
function debounce(func, wait) {
  let timeout

  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}
