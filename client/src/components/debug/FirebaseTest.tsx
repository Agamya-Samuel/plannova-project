'use client';

import React from 'react';
import { auth } from '@/lib/firebase';

export const FirebaseTest: React.FC = () => {
  const checkFirebaseConfig = () => {
    console.log('Firebase Auth instance:', auth);
    console.log('Firebase config check:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
  };

  const testGoogleProvider = async () => {
    try {
      const { GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      console.log('Google Provider created successfully:', provider);
    } catch (error) {
      console.error('Failed to create Google Provider:', error);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Firebase Debug Panel</h3>
      <div className="space-y-2">
        <button
          onClick={checkFirebaseConfig}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Firebase Config
        </button>
        <button
          onClick={testGoogleProvider}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Google Provider
        </button>
      </div>
    </div>
  );
};