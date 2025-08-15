const express = require('express');
const router = express.Router();

router.use('/configurations', (req, res, next) => {
  req.db = req.app.locals.db;
  next();
});

// Get all configurations
router.get('/', async (req, res) => {
  try {
    const configurations = await req.db.getAllConfigurations();
    res.json(configurations);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch configurations: ' + error.message });
  }
});

// Get specific configuration
router.get('/:id', async (req, res) => {
  try {
    const configuration = await req.db.getConfiguration(req.params.id);
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(configuration);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration: ' + error.message });
  }
});

// Create new configuration
router.post('/', async (req, res) => {
  try {
    const { name, semanticSchema, dataSchema, uiSchema, jsFunctionImpl } = req.body;
    
    if (!name || !semanticSchema) {
      return res.status(400).json({ error: 'Name and semanticSchema are required' });
    }

    const id = await req.db.createConfiguration(
      name,
      semanticSchema,
      dataSchema || '',
      uiSchema || '',
      jsFunctionImpl || ''
    );

    res.json({ id, message: 'Configuration created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Configuration name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create configuration: ' + error.message });
    }
  }
});

// Update configuration
router.put('/:id', async (req, res) => {
  try {
    const { name, semanticSchema, dataSchema, uiSchema, jsFunctionImpl } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (semanticSchema !== undefined) updates.semanticSchema = semanticSchema;
    if (dataSchema !== undefined) updates.dataSchema = dataSchema;
    if (uiSchema !== undefined) updates.uiSchema = uiSchema;
    if (jsFunctionImpl !== undefined) updates.jsFunctionImpl = jsFunctionImpl;

    await req.db.updateConfiguration(req.params.id, updates);
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to update configuration: ' + error.message });
  }
});

// Delete configuration
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await req.db.deleteConfiguration(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to delete configuration: ' + error.message });
  }
});

// Get activity log for configuration
router.get('/:id/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activity = await req.db.getActivityLog(req.params.id, limit);
    res.json(activity);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log: ' + error.message });
  }
});

// Get rules for configuration
router.get('/:id/rules', async (req, res) => {
  try {
    const rules = await req.db.getEntityRulesByConfiguration(req.params.id);
    res.json(rules);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch rules: ' + error.message });
  }
});

// Create new rule
router.post('/:id/rules', async (req, res) => {
  try {
    const { ruleText, ruleOrder } = req.body;
    
    if (!ruleText) {
      return res.status(400).json({ error: 'Rule text is required' });
    }

    const ruleId = await req.db.createEntityRule(
      req.params.id,
      ruleText,
      ruleOrder || 0
    );

    res.json({ id: ruleId, message: 'Rule created successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to create rule: ' + error.message });
  }
});

module.exports = router;