# AI Voice Assistant

A modern, interactive voice assistant application built with Next.js, React, and Firebase. Features professional authentication UI, real-time voice recognition, and intelligent command processing.

## ✨ Features

### 🎤 Voice Recognition
- **Multi-API Support**: Web Speech API with Gemini API fallback
- **Real-time Processing**: Live audio visualization and transcription
- **Smart Confirmation**: Low-confidence detection with user confirmation
- **Cross-browser Compatibility**: Optimized for Chrome, Safari, and other modern browsers

### 🔐 Authentication
- **Firebase Auth Integration**: Secure user authentication
- **Professional UI**: Glassmorphic design with purple-blue gradient theme
- **Multiple Sign-in Options**: Email/password and Google OAuth
- **User Profile Management**: Dropdown with account settings and logout

### 🎨 Modern Design
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Framer Motion powered transitions
- **Interactive Elements**: Hover effects, loading states, and micro-interactions
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### 📊 User History
- **Command Tracking**: Store and retrieve user interaction history
- **Statistics Dashboard**: Usage analytics and insights
- **Data Management**: Clear history and export options

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Firebase project with Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aivoiceassistant1
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
aivoiceassistant1/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   │   ├── auth-context.tsx      # Auth context provider
│   │   ├── login-form.tsx        # Login/signup form
│   │   └── login-page.tsx        # Login page layout
│   ├── ui/                       # Reusable UI components
│   ├── user-history/             # User history components
│   ├── landing-page.tsx          # Landing page
│   ├── voice-assistant.tsx       # Main voice assistant
│   └── user-profile-dropdown.tsx # User profile menu
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── firebase.ts               # Firebase configuration
│   ├── user-history.ts           # History management
│   └── utils.ts                  # Helper functions
├── public/                       # Static assets
├── scripts/                      # Python backend scripts
│   ├── ai_features.py            # AI processing
│   ├── command_processor.py      # Command handling
│   ├── main.py                   # Backend server
│   └── requirements.txt          # Python dependencies
└── styles/                       # Additional styles
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion 12.23.12
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

### Backend
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **API Processing**: Python scripts with AI features
- **Voice Processing**: Web Speech API + Gemini API

### Development
- **Package Manager**: npm/yarn/pnpm
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript 5+
- **Build Tool**: Next.js built-in bundler

## 🎯 Key Components

### Voice Assistant (`voice-assistant.tsx`)
Main application interface with voice recognition, command processing, and response handling.

### Authentication System
- **AuthContext**: Global authentication state management
- **LoginForm**: Interactive form with validation and error handling
- **LoginPage**: Professional login interface with animations

### User Interface
- **Landing Page**: Marketing page with feature highlights
- **Profile Dropdown**: User account management
- **History Panel**: Command history and statistics

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Add your domain to authorized domains
5. Copy configuration to `.env.local`

### Voice Recognition
The app automatically detects browser capabilities and falls back to appropriate APIs:
- **Primary**: Web Speech API (Chrome, Safari)
- **Fallback**: Gemini API for unsupported browsers

## 📱 Browser Support

- **Recommended**: Chrome 80+, Safari 14+
- **Supported**: Firefox 90+, Edge 80+
- **Mobile**: iOS Safari, Chrome Mobile

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npx vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔄 Version History

- **v0.1.0**: Initial release with core voice assistant features
- Authentication system with Firebase
- Professional UI with animations
- Voice recognition and command processing
- User history and profile management
