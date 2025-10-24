'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import RoleSelectionModal from '@/components/auth/RoleSelectionModal';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() { 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isRoleUpdateLoading, setIsRoleUpdateLoading] = useState(false);
  const { login, updateRole, user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      toast.success('Welcome back! You have been successfully logged in.');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
      toast.error('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    setIsRoleUpdateLoading(true);
    try {
      await updateRole(role);
      setShowRoleSelection(false);
      toast.success(`Role successfully set to ${role.toLowerCase()}.`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Role update error:', error);
      setError('Failed to update role. Please try again.');
      toast.error('Failed to update role. Please try again.');
    } finally {
      setIsRoleUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl transform rotate-3">
              <Heart className="h-10 w-10 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Welcome Back!
          </h1>
          <p className="text-lg text-gray-600">
            Continue your dream wedding journey
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className="pl-12 h-14 !bg-white !text-gray-900 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 !placeholder-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register('password')}
                    className="pl-12 pr-12 h-14 !bg-white !text-gray-900 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 !placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-semibold text-pink-600 hover:text-pink-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Signing you in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Google Sign-In */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleSignInButton
                onSuccess={async () => {
                  console.log('Google authentication successful');
                  toast.success('Welcome back! You have been successfully logged in with Google.');
                  try {
                    router.push('/dashboard');
                  } catch (error) {
                    console.error('Navigation failed:', error);
                  }
                }}
                onRoleSelectionNeeded={() => {
                  console.log('Role selection needed for new Google user');
                  setShowRoleSelection(true);
                }}
                onError={(error) => {
                  console.error('GoogleSignInButton error:', error);
                  setError('Google sign-in failed. Please try again.');
                }}
                disabled={isLoading}
                className="w-full h-14 !bg-white !text-gray-700 border-2 border-gray-300 hover:border-pink-300 hover:!bg-pink-50 font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                userDisplayName={user?.firstName || 'there'}
              />
            </div>
          </div>

          {/* Sign Up Section */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">New to Plannova?</span>
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6">
            <Link
              href="/auth/register"
              className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl text-lg font-semibold text-gray-700 hover:text-pink-600 hover:border-pink-300 hover:from-pink-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Create your account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-600">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="font-semibold text-pink-600 hover:text-pink-500 transition-colors">
            Terms of Service
          </Link>,{' '}
          <Link href="/privacy" className="font-semibold text-pink-600 hover:text-pink-500 transition-colors">
            Privacy Policy
          </Link>,{' '}
          <Link href="/refund-policy" className="font-semibold text-pink-600 hover:text-pink-500 transition-colors">
            Refund Policy
          </Link>, and{' '}
          <Link href="/cancellation-policy" className="font-semibold text-pink-600 hover:text-pink-500 transition-colors">
            Cancellation Policy
          </Link>
        </p>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleSelection}
        onRoleSelected={handleRoleSelection}
        onClose={() => setShowRoleSelection(false)}
        userDisplayName={user?.firstName || ''}
        isLoading={isRoleUpdateLoading}
      />
    </div>
  );
}