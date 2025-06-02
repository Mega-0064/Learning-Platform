const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first
dotenv.config();

// Import database modules
const pool = require('./config/db.js');
const initializeDatabase = require('./db/initDb.js');

// Route handlers
const userRoutes = require('./routes/users.js');
const courseRoutes = require('./routes/courses.js');
const lessonRoutes = require('./routes/lessons.js');

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000;

// __filename and __dirname are already available in CommonJS modules


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Basic auth middleware placeholder
const authMiddleware = (req, res, next) => {
  // This is a placeholder for actual authentication
  // In a real app, you would verify JWT tokens, session cookies, etc.
  
  // For development, we'll just pass through
  // You could also add mock user data to req.user for testing
  // req.user = { id: 1, role: 'admin' };
  
  next();
};

// All API routes go first to ensure they take precedence
console.log('Setting up API routes...');

// Simple test route to verify API is working
console.log('Registering test route: /api/test');
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Mount user routes
try {
  console.log('Mounting user routes at /api/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes mounted successfully');
} catch (err) {
  console.error('❌ Failed to mount user routes:', err.message);
}

// Mount course routes
try {
  console.log('Mounting course routes at /api/courses');
  app.use('/api/courses', courseRoutes);
  console.log('✅ Course routes mounted successfully');
} catch (err) {
  console.error('❌ Failed to mount course routes:', err.message);
}

// Mount lesson routes
try {
  console.log('Mounting lesson routes at /api/lessons');
  app.use('/api/lessons', lessonRoutes);
  console.log('✅ Lesson routes mounted successfully');
} catch (err) {
  console.error('❌ Failed to mount lesson routes:', err.message);
}

// Health check endpoint
console.log('Registering health check route: /api/health');
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok',
      message: 'Server is healthy',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: 'Server is not healthy',
      error: err.message 
    });
  }
});

// After all API routes, serve static files
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

// Define common React Router routes for SPA
const reactRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/profile',
  '/courses',
  '/courses/*',
  '/lessons/*',
  '/dashboard',
  '/settings',
  '/about',
  '/contact'
];

// Check if dist directory exists before serving static files
try {
  const fs = require('fs');
  if (fs.existsSync(distPath)) {
    console.log('Serving static files from:', distPath);
    
    // Serve static assets with cache control
    app.use(express.static(distPath, {
      maxAge: '1d', // Cache static assets for 1 day
      etag: true,
      lastModified: true,
    }));
    
    // Handle known client-side routes explicitly
    reactRoutes.forEach(route => {
      app.get(route, (req, res) => {
        console.log(`Serving React app for route: ${req.path}`);
        res.sendFile(indexPath);
      });
    });
    
    // Final catch-all route for any other routes not caught by API or explicit routes
    console.log('Registering catch-all route for React app');
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      try {
        if (fs.existsSync(indexPath)) {
          console.log(`Serving React app for unknown route: ${req.path}`);
          res.sendFile(indexPath);
        } else {
          next(new Error('index.html not found'));
        }
      } catch (err) {
        next(err);
      }
    });
  } else {
    console.warn('Warning: dist directory not found. Static file serving disabled.');
    console.warn('Run "npm run build" to create the dist directory.');
  }
} catch (err) {
  console.error('Error setting up static file serving:', err.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Initialize database and start the server
const startServer = async () => {
  try {
    // Check if database needs initialization
    console.log('Checking database status...');
    const dbCheck = await pool.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)', ['users']);
    
    if (!dbCheck.rows[0].exists) {
      console.log('Database tables not found. Initializing database...');
      const initResult = await initializeDatabase();
      
      if (initResult && initResult.success) {
        console.log('✅ Database initialized successfully!');
      } else {
        const errorMessage = initResult ? initResult.message : 'Unknown error';
        console.error('❌ Database initialization failed:', errorMessage);
        process.exit(1);
      }
    } else {
      console.log('Database tables already exist. Skipping initialization.');
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('='.repeat(50));
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Start the application
startServer();
// Export the app for testing purposes
module.exports = app;
