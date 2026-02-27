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
                    siteName: data.siteName || prev.siteName,
                    
                    // Tax Config (Critical)
                    tax: mergedTaxConfig,

                    // Recompute copyright with potentially new site name
                    copyrightText: `(c) ${new Date().getFullYear()} ${data.siteName || prev.siteName}. All rights reserved. Made with love in India`,
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

    const value = useMemo(() => ({ ...config, loading }), [config, loading]);

    return (
        <SiteConfigContext.Provider value={value}>
            {children}
        </SiteConfigContext.Provider>
    );
};
