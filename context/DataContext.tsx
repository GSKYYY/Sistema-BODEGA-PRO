
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Sale, Client, Supplier, Expense, AppConfig, Notification, User } from '../types';

interface DataContextType {
  user: User | null;
  login: (username: string, role: 'owner' | 'employee', name: string) => void;
  logout: () => void;

  products: Product[];
  categories: Category[];
  sales: Sale[];
  clients: Client[];
  suppliers: Supplier[];
  expenses: Expense[];
  config: AppConfig;
  notifications: Notification[];
  
  // Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  
  addSale: (sale: Sale) => void;
  
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: number) => void;
  registerClientPayment: (clientId: number, amount: number) => void;
  
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: number) => void;

  addExpense: (expense: Expense) => void;
  deleteExpense: (id: number) => void;

  addCategory: (category: Category) => void;
  deleteCategory: (id: number) => void;
  
  updateConfig: (config: AppConfig) => void;
  refreshData: () => void;
  resetSystem: () => void;
  clearSalesHistory: () => void;
  clearExpensesHistory: () => void;
  
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotifications: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Víveres', color: '#22c55e' },
  { id: 2, name: 'Bebidas', color: '#3b82f6' },
  { id: 3, name: 'Snacks', color: '#f59e0b' },
  { id: 4, name: 'Limpieza', color: '#06b6d4' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, code: 'P001', name: 'Harina Pan 1kg', categoryId: 1, costPrice: 0.9, salePrice: 1.2, stock: 45, minStock: 10, unit: 'und', status: 'active' },
  { id: 2, code: 'P002', name: 'Coca Cola 2L', categoryId: 2, costPrice: 1.5, salePrice: 2.0, stock: 20, minStock: 12, unit: 'und', status: 'active' },
  { id: 3, code: 'P003', name: 'Doritos Mega', categoryId: 3, costPrice: 2.5, salePrice: 3.5, stock: 5, minStock: 8, unit: 'und', status: 'active' },
  { id: 4, code: 'P004', name: 'Arroz Mary', categoryId: 1, costPrice: 0.8, salePrice: 1.1, stock: 50, minStock: 15, unit: 'und', status: 'active' },
  { id: 5, code: 'P005', name: 'Aceite Mazeite', categoryId: 1, costPrice: 2.5, salePrice: 3.2, stock: 12, minStock: 5, unit: 'und', status: 'active' },
  { id: 6, code: 'P006', name: 'Jabon en Polvo', categoryId: 4, costPrice: 1.8, salePrice: 2.5, stock: 18, minStock: 6, unit: 'und', status: 'active' },
];

const INITIAL_CONFIG: AppConfig = {
  businessName: 'Mi Negocio',
  address: 'Calle Principal, Local 1',
  exchangeRate: 45.00,
  copExchangeRate: 4200, 
  currencySymbol: '$',
  theme: 'blue',
  showCop: true,
  taxRate: 0,
  enableNegativeStock: true,
  lowStockThreshold: 5,
  receipt: {
    headerText: '¡Gracias por su compra!',
    footerText: 'No se aceptan devoluciones después de 24h.',
    paperSize: '58mm',
    showTax: false
  },
  permissions: {
    canViewCosts: false,
    canEditProducts: false,
    canViewDashboardStats: false,
    canManageClients: true,
    canAccessCashbox: true,
    canDeleteItems: false
  }
};

const INITIAL_CLIENTS: Client[] = [
  { id: 1, name: 'Cliente General', identityCard: '00000000', phone: '', debt: 0, creditLimit: 0 },
  { id: 2, name: 'Juan Perez', identityCard: 'V-12345678', phone: '0412-1234567', debt: 15.50, creditLimit: 50 },
  { id: 3, name: 'Maria Rodriguez', identityCard: 'V-87654321', phone: '0414-9876543', debt: 5.00, creditLimit: 30 },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Distribuidora Polar', contact: 'Carlos Ruiz', phone: '0414-0001122', email: 'ventas@polar.com', address: 'Zona Industrial' },
];

// Generate Realistic Historical Sales Data (Last 7 Days)
const generateMockSales = (): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) { // Extended to 30 days for better analytics
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Random number of sales per day (5 to 15)
    const salesCount = Math.floor(Math.random() * 10) + 5;

    for (let j = 0; j < salesCount; j++) {
      // Random Total between $10 and $60 per sale
      const totalUsd = parseFloat((Math.random() * 50 + 10).toFixed(2)); 
      
      // Random Payment Method
      const rand = Math.random();
      let method: any = 'cash_usd';
      if (rand > 0.7) method = 'mobile_pay';
      else if (rand > 0.5) method = 'cash_bs';
      else if (rand > 0.3) method = 'cash_cop';

      // Mock Items for profit calc
      const mockItems = [
          { ...INITIAL_PRODUCTS[0], quantity: Math.ceil(Math.random() * 5) },
          { ...INITIAL_PRODUCTS[1], quantity: Math.ceil(Math.random() * 2) }
      ];

      sales.push({
        id: `mock-${i}-${j}`,
        number: `V-${Date.now().toString().slice(-4)}-${i}${j}`,
        date: `${dateStr}T${10 + j}:00:00.000Z`, 
        totalUsd: totalUsd,
        totalBs: totalUsd * 45,
        exchangeRate: 45,
        paymentMethod: method,
        items: mockItems,
        clientId: undefined
      });
    }
  }
  return sales;
};

