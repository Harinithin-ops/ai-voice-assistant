# AI Voice Assistant - Technical Documentation

## 🏗️ Architecture Overview

This AI Voice Assistant is a full-stack application combining a modern React frontend with a Python FastAPI backend, featuring real-time voice recognition, intelligent command processing, and professional authentication.

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)      │◄──►│   (Gemini AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Firebase      │    │   SQLite DB      │    │   Web Scraping  │
│   (Auth/DB)     │    │   (AI Features)  │    │   (Selenium)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Frontend Technology Stack

### Core Framework
- **Next.js 15.2.4**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5+**: Type-safe development
- **Node.js 18+**: Runtime environment

### UI & Styling
- **Tailwind CSS 4.1.9**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
  - `@radix-ui/react-dialog`: Modal dialogs
  - `@radix-ui/react-dropdown-menu`: Dropdown menus
  - `@radix-ui/react-avatar`: User avatars
  - `@radix-ui/react-tabs`: Tab navigation
  - `@radix-ui/react-toast`: Notifications
  - `@radix-ui/react-progress`: Progress bars
  - `@radix-ui/react-slider`: Range inputs
- **Framer Motion 12.23.12**: Advanced animations
- **Lucide React 0.454.0**: Modern icon library
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility

### Forms & Validation
- **React Hook Form**: Performant form handling
- **@hookform/resolvers**: Form validation resolvers
- **Zod 3.25.67**: TypeScript-first schema validation
- **input-otp**: OTP input components

### Authentication & Database
- **Firebase 12.1.0**: Backend-as-a-Service
  - Firebase Auth: User authentication
  - Firestore: NoSQL database
  - Firebase Storage: File storage
- **Custom Auth Context**: React context for auth state

### Voice Recognition
- **Web Speech API**: Native browser speech recognition
- **MediaRecorder API**: Audio recording fallback
- **Custom Speech Manager**: Multi-API voice processing

### Data Visualization
- **Recharts**: Chart and graph components
- **date-fns 4.1.0**: Date manipulation utilities
- **Canvas API**: Custom voice visualizations

### Development Tools
- **ESLint**: Code linting with Next.js config
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## 🐍 Backend Technology Stack

### Core Framework
- **FastAPI 0.104.1**: Modern Python web framework
- **Uvicorn 0.24.0**: ASGI server with WebSocket support
- **Python 3.9+**: Programming language
- **Pydantic 2.5.0**: Data validation and serialization

### AI & Machine Learning
- **Google Generative AI 0.3.2**: Gemini AI integration
- **NumPy**: Numerical computing
- **SQLite3**: Lightweight database for AI features
- **Custom AI Features Manager**: Conversation memory and user preferences

### Web Automation & Scraping
- **Selenium 4.15.2**: Browser automation
- **Playwright 1.40.0**: Modern browser automation
- **BeautifulSoup4 4.12.2**: HTML parsing
- **Requests 2.31.0**: HTTP client library
- **PyAutoGUI 0.9.54**: GUI automation

### API & Communication
- **WebSockets 12.0**: Real-time communication
- **CORS Middleware**: Cross-origin resource sharing
- **python-multipart 0.0.6**: File upload handling
- **aiofiles 23.2.1**: Async file operations

### Environment & Configuration
- **python-dotenv 1.0.0**: Environment variable management
- **OS Integration**: Cross-platform system commands

## 🔧 Key Components & Features

### Frontend Components

#### Authentication System
```typescript
// Auth Context Provider
- useAuth(): Authentication state management
- Firebase Auth integration
- User session persistence
- Google OAuth support
```

#### Voice Recognition Manager
```typescript
// Multi-API Speech Recognition
- Web Speech API (primary)
- Gemini API (fallback)
- Confidence-based confirmation
- Real-time audio visualization
- Cross-browser compatibility
```

#### UI Components
```typescript
// Professional Interface
- Glassmorphic design system
- Purple-blue gradient theme
- Framer Motion animations
- Responsive layouts
- Accessibility features
```

### Backend Services

#### Command Processor
```python
# Advanced Command Processing
class AdvancedCommandProcessor:
    - Natural language understanding
    - Intent recognition
    - Context-aware responses
    - System command execution
```

#### AI Features Manager
```python
# Intelligent Features
class AIFeaturesManager:
    - Conversation memory
    - User preference learning
    - Sentiment analysis
    - Topic extraction
    - Personalized responses
```

#### Web Scraper
```python
# Advanced Web Scraping
class AdvancedWebScraper:
    - Multi-engine support (Selenium, Playwright)
    - Content extraction
    - PDF processing
    - Dynamic content handling
```

## 🗄️ Database Architecture

### Firebase Firestore
```javascript
// User Data Structure
users/{userId} {
  email: string
  displayName: string
  photoURL: string
  createdAt: timestamp
  lastLoginAt: timestamp
}

// User History
userHistory/{userId}/commands/{commandId} {
  command: string
  response: string
  timestamp: timestamp
  confidence: number
  method: string
}
```

### SQLite (AI Features)
```sql
-- Conversation Memory
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    timestamp DATETIME,
    command TEXT,
    response TEXT,
    context JSON,
    sentiment REAL,
    topics JSON
);

-- User Preferences
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    preference_type TEXT,
    value JSON,
    confidence REAL,
    last_updated DATETIME
);
```

## 🌐 API Architecture

### Frontend API Routes
```typescript
// Next.js API Routes
/api/speech-to-text     // Voice transcription
/api/process-command    // Command processing
/api/extract-pdf-questions // PDF analysis
```

### Backend FastAPI Endpoints
```python
# Main API Endpoints
POST /process-command   # Process voice commands
POST /speech-to-text    # Convert speech to text
GET  /user-history     # Retrieve user history
POST /web-search       # Perform web searches
POST /extract-pdf      # Extract PDF content
```

## 🔐 Security & Authentication

### Frontend Security
- Firebase Auth tokens
- Secure HTTP-only cookies
- CSRF protection
- Input validation with Zod
- XSS prevention

### Backend Security
- CORS configuration
- API key management
- Environment variable protection
- Request validation
- Rate limiting

## 🚀 Performance Optimizations

### Frontend Optimizations
- Next.js App Router for optimal loading
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Framer Motion performance mode
- Memoized components and hooks

### Backend Optimizations
- Async/await patterns
- Connection pooling
- Caching strategies
- Efficient database queries
- WebSocket for real-time features

## 🔄 Development Workflow

### Frontend Development
```bash
# Development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build for production
npm run build
```

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run with specific host/port
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📦 Build & Deployment

### Frontend Deployment
- **Vercel**: Optimized for Next.js
- **Netlify**: Static site deployment
- **Docker**: Containerized deployment

### Backend Deployment
- **Railway**: Python app hosting
- **Heroku**: Cloud platform
- **Docker**: Container deployment
- **AWS Lambda**: Serverless deployment

## 🧪 Testing Strategy

### Frontend Testing
- Jest for unit testing
- React Testing Library
- Cypress for E2E testing
- TypeScript type checking

### Backend Testing
- pytest for Python testing
- FastAPI test client
- Mock external services
- API endpoint testing

## 📊 Monitoring & Analytics

### Performance Monitoring
- Next.js built-in analytics
- Web Vitals tracking
- Error boundary implementation
- User interaction tracking

### Backend Monitoring
- FastAPI metrics
- Database query performance
- API response times
- Error logging and tracking

## 🔮 Future Enhancements

### Planned Features
- Multi-language support
- Advanced AI conversation
- Voice cloning capabilities
- Mobile app development
- Offline functionality
- Advanced analytics dashboard

### Technology Upgrades
- React Server Components
- Edge runtime deployment
- Advanced AI models
- Real-time collaboration
- Enhanced security features
