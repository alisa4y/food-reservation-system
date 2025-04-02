$(document).ready(function () {
  // Handle login form submission
  $("#login-form").on("submit", function (e) {
    e.preventDefault()

    const username = $("#username").val().trim()
    const password = $("#password").val().trim()

    // Validate inputs
    if (!username || !password) {
      showError("لطفاً نام کاربری و رمز عبور را وارد کنید.")
      return
    }

    // Clear previous errors
    $("#login-error").addClass("d-none").text("")

    // Submit login request using fetch
    fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors like 401
          if (response.status === 401) {
            throw new Error("نام کاربری یا رمز عبور اشتباه است.")
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
          // Redirect to admin panel
          window.location.href = "/admin"
        } else {
          showError(data.message || "خطا در ورود به سیستم.")
        }
      })
      .catch(error => {
        // Handle fetch errors (network issues) and errors thrown from .then blocks
        console.error("Login error:", error)
        showError(error.message || "خطا در ارتباط با سرور.")
      })
  })

  // Show error message
  function showError(message) {
    $("#login-error").removeClass("d-none").text(message)
  }
})
