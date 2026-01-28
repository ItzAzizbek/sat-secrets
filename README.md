# 🤫 Secrets Of SAT

[![Powered by Gemini](https://img.shields.io/badge/AI-Powered%20by%20Gemini-blue?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

Secrets Of SAT is a premium, high-performance marketplace platform designed for the secure distribution of verified SAT exam materials. Featuring cutting-edge AI verification and a bold, modern interface, it provides a seamless experience for both administrators and users.

---

## 🚀 Key Features

- **🤖 AI-Powered Payment Verification:** Leverages Google Gemini 2.5 Flash to automatically analyze and verify payment screenshots for authenticity and correct amounts.
- **💬 Charismatic AI Support:** Integrated "SAT Support" AI agent to handle user queries with a professional and elite persona.
- **🔐 Admin Dashboard:** Comprehensive control center for managing products (exams), dates, pricing, and order status.
- **📱 Real-time Notifications:** Instant alerts via Telegram Bot for new orders and contact form submissions.
- **🛡 Advanced Fraud Prevention:** Robust blacklist system that tracks and blocks fraudulent users by IP and Email.
- **🎨 Brutalist Modern UI:** A bold, high-contrast design built with Tailwind CSS and Framer Motion for a premium feel.
- **☁️ Cloud-Native Media:** Seamless image handling and hosting powered by Cloudinary.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State/Auth:** Firebase Authentication & Context API
- **API Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Firebase Firestore
- **Storage:** Cloudinary
- **AI Integration:** Google Generative AI (Gemini SDK)
- **Messaging:** Node Telegram Bot API
- **File Handling:** Multer

---

## 📁 Project Structure

```text
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application views (Home, Admin, Checkout, etc.)
│   │   ├── contexts/      # Authentication and global state
│   │   └── config/        # API and Firebase configurations
├── server/                # Backend Express API
│   ├── routes/            # API endpoints (Orders, Products, Admin, Chat)
│   ├── services/          # Business logic (AI, Firebase, Telegram, Cloudinary)
│   ├── middleware/        # Security and Blacklist checks
│   └── index.js           # Server entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase Project
- Cloudinary Account
- Google Gemini API Key
- Telegram Bot Token

### 1. Server Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory (see [Environment Variables](#-environment-variables)).
```bash
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory (see [Environment Variables](#-environment-variables)).
```bash
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5001) |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Chat ID for Admin Notifications |
| `GEMINI_API_KEY` | Google AI API Key for Analysis |
| `GEMINI_CHAT_API_KEY` | (Optional) Separate Key for Chat Support |
| `ADMIN_SECRET` | Secret key for Admin access |
| `CLIENT_URL` | URL of the frontend application |

### Frontend (`client/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., http://localhost:5001) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_ADMIN_EMAILS` | Comma-separated list of admin emails |

---

## 🤖 AI Features

### Automated Payment Verification
The system uses `gemini-2.5-flash` to inspect uploaded payment screenshots. It checks for:
- Visual cues of a legitimate bank/payment receipt.
- Matching transaction amount against the expected product price.
- Confidence scoring to prevent fraud.

### Charismatic Support Chat
The AI Chat is configured with a specific system instruction to maintain an elite, brand-focused persona. It handles social pleasantries while strictly redirecting non-platform related queries back to the "Secrets Of SAT" services.

---

## 🛡 Security & Fraud Prevention

- **IP Blacklisting:** Automatic blocking of suspicious IPs detected through the admin panel.
- **Email Blacklisting:** Prevents banned users from placing new orders even if they change their IP.
- **Secure Admin Routes:** All admin operations are protected via secret keys and authenticated sessions.
- **AI Content Filtering:** Contact messages are summarized and filtered for spam or irrelevant content using AI.

---

## 📝 License
This project is licensed under the ISC License.
