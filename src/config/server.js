module.exports = {
  port: process.env.PORT || 3001,
  apiKeyRequired: true,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  anthropic: {
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 3000
  }
};