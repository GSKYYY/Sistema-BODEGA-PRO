
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Product, Category, Sale, Client, Supplier, Expense, AppConfig, Notification, User 
} from '../types';
import { db, auth } from '../firebaseConfig';
import { 
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, 
  setDoc, runTransaction, query, orderBy, where, getDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { MathUtils } from '../utils/math';

interface DataContextType {
  user: User | null;
  loading: boolean;
  login: () => void; // Handled in Login.tsx via Firebase Auth
  logout: () => void;

  products: Product[];
  categories: Category[];
  sales: Sale[];
  clients: Client[];
  suppliers: Supplier[];
  expenses: Expense[];
  config: AppConfig;
  notifications: Notification[];
  
  // Actions (Promise based for async feedback)
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  registerClientPayment: (clientId: string, amount: number) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  updateConfig: (config: AppConfig) => Promise<void>;
  resetSystem: () => Promise<void>;
  clearSalesHistory: () => Promise<void>;
  clearExpensesHistory: () => Promise<void>;
  
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotifications: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const INITIAL_CONFIG: AppConfig = {
  businessName: 'Mi Negocio',
  address: 'Dirección Local',
  exchangeRate: 45.00,
  copExchangeRate: 4200, 
  currencySymbol: '$',
  theme: 'blue',
  showCop: true,
  taxRate: 0,
  enableNegativeStock: true,
  lowStockThreshold: 5,
  receipt: {
    headerText: 'Gracias por su compra',
    footerText: '',
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role from Firestore
        let userData: any = null;
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            userData = userDoc.exists() ? userDoc.data() : null;
        } catch (e) {
            console.warn("Failed to fetch user data, falling back to basic auth", e);
        }
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData?.name || 'Usuario',
          role: userData?.role || 'employee',
          isAuthenticated: true
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Listeners (Only when authenticated)
  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => console.error("Error loading products:", error));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => console.error("Error loading categories:", error));

    // Order sales by date desc
    const qSales = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    }, (error) => console.error("Error loading sales:", error));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    }, (error) => console.error("Error loading clients:", error));

    // FIX: Conditional Subscription for Suppliers (Only Owner can read)
    // This prevents the "Missing or insufficient permissions" error for employees
    let unsubSuppliers = () => {};
    if (user.role === 'owner') {
        unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
        }, (error) => {
            console.warn("Access to suppliers denied or failed:", error);
            setSuppliers([]); // Graceful fallback
        });
    } else {
        setSuppliers([]);
    }

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    }, (error) => console.error("Error loading expenses:", error));

    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
      if (snap.exists()) {
        setConfig({ ...INITIAL_CONFIG, ...snap.data() });
      }
    }, (error) => console.error("Error loading config:", error));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSales();
      unsubClients();
      unsubSuppliers();
      unsubExpenses();
      unsubConfig();
    };
  }, [user]);

  // Notifications Helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: id }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const clearNotifications = () => setNotifications([]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // --- CRUD ACTIONS ---

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await addDoc(collection(db, 'products'), product);
      showNotification('Producto agregado', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error agregando producto', 'error');
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { ...product });
      showNotification('Producto actualizado', 'success');
    } catch (e) {
      showNotification('Error actualizando', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      showNotification('Producto eliminado', 'info');
    } catch (e) {
      showNotification('Error eliminando', 'error');
    }
  };

  // --- CRITICAL: SALES TRANSACTION ---
  const addSale = async (sale: Omit<Sale, 'id'>) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check stock for all items
        for (const item of sale.items) {
          const prodRef = doc(db, 'products', item.id);
          const prodDoc = await transaction.get(prodRef);
          
          if (!prodDoc.exists()) {
            throw new Error(`Producto ${item.name} no existe`);
          }

          const currentStock = prodDoc.data().stock;
          
          if (!config.enableNegativeStock && currentStock < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.name}`);
          }

          // 2. Deduct stock
          const newStock = MathUtils.sub(currentStock, item.quantity);
          transaction.update(prodRef, { stock: newStock });
        }

        // 3. Create Sale Document
        const newSaleRef = doc(collection(db, 'sales'));
        
        // FIX: Remove undefined keys to ensure Firestore compatibility
        // Firestore cannot handle 'undefined' values, so we delete them.
        const saleData = { ...sale, id: newSaleRef.id };
        (Object.keys(saleData) as (keyof typeof saleData)[]).forEach(key => {
            if ((saleData as any)[key] === undefined) {
                delete (saleData as any)[key];
            }
        });

        transaction.set(newSaleRef, saleData);

        // 4. Update Client Debt if credit
        if (sale.paymentMethod === 'credit' && sale.clientId) {
          const clientRef = doc(db, 'clients', sale.clientId);
          const clientDoc = await transaction.get(clientRef);
          if (clientDoc.exists()) {
            const newDebt = MathUtils.add(clientDoc.data().debt, sale.totalUsd);
            transaction.update(clientRef, { debt: newDebt });
          }
        }
      });
      
      showNotification(`Venta ${sale.number} registrada`, 'success');
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Error registrando venta', 'error');
      throw e; // Re-throw so UI can handle it
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    await addDoc(collection(db, 'clients'), client);
    showNotification('Cliente registrado', 'success');
  };

  const updateClient = async (client: Client) => {
    await updateDoc(doc(db, 'clients', client.id), { ...client });
    showNotification('Cliente actualizado', 'success');
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, 'clients', id));
  };

  const registerClientPayment = async (clientId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'clients', clientId);
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists()) throw new Error("Cliente no existe");

        const currentDebt = clientDoc.data().debt;
        const newDebt = Math.max(0, MathUtils.sub(currentDebt, amount));
        
        transaction.update(clientRef, { debt: newDebt });
        
        // Optional: Create a payment record
        const paymentRef = doc(collection(db, 'client_payments'));
        transaction.set(paymentRef, {
            clientId,
            amount,
            date: new Date().toISOString(),
            oldDebt: currentDebt,
            newDebt: newDebt
        });
      });
      showNotification('Pago registrado', 'success');
    } catch (e) {
      showNotification('Error registrando pago', 'error');
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    await addDoc(collection(db, 'suppliers'), supplier);
    showNotification('Proveedor registrado', 'success');
  };

  const updateSupplier = async (supplier: Supplier) => {
    await updateDoc(doc(db, 'suppliers', supplier.id), { ...supplier });
  };

  const deleteSupplier = async (id: string) => {
    await deleteDoc(doc(db, 'suppliers', id));
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(collection(db, 'expenses'), expense);
    showNotification('Gasto registrado', 'success');
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    await addDoc(collection(db, 'categories'), category);
    showNotification('Categoría agregada', 'success');
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
  };

  const updateConfig = async (newConfig: AppConfig) => {
    await setDoc(doc(db, 'config', 'main'), newConfig);
    setConfig(newConfig); // Optimistic update
    showNotification('Configuración guardada', 'success');
  };

  // --- BULK OPERATIONS ---
  const clearSalesHistory = async () => {
    showNotification('Contacte soporte para borrado masivo en nube', 'warning');
  };

  const clearExpensesHistory = async () => {
     showNotification('Contacte soporte para borrado masivo en nube', 'warning');
  };

  const resetSystem = async () => {
     showNotification('Reinicio de fábrica deshabilitado en producción', 'warning');
  };

  return (
    <DataContext.Provider value={{
      user, loading, login: () => {}, logout,
      products, categories, sales, clients, suppliers, expenses, config, notifications,
      addProduct, updateProduct, deleteProduct, 
      addSale, 
      addClient, updateClient, deleteClient, registerClientPayment,
      addSupplier, updateSupplier, deleteSupplier,
      addExpense, deleteExpense,
      addCategory, deleteCategory,
      updateConfig, resetSystem, clearSalesHistory, clearExpensesHistory,
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
