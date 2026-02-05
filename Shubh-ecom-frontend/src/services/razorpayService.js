import { toast } from 'sonner';
import APP_CONFIG from '@/config/app.config';
import { initiatePayment } from '@/services/paymentService';

/**
 * Dynamically load Razorpay SDK
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Handle Razorpay Payment Flow
 * @param {string} accessToken - Auth token
 * @param {object} orderData - { orderId, total, ... }
 * @param {object} userDetails - { name, email, phone }
 */
export const processRazorpayPayment = async (accessToken, orderData, userDetails) => {
  const config = APP_CONFIG.payments.gateways.razorpay;

  if (!config.enabled) {
    throw new Error('Razorpay is currently disabled');
  }

  if (!config.keyId) {
    throw new Error('Payment configuration missing (Key ID)');
  }

  // 1. Load SDK
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Failed to load payment gateway');
  }

  // 2. Initiate Payment (Get Order ID from Backend)
  // Note: Backend handles amounts, we just pass the order ID
  const initiation = await initiatePayment(accessToken, {
    orderId: orderData.orderId,
    gateway: 'razorpay'
  });

  const { gatewayPayload, paymentId } = initiation;

  // 3. Open Razorpay Modal
  return new Promise((resolve, reject) => {
    const options = {
      key: config.keyId,
      amount: gatewayPayload.amount, // from backend
      currency: gatewayPayload.currency, // from backend
      name: APP_CONFIG.site.name,
      description: `Order #${orderData.orderNumber}`,
      image: APP_CONFIG.site.logo || undefined,
      order_id: gatewayPayload.id, // Razorpay Order ID from backend
      
      // User Prefills
      prefill: {
        name: userDetails?.name || '',
        email: userDetails?.email || '',
        contact: userDetails?.phone || '',
      },

      theme: {
        color: APP_CONFIG.site.theme.primaryColor,
      },

      // Handlers
      handler: function (response) {
        // Success!
        resolve({
          success: true,
          details: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            internalPaymentId: paymentId
          }
        });
      },

      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      reject(new Error(response.error.description || 'Payment failed'));
    });

    rzp.open();
  });
};