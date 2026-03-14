"use client";

import { ShieldCheck, Truck, RefreshCw, HeadphonesIcon } from "lucide-react";

export const TrustSection = () => {
  const features = [
    {
      icon: <Truck strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#005bb5] group-hover:scale-110 transition-transform duration-300" />,
      title: "Fast Delivery",
      description: "Fast and reliable shipping across the country.",
    },
    {
      icon: <ShieldCheck strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#005bb5] group-hover:scale-110 transition-transform duration-300" />,
      title: "100% Genuine Parts",
      description: "Guaranteed authentic OEM & OES spare parts.",
    },
    {
      icon: <RefreshCw strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#005bb5] group-hover:scale-110 transition-transform duration-300" />,
      title: "Easy Returns",
      description: "Hassle-free 14-day return and refund policy.",
    },
    {
      icon: <HeadphonesIcon strokeWidth={1.5} className="w-8 h-8 md:w-10 md:h-10 text-[#005bb5] group-hover:scale-110 transition-transform duration-300" />,
      title: "Expert Support",
      description: "Dedicated assistance from automotive experts.",
    },
  ];

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reliability You Can Trust</h2>
            <p className="text-slate-500 mt-2">We ensure quality and transparency at every step of your purchase</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-[#005bb5]/20 group">
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl group-hover:bg-[#005bb5]/5 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
