const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  req.db = req.app.locals.db;
  next();
});

// Update rule
router.put('/:id', async (req, res) => {
  try {
    const { ruleText, ruleOrder } = req.body;
    
    if (!ruleText) {
      return res.status(400).json({ error: 'Rule text is required' });
    }

    await req.db.updateEntityRule(req.params.id, ruleText, ruleOrder || 0);
    res.json({ message: 'Rule updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to update rule: ' + error.message });
  }
});

// Delete rule
router.delete('/:id', async (req, res) => {
  try {
    await req.db.deleteEntityRule(req.params.id);
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to delete rule: ' + error.message });
  }
});

module.exports = router;