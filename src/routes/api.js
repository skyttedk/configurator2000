const express = require('express');
const router = express.Router();
const claudeService = require('../services/claudeService');

router.post('/modify-json', async (req, res) => {
  try {
    const { command, jsonData } = req.body;
    
    const modifiedJson = await claudeService.modifyJson(command, jsonData);
    res.json({ modifiedJson });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to modify JSON: ' + error.message });
  }
});

router.post('/modify-schemas', async (req, res) => {
  try {
    const { command, target, schema, uiSchema, formData, rules, currentFunctions } = req.body;
    
    const result = await claudeService.modifySchemas(command, target, schema, uiSchema, formData, rules, currentFunctions);
    res.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to modify schemas: ' + error.message });
  }
});

module.exports = router;