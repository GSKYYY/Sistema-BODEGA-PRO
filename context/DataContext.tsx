
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  Product, Category, Sale, Client, Supplier, Expense, AppConfig, Notification, User 
} from '../types';
import { db, auth } from '../firebaseConfig';
import { 
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, 
  setDoc, runTransaction, query, orderBy, getDoc, writeBatch 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { MathUtils } from '../utils/math';

interface DataContextType {
  user: User | null;
  loading: boolean;
  login: () => void; // Handled in Login.tsx via Firebase Auth
  loginDemo: (role: 'owner' | 'employee') => void; 
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
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  // Updated signature for smart import
  bulkAddProducts: (products: any[]) => Promise<{ added: number; updated: number; errors: number }>;
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

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const INITIAL_CONFIG: AppConfig = {
  businessName: 'Mi Negocio',
  address: 'Dirección Local',
  
  currencyCode: 'USD',
  currencySymbol: '$',
  exchangeRate: 1, 

  theme: 'blue',
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

// --- HELPER FOR DEMO DATA PERSISTENCE ---
const useLocalStorage = (key: string, initialValue: any) => {
    const read = () => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    };
    const write = (value: any) => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Local storage full or error", error);
        }
    };
    return { read, write };
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
  
  // Refs
  const hasNotifiedStock = useRef(false);
  const hasNotifiedDebt = useRef(false);

  // Storage Helpers for Demo Mode
  const localProducts = useLocalStorage('demo_products', []);
  const localCategories = useLocalStorage('demo_categories', []);
  const localSales = useLocalStorage('demo_sales', []);
  const localClients = useLocalStorage('demo_clients', []);
  const localSuppliers = useLocalStorage('demo_suppliers', []);
  const localExpenses = useLocalStorage('demo_expenses', []);
  const localConfig = useLocalStorage('demo_config', INITIAL_CONFIG);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, timestamp: id }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const isDemo = user?.uid.startsWith('demo-');
  const isFirebaseAvailable = db && !(db as any)._isMock;
  const isAuthAvailable = auth && !(auth as any)._isMock;

  // 1. Auth Listener
  useEffect(() => {
    if (!isAuthAvailable) {
        console.warn("Auth service unavailable, checking local storage for session.");
        const demoUser = localStorage.getItem('bodega_demo_user');
        if (demoUser) {
            setUser(JSON.parse(demoUser));
        } else {
            setUser(null);
        }
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData: any = null;
        try {
            if (isFirebaseAvailable) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                userData = userDoc.exists() ? userDoc.data() : null;
            }
        } catch (e) {
            console.warn("Failed to fetch user data", e);
        }
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData?.name || 'Usuario',
          role: userData?.role || 'owner',
          isAuthenticated: true
        });
      } else {
        const demoUser = localStorage.getItem('bodega_demo_user');
        if (demoUser) {
            setUser(JSON.parse(demoUser));
        } else {
            setUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isAuthAvailable, isFirebaseAvailable]);

  // 2. Data Synchronization (Firebase vs LocalStorage)
  useEffect(() => {
    if (!user) return;

    if (isDemo) {
        setProducts(localProducts.read());
        setCategories(localCategories.read());
        setSales(localSales.read());
        setClients(localClients.read());
        setSuppliers(localSuppliers.read());
        setExpenses(localExpenses.read());
        setConfig(localConfig.read());
        return; 
    }

    if (!isFirebaseAvailable) {
        showNotification("Conexión a Base de Datos no disponible", "error");
        return;
    }

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (e) => console.log("Offline/Cache Mode for Products"));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    const qSales = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => {
          const data = d.data();
          return { 
              id: d.id, 
              ...data,
              totalLocal: data.totalLocal || data.totalBs || 0,
              paymentMethod: (data.paymentMethod === 'cash_bs' || data.paymentMethod === 'cash_cop') ? 'cash_local' : data.paymentMethod
          } as Sale;
      }));
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    });

    let unsubSuppliers = () => {};
    if (user.role === 'owner') {
        unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
        });
    }

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(d => {
          const data = d.data();
           return {
               id: d.id,
               ...data,
               paymentMethod: (data.paymentMethod === 'cash_bs' || data.paymentMethod === 'cash_cop') ? 'cash_local' : data.paymentMethod
           } as Expense
      }));
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({ 
            ...INITIAL_CONFIG, 
            ...data,
            currencyCode: data.currencyCode || (data.showCop ? 'COP' : 'VES'), 
            currencySymbol: data.currencySymbol || (data.showCop ? '$' : 'Bs.'),
            exchangeRate: data.exchangeRate || 1
        });
      }
    });

    return () => {
      unsubProducts(); unsubCategories(); unsubSales(); unsubClients();
      unsubSuppliers(); unsubExpenses(); unsubConfig();
    };
  }, [user?.uid, isDemo, isFirebaseAvailable]);

  // 3. Alerts
  useEffect(() => {
    if (loading || !user) return;
    const checkAlerts = () => {
        const lowStockItems = products.filter(p => p.stock <= p.minStock && p.status === 'active');
        if (lowStockItems.length > 0 && !hasNotifiedStock.current) {
            showNotification(`⚠️ Alerta: ${lowStockItems.length} productos con stock bajo`, 'warning');
            hasNotifiedStock.current = true;
        }
        const highDebtClients = clients.filter(c => c.id !== '1' && c.debt > 0 && c.debt >= (c.creditLimit * 0.9));
        if (highDebtClients.length > 0 && !hasNotifiedDebt.current && user.role === 'owner') {
            showNotification(`💰 Cobranza: ${highDebtClients.length} clientes cerca del límite`, 'info');
            hasNotifiedDebt.current = true;
        }
    };
    const timer = setTimeout(checkAlerts, 2000);
    return () => clearTimeout(timer);
  }, [products, clients, user, loading]);

  const clearNotifications = () => setNotifications([]);
  
  const logout = async () => { 
      try { if (isAuthAvailable) await signOut(auth); } catch (e) {}
      localStorage.removeItem('bodega_demo_user');
      setUser(null); 
  };

  const loginDemo = (role: 'owner' | 'employee') => {
      const demoUser: User = {
          uid: 'demo-' + Date.now(),
          email: role === 'owner' ? 'admin@demo.com' : 'vendedor@demo.com',
          name: role === 'owner' ? 'Admin Demo' : 'Vendedor Demo',
          role: role,
          isAuthenticated: true
      };
      setUser(demoUser);
      localStorage.setItem('bodega_demo_user', JSON.stringify(demoUser));
      showNotification('Modo Demo Activado (Datos Locales)', 'success');
  };

  // --- CRUD ACTIONS ---

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (isDemo) {
        const newProduct = { ...productData, id: 'local-' + Date.now() };
        const newProducts = [...products, newProduct];
        setProducts(newProducts);
        localProducts.write(newProducts);
        showNotification('Producto guardado', 'success');
        return;
    }
    if (!isFirebaseAvailable) { showNotification('Error: Sin conexión', 'error'); return; }
    try { await addDoc(collection(db, 'products'), productData); showNotification('Producto guardado', 'success'); } 
    catch (e) { showNotification('Error guardando', 'error'); }
  };

  // --- SMART BULK IMPORT LOGIC ---
  const bulkAddProducts = async (importData: any[]) => {
    let addedCount = 0;
    let updatedCount = 0;

    if (isDemo) {
        // Simple demo logic
        const timestamp = Date.now();
        const modeledProducts = importData.map((p, idx) => ({ 
            ...p, 
            id: `local-import-${timestamp}-${idx}`,
            // In demo, we just assign the raw string as ID for simplicity if cat doesn't exist
            categoryId: categories.find(c => c.name.toLowerCase() === p.categoryName?.toLowerCase())?.id || '1' 
        }));
        const updatedList = [...products, ...modeledProducts];
        setProducts(updatedList);
        localProducts.write(updatedList);
        showNotification(`${importData.length} productos importados (Local)`, 'success');
        return { added: importData.length, updated: 0, errors: 0 };
    }

    if (!isFirebaseAvailable) { 
        showNotification('Error: Sin conexión', 'error'); 
        return { added: 0, updated: 0, errors: importData.length };
    }

    try {
        const batchSize = 450; // Firestore limit 500
        let batch = writeBatch(db);
        let opCount = 0;

        // 1. Prepare Indexes for existing data
        const productMap = new Map(products.map(p => [p.code.toLowerCase(), p.id]));
        const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

        // 2. Identify and Create New Categories first
        const distinctCategories = new Set(importData.map(d => d.categoryName).filter(Boolean));
        
        for (const catName of distinctCategories) {
            const normalized = String(catName).toLowerCase();
            if (!categoryMap.has(normalized)) {
                const newCatRef = doc(collection(db, 'categories'));
                batch.set(newCatRef, {
                    name: catName,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                });
                categoryMap.set(normalized, newCatRef.id);
                opCount++;
            }
        }

        // 3. Process Products
        for (const item of importData) {
            // Commit batch if getting full
            if (opCount >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }

            const catId = categoryMap.get(String(item.categoryName).toLowerCase()) || categories[0]?.id || '';
            
            // Clean object for Firestore
            const productData = {
                code: item.code,
                name: item.name,
                salePrice: Number(item.salePrice),
                costPrice: Number(item.costPrice),
                stock: Number(item.stock),
                minStock: Number(item.minStock || 5),
                unit: item.unit || 'und',
                status: 'active',
                categoryId: catId
            };

            const existingId = productMap.get(String(item.code).toLowerCase());

            if (existingId) {
                // UPDATE existing
                const ref = doc(db, 'products', existingId);
                batch.update(ref, productData);
                updatedCount++;
            } else {
                // CREATE new
                const ref = doc(collection(db, 'products'));
                batch.set(ref, productData);
                addedCount++;
            }
            opCount++;
        }

        // Commit remaining
        if (opCount > 0) {
            await batch.commit();
        }

        showNotification(`Importación: ${addedCount} nuevos, ${updatedCount} actualizados`, 'success');
        return { added: addedCount, updated: updatedCount, errors: 0 };

    } catch (e) {
        console.error(e);
        showNotification('Error crítico en importación masiva', 'error');
        return { added: 0, updated: 0, errors: importData.length };
    }
  };

  const updateProduct = async (product: Product) => {
    if (isDemo) {
        const newProducts = products.map(p => p.id === product.id ? product : p);
        setProducts(newProducts);
        localProducts.write(newProducts);
        showNotification('Producto actualizado', 'success');
        return;
    }
    if (!isFirebaseAvailable) return;
    try { await updateDoc(doc(db, 'products', product.id), { ...product }); showNotification('Producto actualizado', 'success'); } 
    catch (e) { showNotification('Error actualizando', 'error'); }
  };

  const deleteProduct = async (id: string) => {
    if (isDemo) {
        const newProducts = products.filter(p => p.id !== id);
        setProducts(newProducts);
        localProducts.write(newProducts);
        showNotification('Producto eliminado', 'info');
        return;
    }
    if (!isFirebaseAvailable) return;
    try { await deleteDoc(doc(db, 'products', id)); showNotification('Producto eliminado', 'info'); } 
    catch (e) { showNotification('Error eliminando', 'error'); }
  };

  // ... (Remaining methods: addSale, addClient, etc. stay the same)
  const addSale = async (sale: Omit<Sale, 'id'>) => {
    if (isDemo) {
        // ... (Demo logic remains same)
        const currentProducts = [...products];
        for (const item of sale.items) {
            const prodIndex = currentProducts.findIndex(p => p.id === item.id);
            if (prodIndex >= 0) {
                const currentStock = currentProducts[prodIndex].stock;
                if (!config.enableNegativeStock && currentStock < item.quantity) throw new Error(`Stock insuficiente: ${item.name}`);
                currentProducts[prodIndex] = { 
                    ...currentProducts[prodIndex], 
                    stock: MathUtils.sub(currentStock, item.quantity) 
                };
            }
        }
        setProducts(currentProducts);
        localProducts.write(currentProducts);

        if (sale.paymentMethod === 'credit' && sale.clientId) {
            const currentClients = [...clients];
            const clientIndex = currentClients.findIndex(c => c.id === sale.clientId);
            if (clientIndex >= 0) {
                currentClients[clientIndex] = {
                    ...currentClients[clientIndex],
                    debt: MathUtils.add(currentClients[clientIndex].debt, sale.totalUsd)
                };
                setClients(currentClients);
                localClients.write(currentClients);
            }
        }

        const newSale = { ...sale, id: 'local-sale-' + Date.now() };
        const newSales = [newSale, ...sales];
        setSales(newSales);
        localSales.write(newSales);
        showNotification(`Venta ${sale.number} registrada`, 'success');
        return;
    }

    if (!isFirebaseAvailable) { showNotification('Error: Sin conexión', 'error'); return; }

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of sale.items) {
          const prodRef = doc(db, 'products', item.id);
          const prodDoc = await transaction.get(prodRef);
          if (!prodDoc.exists()) throw new Error(`Producto ${item.name} no existe`);
          const currentStock = prodDoc.data().stock;
          if (!config.enableNegativeStock && currentStock < item.quantity) throw new Error(`Stock insuficiente para ${item.name}`);
          transaction.update(prodRef, { stock: MathUtils.sub(currentStock, item.quantity) });
        }
        const newSaleRef = doc(collection(db, 'sales'));
        const saleData = { ...sale, id: newSaleRef.id };
        (Object.keys(saleData) as (keyof typeof saleData)[]).forEach(key => { if ((saleData as any)[key] === undefined) delete (saleData as any)[key]; });
        transaction.set(newSaleRef, saleData);
        if (sale.paymentMethod === 'credit' && sale.clientId) {
          const clientRef = doc(db, 'clients', sale.clientId);
          const clientDoc = await transaction.get(clientRef);
          if (clientDoc.exists()) transaction.update(clientRef, { debt: MathUtils.add(clientDoc.data().debt, sale.totalUsd) });
        }
      });
      showNotification(`Venta ${sale.number} registrada`, 'success');
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Error registrando venta', 'error');
      throw e;
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => { 
      if (isDemo) {
          const newClient = { ...client, id: 'local-client-' + Date.now() };
          const newClients = [...clients, newClient];
          setClients(newClients);
          localClients.write(newClients);
          showNotification('Cliente registrado', 'success');
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await addDoc(collection(db, 'clients'), client); showNotification('Cliente registrado', 'success'); } catch(e) { showNotification('Error', 'error'); } 
  };
  
  const updateClient = async (client: Client) => { 
      if (isDemo) {
          const newClients = clients.map(c => c.id === client.id ? client : c);
          setClients(newClients);
          localClients.write(newClients);
          showNotification('Cliente actualizado', 'success');
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await updateDoc(doc(db, 'clients', client.id), { ...client }); showNotification('Cliente actualizado', 'success'); } catch(e) { showNotification('Error', 'error'); } 
  };
  
  const deleteClient = async (id: string) => { 
      if (isDemo) {
          const newClients = clients.filter(c => c.id !== id);
          setClients(newClients);
          localClients.write(newClients);
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await deleteDoc(doc(db, 'clients', id)); } catch(e) {} 
  };

  const registerClientPayment = async (clientId: string, amount: number) => {
    if (isDemo) {
        const currentClients = [...clients];
        const index = currentClients.findIndex(c => c.id === clientId);
        if (index >= 0) {
            currentClients[index] = {
                ...currentClients[index],
                debt: Math.max(0, MathUtils.sub(currentClients[index].debt, amount))
            };
            setClients(currentClients);
            localClients.write(currentClients);
            showNotification('Abono registrado', 'success');
        }
        return;
    }
    if (!isFirebaseAvailable) return;
    try {
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'clients', clientId);
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists()) throw new Error("Cliente no existe");
        const currentDebt = clientDoc.data().debt;
        transaction.update(clientRef, { debt: Math.max(0, MathUtils.sub(currentDebt, amount)) });
        const paymentRef = doc(collection(db, 'client_payments'));
        transaction.set(paymentRef, { clientId, amount, date: new Date().toISOString(), oldDebt: currentDebt, newDebt: Math.max(0, MathUtils.sub(currentDebt, amount)) });
      });
      showNotification('Pago registrado', 'success');
    } catch (e) { showNotification('Error', 'error'); }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => { 
      if (isDemo) {
          const newSup = { ...supplier, id: 'local-sup-' + Date.now() };
          const newSups = [...suppliers, newSup];
          setSuppliers(newSups);
          localSuppliers.write(newSups);
          showNotification('Proveedor registrado', 'success');
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await addDoc(collection(db, 'suppliers'), supplier); showNotification('Proveedor registrado', 'success'); } catch(e) {} 
  };
  
  const updateSupplier = async (supplier: Supplier) => { 
      if (isDemo) {
          const newSups = suppliers.map(s => s.id === supplier.id ? supplier : s);
          setSuppliers(newSups);
          localSuppliers.write(newSups);
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await updateDoc(doc(db, 'suppliers', supplier.id), { ...supplier }); } catch(e) {} 
  };
  
  const deleteSupplier = async (id: string) => { 
      if (isDemo) {
          const newSups = suppliers.filter(s => s.id !== id);
          setSuppliers(newSups);
          localSuppliers.write(newSups);
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await deleteDoc(doc(db, 'suppliers', id)); } catch(e) {} 
  };
  
  const addExpense = async (expense: Omit<Expense, 'id'>) => { 
      if (isDemo) {
          const newExp = { ...expense, id: 'local-exp-' + Date.now() };
          const newExps = [newExp, ...expenses];
          setExpenses(newExps);
          localExpenses.write(newExps);
          showNotification('Gasto registrado', 'success');
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await addDoc(collection(db, 'expenses'), expense); showNotification('Gasto registrado', 'success'); } catch(e) {} 
  };
  
  const deleteExpense = async (id: string) => { 
      if (isDemo) {
          const newExps = expenses.filter(e => e.id !== id);
          setExpenses(newExps);
          localExpenses.write(newExps);
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await deleteDoc(doc(db, 'expenses', id)); } catch(e) {} 
  };
  
  const addCategory = async (category: Omit<Category, 'id'>) => { 
      if (isDemo) {
          const newCat = { ...category, id: 'local-cat-' + Date.now() };
          const newCats = [...categories, newCat];
          setCategories(newCats);
          localCategories.write(newCats);
          showNotification('Categoría agregada', 'success');
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await addDoc(collection(db, 'categories'), category); showNotification('Categoría agregada', 'success'); } catch(e) {} 
  };
  
  const deleteCategory = async (id: string) => { 
      if (isDemo) {
          const newCats = categories.filter(c => c.id !== id);
          setCategories(newCats);
          localCategories.write(newCats);
          return;
      }
      if (!isFirebaseAvailable) return;
      try { await deleteDoc(doc(db, 'categories', id)); } catch(e) {} 
  };
  
  const updateConfig = async (newConfig: AppConfig) => {
    if (isDemo) {
        setConfig(newConfig);
        localConfig.write(newConfig);
        showNotification('Configuración guardada (Local)', 'success');
        return;
    }
    if (!isFirebaseAvailable) return;
    try {
        await setDoc(doc(db, 'config', 'main'), newConfig);
        setConfig(newConfig);
        showNotification('Configuración guardada', 'success');
    } catch (e) {
        showNotification('Error al guardar configuración', 'error');
    }
  };

  const clearSalesHistory = async () => { 
      if (isDemo) {
          setSales([]);
          localSales.write([]);
          showNotification('Historial de ventas borrado (Demo)', 'warning');
          return;
      }
      showNotification('Contacte soporte para borrado masivo en nube', 'warning'); 
  };
  
  const clearExpensesHistory = async () => { 
      if (isDemo) {
          setExpenses([]);
          localExpenses.write([]);
          showNotification('Historial de gastos borrado (Demo)', 'warning');
          return;
      }
      showNotification('Contacte soporte para borrado masivo en nube', 'warning'); 
  };
  
  const resetSystem = async () => { 
      if (isDemo) {
          localStorage.clear();
          window.location.reload();
          return;
      }
      showNotification('Reinicio de fábrica deshabilitado en producción', 'warning'); 
  };

  return (
    <DataContext.Provider value={{
      user, loading, login: () => {}, loginDemo, logout,
      products, categories, sales, clients, suppliers, expenses, config, notifications,
      addProduct, bulkAddProducts, updateProduct, deleteProduct, addSale, 
      addClient, updateClient, deleteClient, registerClientPayment,
      addSupplier, updateSupplier, deleteSupplier, addExpense, deleteExpense,
      addCategory, deleteCategory, updateConfig, resetSystem, clearSalesHistory, clearExpensesHistory,
      showNotification, clearNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};
