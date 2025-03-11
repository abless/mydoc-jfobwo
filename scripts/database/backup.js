/**
 * MongoDB Database Backup Script
 * 
 * This script automates MongoDB database backups for the Health Advisor application.
 * It handles backup creation, compression, validation, retention management, and
 * optional upload to S3 for off-site storage.
 * 
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string
 * - BACKUP_DIR: Directory to store backups (default: {project_root}/backups)
 * - BACKUP_RETENTION_DAYS: Number of days to keep backups (default: 30)
 * - BACKUP_TYPE: Type of backup to perform (default: 'full')
 * - S3_BUCKET_NAME: S3 bucket for off-site backup storage (optional)
 */

// Load environment variables from .env file
// dotenv v16.0.3
require('dotenv').config();

// Import required modules
// mongoose v7.0.3
const mongoose = require('mongoose');
// fs-extra v11.1.1
const fs = require('fs-extra');
// built-in
const path = require('path');
// built-in
const { spawn } = require('child_process');
// winston v3.8.2
const winston = require('winston');

// Global configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const MONGODB_URI = process.env.MONGODB_URI;
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const BACKUP_TYPE = process.env.BACKUP_TYPE || 'full';

/**
 * Configures the Winston logger for the backup script
 * @returns {winston.Logger} Configured logger instance
 */
function setupLogger() {
  const logDir = path.join(BACKUP_DIR, 'logs');
  
  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Configure Winston logger with console and file transports
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ 
        filename: path.join(logDir, 'backup.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ]
  });
  
  return logger;
}

/**
 * Ensures the backup directory exists, creating it if necessary
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<string>} Path to the backup directory
 */
async function ensureBackupDirectory(logger) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      await fs.mkdirs(BACKUP_DIR);
      logger.info(`Created backup directory: ${BACKUP_DIR}`);
    } else {
      logger.info(`Using existing backup directory: ${BACKUP_DIR}`);
    }
    
    // Ensure logs directory exists
    const logDir = path.join(BACKUP_DIR, 'logs');
    if (!fs.existsSync(logDir)) {
      await fs.mkdirs(logDir);
    }
    
    return BACKUP_DIR;
  } catch (error) {
    logger.error(`Failed to create backup directory: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a timestamped filename for the backup
 * @param {string} backupType - Type of backup
 * @returns {string} Backup filename with timestamp
 */
function generateBackupFilename(backupType) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  return `backup_${backupType}_${timestamp}`;
}

/**
 * Executes the MongoDB backup using mongodump
 * @param {string} backupPath - Path to store the backup
 * @param {string} mongoUri - MongoDB connection URI
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<boolean>} True if backup was successful, false otherwise
 */
async function performBackup(backupPath, mongoUri, logger) {
  return new Promise((resolve, reject) => {
    if (!mongoUri) {
      logger.error('MongoDB URI is not provided. Cannot perform backup.');
      return reject(new Error('MongoDB URI is not provided'));
    }
    
    logger.info(`Starting MongoDB backup to ${backupPath}`);
    
    // Parse MongoDB URI for database name
    const dbName = mongoUri.split('/').pop().split('?')[0];
    
    // Construct mongodump command arguments
    const args = [
      '--uri', mongoUri,
      '--out', backupPath,
      '--gzip'
    ];
    
    // Execute mongodump command
    const mongodump = spawn('mongodump', args);
    
    // Capture output for logging
    mongodump.stdout.on('data', (data) => {
      logger.debug(`mongodump stdout: ${data}`);
    });
    
    mongodump.stderr.on('data', (data) => {
      logger.debug(`mongodump stderr: ${data}`);
    });
    
    // Handle completion
    mongodump.on('close', (code) => {
      if (code === 0) {
        logger.info('MongoDB backup completed successfully');
        resolve(true);
      } else {
        logger.error(`MongoDB backup failed with code ${code}`);
        resolve(false);
      }
    });
    
    // Handle errors
    mongodump.on('error', (error) => {
      logger.error(`Failed to start mongodump: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Removes backup files older than the retention period
 * @param {string} backupDir - Backup directory
 * @param {number} retentionDays - Number of days to keep backups
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<number>} Number of backup files removed
 */
async function cleanupOldBackups(backupDir, retentionDays, logger) {
  logger.info(`Cleaning up backups older than ${retentionDays} days`);
  
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Get all files and directories in the backup directory
    const files = await fs.readdir(backupDir);
    
    // Pattern to identify backup files/directories
    const backupPattern = /^backup_.*$/;
    
    // Filter and process each backup
    let removedCount = 0;
    
    for (const file of files) {
      if (backupPattern.test(file)) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        // Check if the file is older than the cutoff date
        if (stats.birthtime < cutoffDate) {
          // Remove the file or directory
          if (stats.isDirectory()) {
            await fs.remove(filePath);
          } else {
            await fs.unlink(filePath);
          }
          
          logger.info(`Removed old backup: ${file}`);
          removedCount++;
        }
      }
    }
    
    logger.info(`Cleanup complete. Removed ${removedCount} old backup(s)`);
    return removedCount;
  } catch (error) {
    logger.error(`Error during backup cleanup: ${error.message}`);
    throw error;
  }
}

