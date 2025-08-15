const path = require('path');

const config = {
  development: {
    database: path.join(__dirname, '..', '..', 'configurator.db'),
    logging: true
  },
  production: {
    database: process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'configurator.db'),
    logging: false
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = config[environment];