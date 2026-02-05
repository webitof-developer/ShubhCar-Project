"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, Package, Truck, RefreshCw, UserCircle, CreditCard, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';

const FaqPage = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const categories = [
        { id: 'orders', label: 'Orders & Payments', icon: Package },
        { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
        { id: 'returns', label: 'Returns & Refunds', icon: RefreshCw },
        { id: 'account', label: 'Account & Profile', icon: UserCircle },
    ];

    const faqs = {
        orders: [
            {
                question: "How do I place an order?",
                answer: "You can place an order by browsing our catalog, selecting the parts you need, adding them to your cart, and proceeding to checkout. You can checkout as a guest or create an account for faster future purchases."
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit and debit cards (Visa, MasterCard, RuPay), UPI, Net Banking, and select wallets. We also offer Cash on Delivery (COD) for eligible pincodes."
            },
            {
                question: "Can I cancel my order?",
                answer: "Yes, you can cancel your order before it has been shipped. Go to 'My Orders', select the order, and click 'Cancel'. If the order is already shipped, you may need to initiate a return after delivery."
            },
            {
                question: "How do I track my order?",
                answer: "Once your order is shipped, you will receive a tracking ID via SMS and Email. You can also track your order status in real-time from the 'My Orders' section in your account."
            },
            {
                question: "Do you offer GST invoices?",
                answer: "Yes, you can enter your GST number during checkout to receive a GST-compliant invoice for your business purchases."
            }
        ],
        shipping: [
            {
                question: "What are the shipping charges?",
                answer: "Shipping charges vary based on the weight of the product and your location. Standard shipping is free for orders above ₹999. You can view the exact shipping cost at checkout."
            },
            {
                question: "How long does delivery take?",
                answer: "Standard delivery takes 3-7 business days depending on your location. Metro cities usually receive orders within 2-4 days. You can check the estimated delivery date on the product page."
            },
            {
                question: "Do you ship internationally?",
                answer: "Currently, we only ship within India. We cover over 26,000+ pincodes across the country including remote areas."
            },
            {
                question: "What if I am not available to receive the delivery?",
                answer: "Our courier partner will attempt delivery 3 times. If you miss the delivery, they will contact you to reschedule. You can also contact our support team to coordinate the delivery."
            }
        ],
        returns: [
            {
                question: "What is your return policy?",
                answer: "We offer a 7-day return policy for defective or incorrect parts. The product must be unused, in original packaging, and with all tags intact. Some electrical parts may not be eligible for returns."
            },
            {
                question: "How do I initiate a return?",
                answer: "Go to 'My Orders', select the item you want to return, and click 'Return'. Select the reason for return and upload images if required. Our team will review and approve the request within 24 hours."
            },
            {
                question: "When will I get my refund?",
                answer: "Once the returned item is picked up and verified at our warehouse, the refund is initiated. It usually takes 5-7 business days for the amount to reflect in your original payment source."
            },
            {
                question: "Do I have to pay for return shipping?",
                answer: "No, return shipping is free for all valid returns (defective, damaged, or incorrect items). If you are returning for personal reasons, a nominal pickup fee may apply."
            }
        ],
        account: [
            {
                question: "How do I reset my password?",
                answer: "Click on 'Login', then select 'Forgot Password'. Enter your registered email or phone number to receive a secure link or OTP to reset your password."
            },
            {
                question: "Can I change my delivery address?",
                answer: "Yes, you can manage unlimited delivery addresses in the 'My Profile' > 'Addresses' section. You can also add a new address during checkout."
            },
            {
                question: "Is my personal information safe?",
                answer: "Absolutely. We use industry-standard encryption to protect your data. We never share your personal details with third parties for marketing purposes."
            },
            {
                question: "How do I register as a wholesale buyer?",
                answer: "You can sign up for a business account by selecting the 'Business/Wholesale' option during registration. You will need to provide valid business documents (GST, etc.) for verification."
            }
        ]
    };

    const allFaqs = Object.values(faqs).flat();
    const filteredFaqs = searchQuery
        ? allFaqs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    return (
        <Layout>
            {/* Hero Section */}
            <section className="bg-slate-900 py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">How can we help you?</h1>
                    <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                        Search for an answer or browse our most frequently asked questions below.
                    </p>

                    <div className="max-w-2xl mx-auto relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search explicitly (e.g., return policy, shipping codes, etc.)"
                            className="w-full h-14 pl-12 pr-4 rounded-full bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 focus:border-blue-400 transition-all text-lg shadow-xl backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-slate-50 min-h-[60vh]">
                <div className="container mx-auto px-4 max-w-5xl">

                    {searchQuery ? (
                        /* Search Results */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-semibold mb-6 text-slate-900 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                Search Results for "{searchQuery}"
                            </h2>
                            {filteredFaqs.length > 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
                                    <Accordion type="single" collapsible className="w-full">
                                        {filteredFaqs.map((faq, index) => (
                                            <AccordionItem value={`item-${index}`} key={index} className="border-b-0 px-4">
                                                <AccordionTrigger className="text-left text-slate-800 hover:text-blue-600 hover:no-underline py-5 text-base font-medium">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
                                    <p className="text-slate-500">We couldn't find any answers matching your search. Please try different keywords.</p>
                                </div>
                            )}
                            <div className="mt-8 text-center">
                                <Button variant="link" onClick={() => setSearchQuery("")} className="text-blue-600">
                                    Clear Search & Browse All Categories
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Browse Categories */
                        <Tabs defaultValue="orders" className="w-full">
                            <div className="flex justify-center mb-10 overflow-x-auto pb-2 no-scrollbar">
                                <TabsList className="h-auto p-1.5 bg-white border border-slate-200 rounded-full shadow-sm gap-1 inline-flex">
                                    {categories.map(cat => (
                                        <TabsTrigger
                                            key={cat.id}
                                            value={cat.id}
                                            className="rounded-full px-6 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center gap-2"
                                        >
                                            <cat.icon className="w-4 h-4" />
                                            {cat.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {categories.map(cat => (
                                <TabsContent key={cat.id} value={cat.id} className="focus:outline-none animate-in fade-in slide-in-from-bottom-8 duration-500">
                                    <div className="grid md:grid-cols-12 gap-8">
                                        {/* Category Info Side */}
                                        <div className="md:col-span-4 lg:col-span-3">
                                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-24">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                                    <cat.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.label}</h3>
                                                <p className="text-sm text-slate-500 mb-6">
                                                    Everything you need to know about {cat.label.toLowerCase()}.
                                                </p>
                                                <Link href="/contact" className="text-sm font-semibold text-blue-600 flex items-center hover:underline">
                                                    Still need help? <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* FAQs List */}
                                        <div className="md:col-span-8 lg:col-span-9">
                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 pl-4">
                                                <Accordion type="single" collapsible className="w-full">
                                                    {faqs[cat.id].map((faq, index) => (
                                                        <AccordionItem value={`item-${cat.id}-${index}`} key={index} className="px-2 border-slate-100 last:border-0 data-[state=open]:bg-slate-50/50 rounded-xl transition-colors">
                                                            <AccordionTrigger className="text-left text-slate-800 hover:text-blue-600 hover:no-underline py-5 px-4 text-base font-semibold [&[data-state=open]]:text-blue-600">
                                                                {faq.question}
                                                            </AccordionTrigger>
                                                            <AccordionContent className="text-slate-600 text-sm md:text-base leading-relaxed pb-6 px-4">
                                                                {faq.answer}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}

                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h2>
                        <p className="text-slate-500">Can't find the answer you're looking for? Please contact our friendly team.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Live Chat</h3>
                            <p className="text-sm text-slate-500 mb-4">Chat with our support team</p>
                            <Button variant="outline" className="w-full rounded-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">Start Chat</Button>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Email Us</h3>
                            <p className="text-sm text-slate-500 mb-4">We usually reply within 24hrs</p>
                            <Link href="/contact">
                                <Button variant="outline" className="w-full rounded-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">Send Email</Button>
                            </Link>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Phone className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Call Us</h3>
                            <p className="text-sm text-slate-500 mb-4">Mon-Sat from 9am to 6pm</p>
                            <a href="tel:+919876543210">
                                <Button variant="outline" className="w-full rounded-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">Call Now</Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default FaqPage;