/**
 * Compresses the backup directory to save space
 * @param {string} backupPath - Path to the backup directory
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<string>} Path to the compressed backup file
 */
async function compressBackup(backupPath, logger) {
  return new Promise((resolve, reject) => {
    // Target compressed file path
    const compressedFile = `${backupPath}.tar.gz`;
    logger.info(`Compressing backup to ${compressedFile}`);
    
    // Get the directory name for tar command
    const backupDirName = path.basename(backupPath);
    const parentDir = path.dirname(backupPath);
    
    // Construct tar command arguments
    const args = [
      '-czf',
      compressedFile,
      '-C',
      parentDir,
      backupDirName
    ];
    
    // Execute tar command
    const tar = spawn('tar', args);
    
    // Capture output for logging
    tar.stdout.on('data', (data) => {
      logger.debug(`tar stdout: ${data}`);
    });
    
    tar.stderr.on('data', (data) => {
      logger.debug(`tar stderr: ${data}`);
    });
    
    // Handle completion
    tar.on('close', async (code) => {
      if (code === 0) {
        logger.info('Backup compression completed successfully');
        
        // Remove the original uncompressed backup directory
        try {
          await fs.remove(backupPath);
          logger.info(`Removed original uncompressed backup: ${backupPath}`);
          resolve(compressedFile);
        } catch (error) {
          logger.error(`Failed to remove original backup: ${error.message}`);
          resolve(compressedFile); // Still resolve with compressed file path
        }
      } else {
        logger.error(`Backup compression failed with code ${code}`);
        resolve(backupPath); // Return original path if compression fails
      }
    });
    
    // Handle errors
    tar.on('error', (error) => {
      logger.error(`Failed to start tar: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Validates the backup to ensure it's usable for restoration
 * @param {string} backupPath - Path to the backup file or directory
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<boolean>} True if backup is valid, false otherwise
 */
async function validateBackup(backupPath, logger) {
  logger.info(`Validating backup: ${backupPath}`);
  
  try {
    // Check if backup exists
    if (!await fs.pathExists(backupPath)) {
      logger.error(`Backup doesn't exist: ${backupPath}`);
      return false;
    }
    
    // Check if it's a file (compressed backup) or directory
    const stats = await fs.stat(backupPath);
    
    if (stats.isFile()) {
      // For compressed file, check file size
      if (stats.size === 0) {
        logger.error(`Backup file is empty: ${backupPath}`);
        return false;
      }
      
      // If it's a tar.gz file, test its integrity with tar -t
      if (backupPath.endsWith('.tar.gz')) {
        return new Promise((resolve) => {
          const tar = spawn('tar', ['-tzf', backupPath]);
          
          tar.on('close', (code) => {
            if (code === 0) {
              logger.info('Compressed backup validated successfully');
              resolve(true);
            } else {
              logger.error(`Compressed backup validation failed with code ${code}`);
              resolve(false);
            }
          });
          
          tar.on('error', (error) => {
            logger.error(`Failed to validate compressed backup: ${error.message}`);
            resolve(false);
          });
        });
      }
      
      logger.info('Backup file exists and is not empty');
      return true;
    } else if (stats.isDirectory()) {
      // For directory backup, check for essential files
      const files = await fs.readdir(backupPath);
      
      // Typically, mongodump creates separate directories for each database
      if (files.length === 0) {
        logger.error(`Backup directory is empty: ${backupPath}`);
        return false;
      }
      
      logger.info('Backup directory exists and contains files');
      return true;
    }
    
    logger.error(`Backup is neither a file nor directory: ${backupPath}`);
    return false;
  } catch (error) {
    logger.error(`Error validating backup: ${error.message}`);
    return false;
  }
}

/**
 * Uploads the backup to S3 for off-site storage (if configured)
 * @param {string} backupPath - Path to the backup file
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<boolean>} True if upload was successful, false otherwise
 */
async function uploadBackupToS3(backupPath, logger) {
  // Check if S3 backup is enabled
  const bucketName = process.env.S3_BUCKET_NAME;
  
  if (!bucketName) {
    logger.info('S3 backup not configured (S3_BUCKET_NAME not set). Skipping upload.');
    return true;
  }
  
  logger.info(`Uploading backup to S3 bucket: ${bucketName}`);
  
  try {
    // Dynamically import AWS SDK to avoid dependency if not used
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    // Read the backup file
    const fileContent = await fs.readFile(backupPath);
    const fileName = path.basename(backupPath);
    
    // Set up the S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: `backups/${fileName}`,
      Body: fileContent
    };
    
    // Upload to S3
    logger.info(`Starting S3 upload of ${fileName}`);
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    
    logger.info(`Backup uploaded to S3: s3://${bucketName}/backups/${fileName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to upload backup to S3: ${error.message}`);
    return false;
  }
}

/**
 * Main function that orchestrates the backup process
 */
async function main() {
  let logger;
  
  try {
    // Load environment variables
    require('dotenv').config();
    
    // Set up logger
    logger = setupLogger();
    logger.info('Starting MongoDB backup process');
    
    // Validate MongoDB URI
    if (!MONGODB_URI) {
      logger.error('MONGODB_URI environment variable is not set');
      process.exit(1);
    }
    
    // Ensure backup directory exists
    await ensureBackupDirectory(logger);
    
    // Generate backup filename with timestamp
    const backupName = generateBackupFilename(BACKUP_TYPE);
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    logger.info(`Backup type: ${BACKUP_TYPE}`);
    logger.info(`Backup path: ${backupPath}`);
    
    // Perform the backup
    const backupSuccess = await performBackup(backupPath, MONGODB_URI, logger);
    
    if (!backupSuccess) {
      logger.error('Backup failed. Exiting.');
      process.exit(1);
    }
    
    // Compress the backup
    const finalBackupPath = await compressBackup(backupPath, logger);
    
    // Validate the backup
    const isValid = await validateBackup(finalBackupPath, logger);
    
    if (!isValid) {
      logger.error('Backup validation failed. The backup may be corrupted.');
      process.exit(1);
    }
    
    // Upload to S3 if configured
    await uploadBackupToS3(finalBackupPath, logger);
    
    // Clean up old backups
    await cleanupOldBackups(BACKUP_DIR, RETENTION_DAYS, logger);
    
    logger.info('Backup process completed successfully');
    
    // Disconnect mongoose if connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    process.exit(0);
  } catch (error) {
    if (logger) {
      logger.error(`Backup process failed: ${error.message}`);
      logger.error(error.stack);
    } else {
      console.error(`Backup process failed: ${error.message}`);
      console.error(error.stack);
    }
    
    // Disconnect mongoose if connected
    if (mongoose && mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
}

// Execute the main function
if (require.main === module) {
  main();
}

// Export functions for testing or external use
module.exports = {
  setupLogger,
  ensureBackupDirectory,
  generateBackupFilename,
  performBackup,
  cleanupOldBackups,
  compressBackup,
  validateBackup,
  uploadBackupToS3,
  main
};