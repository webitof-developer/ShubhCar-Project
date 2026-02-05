//src/data/cmsPages.js
/**
 * Static CMS page data - matches backend MongoDB structure
 * This file will be replaced with API calls through cmsService
 */

export const cmsPages = [
  {
    id: 'page-1',
    slug: 'about-us',
    title: 'About Us',
    content: '<h1>About AutoParts Pro</h1><p>We are your trusted source for quality auto parts...</p>',
    metaTitle: 'About Us | AutoParts Pro',
    metaDescription: 'Learn about AutoParts Pro, your trusted source for quality automotive parts.',
    isPublished: true,
  },
  {
    id: 'page-2',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>',
    metaTitle: 'Privacy Policy | AutoParts Pro',
    metaDescription: 'Read our privacy policy to understand how we protect your data.',
    isPublished: true,
  },
  {
    id: 'page-3',
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    content: '<h1>Terms & Conditions</h1><p>By using our services, you agree to...</p>',
    metaTitle: 'Terms & Conditions | AutoParts Pro',
    metaDescription: 'Read our terms and conditions for using AutoParts Pro services.',
    isPublished: true,
  },
  {
    id: 'page-4',
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    content: '<h1>Shipping Policy</h1><p>We offer fast and reliable shipping across India...</p>',
    metaTitle: 'Shipping Policy | AutoParts Pro',
    metaDescription: 'Learn about our shipping options and delivery times.',
    isPublished: true,
  },
  {
    id: 'page-5',
    slug: 'return-policy',
    title: 'Return Policy',
    content: '<h1>Return Policy</h1><p>Easy returns within 30 days...</p>',
    metaTitle: 'Return Policy | AutoParts Pro',
    metaDescription: 'Understand our hassle-free return policy.',
    isPublished: true,
  },
];
