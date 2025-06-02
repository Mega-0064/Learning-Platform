import { ConnectionOptions } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// TypeORM configuration
const dbConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'learning_platform',
  synchronize: process.env.NODE_ENV !== 'production', // Automatically create database schema in development
  logging: process.env.NODE_ENV !== 'production',
  entities: [path.join(__dirname, '../entities/**/*.{js,ts}')],
  migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{js,ts}')],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers',
  },
  // SSL configuration for production (e.g., for Heroku)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Export configuration
export default dbConfig;

// Database connection error handling
export const handleDatabaseError = (error: Error): void => {
  console.error('Database connection error:', error);
  // Additional error handling logic here
  // For example, you might want to send alerts or try reconnecting
};

// Connect to database with retry mechanism
export const connectWithRetry = async (
  options: ConnectionOptions,
  retries: number = 5,
  delay: number = 5000
): Promise<any> => {
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await require('typeorm').createConnection(options);
      console.log('Successfully connected to the database');
      return connection;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      
      // Wait before trying again
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to connect to database after ${retries} attempts: ${lastError?.message}`);
};

