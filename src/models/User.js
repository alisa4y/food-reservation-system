const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Get user by username
  static async getByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // Verify user credentials
  static async verifyCredentials(username, password) {
    try {
      const user = await this.getByUsername(username);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Invalid password' };
      }

      return { success: true, user: { id: user.id, username: user.username, is_admin: user.is_admin } };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { username, password, is_admin } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
          'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
          [username, hashedPassword, is_admin ? 1 : 0],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ id: this.lastID });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Change password
  static async changePassword(userId, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.run(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedPassword, userId],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ success: true, changes: this.changes });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = User;
