$(document).ready(function () {
  // Load employees on page load
  loadEmployees()

  // Add employee button click
  $("#add-employee-btn").on("click", function () {
    // Reset form
    $("#employee-form")[0].reset()
    $("#employee-id").val("")
    $("#employee-code-prefix").val("110")
    $("#employee-code-suffix").val("")
    $("#employee-modal-label").text("افزودن کارمند")
    $("#employee-modal").modal("show")
  })

  // Save employee button click
  $("#save-employee-btn").on("click", function () {
    // Get form data
    const id = $("#employee-id").val()
    const employeeCodePrefix = $("#employee-code-prefix").val()
    const employeeCodeSuffix = $("#employee-code-suffix").val()
    const employeeCode = employeeCodePrefix + employeeCodeSuffix
    const firstName = $("#first-name").val()
    const lastName = $("#last-name").val()
    const department = $("#department").val()
    const position = $("#position").val()
    const isGuest = $("#is-guest").is(":checked") ? 1 : 0

    // Validate form
    if (!employeeCodePrefix || !employeeCodeSuffix) {
      alert("لطفاً شماره پرسنلی را وارد کنید.")
      return
    }

    // Prepare data
    const data = {
      employee_id: employeeCode,
      first_name: firstName,
      last_name: lastName,
      department: department,
      position: position,
      is_guest: isGuest,
    }

    // Send request using fetch
    fetch(id ? `/api/employees/${id}` : "/api/employees", {
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
          $("#employee-modal").modal("hide")
          // Reload employees
          loadEmployees()
          // Show success message
          alert(
            id ? "کارمند با موفقیت ویرایش شد." : "کارمند با موفقیت افزوده شد."
          )
        } else {
          alert(responseData.message || "خطا در ذخیره کارمند.")
        }
      })
      .catch(error => {
        console.error("Error saving employee:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Edit employee button click
  $(document).on("click", ".edit-employee-btn", function () {
    const id = $(this).data("id")

    // Get employee data using fetch
    fetch(`/api/employees/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          const employee = responseData.data

          // Fill form
          $("#employee-id").val(employee.id)

          // Split employee_id into prefix and suffix
          const employeeId = employee.employee_id
          if (employeeId && employeeId.length >= 3) {
            $("#employee-code-prefix").val(employeeId.substring(0, 3))
            $("#employee-code-suffix").val(employeeId.substring(3))
          } else {
            $("#employee-code-prefix").val("110")
            $("#employee-code-suffix").val(employeeId)
          }

          $("#first-name").val(employee.first_name)
          $("#last-name").val(employee.last_name)
          $("#department").val(employee.department)
          $("#position").val(employee.position)
          $("#is-guest").prop("checked", employee.is_guest === 1)

          // Show modal
          $("#employee-modal-label").text("ویرایش کارمند")
          $("#employee-modal").modal("show")
        } else {
          alert(responseData.message || "خطا در دریافت اطلاعات کارمند.")
        }
      })
      .catch(error => {
        console.error("Error fetching employee for edit:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Delete employee button click
  $(document).on("click", ".delete-employee-btn", function () {
    const id = $(this).data("id")

    // Store ID in delete modal
    $("#confirm-delete-btn").data("id", id)

    // Show modal
    $("#delete-modal").modal("show")
  })

  // Confirm delete button click
  $("#confirm-delete-btn").on("click", function () {
    const id = $(this).data("id")

    // Send request using fetch
    fetch(`/api/employees/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          // Close modal
          $("#delete-modal").modal("hide")
          // Reload employees
          loadEmployees()
          // Show success message
          alert("کارمند با موفقیت حذف شد.")
        } else {
          alert(responseData.message || "خطا در حذف کارمند.")
        }
      })
      .catch(error => {
        console.error("Error deleting employee:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Search button click
  $("#search-btn").on("click", function () {
    loadEmployees($("#search-input").val())
  })

  // Search input enter key
  $("#search-input").on("keypress", function (e) {
    if (e.which === 13) {
      loadEmployees($(this).val())
    }
  })

  // Import Excel button click
  $("#import-excel-btn").on("click", function () {
    // Reset form
    $("#import-form")[0].reset()

    // Show modal
    $("#import-modal").modal("show")
  })

  // Upload Excel button click
  $("#upload-excel-btn").on("click", function () {
    const fileInput = $("#excel-file")[0]

    // Validate file
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("لطفاً یک فایل اکسل انتخاب کنید.")
      return
    }

    // Prepare form data
    const formData = new FormData()
    formData.append("file", fileInput.files[0])

    // Send request using fetch
    fetch("/api/employees/import", {
      method: "POST",
      body: formData, // fetch handles FormData correctly
      headers: {
        Accept: "application/json", // Expect JSON response
      },
    })
      .then(response => response.json())
      .then(responseData => {
        if (responseData.success) {
          // Close modal
          $("#import-modal").modal("hide")
          // Reload employees
          loadEmployees()
          // Show success message
          alert(`${responseData.count} کارمند با موفقیت بارگذاری شد.`)
        } else {
          alert(responseData.message || "خطا در بارگذاری فایل اکسل.")
        }
      })
      .catch(error => {
        console.error("Error importing employees:", error)
        alert("خطا در ارتباط با سرور.")
      })
  })

  // Load employees function
  function loadEmployees(search = "") {
    // Construct URL with query parameters
    const url = new URL("/api/employees", window.location.origin)
    if (search) {
      url.searchParams.append("search", search)
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
          const employees = responseData.data

          // Clear table
          $("#employees-table-body").empty()

          // Add rows
          employees.forEach(function (employee) {
            $("#employees-table-body").append(`
                <tr>
                    <td>${employee.employee_id}</td>
                    <td>${employee.first_name || ""}</td>
                    <td>${employee.last_name || ""}</td>
                    <td>${employee.department || ""}</td>
                    <td>${employee.position || ""}</td>
                    <td>${
                      employee.is_guest === 1
                        ? '<span class="badge bg-success">بله</span>'
                        : '<span class="badge bg-secondary">خیر</span>'
                    }</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-warning edit-employee-btn" data-id="${
                          employee.id
                        }">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger delete-employee-btn" data-id="${
                          employee.id
                        }">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `)
          })

          // Update total count
          $("#total-count").text(employees.length)

          // TODO: Implement pagination rendering here if needed
          // renderPagination(responseData.totalPages, responseData.currentPage);
        } else {
          // Handle error response
          alert(responseData.message || "خطا در بارگذاری لیست کارمندان.")
          $("#employees-table-body").empty() // Clear table on error
          $("#total-count").text(0)
          // Clear pagination on error
          $("#pagination").empty()
        }
      })
      .catch(error => {
        // Handle fetch error
        console.error("Error loading employees:", error)
        alert("خطا در ارتباط با سرور هنگام بارگذاری کارمندان.")
        $("#employees-table-body").empty() // Clear table on error
        $("#total-count").text(0)
        // Clear pagination on error
        $("#pagination").empty()
      })
  }
})
