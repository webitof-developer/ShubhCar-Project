"use client";
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, ArrowRight, User, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { submitContactForm } from '@/services/contactService';
import { useSiteConfig } from '@/hooks/useSiteConfig';

const ContactPage = () => {
  const { siteName } = useSiteConfig();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const nextValue =
      id === 'phone'
        ? String(value || '').replace(/\D/g, '').slice(0, 10)
        : value;
    setFormData(prev => ({ ...prev, [id]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactForm({
        ...formData,
        phone: cleanPhone,
      });
      toast.success('Message sent successfully!', {
        description: 'We will get back to you within 24 hours.'
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message', {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: Phone,
      title: 'Phone Support',
      desc: 'Mon-Sat 9am to 6pm',
      value: '+91 98765 43210',
      action: 'Call Now',
      href: 'tel:+919876543210',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Mail,
      title: 'Email Us',
      desc: 'We reply within 24hrs',
      value: 'support@autospares.com',
      action: 'Send Email',
      href: 'mailto:support@autospares.com',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: 'Visit HQ',
      desc: 'Raipur, Chhattisgarh',
      value: 'View on Google Maps',
      action: 'Get Directions',
      href: 'https://maps.google.com',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      target: '_blank',
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-slate-900 overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white border border-white/20 text-sm font-medium rounded-full mb-6 backdrop-blur-sm">
            We'd love to hear from you
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Get in touch with our team
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have a question about a product, order, or just want to say hi?
            We are here to help you. Using the form below is the quickest way to reach us.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative -mt-16 z-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {contactDetails.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300 text-center group">
                <div className={`w-14 h-14 mx-auto rounded-2xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{item.desc}</p>
                <div className="font-semibold text-slate-900 mb-6">{item.value}</div>
                <a
                  href={item.href}
                  target={item.target}
                  className={`inline-flex items-center gap-2 font-semibold text-sm ${item.color} hover:underline`}
                >
                  {item.action} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Split: Form + Map/Info */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 max-w-6xl mx-auto">

            {/* Left: Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Send us a message</h2>
                </div>
                <p className="text-slate-500">Fill in the form and our team will get back to you within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876500000"
                        value={formData.phone}
                        onChange={handleChange}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className="pl-16 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 select-none">
                        +91
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-slate-700 font-medium">Subject</Label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      id="subject"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-700 font-medium">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your query..."
                    className="min-h-[150px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors p-4"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-primary-foreground" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  {!isSubmitting && <Send className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </div>

            {/* Right: Info & Map */}
            <div className="lg:col-span-5 space-y-8">
              {/* Map Card */}
              <div className="bg-white rounded-3xl p-2 border border-slate-200 shadow-sm h-[300px] relative overflow-hidden group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118985.43857038153!2d81.56491763177773!3d21.261889476837777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a28dda23be28229%3A0x163ee1204498e72!2sRaipur%2C%20Chhattisgarh!5e0!3m2!1sen!2sin!4v1706520000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '1rem' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale group-hover:grayscale-0 transition-all duration-700"
                ></iframe>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Headquarters</p>
                    <p className="text-[10px] text-slate-500 font-medium">Raipur, Chhattisgarh</p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Clock className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" /> Business Hours
                </h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-slate-300">Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-slate-300">Saturday</span>
                    <span className="font-semibold">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-slate-400">
                    <span>Sunday</span>
                    <span className="text-red-400 font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
