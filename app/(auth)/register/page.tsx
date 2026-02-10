'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
    },
  });

  const password = watch('password');
  const passwordConfirm = watch('password_confirm');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      const result = await authService.register(
        data.email,
        data.password,
        data.first_name,
        data.last_name
      );
      
      if (result.success) {
        toast.success('Account created successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: 'gray' };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    const strength = [
      { text: 'Very Weak', color: 'danger' },
      { text: 'Weak', color: 'danger' },
      { text: 'Fair', color: 'warning' },
      { text: 'Good', color: 'primary' },
      { text: 'Strong', color: 'success' },
      { text: 'Very Strong', color: 'success' },
    ];
    
    return { score, ...strength[Math.min(score, 5)] };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-lg bg-primary-600 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                error={errors.first_name?.message}
                leftIcon={<User className="h-5 w-5" />}
                placeholder="John"
                {...register('first_name')}
              />

              <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                error={errors.last_name?.message}
                leftIcon={<User className="h-5 w-5" />}
                placeholder="Doe"
                {...register('last_name')}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              placeholder="you@example.com"
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                leftIcon={<Lock className="h-5 w-5" />}
                placeholder="Enter your password"
                showPasswordToggle
                {...register('password')}
              />
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'danger' ? 'text-danger-600' :
                      passwordStrength.color === 'warning' ? 'text-warning-600' :
                      passwordStrength.color === 'primary' ? 'text-primary-600' :
                      'text-success-600'
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength.color === 'danger' ? 'bg-danger-500' :
                        passwordStrength.color === 'warning' ? 'bg-warning-500' :
                        passwordStrength.color === 'primary' ? 'bg-primary-500' :
                        'bg-success-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                  <li className={password?.length >= 8 ? 'text-success-600' : ''}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password || '') ? 'text-success-600' : ''}>
                    One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password || '') ? 'text-success-600' : ''}>
                    One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password || '') ? 'text-success-600' : ''}>
                    One number
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                error={errors.password_confirm?.message}
                leftIcon={<Lock className="h-5 w-5" />}
                placeholder="Confirm your password"
                showPasswordToggle
                {...register('password_confirm')}
              />
              
              {passwordConfirm && password && (
                <div className="mt-2">
                  {password === passwordConfirm ? (
                    <p className="text-xs text-success-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-xs text-danger-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full">
                Google
              </Button>
              <Button variant="secondary" className="w-full">
                Microsoft
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}