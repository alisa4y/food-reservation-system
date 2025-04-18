const days = [
  "یکشنبه",
  "دوشنبه",
  "سه شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
]
function updateReservationsTable(responseData, showOp = false) {
  let reservations = responseData.data

  if (reservations.reservations) {
    reservations = reservations.reservations
  }

  const totalCount = responseData.totalItems
  const totalPages = Math.ceil(totalCount / 20)
  const currentPage = responseData.currentPage

  const tableBody = $("#reservations-table-body")
  tableBody.empty() // Clear existing rows

  if (reservations.length === 0) {
    tableBody.append(
      '<tr><td colspan="7" class="text-center">هیچ رزروی یافت نشد.</td></tr>'
    )
  } else {
    reservations.forEach(res => {
      const row = `
                            <tr>
                                <td>${res.employee_id}</td>
                                <td>${res.first_name || ""} ${
        res.last_name || ""
      }</td>
                                <td>${showDate(res.date)}</td>
                                <td>${getMealStatusText(res.breakfast)}</td>
                                <td>${getMealStatusText(res.lunch)}</td>
                                <td>${getMealStatusText(res.dinner)}</td>
                                ${
                                  showOp
                                    ? `<td>
                                    <button class="btn btn-sm btn-info view-reservation-btn" data-id="${res.id}" title="مشاهده"><i class="fas fa-eye"></i></button>
                                    <button class="btn btn-sm btn-warning edit-reservation-btn" data-id="${res.id}" title="ویرایش"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-danger delete-reservation-btn" data-id="${res.id}" title="حذف"><i class="fas fa-trash"></i></button>
                                </td>`
                                    : ""
                                }
                            </tr>
                        `
      tableBody.append(row)
    })
  }

  // Update total count
  $("#total-count").text(reservations.length)

  // Generate pagination
  const paginationUl = $("#pagination")
  paginationUl.empty()
}
// Helper function to get meal status text and icon
function getMealStatusText(status) {
  switch (parseInt(status)) {
    case 0:
      return '<span class="badge meal-status bg-no-reservation">بدون رزرو</span>'
    case 1:
      return '<span class="badge meal-status bg-reserved-in-shift">رزرو (شیفت)</span>'
    case 2:
      return '<span class="badge meal-status bg-reserved-out-shift">رزرو (خارج شیفت)</span>'
    case 3:
      return '<span class="badge meal-status bg-consumed-in-shift" style="text-decoration: line-through;">رزرو (شیفت)</span>'
    case 4:
      return '<span class="badge meal-status bg-consumed-out-shift" style="text-decoration: line-through;">رزرو (خارج شیفت)</span>'
    default:
      return '<span class="badge meal-status bg-light text-dark">نامشخص</span>'
  }
}
function getPersianDayOfWeek(reservationDate) {
  reservationDate = reservationDate.toString()
  const year = reservationDate.slice(0, 4)
  const month = reservationDate.slice(4, 6)
  const day = reservationDate.slice(6, 8)

  const d = new Date(year, month - 1, day)
  const dayIndex = d.getDay()

  return days[dayIndex]
}
function showDate(date) {
  date = date.toString()
  const year = date.slice(0, 4)
  const month = date.slice(4, 6)
  const day = date.slice(6, 8)

  return `${day}/${month}/${year}`
}

window.addEventListener("DOMContentLoaded", () => {
  const elms = document.querySelectorAll('[type="date"]')
  elms.forEach(elm => {
    elm.addEventListener("change", () => {
      // elm.value = elm.valueAsDate.toLocaleDateString("en-GB")
    })
  })
})
