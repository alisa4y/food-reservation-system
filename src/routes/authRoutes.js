const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    const result = await User.verifyCredentials(username, password);
    
    if (result.success) {
      // Set user in session
      req.session.user = result.user;
      req.session.isAuthenticated = true;
      
      return res.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          id: result.user.id,
          username: result.user.username,
          is_admin: result.user.is_admin
        }
      });
    } else {
      return res.status(401).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.session.isAuthenticated && req.session.user) {
    return res.json({ 
      success: true, 
      isAuthenticated: true,
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        is_admin: req.session.user.is_admin
      }
    });
  } else {
    return res.json({ success: true, isAuthenticated: false });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.isAuthenticated || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    
    // Verify current password
    const verifyResult = await User.verifyCredentials(req.session.user.username, currentPassword);
    
    if (!verifyResult.success) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Change password
    const result = await User.changePassword(req.session.user.id, newPassword);
    
    if (result.success) {
      return res.json({ success: true, message: 'Password changed successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

module.exports = router;
