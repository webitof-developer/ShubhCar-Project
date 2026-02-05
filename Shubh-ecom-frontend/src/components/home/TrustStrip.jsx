//src/components/home/TrustStrip.jsx
import { ShieldCheck, Package, FileText, Lock } from 'lucide-react';

const trustItems = [
  { icon: ShieldCheck, label: 'Verified Sellers' },
  { icon: Package, label: 'OEM & Aftermarket Parts' },
  { icon: FileText, label: 'GST Invoice' },
  { icon: Lock, label: 'Secure Payments' },
];

export const TrustStrip = () => {
  return (
    <section className="py-6 border-y border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
