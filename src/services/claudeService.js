require('dotenv').config();
const serverConfig = require('../config/server');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = serverConfig.anthropic.model;
    this.maxTokens = serverConfig.anthropic.maxTokens;
  }

  async modifyJson(command, jsonData) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    if (!command || !jsonData) {
      throw new Error('Command and JSON data are required');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: 'user',
              content: `You are a JSON modification assistant. Given a command and JSON data, return ONLY the modified JSON object. Do not include any explanations, markdown formatting, or additional text. Just return the raw JSON.

Command: ${command}

Current JSON:
${jsonData}

Modified JSON:`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text.trim();

      // DEBUG: Dump Claude's raw response
      console.log('=== CLAUDE RAW RESPONSE ===');
      console.log(responseText);
      console.log('=== END CLAUDE RESPONSE ===');

      // Extract JSON from Claude's response (it might include explanations)
      let modifiedJson = responseText;

      // Try to find JSON in the response if it's wrapped in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        modifiedJson = jsonMatch[0];
      }

      // Clean up common issues
      modifiedJson = modifiedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Try to parse the response to ensure it's valid JSON
      try {
        const parsed = JSON.parse(modifiedJson);
        return JSON.stringify(parsed, null, 2);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON returned from AI. Raw response: ' + responseText.substring(0, 200) + '...');
      }

    } catch (error) {
      console.error('Claude service error:', error);
      throw error;
    }
  }

  async modifySchemas(command, target, schema, uiSchema, formData, rules = [], currentFunctions = '', currentSemanticSchema = '', currentRuleSet = [], lastSemanticSchema = '', lastRuleSet = [], lastDataSchema = '{}', lastUISchema = '{}', lastJsFunctionImpl = '') {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    if (!command) {
      throw new Error('Command is required');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: 'user',
              content: `You are a React JSON Schema Form assistant. Given a command and current schemas, return the COMPLETE, FULL JSON objects with modifications applied. NEVER return partial objects - always return the complete schema/data with all existing fields preserved and only the requested changes applied.

You must ALWAYS analyze and return ALL THREE: schema, uiSchema, and formData - even if the command seems to target only one. Consider how changes affect all three schemas.

Command: ${command}

CONTEXT - You have access to both current working state and last saved state:

CURRENT USER INPUT (what caused this AI call):
- Semantic Schema: ${currentSemanticSchema || 'Not provided'}
- Rule Set: ${Array.isArray(currentRuleSet) && currentRuleSet.length > 0 ? currentRuleSet.join(', ') : 'No current rules'}

LAST SAVED STATE FROM DATABASE (for comparison):
- Last Semantic Schema: ${lastSemanticSchema || 'Not saved yet'}
- Last Rule Set: ${Array.isArray(lastRuleSet) && lastRuleSet.length > 0 ? lastRuleSet.join(', ') : 'No saved rules'}
- Last Data Schema: ${lastDataSchema}
- Last UI Schema: ${lastUISchema}
- Last JS Functions: ${lastJsFunctionImpl || 'No functions saved'}

${rules.length > 0 ? `
IMPORTANT RULES TO ENFORCE:
${rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

You MUST ensure that ALL modifications comply with these rules. If a command conflicts with a rule, prioritize the rule and modify the command accordingly. Apply these rules when creating or modifying any schema properties, UI configurations, or form data.
` : ''}

CURRENT WORKING SCHEMAS (what user is editing now):
JSON Schema:
${JSON.stringify(schema, null, 2)}

UI Schema:
${JSON.stringify(uiSchema, null, 2)}

Form Data:
${JSON.stringify(formData, null, 2)}

${currentFunctions ? `Current JavaScript Functions:
${currentFunctions}` : 'No JavaScript functions currently exist.'}

CRITICAL: Return the result as a JSON object with keys: schema, uiSchema, formData, and jsFunctions. Each returned object MUST be the complete object with ALL existing fields preserved plus your modifications.

FOR COMPLEX RULES that require dynamic behavior (like "if age > 75, remove bio field"), you MUST generate JavaScript functions in the jsFunctions field. These functions should:
1. Listen for form field changes
2. Implement the rule logic
3. Dynamically modify the form schema/data
4. Use function names like: applyRule1, applyRule2, etc.

Simple validation rules go in the JSON schema. Complex conditional rules become JavaScript functions.

${rules.length > 0 ? 'ENSURE ALL RULES ARE SATISFIED in your response. Check each rule against your modifications before returning the result.' : ''}

Return format:
{
  "schema": {complete schema with all properties},
  "uiSchema": {complete uiSchema with all properties}, 
  "formData": {complete formData with all properties},
  "jsFunctions": "// Generated JavaScript functions for complex rules\nfunction applyRule1(formData, updateForm) {\n  // Rule implementation\n}"
}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text.trim();

      // DEBUG: Dump Claude's raw response
      console.log('=== CLAUDE SCHEMAS RESPONSE ===');
      console.log(responseText);
      console.log('=== END CLAUDE RESPONSE ===');

      // Extract JSON from Claude's response
      let modifiedSchemas = responseText;

      // Try to find JSON in the response if it's wrapped in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        modifiedSchemas = jsonMatch[0];
      }

      // Clean up common issues
      modifiedSchemas = modifiedSchemas.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Try to parse the response to ensure it's valid JSON
      try {
        const parsed = JSON.parse(modifiedSchemas);
        return parsed;
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON returned from AI. Raw response: ' + responseText.substring(0, 200) + '...');
      }

    } catch (error) {
      console.error('Claude schemas service error:', error);
      throw error;
    }
  }
}

module.exports = new ClaudeService();