// Check if the request is from localhost or local network
const isLocal = req => {
  const clientIp = req.ip || req.connection.remoteAddress
  return clientIp === "127.0.0.1" || clientIp === "::1"
}

// Check if the request is accessing the admin panel
const isPanelAccess = req => {
  return req.path.startsWith("/admin") || req.path.startsWith("/api")
}

// Check if the request is accessing the admin panel and not from local network
const isLocalAccess = (req, res, next) => {
  if ((isPanelAccess(req) || isDatabaseOperation(req)) && !isLocal(req)) {
    if (req.xhr || req.path.startsWith("/api")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin panel can only be accessed locally.",
      })
    } else {
      return res.render("access-denied", {
        title: "Access Denied",
        message: "Admin panel can only be accessed from the local network.",
      })
    }
  }

  next()
}

// New function to check for database operations
const modifyingMethods = ["POST", "PUT", "DELETE"]
const isDatabaseOperation = req => {
  return modifyingMethods.includes(req.method)
}

module.exports = {
  isLocalAccess,
}
