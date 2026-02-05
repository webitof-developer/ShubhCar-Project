"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const returnTo = searchParams?.get('returnTo') || '/';
      router.push(returnTo);
    }
  }, [isAuthenticated, authLoading, searchParams, router]);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Successfully logged in with Google!');
      const returnTo = searchParams?.get('returnTo') || '/';
      router.push(returnTo);
    } catch (error) {
      console.error('Google Login Error:', error);
      toast.error(error.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      toast.success('Login successful!');

      // Redirect to return URL or home
      const returnTo = searchParams?.get('returnTo') || '/';
      router.push(returnTo);
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[75vh] flex items-center justify-center px-4 py-10 bg-muted/20">
          <div className="w-full rounded-[18px] border border-[#94a3b840] bg-white p-8 shadow-[0_18px_40px_#0f172a14] relative max-w-[min(520px,100%)] animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 w-28 bg-slate-200 rounded"></div>
              <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
            </div>

            <div className="mb-8">
              <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-64 bg-slate-100 rounded"></div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
              </div>

              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-100 rounded"></div>
                <div className="h-4 w-40 bg-slate-100 rounded"></div>
              </div>

              <div className="h-11 w-full bg-slate-200 rounded-full"></div>
            </div>

            <div className="mt-6 flex justify-between">
              <div className="h-4 w-32 bg-slate-100 rounded"></div>
              <div className="h-4 w-48 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <Layout>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-10 bg-muted/20">
        <div className="w-full rounded-[18px] border border-[#94a3b840] bg-white p-8 shadow-[0_18px_40px_#0f172a14] relative max-w-[min(520px,100%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logodark.png" alt="Shubh Car Spares" width={110} height={32} />
            </div>
            <div className="rounded-full border border-[#3b82f659] bg-[#3b82f61f] px-[0.65rem] py-[0.3rem] text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-[#1d4ed8]">
              CUSTOMER LOGIN
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-foreground">LOGIN</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Access your account with your credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pb-[0.55rem] pt-[1.1rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 disabled:bg-white"
              />
              <Label
                htmlFor="email"
                className="pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
              >
                Email
              </Label>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pb-[0.55rem] pt-[1.1rem] pr-10 text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 disabled:bg-white"
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
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(value) => setRememberMe(Boolean(value))}
                />
                Remember me
              </label>
              <span className="text-muted-foreground/80">Protected by enterprise-grade encryption</span>
            </div>

            <Button type="submit" className="w-full h-11 rounded-full tracking-widest text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'LOGIN NOW'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => {
                console.error('Google Login Failed');
                toast.error('Google Login canceled or failed');
              }}
              useOneTap
              theme="outline"
              shape="pill"
              width="100%"
              text="continue_with"
              logo_alignment="center"
            />
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            {/* <Link href="/reset-password" className="text-primary hover:underline">
              Forgot password?
            </Link> */}
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Login = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    }>
      <LoginContent />
    </Suspense>
  );
};

export default Login;
