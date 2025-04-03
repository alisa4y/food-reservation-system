const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

const projectRoot = process.cwd()
const tokenDir = path.join(projectRoot, "public/tokens")
// *** IMPORTANT: Adjust the font file name if necessary ***
const fontPath = path.join(
  projectRoot,
  "assets/fonts/ttf/Vazirmatn-Regular.ttf"
)
const logoPath = path.join(projectRoot, "public/images/logo.png")

setInterval((() => {}, 24 * 36000 * 1000))

async function generateMealToken(employeeData, mealType, reservationId) {
  // --- Define Paths ---

  // --- Pre-checks ---
  if (!fs.existsSync(fontPath)) {
    console.error(`FATAL ERROR: Persian font not found at ${fontPath}`)
    console.error(
      "Please download a Persian font (like Vazirmatn) and place it in assets/fonts/"
    )
    throw new Error("Required Persian font file is missing.")
    // Or handle this more gracefully depending on your application needs
  }
  if (!fs.existsSync(logoPath)) {
    console.warn(
      `Warning: Logo file not found at ${logoPath}. Proceeding without logo.`
    )
    // Decide if this should be a fatal error or just a warning
    // if (/* logo is mandatory */) {
    //   throw new Error("Required logo file is missing.");
    // }
  }

  // Ensure output directory exists
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true })
  }

  // Define file path
  const fileName = `token_${
    employeeData.employee_id
  }_${mealType}_${Date.now()}.pdf`
  const filePath = path.join(tokenDir, fileName)

  // Use a Promise to handle the asynchronous stream operations
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A7", // Approx 74 x 105 mm or 210 x 297 points
        margin: 10,
        layout: "landscape", // Approx 105 x 74 mm or 297 x 210 points
      })

      const writeStream = fs.createWriteStream(filePath)

      // Pipe PDF document to a file stream
      doc.pipe(writeStream)

      // --- Register the Persian Font ---
      // Give it an alias ('PersianFont') to use in text commands
      doc.registerFont("PersianFont", fontPath)

      // --- PDF Content ---

      const pageW = doc.page.width
      const pageH = doc.page.height
      const margin = doc.page.margins.left // Assuming symmetrical margins
      const effectiveWidth = pageW - 2 * margin
      const rightEdgeX = pageW - margin // X coordinate of the right margin

      // --- Apply 'features' to text calls ---
      const rtlFeatures = ["rtlm", "liga", "calt"] // Common features for RTL + ligatures

      // 1. Logo (Left Side)
      if (fs.existsSync(logoPath)) {
        // Place logo respecting top/left margins
        doc.image(logoPath, margin, margin, { width: 40 }) // Smaller logo?
      }

      // 2. Header Text (Right Side) - Use the registered Persian font
      // Align text block to the right margin
      doc
        .font("PersianFont")
        .fontSize(11)
        .text("مستشفى الإمام علي", margin, margin + 5, {
          // Start near left margin, let width+align handle positioning
          width: effectiveWidth,
          align: "right",
          features: rtlFeatures,
        })
      doc
        .font("PersianFont")
        .fontSize(9)
        .text("نظام حجز الوجبات", margin, margin + 22, {
          // Adjust Y coordinate
          width: effectiveWidth,
          align: "right",
          features: rtlFeatures,
        })

      // 3. Separator Line
      const lineY = margin + 45 // Position below header text
      doc.moveTo(margin, lineY).lineTo(rightEdgeX, lineY).stroke()

      // 4. Details (Right Aligned) - Use the Persian font and align right
      let currentY = lineY + 10 // Start below the line
      const lineSpacing = 15 // Spacing between lines

      // Helper function for right-aligned text lines
      const addRightAlignedText = (text, yPos) => {
        doc.font("PersianFont").fontSize(9).text(text, margin, yPos, {
          width: effectiveWidth,
          align: "right",
          features: rtlFeatures,
        })
        return yPos + lineSpacing // Return Y position for the next line
      }

      currentY = addRightAlignedText(
        `رقم الموظف: ${employeeData.employee_id}`,
        currentY
      )
      currentY = addRightAlignedText(
        `الاسم: ${employeeData.first_name || ""} ${
          employeeData.last_name || ""
        }`,
        currentY
      )

      // Format Date using fa-IR locale
      const now = new Date()
      const dateStr = now.toLocaleDateString("fa-IR", {
        // Use fa-IR, force Latin numerals for consistency if needed, or omit -u-nu-latn for Persian numerals
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      // Or use Intl for more control:
      // const dateFormatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
      // const dateStr = dateFormatter.format(now);
      const dateLabel = "التاریخ:"
      const fullDateText = `${dateLabel} \u200E${dateStr
        .split("")
        .reverse()
        .join("")}` // Insert LRM here
      currentY = addRightAlignedText(fullDateText, currentY)

      let mealTypeText = ""
      switch (mealType) {
        case "breakfast":
          mealTypeText = "فطور "
          break
        case "lunch":
          mealTypeText = "غداء"
          break
        case "dinner":
          mealTypeText = "عشاء"
          break
        default:
          mealTypeText = mealType // Fallback if type is unexpected
      }
      currentY = addRightAlignedText(`الوجبة: ${mealTypeText}`, currentY)

      // 5. Reservation ID Box (Centered Text)
      currentY += 5 // Add a bit more space before the box
      doc.rect(margin, currentY, effectiveWidth, 25).stroke() // Box for the ID
      doc
        .font("PersianFont")
        .fontSize(10)
        .text(`معرف القسيمة: ${reservationId}`, margin, currentY + 7, {
          // Vertically center text in box
          width: effectiveWidth,
          align: "center",
        })

      // 6. Footer Note (Centered Text) - Position near the bottom
      doc
        .font("PersianFont")
        .fontSize(8)
        .text(
          "يرجى تقديم هذا الإيصال عند استلام الوجبة",
          margin,
          pageH - margin - 15, // Positioned 15 points above the bottom margin
          {
            width: effectiveWidth,
            align: "center",
            features: rtlFeatures,
          }
        )

      // --- Finalize the PDF ---
      doc.end()

      // --- Handle stream events ---
      writeStream.on("finish", () => {
        console.log(`PDF generated successfully: ${filePath}`)
        resolve(filePath) // Resolve the promise with the file path
      })

      writeStream.on("error", err => {
        console.error("Error writing PDF stream:", err)
        reject(err) // Reject the promise if writing fails
      })
    } catch (error) {
      console.error("Error during PDF document setup:", error)
      reject(error) // Reject the promise if setup fails
    }
  })
}

