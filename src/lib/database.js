const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbConfig = require('../config/database');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath || dbConfig.database;
    this.db = null;
    this.isConnected = false;
    this.logging = dbConfig.logging;
  }

  // Initialize database connection and create tables
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database:', this.dbPath);
          this.isConnected = true;
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // Create initial tables
  async createTables() {
    const schemas = [
      // Configurations table - separates user-generated from AI-generated fields
      `CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        semantic_schema TEXT NOT NULL,
        data_schema TEXT,
        ui_schema TEXT,
        js_function_impl TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Entity Rules table - stores individual rules with one-to-many relationship
      `CREATE TABLE IF NOT EXISTS entity_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        configuration_id INTEGER NOT NULL,
        rule_text TEXT NOT NULL,
        rule_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (configuration_id) REFERENCES configurations (id) ON DELETE CASCADE
      )`,

      // Keep old rules table for compatibility (can be removed later)
      `CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        configuration_id INTEGER,
        rule_text TEXT NOT NULL,
        rule_type TEXT DEFAULT 'simple',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (configuration_id) REFERENCES configurations (id) ON DELETE CASCADE
      )`,

      // Activity log table - tracks changes
      `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        configuration_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (configuration_id) REFERENCES configurations (id) ON DELETE CASCADE
      )`
    ];

    for (const schema of schemas) {
      await this.run(schema);
    }

    console.log('Database tables created/verified successfully');
  }

  // Generic query method
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database run error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Generic select method
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Generic select all method
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Configuration CRUD operations
  async createConfiguration(name, semanticSchema, dataSchema = '', uiSchema = '', jsFunctionImpl = '') {
    const sql = `INSERT INTO configurations (name, semantic_schema, data_schema, ui_schema, js_function_impl)
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await this.run(sql, [name, semanticSchema, dataSchema, uiSchema, jsFunctionImpl]);
    
    // Log activity
    await this.logActivity(result.id, 'CREATE', `Configuration "${name}" created`);
    
    return result.id;
  }

  async getConfiguration(id) {
    const sql = `SELECT * FROM configurations WHERE id = ?`;
    return await this.get(sql, [id]);
  }

  async getConfigurationByName(name) {
    const sql = `SELECT * FROM configurations WHERE name = ?`;
    return await this.get(sql, [name]);
  }

  async getAllConfigurations() {
    const sql = `SELECT id, name, semantic_schema, created_at, updated_at FROM configurations ORDER BY updated_at DESC`;
    return await this.all(sql);
  }

  async updateConfiguration(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.semanticSchema !== undefined) { fields.push('semantic_schema = ?'); values.push(updates.semanticSchema); }
    if (updates.dataSchema !== undefined) { fields.push('data_schema = ?'); values.push(updates.dataSchema); }
    if (updates.uiSchema !== undefined) { fields.push('ui_schema = ?'); values.push(updates.uiSchema); }
    if (updates.jsFunctionImpl !== undefined) { fields.push('js_function_impl = ?'); values.push(updates.jsFunctionImpl); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE configurations SET ${fields.join(', ')} WHERE id = ?`;
    const result = await this.run(sql, values);
    
    // Log activity
    await this.logActivity(id, 'UPDATE', `Configuration updated: ${Object.keys(updates).join(', ')}`);
    
    return result;
  }

  async deleteConfiguration(id) {
    const config = await this.getConfiguration(id);
    if (!config) return false;
    
    const sql = `DELETE FROM configurations WHERE id = ?`;
    await this.run(sql, [id]);
    
    // Log activity (before deletion)
    await this.logActivity(id, 'DELETE', `Configuration "${config.name}" deleted`);
    
    return true;
  }

  // Entity Rules CRUD operations
  async createEntityRule(configurationId, ruleText, ruleOrder = 0) {
    const sql = `INSERT INTO entity_rules (configuration_id, rule_text, rule_order) VALUES (?, ?, ?)`;
    const result = await this.run(sql, [configurationId, ruleText, ruleOrder]);
    
    await this.logActivity(configurationId, 'RULE_ADD', `Rule added: "${ruleText}"`);
    
    return result.id;
  }

  async getEntityRulesByConfiguration(configurationId) {
    const sql = `SELECT * FROM entity_rules WHERE configuration_id = ? AND is_active = 1 ORDER BY rule_order, created_at`;
    return await this.all(sql, [configurationId]);
  }

  async updateEntityRule(id, ruleText, ruleOrder) {
    const sql = `UPDATE entity_rules SET rule_text = ?, rule_order = ? WHERE id = ?`;
    return await this.run(sql, [ruleText, ruleOrder, id]);
  }

  async deleteEntityRule(id) {
    const sql = `DELETE FROM entity_rules WHERE id = ?`;
    return await this.run(sql, [id]);
  }

  // Legacy Rules CRUD operations (keep for compatibility)
  async createRule(configurationId, ruleText, ruleType = 'simple') {
    const sql = `INSERT INTO rules (configuration_id, rule_text, rule_type) VALUES (?, ?, ?)`;
    const result = await this.run(sql, [configurationId, ruleText, ruleType]);
    
    await this.logActivity(configurationId, 'RULE_ADD', `Rule added: "${ruleText}"`);
    
    return result.id;
  }

  async getRulesByConfiguration(configurationId) {
    const sql = `SELECT * FROM rules WHERE configuration_id = ? AND is_active = 1 ORDER BY created_at`;
    return await this.all(sql, [configurationId]);
  }

  async updateRule(id, ruleText, ruleType) {
    const sql = `UPDATE rules SET rule_text = ?, rule_type = ? WHERE id = ?`;
    return await this.run(sql, [ruleText, ruleType, id]);
  }

  async deleteRule(id) {
    const sql = `UPDATE rules SET is_active = 0 WHERE id = ?`;
    return await this.run(sql, [id]);
  }

  // Activity logging
  async logActivity(configurationId, action, details) {
    const sql = `INSERT INTO activity_log (configuration_id, action, details) VALUES (?, ?, ?)`;
    return await this.run(sql, [configurationId, action, details]);
  }

  async getActivityLog(configurationId, limit = 50) {
    const sql = `SELECT * FROM activity_log WHERE configuration_id = ? ORDER BY created_at DESC LIMIT ?`;
    return await this.all(sql, [configurationId, limit]);
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
            this.isConnected = false;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;