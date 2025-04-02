const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
}

const generateMealToken = async (employeeData, mealType, reservationId) => {
  try {
    const doc = new PDFDocument({
      size: "A7",
      margin: 10,
      layout: "landscape",
    })

    const tokenDir = path.join(__dirname, "../../public/tokens")

    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true })
    }

    const fileName = `token_${
      employeeData.employee_id
    }_${mealType}_${Date.now()}.pdf`
    const filePath = path.join(tokenDir, fileName)
    const writeStream = fs.createWriteStream(filePath)

    doc.pipe(writeStream)

    const logoPath = path.join(__dirname, "../../public/images/logo.png")
    doc.image(logoPath, 10, 10, { width: 50 })

    doc.fontSize(12).text("بیمارستان امام علی", 70, 15, { align: "right" })
    doc.fontSize(10).text("سیستم رزرو وعده غذایی", 70, 30, { align: "right" })

    doc
      .moveTo(10, 50)
      .lineTo(doc.page.width - 10, 50)
      .stroke()

    doc.fontSize(10).text(`شماره کارمند: ${employeeData.employee_id}`, 10, 60, {
      align: "right",
    })
    doc
      .fontSize(10)
      .text(
        `نام: ${employeeData.first_name || ""} ${employeeData.last_name || ""}`,
        10,
        75,
        { align: "right" }
      )

    const now = new Date()
    const dateStr = now.toLocaleString("fa-IR")

    let mealTypeText = ""
    switch (mealType) {
      case "breakfast":
        mealTypeText = "صبحانه"
        break
      case "lunch":
        mealTypeText = "ناهار"
        break
      case "dinner":
        mealTypeText = "شام"
        break
    }

    doc.fontSize(10).text(`تاریخ: ${dateStr}`, 10, 90, { align: "right" })
    doc
      .fontSize(10)
      .text(`وعده غذایی: ${mealTypeText}`, 10, 105, { align: "right" })

    doc.rect(10, 125, doc.page.width - 20, 30).stroke()
    doc
      .fontSize(8)
      .text(`شناسه ژتون: ${reservationId}`, 10, 130, { align: "center" })

    doc
      .fontSize(8)
      .text(
        "لطفاً این رسید را هنگام دریافت غذا ارائه دهید",
        10,
        doc.page.height - 20,
        {
          align: "center",
        }
      )

    doc.end()

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        resolve(`/tokens/${fileName}`)
      })
      writeStream.on("error", reject)
    })
  } catch (error) {
    console.error("خطا در تولید ژتون غذا:", error)
    throw error
  }
}

module.exports = {
  generateMealToken,
}
