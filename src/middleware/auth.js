// Authentication middleware - simplified to only check IP
const isLocalAccess = (req, res, next) => {
  // Skip IP check for scanner page and public routes
  if (req.path.startsWith('/scanner') || req.path === '/') {
    return next();
  }
  
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Check if the request is from localhost or local network
  const isLocal = 
    clientIp === '127.0.0.1' || 
    clientIp === '::1' || 
    clientIp.startsWith('192.168.') || 
    clientIp.startsWith('10.') || 
    clientIp.startsWith('172.16.') ||
    clientIp.startsWith('172.17.') ||
    clientIp.startsWith('172.18.') ||
    clientIp.startsWith('172.19.') ||
    clientIp.startsWith('172.20.') ||
    clientIp.startsWith('172.21.') ||
    clientIp.startsWith('172.22.') ||
    clientIp.startsWith('172.23.') ||
    clientIp.startsWith('172.24.') ||
    clientIp.startsWith('172.25.') ||
    clientIp.startsWith('172.26.') ||
    clientIp.startsWith('172.27.') ||
    clientIp.startsWith('172.28.') ||
    clientIp.startsWith('172.29.') ||
    clientIp.startsWith('172.30.') ||
    clientIp.startsWith('172.31.');
  
  if (!isLocal) {
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin panel can only be accessed locally.' });
    } else {
      return res.render('access-denied', { 
        title: 'Access Denied',
        message: 'Admin panel can only be accessed from the local network.'
      });
    }
  }
  
  next();
};

module.exports = {
  isLocalAccess
};
