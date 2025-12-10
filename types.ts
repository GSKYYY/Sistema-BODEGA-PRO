
export interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  status: 'active' | 'inactive';
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Client {
  id: number;
  name: string;
  identityCard: string; // Cedula
  phone: string;
  debt: number;
  creditLimit: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: 'cash_bs' | 'cash_usd' | 'cash_cop' | 'transfer' | 'mobile_pay';
}

export interface Sale {
  id: string; // UUID
  number: string; // Readable ID (e.g., V-001)
  date: string;
  totalUsd: number;
  totalBs: number;
  exchangeRate: number;
  paymentMethod: 'cash_usd' | 'cash_bs' | 'cash_cop' | 'mobile_pay' | 'transfer' | 'card' | 'credit';
  clientId?: number;
  items: CartItem[];
  taxAmount?: number; // New field for tax
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
  exchangeRate: number; // BS
  copExchangeRate: number; // COP
  currencySymbol: string;
  theme: string;
  showCop: boolean;
  
  // New Business Logic Fields
  taxRate: number; // Percentage (e.g., 16)
  enableNegativeStock: boolean; // Allow selling with 0 stock
  lowStockThreshold: number; // Global default
  
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
  username: string;
  name: string;
  role: 'owner' | 'employee';
  isAuthenticated: boolean;
}
