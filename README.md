# Kuuza AI Frontend

A modern React frontend for the Kuuza AI platform, built with Vite and Tailwind CSS.

## Features

- **Modern React**: Built with React 18 and functional components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Router**: Client-side routing for single-page application
- **Auth0 Integration**: Seamless authentication with Auth0
- **Responsive Design**: Mobile-first responsive design
- **Error Handling**: Comprehensive error boundaries and loading states
- **API Integration**: Clean API layer for backend communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Backend Integration

The frontend is configured to work with the FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before testing authentication features.

## Project Structure

```
src/
├── components/          # React components
│   ├── LandingPage.jsx     # Home page
│   ├── CompanyRegistration.jsx  # Company signup
│   ├── Login.jsx           # Authentication
│   ├── Dashboard.jsx       # User dashboard
│   ├── AuthCallback.jsx    # Auth0 callback handler
│   ├── ErrorBoundary.jsx   # Error handling
│   └── LoadingSpinner.jsx  # Loading components
├── hooks/               # Custom React hooks
│   └── useAuth.js          # Authentication hook
├── utils/               # Utility functions
│   └── api.js              # API client
├── App.jsx              # Main app component
├── main.jsx             # App entry point
└── index.css            # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints Used

- `POST /api/v1/company/register` - Company registration
- `GET /api/v1/auth/login` - Redirect to Auth0 login
- `GET /api/v1/auth/signup` - Redirect to Auth0 signup
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/invite` - Invite users (admin only)
- `GET /api/v1/auth/logout` - Logout

## Styling

The project uses Tailwind CSS with custom components and animations. Key design elements:

- **Primary Color**: Blue (`primary-600`)
- **Secondary Color**: Gray (`secondary-500`)
- **Typography**: Inter font family
- **Components**: Custom button, input, and card styles
- **Animations**: Fade-in, slide-up, and scale effects
