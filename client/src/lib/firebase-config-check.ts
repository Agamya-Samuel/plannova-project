// Firebase configuration validation
export const checkFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missing = Object.entries(config).filter(([, value]) => !value);
  
  if (missing.length > 0) {
    console.error('Missing Firebase config:', missing.map(([key]) => key));
    return false;
  }

  console.log('✅ All Firebase environment variables are set');
  return true;
};

export const validateFirebaseConfig = () => {
  if (!checkFirebaseConfig()) {
    throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
  }
};