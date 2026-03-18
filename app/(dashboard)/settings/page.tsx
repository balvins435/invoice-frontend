'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Lock,
  Palette,
  Shield,
  User,
  Save,
  Loader2,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { session } from '@/lib/session';
import { useTheme } from '@/lib/theme';

type PreferenceState = {
  email_invoice_updates: boolean;
  email_weekly_summary: boolean;
  email_marketing: boolean;
};

const getErrorPayload = (error: unknown): Record<string, unknown> => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data && typeof response.data === 'object') {
      return response.data as Record<string, unknown>;
    }
  }
  return {};
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [preferences, setPreferences] = useState<PreferenceState>({
    email_invoice_updates: true,
    email_weekly_summary: true,
    email_marketing: false,
  });

  useEffect(() => {
    const boot = async () => {
      try {
        const meResponse = await apiService.auth.getCurrentUser();
        const me = meResponse.data;
        setFullName(me.full_name || '');
        setEmail(me.email || '');
        setPreferences({
          email_invoice_updates: Boolean(me.email_invoice_updates),
          email_weekly_summary: Boolean(me.email_weekly_summary),
          email_marketing: Boolean(me.email_marketing),
        });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setIsBootstrapping(false);
      }
    };

    boot();
  }, []);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const passwordStrengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength];

  const handleProfileSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error('Full name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await apiService.auth.updateProfile({ full_name: trimmed });
      const updatedUser = response.data;

      if (typeof window !== 'undefined') {
        session.setRawUser(JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      const data = getErrorPayload(error);
      const msg =
        (typeof data.detail === 'string' ? data.detail : null) ||
        (Array.isArray(data.full_name) && typeof data.full_name[0] === 'string' ? data.full_name[0] : null) ||
        'Failed to update profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill in all password fields');
      return;
    }

    try {
      setSavingPassword(true);
      await apiService.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully. Please log in again.');
      authService.clearAuth();
      window.location.replace(ROUTES.login);
    } catch (error: unknown) {
      const data = getErrorPayload(error);
      const msg =
        (typeof data.detail === 'string' ? data.detail : null) ||
        (typeof data.current_password === 'string' ? data.current_password : null) ||
        (Array.isArray(data.new_password) && typeof data.new_password[0] === 'string' ? data.new_password[0] : null) ||
        (Array.isArray(data.confirm_password) && typeof data.confirm_password[0] === 'string' ? data.confirm_password[0] : null) ||
        'Failed to change password';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const updatePreference = (key: keyof PreferenceState) => {
    const previous = preferences;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    const payload = {
      full_name: fullName.trim() || undefined,
      email_invoice_updates: next.email_invoice_updates,
      email_weekly_summary: next.email_weekly_summary,
      email_marketing: next.email_marketing,
    };
    apiService.auth.updateProfile(payload)
      .then((response) => {
        if (typeof window !== 'undefined') {
          session.setRawUser(JSON.stringify(response.data));
        }
      })
      .catch(() => {
        setPreferences(previous);
        toast.error('Failed to save notification preferences');
      });
  };

  if (isBootstrapping) {
    return (
      <>
        <Navbar title="Settings" subtitle="Manage your account, security, and preferences" />
        <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar title="Settings" subtitle="Manage your account, security, and preferences" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-5xl space-y-6">
          <Alert variant="info" title="Account Safety">
            Use a strong password and keep your email verified to protect invoice and business data.
          </Alert>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Profile
                </CardTitle>
                <CardDescription>Update your display identity used across the system.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
                <Input
                  label="Email"
                  value={email}
                  disabled
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={handleProfileSave} loading={savingProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Change your password regularly to keep your account secure.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Current Password"
                  type="password"
                  showPasswordToggle
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  showPasswordToggle
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  showPasswordToggle
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Password strength</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{passwordStrengthLabel}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button onClick={handlePasswordSave} loading={savingPassword}>
                  {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance & Notifications
                </CardTitle>
                <CardDescription>Personalize your experience and communication preferences.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Theme</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Choose your preferred interface mode.</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>Light</Button>
                    <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>Dark</Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Preferences
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    {[
                      ['email_invoice_updates', 'Invoice status updates'],
                      ['email_weekly_summary', 'Weekly financial summary'],
                      ['email_marketing', 'Product announcements'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between gap-3">
                        <span className="text-gray-700 dark:text-slate-300">{label}</span>
                        <button
                          type="button"
                          onClick={() => updatePreference(key as keyof PreferenceState)}
                          className={`h-6 w-11 rounded-full p-1 transition ${preferences[key as keyof PreferenceState] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                        >
                          <span
                            className={`block h-4 w-4 rounded-full bg-white transition ${preferences[key as keyof PreferenceState] ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
