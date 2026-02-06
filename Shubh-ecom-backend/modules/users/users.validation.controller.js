const usersService = require('./users.service');
const userRepo = require('./user.repo');

/**
 * Lightweight duplicate check for real-time form validation
 */
async function checkEmailAvailability(req, res) {
  try {
    const { email, excludeUserId } = req.query;
    
    if (!email) {
      return res.success({ available: true });
    }

    const existing = await userRepo.findByEmail(email.toLowerCase().trim());
    
    // If editing, exclude current user from check
    if (existing && excludeUserId && existing._id.toString() === excludeUserId) {
      return res.success({ available: true });
    }

    return res.success({ available: !existing });
  } catch (error) {
    console.error('Email availability check error:', error);
    return res.fail('Failed to check email availability', 500);
  }
}

/**
 * Lightweight duplicate check for phone
 */
async function checkPhoneAvailability(req, res) {
  try {
    const { phone, excludeUserId } = req.query;
    
    if (!phone) {
      return res.success({ available: true });
    }

    const existing = await userRepo.findByPhone(phone.trim());
    
    // If editing, exclude current user from check
    if (existing && excludeUserId && existing._id.toString() === excludeUserId) {
      return res.success({ available: true });
    }

    return res.success({ available: !existing });
  } catch (error) {
    console.error('Phone availability check error:', error);
    return res.fail('Failed to check phone availability', 500);
  }
}

module.exports = {
  checkEmailAvailability,
  checkPhoneAvailability,
};
