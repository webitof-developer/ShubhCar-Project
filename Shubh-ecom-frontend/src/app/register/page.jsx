"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, AlertTriangle, UserCircle, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';

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
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
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

    // Phone validation (>= 10 digits)
    const phoneRegex = /^\d{10,}$/;
    // Remove non-digits for length check
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
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
        phone: formData.phone,
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
          <div className="w-full rounded-[18px] border border-[#94a3b840] bg-white p-8 shadow-[0_18px_40px_#0f172a14] relative max-w-[min(520px,100%)] animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 w-28 bg-slate-200 rounded"></div>
              <div className="h-6 w-32 bg-slate-100 rounded-full"></div>
            </div>

            <div className="mb-8">
              <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-64 bg-slate-100 rounded"></div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
                <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
              </div>
              <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
              <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
              <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>

              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
                <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
              </div>

              <div className="h-11 w-full bg-slate-200 rounded-full mt-4"></div>
            </div>
          </div>
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

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder=" "
                  className={`peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.firstName ? "border-destructive" : ""}`}
                />
                <Label
                  htmlFor="firstName"
                  className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
                >
                  First Name
                </Label>
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
              </div>
              <div className="relative">
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder=" "
                  className={`peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.lastName ? "border-destructive" : ""}`}
                />
                <Label
                  htmlFor="lastName"
                  className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
                >
                  Last Name
                </Label>
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder=" "
                className={`peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.email ? "border-destructive" : ""}`}
              />
              <Label
                htmlFor="email"
                className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
              >
                Email
              </Label>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder=" "
                className={`peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.phone ? "border-destructive" : ""}`}
              />
              <Label
                htmlFor="phone"
                className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
              >
                Phone
              </Label>
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                className={`peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] pr-10 text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.password ? "border-destructive" : ""}`}
              />
              <Label
                htmlFor="password"
                className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <div className="space-y-3">
              <Label>
                Account Type <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.customerType}
                onValueChange={handleRadioChange}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="retail"
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.customerType === 'retail'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <RadioGroupItem value="retail" id="retail" className="sr-only" />
                  <UserCircle className={`w-5 h-5 ${formData.customerType === 'retail' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Personal</p>
                    <p className="text-xs text-muted-foreground">Individual buyer</p>
                  </div>
                </label>
                <label
                  htmlFor="wholesale"
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.customerType === 'wholesale'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <RadioGroupItem value="wholesale" id="wholesale" className="sr-only" />
                  <Building2 className={`w-5 h-5 ${formData.customerType === 'wholesale' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Wholesale</p>
                    <p className="text-xs text-muted-foreground">Business buyer</p>
                  </div>
                </label>
              </RadioGroup>

              {formData.customerType === 'wholesale' && (
                <Alert className="bg-warning/10 border-warning/30">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm">
                    Wholesale accounts require admin approval. You&apos;ll have access to retail
                    pricing until your account is verified.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
                required
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none cursor-pointer"
              >
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 rounded-full tracking-widest text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'REGISTER NOW'
              )}
            </Button>
          </form>

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
