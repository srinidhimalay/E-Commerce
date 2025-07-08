document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }
})

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("username").value
  const password = document.getElementById("password").value
  const messageDiv = document.getElementById("login-message")

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      messageDiv.innerHTML = '<div class="message success">Login successful! Redirecting...</div>'

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/admin"
        } else {
          window.location.href = "/"
        }
      }, 1000)
    } else {
      messageDiv.innerHTML = `<div class="message error">${data.error}</div>`
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="message error">Login failed. Please try again.</div>'
  }
}

// Handle registration form submission
async function handleRegister(e) {
  e.preventDefault()

  const username = document.getElementById("username").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const messageDiv = document.getElementById("register-message")

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      messageDiv.innerHTML = '<div class="message success">Registration successful! You can now login.</div>'
      document.getElementById("register-form").reset()

      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } else {
      messageDiv.innerHTML = `<div class="message error">${data.error}</div>`
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="message error">Registration failed. Please try again.</div>'
  }
}
