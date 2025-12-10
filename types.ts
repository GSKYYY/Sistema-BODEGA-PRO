
export interface Product {
  id: string; // Firestore ID
  code: string;
  name: string;
  categoryId: string; // Firestore ID
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  status: 'active' | 'inactive';
}

export interface Category {
  id: string; // Firestore ID
  name: string;
  color: string;
}

export interface CartItem extends Product {
  quantity: number;
  priceAtSale: number; // Snapshot of price at moment of sale
}

export interface Client {
  id: string; // Firestore ID
  name: string;
  identityCard: string;
  phone: string;
  debt: number;
  creditLimit: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: 'cash_bs' | 'cash_usd' | 'cash_cop' | 'transfer' | 'mobile_pay';
}

export interface Sale {
  id: string;
  number: string;
  date: string;
  totalUsd: number;
  totalBs: number;
  exchangeRate: number;
  paymentMethod: 'cash_usd' | 'cash_bs' | 'cash_cop' | 'mobile_pay' | 'transfer' | 'card' | 'credit';
  clientId?: string | null;
  items: CartItem[];
  taxAmount?: number;
}

export interface EmployeePermissions {
  canViewCosts: boolean;
  canEditProducts: boolean;
  canViewDashboardStats: boolean;
  canManageClients: boolean;
  canAccessCashbox: boolean;
  canDeleteItems: boolean;
}

export interface ReceiptConfig {
  headerText: string;
  footerText: string;
  paperSize: '58mm' | '80mm';
  showTax: boolean;
}

export interface AppConfig {
  businessName: string;
  address: string;
  exchangeRate: number;
  copExchangeRate: number;
  currencySymbol: string;
  theme: string;
  showCop: boolean;
  taxRate: number;
  enableNegativeStock: boolean;
  lowStockThreshold: number;
  permissions: EmployeePermissions;
  receipt: ReceiptConfig;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'employee';
  isAuthenticated: boolean;
}
