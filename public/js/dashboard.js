document.addEventListener("DOMContentLoaded", () => {
  const todayDate = new Date()
  const tomorrow = new Date(todayDate)
  tomorrow.setDate(todayDate.getDate() + 1)
  const day7 = new Date(todayDate)
  day7.setDate(todayDate.getDate() + 7)

  fetch("/api/reservations/filter".toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json", // Must be explicitly set
    },
    body: JSON.stringify({
      startDate: todayDate.toLocaleDateString("en-GB"),
      endDate: tomorrow.toLocaleDateString("en-GB"),
    }),
  })
    .then(response => response.json())
    .then(responseData => {
      if (responseData.success) {
        updateReservationsTable(responseData)
        distributionChart(responseData.data.reservations)
      } else {
        alert(responseData.message || "خطا در جستجو.")
      }
    })
    .catch(error => {
      console.error("Error searching reservations:", error)
      alert("خطا در ارتباط با سرور.")
    })

  fetch("/api/reservations/filter".toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json", // Must be explicitly set
    },
    body: JSON.stringify({
      startDate: todayDate.toLocaleDateString("en-GB"),
      endDate: day7.toLocaleDateString("en-GB"),
    }),
  })
    .then(response => response.json())
    .then(responseData => {
      if (responseData.success) {
        c2(responseData.data.reservations)
      } else {
        alert(responseData.message || "خطا در جستجو.")
      }
    })
    .catch(error => {
      console.error("Error searching reservations:", error)
      alert("خطا در ارتباط با سرور.")
    })
})
function distributionChart(reservations) {
  // Initialize meal counters
  let breakfastCount = 0
  let lunchCount = 0
  let dinnerCount = 0

  // Aggregate meal counts
  reservations.forEach(row => {
    if (row.breakfast) breakfastCount++
    if (row.lunch) lunchCount++
    if (row.dinner) dinnerCount++
  })

  // Configure the chart
  const config = {
    type: "pie",
    data: {
      labels: ["صبحانه", "ناهار", "شام"], // Translated meal names
      datasets: [
        {
          label: "توزیع وعدههای غذایی", // Translated label
          data: [breakfastCount, lunchCount, dinnerCount],
          backgroundColor: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "توزیع رزروهای غذایی", // Translated title
        },
      },
    },
  }

  // Render the chart
  new Chart(document.getElementById("mealDistributionChart"), config)
}

function c2(reservations) {
  // Step 1: Aggregate meal counts by department
  const departmentMeals = {}
  reservations.forEach(row => {
    const dept = row.department
    if (!departmentMeals[dept]) {
      departmentMeals[dept] = { breakfast: 0, lunch: 0, dinner: 0 }
    }
    if (row.breakfast) departmentMeals[dept].breakfast++
    if (row.lunch) departmentMeals[dept].lunch++
    if (row.dinner) departmentMeals[dept].dinner++
  })

  // Persian meal names for labels
  const persianMeals = ["صبحانه", "ناهار", "شام"]
  // Mapping Persian names to English keys
  const mealKeyMap = {
    صبحانه: "breakfast",
    ناهار: "lunch",
    شام: "dinner",
  }

  // Step 2: Prepare labels (department names) and datasets
  const departments = Object.keys(departmentMeals)
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"]

  const datasets = persianMeals.map((meal, index) => ({
    label: meal,
    data: departments.map(dept => {
      const total =
        departmentMeals[dept].breakfast +
        departmentMeals[dept].lunch +
        departmentMeals[dept].dinner
      // Use the English key from the mapping
      const englishKey = mealKeyMap[meal]
      return total
        ? ((departmentMeals[dept][englishKey] / total) * 100).toFixed(1)
        : 0
    }),
    backgroundColor: colors[index],
  }))

  // Step 3: Configure the chart
  const config = {
    type: "bar",
    data: {
      labels: departments,
      datasets: datasets,
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "توزیع وعدههای غذایی بر اساس دپارتمان (%)",
        },
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.raw}%`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: "دپارتمان",
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => `${value}%`,
          },
          title: {
            display: true,
            text: "درصد وعدههای غذایی",
          },
        },
      },
    },
  }

  // Step 4: Render the chart
  new Chart(document.getElementById("weeklyReservationsChart"), config)
}
