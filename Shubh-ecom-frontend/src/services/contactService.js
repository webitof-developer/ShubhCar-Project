import APP_CONFIG from '@/config/app.config';

const API_BASE = APP_CONFIG.api.baseUrl;
const readResponseBody = async (response) => {
    const text = await response.text();
    if (!text) return { text: '', json: null };
    try {
        return { text, json: JSON.parse(text) };
    } catch {
        return { text, json: null };
    }
};

export const submitContactForm = async (data) => {
    const response = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const { text, json } = await readResponseBody(response);
    if (!response.ok) {
        throw new Error(json?.message || text || 'Failed to submit form');
    }

    return json || {};
};
