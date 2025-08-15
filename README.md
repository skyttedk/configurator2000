# Configurator 2000

A dynamic JSON Schema Form configuration tool with AI assistance for creating and managing complex form schemas using React JSON Schema Form.

## Features

- **Dynamic Form Generation**: Create forms from JSON schemas with UI schema customization
- **AI-Powered Schema Modification**: Use Claude AI to modify schemas with natural language commands
- **Rule-Based Validation**: Define complex validation rules and business logic
- **Persistent Configuration**: Save and manage multiple form configurations
- **Activity Logging**: Track changes and modifications over time

## Architecture

### Project Structure
```
configurator2000/
├── src/
│   ├── config/           # Configuration files
│   ├── lib/              # Core libraries (Database)
│   ├── services/         # External services (Claude AI)
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Express middleware
├── public/               # Static frontend assets
├── package.json
├── server.js            # Main application entry point
└── README.md
```

### Core Components

1. **Database Layer** (`src/lib/database.js`)
   - SQLite database with configuration and rules management
   - Activity logging for audit trails

2. **AI Service** (`src/services/claudeService.js`)
   - Integration with Anthropic's Claude API
   - Schema modification and generation

3. **API Routes** (`src/routes/`)
   - RESTful endpoints for configurations and rules
   - AI integration endpoints

## Development

### Prerequisites
- Node.js >= 16.0.0
- Anthropic API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

The server will start at `http://localhost:3001` by default.

### API Endpoints

#### Configurations
- `GET /api/configurations` - List all configurations
- `GET /api/configurations/:id` - Get specific configuration
- `POST /api/configurations` - Create new configuration
- `PUT /api/configurations/:id` - Update configuration
- `DELETE /api/configurations/:id` - Delete configuration

#### Rules
- `GET /api/configurations/:id/rules` - Get rules for configuration
- `POST /api/configurations/:id/rules` - Create rule for configuration
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

#### AI Services
- `POST /api/modify-json` - Modify JSON with AI commands
- `POST /api/modify-schemas` - Modify schemas with AI commands

#### Health Check
- `GET /health` - Server health status

## Usage

The system works with three main schema types:

1. **Semantic Schema**: Human-readable description of the form structure
2. **JSON Schema**: Technical schema for form validation
3. **UI Schema**: React JSON Schema Form UI customization

### Example Workflow

1. Create a new configuration with semantic schema
2. Use AI commands to generate JSON and UI schemas
3. Add validation rules
4. Test and refine the form
5. Save the final configuration

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `DATABASE_PATH` | SQLite database path | ./configurator.db |

## Contributing

1. Follow the existing code structure
2. Use meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

MIT
