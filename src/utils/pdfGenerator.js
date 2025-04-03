const PDFDocument = require("pdfkit")
const fs = require("fs") // Still needed for reading font/logo
const path = require("path")
// const arabicShaper = require('arabic-shaper');

// *** Modified function to return a Promise<Buffer> ***
async function generateMealToken(employeeData, mealType, reservationId) {
  const projectRoot = process.cwd()
  // *** Paths for required assets (font, logo) ***
  const fontPath = path.join(
    projectRoot,
    "assets/fonts/ttf/Vazirmatn-Regular.ttf"
  )
  const logoPath = path.join(projectRoot, "public/images/logo.png")

  // --- Pre-checks for required assets ---
  if (!fs.existsSync(fontPath)) {
    console.error(`FATAL ERROR: Font not found at ${fontPath}`)
    throw new Error("Required font file is missing.")
  }
  // Optional: Check for logo if mandatory
  let logoExists = fs.existsSync(logoPath)
  if (!logoExists) {
    console.warn(
      `Warning: Logo file not found at ${logoPath}. Proceeding without logo.`
    )
  }

  // --- No need for output directory/file paths ---

  // Use a Promise to handle the asynchronous buffer creation
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A7",
        margin: 10,
        layout: "landscape",
        // bufferPages: true // May improve performance for complex docs, often not needed here
      })

      // --- Array to collect buffer chunks ---
      const buffers = []
      doc.on("data", buffers.push.bind(buffers))
      doc.on("error", reject) // Reject promise on stream error
      doc.on("end", () => {
        // --- Concatenate buffers when the stream ends ---
        const pdfData = Buffer.concat(buffers)
        console.log("PDF Buffer generated successfully.")
        resolve(pdfData) // Resolve the promise with the final Buffer
      })

      // --- Register Font (same as before) ---
      doc.registerFont("ArabicFont", fontPath)

      // --- PDF Content Generation (Identical to previous version) ---
      const pageW = doc.page.width
      const pageH = doc.page.height
      const margin = 10
      const effectiveWidth = pageW - 2 * margin
      const rightEdgeX = pageW - margin
      const rtlFeatures = ["rtlm", "liga", "calt"]
      const lineSpacing = 15

      // Helper functions (same as before)
      const addRightAlignedTextRtl = (text, yPos, fontSize = 9) => {
        doc.font("ArabicFont").fontSize(fontSize).text(text, margin, yPos, {
          width: effectiveWidth,
          align: "right",
          features: rtlFeatures,
        })
        return yPos + lineSpacing
      }
      // Potentially add the manual LTR/RTL helper if needed for dates etc.

      // Logo
      if (logoExists) {
        doc.image(logoPath, margin, margin, { width: 40 })
      }

      // Header
      let currentY = addRightAlignedTextRtl("مستشفى الإمام علي", margin + 5, 11)
      currentY = addRightAlignedTextRtl("نظام حجز الوجبات", currentY)

      // Separator
      const lineY = currentY + 5
      doc.moveTo(margin, lineY).lineTo(rightEdgeX, lineY).stroke()
      currentY = lineY + 10

      // Details (Employee ID, Name, Date, Meal Type - same logic)
      const employeeIdText = employeeData.employee_id || ""
      const nameText = `${employeeData.first_name || ""} ${
        employeeData.last_name || ""
      }`
      currentY = addRightAlignedTextRtl(
        `رقم الموظف: ${employeeIdText.split("").reverse().join("")}`,
        currentY
      )
      currentY = addRightAlignedTextRtl(`الاسم: ${nameText}`, currentY)

      const now = new Date()
      let dateStr = now.toLocaleDateString("ar-EG", {
        /* options */
      })
      currentY = addRightAlignedTextRtl(
        `التاريخ: ${dateStr
          .split("")
          .reverse()
          .join("")
          .split("/")
          .reverse()
          .join("/")}`,
        currentY
      )

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
      currentY = addRightAlignedTextRtl(`الوجبة: ${mealTypeText}`, currentY)

      // Reservation ID Box
      currentY += 5
      doc.rect(margin, currentY, effectiveWidth, 25).stroke()
      const reservationText = `معرف القسيمة: ${reservationId
        .toString()
        .split("")
        .reverse()
        .join("")}`
      doc
        .font("ArabicFont")
        .fontSize(10)
        .text(reservationText, margin, currentY + 7, {
          width: effectiveWidth,
          align: "center",
          features: rtlFeatures,
        })
      currentY += 25 + 5

      // Footer Note
      const footerText = "يرجى تقديم هذا الإيصال عند استلام الوجبة"
      const footerY = pageH - margin - 15
      doc.font("ArabicFont").fontSize(8).text(footerText, margin, footerY, {
        width: effectiveWidth,
        align: "center",
        features: rtlFeatures,
      })

      // --- Finalize the PDF Document ---
      // This triggers the 'end' event eventually
      doc.end()
    } catch (error) {
      // Catch errors during document setup (e.g., font loading)
      console.error("Error during PDF document setup:", error)
      reject(error)
    }
  })
}
module.exports = {
  generateMealToken,
}
// --- Example Usage (e.g., in an Express.js route) ---

/*
async function handleGenerateTokenRequest(req, res) {
    try {
        // Assume you get employeeData, mealType, reservationId from the request (req.body, req.params, etc.)
        const employee = { employee_id: "١٢٣٤٥٦", first_name: "علي", last_name: "محمد" };
        const meal = "lunch";
        const reservation = "QSM-٩٨٧٦٥";

        // Generate the PDF buffer
        const pdfBuffer = await generateMealTokenArabicBuffer(employee, meal, reservation);

        // Set response headers for PDF download
        const fileName = `token_ar_${employee.employee_id}_${meal}_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`); // Use 'inline' to display in browser if supported
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send the buffer as the response body
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Failed to generate and send PDF token:", error);
        res.status(500).send("Error generating PDF token.");
    }
}
*/
