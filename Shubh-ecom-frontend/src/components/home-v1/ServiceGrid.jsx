"use client";

import { Star, Zap, Shield, Heart } from "lucide-react";

export const ServiceGrid = () => {
  const services = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Turbo Service",
      description: "Get your parts delivered in record time with our express shipping options.",
      color: "bg-yellow-50"
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: "Secure Checkouts",
      description: "Your data is protected with 256-bit encryption for safe and secure shopping.",
      color: "bg-blue-50"
    },
    {
      icon: <Star className="w-6 h-6 text-purple-500" />,
      title: "Premium Quality",
      description: "Only certified OEM and OES parts from the world's leading manufacturers.",
      color: "bg-purple-50"
    },
    {
      icon: <Heart className="w-6 h-6 text-red-500" />,
      title: "Customer First",
      description: "Our support team is always ready to help you find the perfect part for your vehicle.",
      color: "bg-red-50"
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {services.map((service, index) => (
            <div key={index} className="group p-6 bg-slate-50 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-1">
              <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {service.icon}
              </div>
              <h3 className="text-[17px] font-bold text-slate-800 mb-1.5 tracking-tight">{service.title}</h3>
              <p className="text-slate-500 leading-relaxed text-[13px]">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
