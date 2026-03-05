"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { RegisterLoadingCard } from '@/components/register/RegisterLoadingCard';
import { RegisterForm } from '@/components/register/RegisterForm';
import { sanitizeIndianPhone } from '@/utils/phoneValidation';
import { logger } from '@/utils/logger';
import { validateEmailField, validateNameField, validatePhoneField } from '@/utils/formValidation';

const RegisterPage = () => {
  const { register, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    customerType: 'retail',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const nextValue =
      id === 'phone'
        ? sanitizeIndianPhone(value)
        : value;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : nextValue,
    }));
    // Clear error when user types
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleRadioChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      customerType: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const firstNameError = validateNameField(formData.firstName, 'First name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateNameField(formData.lastName, 'Last name');
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailError = validateEmailField(formData.email, true);
    if (emailError) newErrors.email = emailError;

    const cleanPhone = sanitizeIndianPhone(formData.phone);
    const phoneError = validatePhoneField(cleanPhone, true);
    if (phoneError) newErrors.phone = phoneError;

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to terms and conditions');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;


    setLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: sanitizeIndianPhone(formData.phone),
        password: formData.password,
        customerType: formData.customerType,
      });

      toast.success('Account created successfully');
      // BYPASS OTP: Redirect directly to login
      router.push('/login');
    } catch (error) {
      logger.error('[REGISTER] Error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse; // This is the idToken
      if (!credential) {
        toast.error('Google login failed: No credential received');
        return;
      }

      setLoading(true);
      await loginWithGoogle(credential);
      toast.success('Login successful');
      router.push('/');
    } catch (error) {
      logger.error('[REGISTER] Google Login Error:', error);
      toast.error(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/20">
          <RegisterLoadingCard />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/20">
        <div className="w-full rounded-[18px] border border-[#94a3b840] bg-white p-8 shadow-[0_18px_40px_#0f172a14] relative max-w-[min(520px,100%)]">
          <div className="flex items-center justify-between">
            <Image src="/logodark.png" alt="Shubh Car Spares" width={110} height={32} />
            <div className="rounded-full border border-[#3b82f659] bg-[#3b82f61f] px-[0.65rem] py-[0.3rem] text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-[#1d4ed8]">
              CUSTOMER REGISTER
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-foreground">REGISTER</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Create your account to access exclusive offers.
            </p>
          </div>

          <RegisterForm
            formData={formData}
            errors={errors}
            loading={loading}
            showPassword={showPassword}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onCustomerTypeChange={handleRadioChange}
            onAgreeTermsChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
          />

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="pill"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
