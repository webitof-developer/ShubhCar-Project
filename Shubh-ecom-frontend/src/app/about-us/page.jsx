"use client";
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import {
  Award,
  Users,
  Truck,
  ShieldCheck,
  Target,
  Heart,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  Package,
  Wrench,
  Clock
} from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AboutPage = () => {
  const { siteName } = useSiteConfig();

  const stats = [
    { value: '50K+', label: 'Auto Parts' },
    { value: '15K+', label: 'Happy Customers' },
    { value: '100+', label: 'Brands Covered' },
    { value: '24/7', label: 'Expert Support' },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: '100% Genuine Parts',
      desc: 'We source directly from authorized manufacturers and verified distributors to ensure every part is authentic.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Truck,
      title: 'Pan-India Delivery',
      desc: 'Lightning fast shipping to over 26,000+ pin codes across India with real-time tracking updates.',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Users,
      title: 'Expert Compatibility',
      desc: 'Our "Verified Fit" system ensures the part you buy fits your specific vehicle model perfectly.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: Award,
      title: 'Warranty Protection',
      desc: 'Shop with confidence. Most parts come with manufacturer warranty and our easy return policy.',
      color: 'bg-amber-50 text-amber-600'
    },
  ];

  const timeline = [
    { year: '2020', title: 'The Beginning', desc: 'Started with a small garage in Mumbai, aiming to digitize auto parts sales.' },
    { year: '2021', title: 'Rapid Expansion', desc: 'Partnered with 50+ major brands and expanded delivery to metro cities.' },
    { year: '2023', title: 'Tech Innovation', desc: 'Launched our AI-powered "Verified Fit" system to reduce compatibility issues.' },
    { year: 'Today', title: 'Market Leader', desc: 'India\'s most trusted platform for spare parts, serving thousands daily.' },
  ];

  return (
    <Layout>
      {/* 1. Hero Section */}
      {/* 1. Hero Section */}
      <section className="relative py-20 bg-slate-900 overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm font-medium border-white/20 bg-white/10 text-white rounded-full backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            Simplifying Auto Care
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Auto Parts Buying</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            We are building the most reliable digital ecosystem for automobile spares in India.
            Connect with verified sellers, find the exact part you need, and get it delivered to your doorstep.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link href="/categories">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-slate-900/50">
                Explore Catalog <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-semibold bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Section - Floating Cards */}
      <section className="relative -mt-12 z-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Our Story / "Bento" Grid */}
      <section className="py-20 bg-slate-50/50 border-y border-slate-200/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 max-w-6xl mx-auto">
            <div>
              <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">Our Story</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Driven by Passion, <br />Fueled by Technology.</h2>
              <div className="prose prose-lg text-slate-600">
                <p className="mb-4">
                  It started with a simple frustration: finding the right spare part for a car was unnecessarily difficult.
                  Counterfeit parts, opaque pricing, and lack of technical guidance were industry norms.
                </p>
                <p>
                  We founded <strong>{siteName}</strong> to change that. We combined deep automotive expertise with modern technology to create a platform
                  where trust and transparency come standard. Today, we are proud to be the go-to destination for mechanics,
                  car enthusiasts, and daily drivers alike.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Mission</h4>
                    <p className="text-sm text-slate-500 leading-snug">To simplify auto maintenance for everyone.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Vision</h4>
                    <p className="text-sm text-slate-500 leading-snug">To be the world's most trusted parts network.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl -z-10" />
              <div className="bg-white rounded-3xl p-8 border border-slate-200">
                <div className="space-y-8">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {/* Connecting Line */}
                      {i !== timeline.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100" />
                      )}

                      <div className="flex-none w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 z-10">
                        {item.year}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Values */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why India Trusts Us</h2>
            <p className="text-slate-600 text-lg">We don't just sell parts; we deliver reliability. Here is what sets us apart from the rest.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:border-slate-200 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works - Visual */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience the New Standard</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Detailed Technical Specs</h4>
                    <p className="text-slate-400">Every product comes with comprehensive dimensions, weight, and material data.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Secure Packaging</h4>
                    <p className="text-slate-400">Custom-engineered packaging ensures your fragile parts arrive safely, every time.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Real-Time Support</h4>
                    <p className="text-slate-400">Talk to real mechanics in real-time if you have doubts about fitment.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 relative bg-slate-800/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-center p-8">
                <h3 className="text-2xl font-bold mb-4">Start Your Journey</h3>
                <p className="text-slate-400 mb-8">Join thousands of smart vehicle owners who trust us for their spare part needs.</p>
                <Link href="/register">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-14 text-lg">
                    Create Free Account
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-4">No subscription fees. Pay only for what you buy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Simple CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Got questions? We are here to help.</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact-us">
              <Button variant="secondary" size="lg" className="h-12 px-8">Contact Support</Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" size="lg" className="h-12 px-8">Visit FAQ Center</Button>
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default AboutPage;
