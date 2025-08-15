require('dotenv').config();
const express = require('express');
const path = require('path');

const Database = require('./src/lib/database');
const serverConfig = require('./src/config/server');
const errorHandler = require('./src/middleware/errorHandler');

const apiRoutes = require('./src/routes/api');
const configurationRoutes = require('./src/routes/configurations');
const ruleRoutes = require('./src/routes/rules');

const app = express();
const PORT = serverConfig.port;
const db = new Database();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.locals.db = db;

// API Routes
app.use('/api', apiRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/rules', ruleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: db.isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await db.init();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log('📝 Make sure to set ANTHROPIC_API_KEY in your .env file');
      console.log('💾 Database initialized successfully');
      console.log('🏥 Health check available at /health');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down server...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down server...');
  await db.close();
  process.exit(0);
});

startServer();