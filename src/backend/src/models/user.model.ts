/**
 * User Model for MongoDB
 * 
 * This module defines the Mongoose schema and model for the User collection.
 * It includes fields for email, password, and role, with appropriate validation.
 * Password hashing is automatically performed via middleware before saving.
 * 
 * @module models/user.model
 */

import mongoose, { Schema, Model } from 'mongoose'; // ^7.0.0
import { UserDocument, UserRole } from '../types/user.types';
import { hashPassword, verifyPassword } from '../utils/encryption.util';

/**
 * Mongoose schema for the User collection
 */
export const userSchema = new Schema<UserDocument>(
  {
    // Email field - unique identifier for users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please provide a valid email address'
      ]
    },
    
    // Password field - stored as bcrypt hash
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long']
    },
    
    // Role field - determines user permissions
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    }
  },
  { 
    timestamps: true, // Automatically add createdAt and updatedAt fields
    toJSON: { 
      // Exclude password when converting to JSON
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);

/**
 * Password hashing middleware
 * Automatically hashes the password before saving if it's been modified
 */
userSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();
  
  try {
    // Hash the password using the utility function
    user.password = await hashPassword(user.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Method to compare a candidate password with the stored hashed password
 * 
 * @param candidatePassword - The plaintext password to compare
 * @returns Promise resolving to boolean indicating if passwords match
 */
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  const user = this as UserDocument;
  return verifyPassword(candidatePassword, user.password);
};

/**
 * Static method to find a user by email
 * 
 * @param email - Email address to search for
 * @returns Promise resolving to the user document or null if not found
 */
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Create index for email field for faster lookups and to enforce uniqueness
userSchema.index({ email: 1 }, { unique: true });

/**
 * User model for the MongoDB users collection
 */
const User = mongoose.model<UserDocument, 
  Model<UserDocument> & { 
    findByEmail: (email: string) => Promise<UserDocument | null> 
  }
>('User', userSchema);

export default User;