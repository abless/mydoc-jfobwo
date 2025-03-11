/**
 * Encryption Utility Module
 * 
 * This module provides utilities for secure password handling and other cryptographic
 * operations required by the Health Advisor application. It leverages bcrypt for 
 * password hashing and the Node.js crypto module for generating secure random values.
 * 
 * @module utils/encryption
 */

import bcrypt from 'bcrypt'; // ^5.1.0
import crypto from 'crypto'; // ^1.0.1
import { IS_PRODUCTION } from '../config/environment';
import { InternalServerError } from './error.util';

// Default salt rounds for password hashing - increased in production environment
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt with appropriate salt rounds
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 * @throws InternalServerError if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate input
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Use higher salt rounds in production for increased security
    const saltRounds = IS_PRODUCTION ? SALT_ROUNDS + 2 : SALT_ROUNDS;
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    throw new InternalServerError(
      'Failed to hash password',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Verifies a plain text password against a hashed password
 * 
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 * @throws InternalServerError if verification fails
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!plainPassword || !hashedPassword) {
      throw new Error('Both plainPassword and hashedPassword must be provided');
    }
    
    // Compare passwords
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new InternalServerError(
      'Failed to verify password',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Generates a random string of bytes encoded as hex for security purposes
 * 
 * @param length - Length of random bytes to generate
 * @returns Promise resolving to a random hex string
 * @throws InternalServerError if generation fails
 */
export async function generateRandomBytes(length: number): Promise<string> {
  try {
    // Validate input
    if (!length || length <= 0) {
      throw new Error('Length must be a positive number');
    }
    
    // Generate random bytes and convert to hex
    return new Promise<string>((resolve, reject) => {
      crypto.randomBytes(length, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer.toString('hex'));
        }
      });
    });
  } catch (error) {
    throw new InternalServerError(
      'Failed to generate random bytes',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Generates a secure random token for use in security-critical contexts
 * 
 * @param byteLength - Length of random bytes to generate (defaults to 32)
 * @returns Promise resolving to a secure random token
 * @throws InternalServerError if generation fails
 */
export async function generateSecureToken(byteLength = 32): Promise<string> {
  try {
    return await generateRandomBytes(byteLength);
  } catch (error) {
    throw new InternalServerError(
      'Failed to generate secure token',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}