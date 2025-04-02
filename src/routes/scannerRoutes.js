const express = require('express');
const router = express.Router();
const path = require('path');
const Reservation = require('../models/Reservation');
const Employee = require('../models/Employee');
const { generateMealToken } = require('../utils/pdfGenerator');

// Scanner page
router.get('/', (req, res) => {
  res.render('scanner/index', { 
    title: 'اسکنر بارکد',
    layout: false // Don't use admin layout for scanner page
  });
});

// Check active reservation
router.get('/api/check/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check if employee exists
    const employee = await Employee.getByEmployeeId(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'کارمند با این شماره پرسنلی یافت نشد.' 
      });
    }
    
    // Check for active reservation
    const result = await Reservation.checkActiveReservation(employeeId);
    
    if (result.active) {
      // Generate token PDF
      const tokenPath = await generateMealToken(
        result.reservation, 
        result.mealType,
        result.reservation.id
      );
      
      // Mark reservation as consumed
      await Reservation.markAsConsumed(result.reservation.id, result.mealType, result.isInShift);
      
      // Return success with token path
      return res.json({
        success: true,
        active: true,
        data: {
          employee: {
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            is_guest: employee.is_guest
          },
          meal_type: result.mealType,
          reservation: {
            ...result.reservation,
            token_pdf: tokenPath
          }
        }
      });
    } else {
      // Return not active with appropriate message
      let message = result.message;
      if (result.consumed) {
        message = `این وعده غذایی (${result.mealType === 'breakfast' ? 'صبحانه' : result.mealType === 'lunch' ? 'ناهار' : 'شام'}) قبلاً مصرف شده و ژتون آن چاپ شده است.`;
      }
      
      return res.json({
        success: true,
        active: false,
        consumed: result.consumed || false,
        data: {
          employee: {
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            is_guest: employee.is_guest
          },
          meal_type: result.mealType,
          message: message
        }
      });
    }
  } catch (error) {
    console.error('Error checking reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در بررسی رزرو.' 
    });
  }
});

module.exports = router;
