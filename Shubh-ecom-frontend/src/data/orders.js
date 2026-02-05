//src/data/orders.js

/**
 * Static order data for profile pages
 * This file will be replaced with API calls through orderService
 */

export const orders= [
  {
    id: 'ord-1',
    orderNumber: 'AS-2024-001234',
    date: '2024-02-15',
    status: 'delivered',
    items: [
      {
        productId: 'prod-1',
        productName: 'Front Brake Disc Rotor',
        productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        quantity: 2,
        price: 3499,
      },
      {
        productId: 'prod-6',
        productName: 'Brake Pad Set - Front',
        productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        quantity: 1,
        price: 2999,
      },
    ],
    subtotal: 9997,
    discount: 1000,
    shipping: 0,
    total: 8997,
    shippingAddress: {
      name: 'Rajesh Kumar',
      line1: '123, Green Park Society',
      line2: 'Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '+91 98765 43210',
    },
    paymentMethod: 'UPI - PhonePe',
    trackingNumber: 'DELHV123456789',
    deliveryDate: '2024-02-18',
  },
  {
    id: 'ord-2',
    orderNumber: 'AS-2024-001189',
    date: '2024-02-10',
    status: 'shipped',
    items: [
      {
        productId: 'prod-2',
        productName: 'Air Filter Element',
        productImage: 'https://images.unsplash.com/photo-1635784298843-1c3e7c9d6c30?w=500',
        quantity: 3,
        price: 899,
      },
    ],
    subtotal: 2697,
    discount: 0,
    shipping: 0,
    total: 2697,
    shippingAddress: {
      name: 'Rajesh Kumar',
      line1: '123, Green Park Society',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '+91 98765 43210',
    },
    paymentMethod: 'Credit Card',
    trackingNumber: 'DELHV123456790',
  },
  {
    id: 'ord-3',
    orderNumber: 'AS-2024-001056',
    date: '2024-01-28',
    status: 'delivered',
    items: [
      {
        productId: 'prod-4',
        productName: 'Headlight Assembly - Left',
        productImage: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500',
        quantity: 1,
        price: 8499,
      },
    ],
    subtotal: 8499,
    discount: 500,
    shipping: 0,
    total: 7999,
    shippingAddress: {
      name: 'Rajesh Kumar',
      line1: '123, Green Park Society',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '+91 98765 43210',
    },
    paymentMethod: 'Net Banking',
    deliveryDate: '2024-02-02',
  },
  {
    id: 'ord-4',
    orderNumber: 'AS-2024-000987',
    date: '2024-01-15',
    status: 'cancelled',
    items: [
      {
        productId: 'prod-9',
        productName: 'Alternator Assembly',
        productImage: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500',
        quantity: 1,
        price: 12999,
      },
    ],
    subtotal: 12999,
    discount: 0,
    shipping: 0,
    total: 12999,
    shippingAddress: {
      name: 'Rajesh Kumar',
      line1: '123, Green Park Society',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '+91 98765 43210',
    },
    paymentMethod: 'Debit Card',
  },
];

// Wholesale orders (for wholesale users)
export const wholesaleOrders= [
  {
    id: 'word-1',
    orderNumber: 'ASW-2024-000123',
    date: '2024-02-12',
    status: 'confirmed',
    items: [
      {
        productId: 'prod-1',
        productName: 'Front Brake Disc Rotor',
        productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        quantity: 50,
        price: 2999,
      },
      {
        productId: 'prod-6',
        productName: 'Brake Pad Set - Front',
        productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        quantity: 100,
        price: 2599,
      },
    ],
    subtotal: 409850,
    discount: 20000,
    shipping: 0,
    total: 389850,
    shippingAddress: {
      name: 'AutoZone Parts Pvt Ltd',
      line1: 'Plot 45, MIDC Industrial Area',
      line2: 'Bhosari',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411026',
      phone: '+91 20 2712 3456',
    },
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'word-2',
    orderNumber: 'ASW-2024-000098',
    date: '2024-01-25',
    status: 'delivered',
    items: [
      {
        productId: 'prod-2',
        productName: 'Air Filter Element',
        productImage: 'https://images.unsplash.com/photo-1635784298843-1c3e7c9d6c30?w=500',
        quantity: 200,
        price: 749,
      },
      {
        productId: 'prod-5',
        productName: 'Engine Oil Filter',
        productImage: 'https://images.unsplash.com/photo-1635784298843-1c3e7c9d6c30?w=500',
        quantity: 250,
        price: 379,
      },
    ],
    subtotal: 244550,
    discount: 15000,
    shipping: 0,
    total: 229550,
    shippingAddress: {
      name: 'AutoZone Parts Pvt Ltd',
      line1: 'Plot 45, MIDC Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411026',
      phone: '+91 20 2712 3456',
    },
    paymentMethod: 'Bank Transfer',
    deliveryDate: '2024-02-01',
  },
];

// Helper functions
export const getUserOrders = (userId) => {
  return orders;
};

export const getWholesaleOrders = (userId) => {
  return wholesaleOrders;
};

export const getOrderById = (orderId) => {
  return [...orders, ...wholesaleOrders].find(o => o.id === orderId);
};

export const getOrderByNumber = (orderNumber) => {
  return [...orders, ...wholesaleOrders].find(o => o.orderNumber === orderNumber);
};
