"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword, resetPassword, verifyResetPasswordOtp } from '@/services/authService';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, ShieldCheck, KeyRound } from 'lucide-react';

const STEP_META = {
  request: {
    icon: Mail,
    title: 'Forgot Password',
    description: 'Enter your Gmail address to receive a 6-digit OTP.',
  },
  verify: {
    icon: ShieldCheck,
    title: 'Verify OTP',
    description: 'Enter the OTP sent to your email to continue.',
  },
  reset: {
    icon: KeyRound,
    title: 'Create New Password',
    description: 'Set your new password after OTP verification.',
  },
  success: {
    icon: ShieldCheck,
    title: 'Password Updated',
    description: 'Your password has been changed successfully.',
  },
};

const StepBadge = ({ active, done, step, label }) => (
  <div className="flex flex-col items-center text-center gap-2">
    <div
      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
        done
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-slate-300 bg-white text-slate-500'
      }`}
    >
      {step}
    </div>
    <span className={`text-xs font-medium leading-4 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
  </div>
);

const StepConnector = ({ active }) => (
  <div className="flex items-center justify-center">
    <div className={`h-[3px] w-full rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  </div>
);

const ResetPasswordPage = () => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentMeta = STEP_META[step];
  const CurrentIcon = currentMeta.icon;

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('verify');
      toast.success('OTP sent to your email');
    } catch (error) {
      logger.error('[FORGOT_PASSWORD_PAGE] Error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyResetPasswordOtp({
        identifier: email.trim(),
        otp: otp.trim(),
      });
      setStep('reset');
      toast.success('OTP verified');
    } catch (error) {
      logger.error('[VERIFY_RESET_OTP_PAGE] Error:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        identifier: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('success');
      toast.success('Password updated successfully');
    } catch (error) {
      logger.error('[RESET_PASSWORD_PAGE] Error:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[76vh] flex items-center justify-center px-4 py-10 bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.95))]">
        <div className="w-full max-w-[720px] rounded-[26px] border border-[#dbe4f0] bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <div className="mt-6 rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-0">
              <div className="min-w-0">
                <StepBadge active={step === 'request'} done={['verify', 'reset', 'success'].includes(step)} step="1" label="Send OTP" />
              </div>
              <div className="pt-5 -mx-2">
                <StepConnector active={['verify', 'reset', 'success'].includes(step)} />
              </div>
              <div className="min-w-0">
                <StepBadge active={step === 'verify'} done={['reset', 'success'].includes(step)} step="2" label="Verify OTP" />
              </div>
              <div className="pt-5 -mx-2">
                <StepConnector active={['reset', 'success'].includes(step)} />
              </div>
              <div className="min-w-0">
                <StepBadge active={step === 'reset'} done={step === 'success'} step="3" label="Update Password" />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-[#e2e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <CurrentIcon className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{currentMeta.title}</h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {currentMeta.description}
                {(step === 'verify' || step === 'reset') && (
                  <>
                    {' '}<span className="font-medium text-foreground">{email}</span>
                  </>
                )}
              </p>
            </div>

            {step === 'request' && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Gmail Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your Gmail address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">OTP <span className="text-destructive">*</span></Label>
                  <Input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-12 rounded-xl tracking-[0.35em] text-center text-lg"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    disabled={loading}
                    onClick={handleSendOtp}
                  >
                    Resend OTP
                  </Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl text-base" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 rounded-xl pr-10"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl pr-10"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Password'
                  )}
                </Button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="mb-6 text-muted-foreground">
                  Your password has been updated. You can now sign in using the new password.
                </p>
                <Button asChild className="w-full h-12 rounded-xl text-base">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
