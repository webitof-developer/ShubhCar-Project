"use client";
import { Layout } from '@/components/layout/Layout';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Shield, Lock, FileText, Share2, Eye, Server, UserCheck, AlertCircle } from 'lucide-react';

const Privacy = () => {
  const { siteName } = useSiteConfig();

  return (
    <Layout>
      {/* Header */}
      <div className="bg-slate-950 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We value your trust and are committed to protecting your personal information.
          </p>
          <p className="text-sm text-slate-500 mt-4">Effective Date: January 1, 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_250px] gap-12">

          {/* Main Content */}
          <div className="space-y-12">

            <section id="introduction">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Introduction</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  Welcome to <strong>{siteName}</strong> ("we," "our," or "us"). We are committed to protecting your privacy and ensuring your personal information is handled in a safe and responsible manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong>autospares.com</strong> and use our services.
                </p>
                <p>
                  By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
                </p>
              </div>
            </section>

            <section id="collection" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Information We Collect</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>We collect information you provide directly to us when you:</p>
                <ul className="list-none space-y-2 pl-0 mt-4">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span><strong>Personal Account Info:</strong> Name, email address, password, phone number, and preferences when you create an account.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span><strong>Transaction Data:</strong> Billing address, shipping address, and payment confirmation details (we do not store full credit card numbers).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span><strong>Vehicle Information:</strong> Make, model, year, and VIN number if you use our vehicle compatibility tools.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="usage" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                  <Server className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. How We Use Your Data</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>We use the collected information for various purposes:</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-2">Order Fulfillment</h4>
                    <p className="text-sm">Processing payments, shipping orders, and providing tracking updates.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-2">Customer Support</h4>
                    <p className="text-sm">Responding to your inquiries, returns, and warranty claims efficiently.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-2">Platform Improvement</h4>
                    <p className="text-sm">Analyzing usage patterns to optimize our website layout and product recommendations.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-2">Marketing</h4>
                    <p className="text-sm">Sending newsletters and promotional offers (only with your explicit consent).</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="sharing" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                  <Share2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Information Sharing</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  We do not sell, trade, or rent your personal identification information to others. We share your information only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>Service Providers:</strong> Third-party vendors who assist with shipping (e.g., FedEx, Delhivery), payment processing (e.g., Razorpay, Stripe), and data analysis.</li>
                  <li><strong>Legal Compliance:</strong> When required by law or to protect our rights, property, or safety.</li>
                  <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition.</li>
                </ul>
              </div>
            </section>

            <section id="security" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Data Security</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  We implement industry-standard security measures including SSL encryption and secure servers to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            <section id="rights" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. Your Rights</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>You have the following rights regarding your personal data:</p>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mt-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Access and review the personal information we hold about you.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Request correction of any inaccurate or incomplete data.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Request deletion of your account and personal data (subject to legal retention requirements).</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Opt-out of marketing communications at any time.</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-4">
                  To exercise any of these rights, please contact us at <a href="mailto:privacy@autospares.com" className="text-blue-600 hover:underline font-medium">privacy@autospares.com</a>.
                </p>
              </div>
            </section>

          </div>

          {/* Sidebar Navigation (Desktop Only) */}
          <div className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4">Table of Contents</h4>
                <nav className="space-y-3">
                  <a href="#introduction" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">1. Introduction</a>
                  <a href="#collection" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">2. Information Collection</a>
                  <a href="#usage" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">3. How We Use Data</a>
                  <a href="#sharing" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">4. Information Sharing</a>
                  <a href="#security" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">5. Data Security</a>
                  <a href="#rights" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">6. Your Rights</a>
                </nav>
              </div>

              <div className="bg-blue-600 rounded-2xl p-6 text-white text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <h4 className="font-bold mb-2">Need Privacy Help?</h4>
                <p className="text-sm text-blue-100 mb-4">Contact our data protection officer for specific inquiries.</p>
                <a href="mailto:privacy@autospares.com" className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                  Email DPO
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
