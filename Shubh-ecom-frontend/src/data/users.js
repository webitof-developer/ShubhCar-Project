//src/data/users.js

/**
 * Static user data for profile pages
 */


export const retailUser = {
  id: 'user-1',
  firstName: 'Rajesh',
  lastName: 'Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '+91 98765 43210',
  authProvider: 'password',
  role: 'customer',
  customerType: 'retail',
  verificationStatus: 'not_required',
  status: 'active',
  emailVerified: true,
  createdAt: '2023-06-15',
  updatedAt: '2024-02-15',
  addresses: [
    {
      id: 'addr-1',
      label: 'Home',
      name: 'Rajesh Kumar',
      line1: '123, Green Park Society',
      line2: 'Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '+91 98765 43210',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Office',
      name: 'Rajesh Kumar',
      line1: '456, Corporate Tower',
      line2: 'BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+91 98765 43210',
      isDefault: false,
    },
  ],
};

export const wholesaleUser = {
  id: 'user-2',
  firstName: 'Suresh',
  lastName: 'Patel',
  email: 'suresh@autozonepartspvt.com',
  phone: '+91 20 2712 3456',
  authProvider: 'password',
  role: 'customer',
  customerType: 'wholesale',
  verificationStatus: 'approved',
  status: 'active',
  emailVerified: true,
  createdAt: '2022-11-10',
  updatedAt: '2024-02-10',
  wholesaleInfo: {
    businessName: 'AutoZone Parts Pvt Ltd',
    gstOrTaxId: '27AABCA1234D1ZV',
    documentUrls: [],
    address: 'Plot 45, MIDC Industrial Area, Bhosari, Pune 411026',
  },
  addresses: [
    {
      id: 'addr-3',
      label: 'Warehouse',
      name: 'AutoZone Parts Pvt Ltd',
      line1: 'Plot 45, MIDC Industrial Area',
      line2: 'Bhosari',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411026',
      phone: '+91 20 2712 3456',
      isDefault: true,
    },
  ],
};

export const getCurrentUser = () => retailUser;

export const getUserById = (userId) => {
  if (userId === 'user-1') return retailUser;
  if (userId === 'user-2') return wholesaleUser;
  return undefined;
};

export const isWholesaleUser = (user) => {
  return user.customerType === 'wholesale';
};
