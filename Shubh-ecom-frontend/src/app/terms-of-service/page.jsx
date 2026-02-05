"use client";
import { Layout } from '@/components/layout/Layout';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { FileCheck, ShoppingBag, Truck, RotateCcw, ShieldCheck, Scale, AlertTriangle, HelpCircle } from 'lucide-react';

const TermsPage = () => {
  const { siteName } = useSiteConfig();

  return (
    <Layout>
      {/* Header */}
      <div className="bg-slate-950 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
          <p className="text-sm text-slate-500 mt-4">Last Updated: January 1, 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_250px] gap-12">

          {/* Main Content */}
          <div className="space-y-12">

            <section id="acceptance">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  By accessing and using <strong>{siteName}</strong> ("we," "our," or "the Platform"), you confirm that you accept these Terms of Service and agree to comply with them. If you do not agree to these terms, you must not use our services.
                </p>
                <p>
                  These terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </div>
            </section>

            <section id="products" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Products & Pricing</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 mb-4">
                  <ul className="space-y-3 mb-0">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Descriptions:</strong> We strive to display product colors and specifications accurately, but cannot guarantee that your device's display reflects the actual product color reliably.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Availability:</strong> All products are subject to availability. We reserve the right to limit the quantity of products we supply.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Pricing:</strong> Prices are in Indian Rupees (INR) and are subject to change without notice.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="orders" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                  <Truck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Orders & Shipping</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  We reserve the right to refuse any order you place with us. Delivery estimates are provided for convenience only and are not guaranteed delivery dates. We are not responsible for delays caused by shipping carriers, customs clearance, or other causes beyond our control.
                </p>
              </div>
            </section>

            <section id="returns" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Returns & Refunds</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  Items may be returned in accordance with our Return Policy. Generally, products can be returned within 30 days of delivery if they are unused and in original packaging. Defective parts must be reported within 48 hours of receipt.
                </p>
                <p>
                  Refunds will be processed to the original method of payment within 7-10 business days after we receive and inspect the returned item.
                </p>
              </div>
            </section>

            <section id="liability" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Limitation of Liability</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  To the maximum extent permitted by law, {siteName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </div>
            </section>

            <section id="governing" className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. Governing Law</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
                <p>
                  These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, India.
                </p>
              </div>
            </section>

          </div>

          {/* Sidebar Navigation (Desktop Only) */}
          <div className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4">Quick Navigation</h4>
                <nav className="space-y-3">
                  <a href="#acceptance" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">1. Acceptance</a>
                  <a href="#products" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">2. Products & Pricing</a>
                  <a href="#orders" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">3. Orders & Shipping</a>
                  <a href="#returns" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">4. Returns</a>
                  <a href="#liability" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">5. Liability</a>
                  <a href="#governing" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">6. Governing Law</a>
                </nav>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
                <HelpCircle className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                <h4 className="font-bold mb-2">Have Questions?</h4>
                <p className="text-sm text-slate-400 mb-4">Our support team is here to help clarify any terms.</p>
                <a href="/contact-us" className="inline-block bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                  Contact Support
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
