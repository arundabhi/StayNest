import validator from 'validator';
import mongoose from 'mongoose';

export const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    throw new Error("Invalid email address");
  }
  return email.toLowerCase().trim();
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Password must contain uppercase, lowercase, and number");
  }
  
  return password;
};

export const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return id;
};

export const validateDate = (date, fieldName = "date") => {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return parsed;
};

export const validateDateRange = (checkIn, checkOut) => {
  const start = validateDate(checkIn, "check-in date");
  const end = validateDate(checkOut, "check-out date");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (start < today) {
    throw new Error("Check-in date cannot be in the past");
  }
  
  if (end <= start) {
    throw new Error("Check-out must be after check-in");
  }
  
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    throw new Error("Booking cannot exceed 365 days");
  }
  
  return { start, end, diffDays };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return validator.escape(input.trim());
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error("Invalid phone number");
  }
  
  return cleaned;
};

export const validatePrice = (price, fieldName = "price") => {
  const parsed = Number(price);
  
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
  
  if (parsed > 1000000) {
    throw new Error(`${fieldName} seems unreasonably high`);
  }
  
  return parsed;
};