// module.exports = {
//   generateMealToken,
// }

const TOKENS_DIRECTORY = tokenDir
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Deletes all PDF files within the TOKENS_DIRECTORY.
 */
async function emptyTokenDirectory() {
  console.log(
    `[${new Date().toISOString()}] Running daily cleanup for: ${TOKENS_DIRECTORY}`
  )
  try {
    // Check if directory exists, create if not (or handle as needed)
    try {
      await fs.access(TOKENS_DIRECTORY)
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(
          `[${new Date().toISOString()}] Directory ${TOKENS_DIRECTORY} not found. Nothing to clean.`
        )
        // Optional: Create directory if it should exist
        // await fs.mkdir(TOKENS_DIRECTORY, { recursive: true });
        // console.log(`[${new Date().toISOString()}] Created directory: ${TOKENS_DIRECTORY}`);
        return // Exit if directory doesn't exist and shouldn't be created
      }
      throw err // Re-throw other access errors
    }

    const files = await fs.readdir(TOKENS_DIRECTORY)
    let deletedCount = 0
    let errorCount = 0

    const deletePromises = files
      .filter(file => file.toLowerCase().endsWith(".pdf")) // Target only PDF files
      .map(async file => {
        const filePath = path.join(TOKENS_DIRECTORY, file)
        try {
          await fs.unlink(filePath)
          // console.log(`Deleted: ${file}`); // Optional: Log each deleted file
          deletedCount++
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] Failed to delete ${file}:`,
            err.message
          )
          errorCount++
        }
      })

    await Promise.all(deletePromises) // Wait for all deletions to complete

    console.log(
      `[${new Date().toISOString()}] Cleanup finished. Deleted: ${deletedCount} PDF files. Errors: ${errorCount}.`
    )
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Error during token directory cleanup:`,
      err
    )
  }
}

/**
 * Schedules the directory cleanup to run daily starting at the next midnight.
 */
function scheduleDailyTokenCleanup() {
  const now = new Date()

  // Calculate time until next midnight
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0) // Set to midnight (start of the day)

  const msUntilMidnight = tomorrow.getTime() - now.getTime()

  console.log(
    `Scheduling first token cleanup in ${Math.round(
      msUntilMidnight / 1000 / 60
    )} minutes (at ${tomorrow.toISOString()}).`
  )

  // Set timeout to run the first cleanup at the next midnight
  setTimeout(() => {
    console.log(
      `[${new Date().toISOString()}] Running initial midnight cleanup.`
    )
    emptyTokenDirectory() // Run cleanup immediately

    // After the first run, set interval to run daily
    console.log(
      `[${new Date().toISOString()}] Setting up daily interval cleanup.`
    )
    setInterval(emptyTokenDirectory, ONE_DAY_MS)
  }, msUntilMidnight)
}

scheduleDailyTokenCleanup()
