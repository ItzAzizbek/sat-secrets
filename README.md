# Secrets Of SAT

A premium marketplace for verified SAT exam leaks.

## Setup Instructions

### Backend Server

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory with your configuration:
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
ADMIN_SECRET=your-admin-secret
GOOGLE_GENERATIVE_AI_API_KEY=your-ai-api-key
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Client

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The client will run on `http://localhost:5173`

## Important Notes

- **The backend server must be running** for the frontend to work properly
- The frontend proxies API requests to `http://localhost:5000`
- Make sure both servers are running simultaneously

## Features

- Admin panel to create products (exams with dates)
- User interface to select exams and dates
- Payment verification with AI-powered screenshot analysis
- Order management system
- Blacklist functionality for fraudulent users
