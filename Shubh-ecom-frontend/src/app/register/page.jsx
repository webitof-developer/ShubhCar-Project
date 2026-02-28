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
        ? String(value || '').replace(/\D/g, '').slice(0, 10)
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

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (exactly 10 digits)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

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
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        customerType: formData.customerType,
      });

      toast.success('Account created successfully');
      // BYPASS OTP: Redirect directly to login
      router.push('/login');
    } catch (error) {
      console.error('[REGISTER] Error:', error);
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
      console.error('[REGISTER] Google Login Error:', error);
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
