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
import { sanitizeIndianPhone } from '@/utils/phoneValidation';
import {
  normalizeTextField,
  validateEmailField,
  validateMessageField,
  validateNameField,
  validatePhoneField,
  validateSubjectField,
} from '@/utils/formValidation';

const fieldClassName =
  'peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0';
const fieldLabelClassName =
  'pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary';

const ContactPage = () => {
  const { siteName, contact } = useSiteConfig();
  const supportPhone = contact?.phone || '9876543210';
  const supportEmail = contact?.email || 'support@autospares.com';
  const supportAddress = contact?.address || 'Raipur, Chhattisgarh, India';
  const supportPhoneHref = `tel:${String(supportPhone).replace(/\D/g, '')}`;
  const mapQuery = encodeURIComponent(supportAddress);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const nextValue =
      id === 'phone'
        ? sanitizeIndianPhone(value)
        : value;
    setFormData(prev => ({ ...prev, [id]: nextValue }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const cleanPhone = sanitizeIndianPhone(formData.phone);

    const nameError = validateNameField(formData.name, 'Name');
    if (nameError) nextErrors.name = nameError;

    const emailError = validateEmailField(formData.email, true);
    if (emailError) nextErrors.email = emailError;

    const phoneError = validatePhoneField(cleanPhone, false);
    if (phoneError) nextErrors.phone = phoneError;

    const subjectError = validateSubjectField(formData.subject, true);
    if (subjectError) nextErrors.subject = subjectError;

    const messageError = validateMessageField(formData.message, { minLength: 10, maxLength: 5000 });
    if (messageError) nextErrors.message = messageError;

    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, cleanPhone };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, cleanPhone } = validateForm();
    if (!valid) {
      toast.error('Please correct the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPayload = {
        name: normalizeTextField(formData.name),
        email: normalizeTextField(formData.email),
        phone: cleanPhone,
        subject: normalizeTextField(formData.subject),
        message: normalizeTextField(formData.message),
      };

      await submitContactForm({
        ...normalizedPayload,
      });
      toast.success('Message sent successfully!', {
        description: 'We will get back to you within 24 hours.'
      });
      setErrors({});
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
      value: supportPhone,
      action: 'Call Now',
      href: supportPhoneHref,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Mail,
      title: 'Email Us',
      desc: 'We reply within 24hrs',
      value: supportEmail,
      action: 'Send Email',
      href: `mailto:${supportEmail}`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: 'Visit HQ',
      desc: supportAddress,
      value: 'View on Google Maps',
      action: 'Get Directions',
      href: mapHref,
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
            We&apos;d love to hear from you
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
                    <div className="relative">
                      <Input
                        id="name"
                        placeholder=" "
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={`${fieldClassName} ${errors.name ? 'border-destructive' : ''}`}
                      />
                      <Label htmlFor="name" className={fieldLabelClassName}>
                        Full Name
                      </Label>
                    </div>
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground z-10">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder=" "
                        value={formData.phone}
                        onChange={handleChange}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className={`${fieldClassName} pl-14 ${errors.phone ? 'border-destructive' : ''}`}
                      />
                      <Label htmlFor="phone" className={fieldLabelClassName}>
                        Phone Number
                      </Label>
                    </div>
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder=" "
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`${fieldClassName} ${errors.email ? 'border-destructive' : ''}`}
                    />
                    <Label htmlFor="email" className={fieldLabelClassName}>
                      Email Address
                    </Label>
                  </div>
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                      <Input
                        id="subject"
                        placeholder=" "
                        value={formData.subject}
                        onChange={handleChange}
                        maxLength={200}
                        required
                        className={`${fieldClassName} ${errors.subject ? 'border-destructive' : ''}`}
                      />
                    <Label htmlFor="subject" className={fieldLabelClassName}>
                      Subject
                    </Label>
                  </div>
                  {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      id="message"
                      placeholder=" "
                      className={`${fieldClassName} min-h-[150px] resize-none p-4 ${errors.message ? 'border-destructive' : ''}`}
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={5000}
                      required
                    />
                    <Label htmlFor="message" className={fieldLabelClassName}>
                      Message
                    </Label>
                  </div>
                  {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                </div>

                <Button type="submit" className="w-full h-11 rounded-full tracking-widest text-base" disabled={isSubmitting}>
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
