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
    // Build static config object (Initial state)
    const staticConfig = useMemo(() => ({
        // Site Identity
        siteName: APP_CONFIG.site.name,
        domain: APP_CONFIG.site.domain,

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
                    siteName: data.site_title || data.siteName || prev.siteName,
                    contact: {
                        ...prev.contact,
                        email: data.contact_email || prev.contact?.email,
                        phone: data.contact_phone || prev.contact?.phone,
                        address: [
                            data.store_address,
                            data.store_city,
                            data.store_zip,
                            data.store_country,
                        ].filter(Boolean).join(', ') || prev.contact?.address,
                    },
                    
                    // Tax Config (Critical)
                    tax: mergedTaxConfig,

                    // Recompute copyright with potentially new site name
                    copyrightText: `(c) ${new Date().getFullYear()} ${data.site_title || data.siteName || prev.siteName}. All rights reserved. Made with love in India`,
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
