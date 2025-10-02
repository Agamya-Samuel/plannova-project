# Firebase Integration Setup

This document describes how Firebase is integrated with the Plannova project.

## 🔥 Firebase Configuration

### Client-Side Setup (Next.js)

**Environment Variables** (`.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDNH8OAKgZ7sNW2M72pA686JK8jgpU9KfE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="plannova-aa46c.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="plannova-aa46c"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="plannova-aa46c.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="111994000325"
NEXT_PUBLIC_FIREBASE_APP_ID="1:111994000325:web:21407591fb2494645f31ac"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-QREHY1HY01"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

**Configuration File**: `src/lib/firebase.ts`
- Initializes Firebase app
- Provides auth, firestore, storage, and analytics instances
- Handles SSR compatibility

**Auth Utilities**: `src/lib/firebase-auth.ts`
- Sign up/sign in functions
- Auth state management
- Token handling for API calls

### Server-Side Setup (Express.js)

**Environment Variables** (`.env`):
```env
FIREBASE_PROJECT_ID="plannova-aa46c"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@plannova-aa46c.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="[PRIVATE_KEY_HERE]"
```

**Configuration File**: `src/firebase-admin.ts`
- Initializes Firebase Admin SDK
- Provides admin auth, firestore, and storage instances
- Handles service account authentication

**Service Account**: `serviceAccountKey.json`
- Alternative credential method for production
- Should be added to `.gitignore` for security

## 🚀 Usage Examples

### Client-Side Authentication

```typescript
import { signIn, signUp, signInWithGoogle, getCurrentUser } from '@/lib/firebase-auth';
import { useAuth } from '@/contexts/AuthContext';

// Email/Password Authentication
const user = await signUp('user@example.com', 'password123', 'John Doe');
const user = await signIn('user@example.com', 'password123');

// Google Sign-In
const result = await signInWithGoogle();
const user = result.user;

// Using Auth Context
const { googleSignIn, logout, user } = useAuth();

// Google Sign-In with context
const handleGoogleSignIn = async () => {
  try {
    await googleSignIn();
    console.log('Signed in successfully:', user);
  } catch (error) {
    console.error('Sign-in failed:', error);
  }
};

// Get current user
const currentUser = getCurrentUser();

// Get ID token for API calls
const token = await getIdToken();
```

### Google Sign-In Button Component

```tsx
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { googleSignIn } = useAuth();

  const handleGoogleSuccess = (user: any) => {
    console.log('Google sign-in successful:', user);
  };

  const handleGoogleError = (error: any) => {
    console.error('Google sign-in failed:', error);
  };

  return (
    <div>
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
      {/* Or use the auth context method */}
      <button onClick={googleSignIn}>
        Sign in with Google
      </button>
    </div>
  );
};
```

### Server-Side Operations

```typescript
import { adminAuth, adminDb } from './src/firebase-admin.js';

// Verify ID token (supports both email/password and Google Sign-In)
const decodedToken = await adminAuth.verifyIdToken(idToken);

// Create user with custom claims
await adminAuth.setCustomUserClaims(uid, { role: 'CUSTOMER' });

// Firestore operations
await adminDb.collection('users').doc(uid).set(userData);
```

### Google Sign-In API Endpoint

```typescript
// POST /api/auth/google
{
  "idToken": "firebase_id_token_from_client"
}

// Response
{
  "message": "Google sign-in successful",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "photoURL": "https://lh3.googleusercontent.com/...",
    "provider": "google.com",
    "isVerified": true
  },
  "token": "firebase_id_token"
}
```

## 🔐 Security Features

### Authentication Methods
- **Email/Password**: Traditional authentication
- **Google Sign-In**: OAuth2 with Google
- **Hybrid Support**: Users can use either method

### Authentication Roles
- **CUSTOMER**: Regular users who book services
- **PROVIDER**: Service providers who offer venues/services  
- **ADMIN**: System administrators

### Protected Routes
- Client-side route protection with `ProtectedRoute` component
- Server-side middleware validates JWT tokens
- Role-based access control on both ends

### Security Rules
Firestore security rules should be configured to:
- Allow users to read/write their own data
- Restrict admin operations to admin users
- Validate data structure and types

## 📦 Dependencies

### Client Dependencies
```json
{
  "firebase": "^12.3.0"
}
```

### Server Dependencies  
```json
{
  "firebase-admin": "^12.0.0"
}
```

## 🔧 Environment Setup

1. **Development**: Uses `.env.local` and `.env` files
2. **Production**: Should use Firebase service account JSON file
3. **Security**: All credential files are excluded from version control

## ✅ Integration Status

- ✅ Firebase Admin SDK configured
- ✅ Client-side Firebase configured  
- ✅ Environment variables set
- ✅ Service account credentials loaded
- ✅ Email/Password authentication
- ✅ Google Sign-In authentication
- ✅ Authentication utilities created
- ✅ Google Sign-In button component
- ✅ Enhanced AuthContext with Google support
- ✅ Hybrid authentication middleware
- ✅ Security configurations in place
- ✅ MongoDB + Firebase hybrid setup working

## 🚨 Important Notes

1. **Hybrid Database Setup**: This project uses MongoDB for primary data storage and Firebase for authentication and real-time features
2. **Service Account Security**: Never commit service account keys to version control
3. **Environment Variables**: Use appropriate environment files for different deployment stages
4. **CORS Configuration**: Ensure Firebase domain is allowed in server CORS settings