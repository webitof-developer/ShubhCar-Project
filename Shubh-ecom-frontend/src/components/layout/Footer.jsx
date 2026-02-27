"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const { siteName, copyrightText } = useSiteConfig();

  return (
    <footer className="bg-slate-950 text-slate-300 mt-auto border-t border-slate-800">

      {/* Main Footer Content */}
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand Column - Full width on mobile/tablet, 4 cols on desktop */}
          <div className="col-span-2 lg:col-span-4 space-y-6">
            <Link href="/" className="inline-block">
              <div className="h-16 w-56 relative md:h-20 md:w-80">
                <Image src="/logo.png" alt="ShubhCars" fill className="object-contain object-left" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              India's most trusted online marketplace for genuine OEM and high-quality aftermarket automobile spare parts. Verified sellers, pan-India delivery, and dedicated support.
            </p>

            <div className="flex gap-4 pt-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns - 1 col each on mobile (side-by-side), 2 cols on desktop */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold text-lg mb-6">Shop</h4>
            <ul className="space-y-4">
              {[
                { name: 'All Products', url: '/categories' },
                { name: 'Brake System', url: '/categories/brake-system' },
                { name: 'Engine Parts', url: '/categories/engine-parts' },
                { name: 'Suspension', url: '/categories/suspension' },
                { name: 'Electric System', url: '/categories/electric-system' },
                { name: 'Car Body and Interior', url: '/categories/car-body-and-interior' }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.url} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group text-sm md:text-base">
                    <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300"><ArrowRight className="w-3 h-3" /></span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              {[
                { name: 'About Us', url: '/about-us' },
                { name: 'Contact Us', url: '/contact-us' },
                { name: 'FAQs', url: '/faq' },
                { name: 'Privacy Policy', url: '/privacy-policy' },
                { name: 'Terms of Service', url: '/terms-of-service' }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.url} className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 group text-sm md:text-base">
                    <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300"><ArrowRight className="w-3 h-3" /></span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column - Full width on mobile, 4 cols on desktop */}
          <div className="col-span-2 md:col-span-2 lg:col-span-4">
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Headquarters</p>
                  <p className="text-slate-400 text-sm leading-relaxed">Raipur, Chhattisgarh, India</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-1">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Phone Support</p>
                  <a href="tel:+919876543210" className="text-slate-400 text-sm hover:text-white transition-colors">+91 98765 43210</a>
                  <p className="text-xs text-slate-500 mt-1">Mon-Sat 9am to 6pm</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Email Us</p>
                  <a href="mailto:support@autospares.com" className="text-slate-400 text-sm hover:text-white transition-colors">support@autospares.com</a>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black/40 border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 text-center md:text-left">
              {copyrightText}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-8 bg-white/10 rounded px-2 flex items-center justify-center border border-white/10">
                  <Image src="/payments/visa.svg" alt="Visa" width={56} height={16} className="h-4 w-auto object-contain" />
                </div>
                <div className="h-8 bg-white/10 rounded px-2 flex items-center justify-center border border-white/10">
                  <Image src="/payments/mastercard.svg" alt="Mastercard" width={72} height={20} className="h-5 w-auto object-contain" />
                </div>
                <div className="h-8 bg-white/10 rounded px-2 flex items-center justify-center border border-white/10">
                  <Image src="/payments/upi.svg" alt="UPI" width={40} height={12} className="h-3 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
