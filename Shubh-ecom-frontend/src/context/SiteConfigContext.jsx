"use client";

import { createContext, useState, useEffect, useMemo, useContext } from 'react';
import APP_CONFIG from '@/config/app.config';
import { getMergedTaxConfig } from '@/services/taxSettingsService';

const SiteConfigContext = createContext(null);

export const useSiteConfigContext = () => {
    const context = useContext(SiteConfigContext);
    if (!context) {
        throw new Error('useSiteConfigContext must be used within a SiteConfigProvider');
    }
    return context;
};

export const SiteConfigProvider = ({ children }) => {
    const resolveMediaUrl = (url) => {
        if (!url) return url;
        if (url.startsWith('/api/proxy/')) return url;
        const apiOrigin = (APP_CONFIG.api.baseUrl || '').replace(/\/api\/v1\/?$/, '');
        const toRawProxy = (path) => `/api/proxy/__raw__${path.startsWith('/') ? '' : '/'}${path}`;

        if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
                const parsed = new URL(url);
                if (apiOrigin && parsed.origin === apiOrigin) {
                    return toRawProxy(`${parsed.pathname}${parsed.search}`);
                }
            } catch {
                // keep original url below
            }
            return url;
        }

        // Keep frontend static favicon local to avoid CSP cross-origin issues.
        if (url.startsWith('/favicon')) return '/favicon.ico';

        // Backend media paths are served through same-origin proxy.
        if (url.startsWith('/uploads/')) return toRawProxy(url);

        if (!apiOrigin) return url;
        return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Build static config object (Initial state)
    const staticConfig = useMemo(() => ({
        // Site Identity
        siteName: APP_CONFIG.site.name,
        siteTitle: APP_CONFIG.site.name,
        siteDescription: APP_CONFIG.site.tagline,
        seoTitle: APP_CONFIG.site.name,
        seoDescription: APP_CONFIG.site.tagline,
        seoKeywords: '',
        domain: APP_CONFIG.site.domain,

        // Branding
        logoDark: resolveMediaUrl(APP_CONFIG.site.logoDark || APP_CONFIG.site.logo || null),
        logoLight: resolveMediaUrl(APP_CONFIG.site.logoLight || APP_CONFIG.site.logo || null),
        favicon: resolveMediaUrl(APP_CONFIG.site.favicon || APP_CONFIG.theme?.favicon || '/favicon.ico'),
        tagline: APP_CONFIG.site.tagline,
        primaryColor: APP_CONFIG.theme?.primaryColor,

        // Contact Information
        contact: APP_CONFIG.site.contact,
        social: APP_CONFIG.site.social,
        hours: APP_CONFIG.site.hours,

        // Computed Values
        copyrightText: `(c) ${new Date().getFullYear()} ${APP_CONFIG.site.name}. All rights reserved. Made with love in India`,

        // Tax Configuration (static fallback)
        tax: APP_CONFIG.site?.tax || {},
        couponEnabled: true,
        couponSequential: false,
        shippingHandlingDays: '3-5 business days',
        productUnits: {
            weight: 'kg',
            dimensions: 'cm',
        },

        // Feature Flags
        features: APP_CONFIG.features,
    }), []);

    const [config, setConfig] = useState(staticConfig);
    const [loading, setLoading] = useState(APP_CONFIG.site.useDynamicSettings);

    useEffect(() => {
        // Skip fetching if dynamic settings disabled
        if (!APP_CONFIG.site.useDynamicSettings) {
            setLoading(false);
            return;
        }

        const fetchSettings = async () => {
            try {
                // Parallel fetch for speed
                const [settingsResponse, mergedTaxConfig] = await Promise.all([
                    fetch(`${APP_CONFIG.api.baseUrl}/settings/public`, {
                        headers: { 'Content-Type': 'application/json' },
                    }).then(res => res.ok ? res.json() : null),
                    getMergedTaxConfig()
                ]);

                const data = settingsResponse?.data || settingsResponse || {};

                setConfig(prev => ({
                    ...prev,
                    // Merge dynamic settings if available
                    logoDark: data.site_logo_dark ? resolveMediaUrl(data.site_logo_dark) : prev.logoDark,
                    logoLight: data.site_logo_light ? resolveMediaUrl(data.site_logo_light) : prev.logoLight,
                    favicon: data.site_favicon ? resolveMediaUrl(data.site_favicon) : prev.favicon,
                    siteName: data.site_title || prev.siteName,
                    siteTitle: data.site_title || prev.siteTitle,
                    siteDescription: data.site_description || prev.siteDescription,
                    seoTitle: data.seo_title || prev.seoTitle,
                    seoDescription: data.seo_description || prev.seoDescription,
                    seoKeywords: data.seo_keywords || prev.seoKeywords,
                    contact: {
                        ...prev.contact,
                        email: data.contact_email || prev.contact?.email,
                        phone: data.contact_phone || prev.contact?.phone,
                    },
                    couponEnabled: data.coupon_enabled !== undefined
                        ? (data.coupon_enabled === true || data.coupon_enabled === 'true' || data.coupon_enabled === 1 || data.coupon_enabled === '1')
                        : prev.couponEnabled,
                    couponSequential: data.coupon_sequential !== undefined
                        ? (data.coupon_sequential === true || data.coupon_sequential === 'true' || data.coupon_sequential === 1 || data.coupon_sequential === '1')
                        : prev.couponSequential,
                    shippingHandlingDays: data.shipping_handling_days || prev.shippingHandlingDays,
                    productUnits: {
                        weight: data.product_weight_unit || prev.productUnits?.weight || 'kg',
                        dimensions: data.product_dimensions_unit || prev.productUnits?.dimensions || 'cm',
                    },
                    
                    // Tax Config (Critical)
                    tax: mergedTaxConfig,

                    // Recompute copyright with potentially new site name
                    copyrightText: `(c) ${new Date().getFullYear()} ${data.site_title || prev.siteName}. All rights reserved. Made with love in India`,
                }));

            } catch (error) {
                console.warn('[SiteConfigProvider] Failed to fetch dynamic settings, using static config:', error);
                // State remains as staticConfig (safe fallback)
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [staticConfig]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (config?.siteTitle) {
            document.title = config.siteTitle;
        }

        const ensureMeta = (name, content) => {
            if (!content) return;
            let tag = document.querySelector(`meta[name='${name}']`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('name', name);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        ensureMeta('description', config?.seoDescription || config?.siteDescription || '');
        ensureMeta('keywords', config?.seoKeywords || '');
    }, [config?.siteTitle, config?.siteDescription, config?.seoDescription, config?.seoKeywords]);

    const value = useMemo(() => ({ ...config, loading }), [config, loading]);

    return (
        <SiteConfigContext.Provider value={value}>
            {children}
        </SiteConfigContext.Provider>
    );
};
