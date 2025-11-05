# ranbo-play

A modern web-based development environment for creating and testing MVU (MagVarUpdate) variable systems with integrated AI chat capabilities, Monaco editor, and live preview sandbox.

## ✨ Features

- **Monaco Editor Integration** - Full-featured code editor with syntax highlighting for JavaScript, YAML, JSON, and more
- **AI Chat Interface** - Built-in chat interface for testing variable-driven conversations with OpenAI-compatible APIs
- **Code Generator** - MVU template generation with variable management and prompt assembly
- **Preview Sandbox** - Live preview of status bars and UI components generated from your templates
- **Responsive Layout** - Mobile-friendly design that works across all devices
- **Theme Toggle** - Dark/light mode support with smooth transitions
- **Local Storage** - Persistent configuration and chat history with base64-encoded secret storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/ranbo12138/ranbo-play.git
cd ranbo-play

# Navigate to the frontend application
cd mvu-generator

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Configuration

### Local API Settings

The application stores API configuration in localStorage with base64 encoding for security:

```javascript
// Storage keys (all prefixed with 'mvuChat:')
const API_SETTINGS_KEY = 'mvuChat:apiSettings'
const CHAT_HISTORY_KEY = 'mvuChat:chatHistory'  
const VARIABLE_SUMMARY_KEY = 'mvuChat:variableSummary'
```

#### Default Settings

```javascript
{
  providerType: 'openai',           // 'openai', 'azure', 'openrouter'
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-3.5-turbo',
  headers: {},
  apiKey: ''                        // Base64-encoded when stored
}
```

#### Supported Providers

- **OpenAI**: Standard OpenAI API
- **Azure**: Azure OpenAI with `api-key` header
- **OpenRouter**: Includes automatic referer and title headers

### Theme Configuration

Theme preference is automatically saved to localStorage and persists across sessions.

## 📖 Usage Guide

### Variables YAML Workflow

1. **Define Variables**: Use YAML format in the Variable Editor panel
2. **Configure Context**: Select which MVU context to include (stat_data, lorebook, memory)
3. **Generate Code**: Use the AI chat to generate MVU templates and status bars
4. **Preview Results**: See live preview in the Preview Panel
5. **Export**: Copy generated code for use in TavernAI or other platforms

### Code Generation

The application supports generating:

- MVU variable structures in YAML/TOML/JSON5
- Status bar templates with theme integration
- Prompt templates with variable insertion
- Update rules and format definitions

### Preview Sandbox

Test your generated templates in real-time with:

- Live status bar rendering
- Theme switching (Tailwind CSS integration)
- Variable value injection
- Responsive layout testing

### Templates

Built-in templates include:

- Status bar configurations
- Variable update formats
- Chat prompt structures
- Export-ready code snippets

## 🐳 Docker

### Build Image

```bash
# Build the Docker image
docker build -t ranbo-play .

# Or build with specific tag
docker build -t ranbo-play:v1.0.0 .
```

### Run Container

```bash
# Run on port 3000
docker run -p 3000:80 ranbo-play

# Run with environment variables
docker run -p 3000:80 \
  -e NODE_ENV=production \
  ranbo-play
```

### Container Images

Once CI is configured, images will be available at:

- `ghcr.io/ranbo12138/ranbo-play:latest` (latest stable)
- `ghcr.io/ranbo12138/ranbo-play:pr-{number}` (PR-specific builds)

Pull PR images for testing:
```bash
docker pull ghcr.io/ranbo12138/ranbo-play:pr-123
docker run -p 3000:80 ghcr.io/ranbo12138/ranbo-play:pr-123
```

## 🔄 CI/CD

### GitHub Actions Workflow

The project includes automated workflows for:

- **Triggers**: Push to main, pull requests, releases
- **Build**: Multi-stage Docker builds with caching
- **Tags**: Automatic image tagging based on git refs
- **Security**: Automated vulnerability scanning

### Workflow Features

- Multi-platform builds (linux/amd64, linux/arm64)
- Layer caching for faster builds
- Automatic image promotion on release
- PR-specific image tags for testing

## 🛠️ Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code (if configured)
```

### Code Style

- Uses ESLint for code linting
- Follows React hooks best practices
- Component-based architecture with clear separation of concerns

## 🔧 Troubleshooting

### Monaco Editor Issues

**Problem**: Monaco workers not loading
```bash
# Clear Vite cache
rm -rf .vite
npm run dev
```

**Problem**: Syntax highlighting not working
- Ensure language workers are properly configured in `vite.config.js`
- Check console for worker loading errors

### CORS Issues with Custom API

**Problem**: CORS errors when using custom API endpoints

**Solution**: Configure your API server to allow requests from your domain:
```javascript
// Example API server configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  credentials: true
}));
```

### Iframe Sandbox Errors

**Problem**: Preview sandbox not loading content

**Solutions**:
1. Check browser console for security violations
2. Ensure content uses HTTPS when served from HTTPS
3. Verify iframe sandbox permissions allow required features
4. Some features may require `allow-same-origin` in sandbox attributes

### Local Storage Issues

**Reset Application Data**:
```javascript
// Clear all mvuChat data
Object.keys(localStorage)
  .filter(key => key.startsWith('mvuChat:'))
  .forEach(key => localStorage.removeItem(key));
```

**Common Storage Keys**:
- `mvuChat:apiSettings` - API configuration
- `mvuChat:chatHistory` - Chat messages
- `mvuChat:variableSummary` - Variable definitions

### Performance Issues

**Large Chat History**:
- Chat history is stored in localStorage and can grow large
- Consider implementing history cleanup or pagination
- Maximum localStorage size is typically 5-10MB

**Monaco Editor Performance**:
- Large files may impact editor performance
- Consider enabling minimap for better navigation
- Use worker threads for syntax-intensive operations

## 📚 Additional Documentation

- [Architecture Overview](docs/architecture.md) - Code structure and data flow
- [Deployment Guide](docs/deployment.md) - Production deployment details
- [MVU Framework Tutorial](docs/MVU框架的角色卡制作教程.md) - Complete MVU usage guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🔗 Related Projects

- [MagVarUpdate](https://github.com/MagicalAstrogy/MagVarUpdate) - MVU framework for variable management
- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - AI chat interface platform
- [TavernAI](https://github.com/TavernAI/TavernAI) - AI chat interface

---

Built with ❤️ using React, Vite, Monaco Editor, and Tailwind CSS.