// Helper to safe load from localStorage
const getStoredData = <T,>(key: string, initialValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        }
        return initialValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return initialValue;
    }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Lazy initialization ensures data is loaded BEFORE the first render
  // This prevents race conditions and data loss on reload
  
  const [user, setUser] = useState<User | null>(() => {
    const u = getStoredData('user', null);
    // CRITICAL FIX: Verify the user object is valid and has a role (in case of old data)
    // If invalid, force logout (null) to prevent crashes
    if (u && (!u.role || !u.name)) {
        return null; 
    }
    return u;
  });
  
  const [products, setProducts] = useState<Product[]>(() => 
    getStoredData('products', INITIAL_PRODUCTS)
  );
  
  const [categories, setCategories] = useState<Category[]>(() => 
    getStoredData('categories', INITIAL_CATEGORIES)
  );
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const stored = window.localStorage.getItem('sales');
    return stored ? JSON.parse(stored) : generateMockSales();
  });
  
  const [clients, setClients] = useState<Client[]>(() => 
    getStoredData('clients', INITIAL_CLIENTS)
  );
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => 
    getStoredData('suppliers', INITIAL_SUPPLIERS)
  );
  
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    getStoredData('expenses', [])
  );
  
  const [config, setConfig] = useState<AppConfig>(() => {
     const stored = getStoredData('config', INITIAL_CONFIG);
     // Merge to ensure new fields (like permissions) exist even if localStorage has old config
     return { 
        ...INITIAL_CONFIG, 
        ...stored,
        permissions: { ...INITIAL_CONFIG.permissions, ...(stored.permissions || {}) },
        receipt: { ...INITIAL_CONFIG.receipt, ...(stored.receipt || {}) }
     }; 
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persist to LocalStorage whenever state changes
  useEffect(() => { if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user'); }, [user]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);

  // Low Stock Check on Mount
  useEffect(() => {
    const lowStock = products.filter(p => p.stock <= p.minStock && p.status === 'active');
    if (lowStock.length > 0) {
        setTimeout(() => {
            showNotification(`Atención: ${lowStock.length} productos con stock bajo`, 'warning');
        }, 1000);
    }
  }, []); 

  const login = (username: string, role: 'owner' | 'employee', name: string) => {
    setUser({ username, role, name, isAuthenticated: true });
  };

  const logout = () => {
    setUser(null);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: id }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
    showNotification('Producto agregado', 'success');
  };

  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    showNotification('Producto actualizado', 'success');
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showNotification('Producto eliminado', 'info');
  };

  const addSale = (sale: Sale) => {
    setSales(prev => [...prev, sale]);
    
    // Update stock
    const newProducts = [...products];
    sale.items.forEach(item => {
      const productIndex = newProducts.findIndex(p => p.id === item.id);
      if (productIndex > -1) {
        newProducts[productIndex].stock -= item.quantity;
      }
    });
    setProducts(newProducts);

    if (sale.paymentMethod === 'credit' && sale.clientId) {
      setClients(prev => prev.map(c => 
        c.id === sale.clientId ? { ...c, debt: c.debt + sale.totalUsd } : c
      ));
    }
    
    showNotification(`Venta ${sale.number} registrada`, 'success');
  };

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
    showNotification('Cliente registrado', 'success');
  };

  const updateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    showNotification('Cliente actualizado', 'success');
  };

  const deleteClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
    showNotification('Cliente eliminado', 'info');
  };

  const registerClientPayment = (clientId: number, amount: number) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, debt: Math.max(0, c.debt - amount) } : c
    ));
    showNotification(`Pago de $${amount} registrado`, 'success');
  };

  const addSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [...prev, supplier]);
    showNotification('Proveedor registrado', 'success');
  };

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    showNotification('Proveedor actualizado', 'success');
  };

  const deleteSupplier = (id: number) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    showNotification('Proveedor eliminado', 'info');
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    showNotification('Gasto registrado', 'success');
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showNotification('Gasto eliminado', 'info');
  };

  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
    showNotification('Categoría agregada', 'success');
  };

  const deleteCategory = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showNotification('Categoría eliminada', 'info');
  };

  const updateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    showNotification('Configuración guardada', 'success');
  };

  const refreshData = () => {};

  const clearSalesHistory = () => {
    setSales([]);
    showNotification('Historial de ventas eliminado', 'warning');
  };

  const clearExpensesHistory = () => {
    setExpenses([]);
    showNotification('Historial de gastos eliminado', 'warning');
  };

  const resetSystem = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setSales([]); 
    setClients(INITIAL_CLIENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setExpenses([]);
    setConfig(prev => ({...INITIAL_CONFIG, businessName: prev.businessName}));
    showNotification('Sistema reiniciado de fábrica', 'warning');
  };

  return (
    <DataContext.Provider value={{
      user, login, logout,
      products, categories, sales, clients, suppliers, expenses, config, notifications,
      addProduct, updateProduct, deleteProduct, 
      addSale, 
      addClient, updateClient, deleteClient, registerClientPayment,
      addSupplier, updateSupplier, deleteSupplier,
      addExpense, deleteExpense,
      addCategory, deleteCategory,
      updateConfig, refreshData, resetSystem, clearSalesHistory, clearExpensesHistory,
      showNotification, clearNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
