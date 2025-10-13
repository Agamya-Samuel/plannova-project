# Plannova Wedding Planning Platform

A modern wedding planning application built with Next.js, Express.js, MongoDB, and Firebase authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd plannova-project
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```
   This will automatically install dependencies for both client and server.

3. **Setup environment variables**
   
   **Client** (`client/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   ```
   
   **Server** (`server/.env`):
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY=your_private_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

## 🔧 Development Commands

### Start Development (Recommended)
```bash
npm run dev
```
This starts both client and server concurrently with colored output:
- **Backend**: http://localhost:3000 (yellow logs)
- **Frontend**: http://localhost:3003 (cyan logs)

### Individual Services
```bash
# Start only server
npm run server

# Start only client  
npm run client
```

### Installation Commands
```bash
# Install all dependencies (client + server)
npm install

# Install client dependencies only
npm run install:client

# Install server dependencies only
npm run install:server
```

### Build Commands
```bash
# Build client for production
npm run build

# Build client only
npm run build:client

# Build server only
npm run build:server
```

## 🏗️ Project Structure

```
plannova-project/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities & configs
│   │   ├── types/          # TypeScript types
│   │   └── app/            # Next.js app router pages
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express.js backend
│   ├── src/                # Source files
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   └── package.json
├── package.json            # Root package.json for scripts
└── README.md
```

## 🔥 Firebase Integration

This project uses Firebase for:
- **Authentication**: Email/password + Google Sign-In
- **Real-time features**: Firestore for live updates
- **File storage**: Firebase Storage for images

See `FIREBASE_SETUP.md` for detailed Firebase configuration.

## 🗄️ Database

- **Primary Database**: MongoDB Atlas
- **Authentication**: Firebase Auth
- **Hybrid Setup**: MongoDB for data, Firebase for auth & real-time

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI
- **State Management**: React Context
- **Authentication**: Firebase Auth

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK
- **Security**: Helmet, CORS, Rate Limiting

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Deploy frontend** (Vercel recommended)

4. **Deploy backend** (Railway, Heroku, or VPS)

## 🛠️ Development Tips

- Use `npm run dev` for the best development experience
- Frontend runs on port 3003, backend on port 3000
- All API calls go to `http://localhost:3000/api`
- Hot reload is enabled for both frontend and backend
- Check browser console for debugging information

### Password Reset Feature

The application includes a password reset feature that allows users to reset their passwords via email. To use this feature:

1. Users can navigate to the "Forgot Password" page from the login screen
2. They enter their email address to receive a password reset link
3. An email is sent with a secure token link
4. Clicking the link takes them to the password reset page
5. Users enter a new password to complete the reset process

To configure the email service for password reset:
1. Set up the email configuration in `server/.env`:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
2. For Gmail, you'll need to use an App Password instead of your regular password

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client & server with live reload |
| `npm run server` | Start only the Express.js server |
| `npm run client` | Start only the Next.js client |
| `npm install` | Install dependencies for both projects |
| `npm run build` | Build client for production |

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 3002 are in use, the apps will try to use alternative ports
2. **MongoDB connection**: Ensure your MongoDB URI is correct and IP is whitelisted
3. **Firebase auth**: Check that all Firebase environment variables are set correctly
4. **CORS errors**: Ensure the server CORS settings include your frontend URL

### Getting Help

1. Check the console logs (both browser and terminal)
2. Verify all environment variables are set
3. Ensure all dependencies are installed with `npm install`
4. Check that both servers are running on the correct ports

## 📄 License

[Your License Here]
