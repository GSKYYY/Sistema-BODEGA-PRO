
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, RefreshCw, Lock, Layout, Shield, Tag, Server, Download, Box, Printer, Database, Gift, Percent, Globe, Plus, Trash2, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LATAM_CURRENCIES = [
    { code: 'USD', name: 'Dólar (Base)', symbol: '$', country: 'Internacional' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$', country: 'México' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$', country: 'Colombia' },
    { code: 'VES', name: 'Bolívar', symbol: 'Bs.', country: 'Venezuela' },
    { code: 'PEN', name: 'Sol', symbol: 'S/', country: 'Perú' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$', country: 'Chile' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$', country: 'Argentina' },
    { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', country: 'Rep. Dominicana' },
    { code: 'CRC', name: 'Colón', symbol: '₡', country: 'Costa Rica' },
    { code: 'GTQ', name: 'Quetzal', symbol: 'Q', country: 'Guatemala' },
    { code: 'HNL', name: 'Lempira', symbol: 'L', country: 'Honduras' },
    { code: 'NIO', name: 'Córdoba', symbol: 'C$', country: 'Nicaragua' },
    { code: 'PYG', name: 'Guaraní', symbol: '₲', country: 'Paraguay' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$', country: 'Uruguay' },
    { code: 'BOB', name: 'Boliviano', symbol: 'Bs', country: 'Bolivia' },
];

const COMMON_CATEGORIES = [
    "Alimentos", "Bebidas", "Licores", "Limpieza", "Higiene Personal", 
    "Snacks y Golosinas", "Charcutería", "Carnicería", "Frutas y Verduras", 
    "Panadería", "Farmacia", "Mascotas", "Papelería", "Hogar", "Cigarrillos", "Varios"
];

export const Settings: React.FC = () => {
  const { config, updateConfig, categories, addCategory, deleteCategory, resetSystem, clearSalesHistory, clearExpensesHistory, user, products, sales, clients, suppliers, expenses } = useData();
  const navigate = useNavigate();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Simplified Tabs: General, Appearance, Rules, Data
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'rules' | 'data'>('general');
  
  const [resetStep, setResetStep] = useState(0); 
  const [resetInput, setResetInput] = useState('');
  const [resetAction, setResetAction] = useState<'full' | 'sales' | 'expenses' | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    if (user?.role === 'employee') {
        navigate('/');
    }
  }, [user, navigate]);

  const handleConfigSave = () => {
    updateConfig(localConfig);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory({
        name: newCategoryName,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
    setNewCategoryName('');
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = LATAM_CURRENCIES.find(c => c.code === e.target.value);
      if (selected) {
          setLocalConfig({
              ...localConfig,
              currencyCode: selected.code,
              currencySymbol: selected.symbol,
              exchangeRate: selected.code === 'USD' ? 1 : localConfig.exchangeRate
          });
      }
  };

  const initReset = (action: 'full' | 'sales' | 'expenses') => {
    setResetAction(action);
    setResetStep(1);
  };

  const executeReset = () => {
    const confirmationWord = resetAction === 'full' ? 'BORRAR' : 'CONFIRMAR';
    if (resetInput === confirmationWord) {
        if (resetAction === 'full') resetSystem();
        if (resetAction === 'sales') clearSalesHistory();
        if (resetAction === 'expenses') clearExpensesHistory();
        
        setResetStep(0);
        setResetInput('');
        setResetAction(null);
    } else {
        alert('Palabra de confirmación incorrecta.');
    }
  };

  const handleExportData = () => {
    const data = { config, categories, products, sales, clients, suppliers, expenses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getButtonClass = () => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        emerald: 'bg-emerald-600 hover:bg-emerald-700',
        violet: 'bg-violet-600 hover:bg-violet-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
        rose: 'bg-rose-600 hover:bg-rose-700',
        slate: 'bg-slate-600 hover:bg-slate-700',
        christmas: 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white border-2 border-yellow-400',
    };
    return colors[config.theme] || 'bg-blue-600 hover:bg-blue-700';
  };

  if (user?.role === 'employee') return null;

  const tabs = [
    { id: 'general', icon: Layout, label: 'Negocio y Moneda' },
    { id: 'appearance', icon: Printer, label: 'Apariencia y Recibo' },
    { id: 'rules', icon: Sliders, label: 'Reglas y Permisos' },
    { id: 'data', icon: Database, label: 'Datos y Mantenimiento' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
            <p className="text-gray-500">Administre su negocio, moneda y permisos.</p>
        </div>
        <button 
            onClick={handleConfigSave}
            className={`text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95 font-bold ${getButtonClass()}`}
        >
            <Save size={20} />
            Guardar Cambios
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        {tabs.map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[150px] px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap text-sm ${
                    activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        
        {/* TAB: GENERAL (Business & Currency) */}
        {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Layout size={20}/> Identidad del Negocio
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            value={localConfig.businessName}
                            onChange={(e) => setLocalConfig({...localConfig, businessName: e.target.value})}
                        />
                         <p className="text-xs text-gray-500 mt-1">Se mostrará en la barra lateral y recibos.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Ubicación</label>
                        <textarea 
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            rows={3}
                            value={localConfig.address}
                            onChange={(e) => setLocalConfig({...localConfig, address: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Globe size={20} /> Moneda y Región
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2">País / Moneda Local</label>
                            <select 
                                className="w-full p-3 border border-blue-200 rounded-lg bg-white font-medium text-gray-800"
                                value={localConfig.currencyCode}
                                onChange={handleCurrencyChange}
                            >
                                {LATAM_CURRENCIES.map(curr => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.country} - {curr.name} ({curr.code})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-blue-600 mt-2">
                                Esta moneda se usará para conversiones y reportes locales.
                            </p>
                        </div>

                        {localConfig.currencyCode !== 'USD' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tasa de Cambio Actual
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                                        1 USD =
                                    </div>
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{localConfig.currencySymbol}</div>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-3 border rounded-lg font-bold text-green-600 text-lg"
                                            value={localConfig.exchangeRate}
                                            onChange={(e) => setLocalConfig({...localConfig, exchangeRate: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Percent size={16} className="text-gray-400"/> Impuesto / IVA (%)
                            </label>
                            <div className="relative w-1/2">
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="0"
                                    value={localConfig.taxRate || ''}
                                    onChange={(e) => setLocalConfig({...localConfig, taxRate: parseFloat(e.target.value) || 0})}
                                />
                                <span className="absolute right-3 top-2 text-gray-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: RULES (Operations & Permissions) */}
        {activeTab === 'rules' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Box size={20} /> Reglas de Inventario
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 border border-orange-100 bg-orange-50 rounded-lg">
                            <input 
                                type="checkbox"
                                id="negativeStock"
                                checked={localConfig.enableNegativeStock}
                                onChange={(e) => setLocalConfig({...localConfig, enableNegativeStock: e.target.checked})}
                                className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <div>
                                <label htmlFor="negativeStock" className="font-bold text-gray-800 cursor-pointer">Vender sin Stock</label>
                                <p className="text-sm text-gray-600 mt-1">
                                    Permite registrar ventas incluso si el inventario llega a cero (se volverá negativo).
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-800 mb-1">Alerta de Stock Bajo (Global)</label>
                            <div className="flex gap-3 items-center">
                                <input 
                                    type="number"
                                    className="w-24 p-2 border rounded-lg"
                                    value={localConfig.lowStockThreshold || 5}
                                    onChange={(e) => setLocalConfig({...localConfig, lowStockThreshold: parseInt(e.target.value)})}
                                />
                                <span className="text-sm text-gray-500">unidades restantes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Shield size={20} /> Permisos de Empleado
                    </h2>
                    
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 mb-2">Marque las acciones que los empleados pueden realizar:</p>
                        {[
                            { key: 'canViewCosts', label: 'Ver Costos y Ganancias' },
                            { key: 'canEditProducts', label: 'Crear/Editar Productos' },
                            { key: 'canViewDashboardStats', label: 'Ver Estadísticas Financieras' },
                            { key: 'canManageClients', label: 'Gestionar Clientes (Fiado)' },
                            { key: 'canAccessCashbox', label: 'Acceso a Caja Diaria' },
                            { key: 'canDeleteItems', label: 'Eliminar Registros (Peligroso)' },
                        ].map((perm) => (
                            <label key={perm.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={(localConfig.permissions as any)[perm.key]}
                                    onChange={(e) => setLocalConfig({
                                        ...localConfig,
                                        permissions: { ...localConfig.permissions, [perm.key]: e.target.checked }
                                    })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 font-medium">{perm.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* TAB: APPEARANCE (Theme & Receipt) */}
        {activeTab === 'appearance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Temas y Visualización</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Color del Sistema</label>
                        <div className="flex flex-wrap gap-3">
                            {['blue', 'emerald', 'violet', 'orange', 'rose', 'slate'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setLocalConfig({...localConfig, theme: color})}
                                    className={`w-10 h-10 rounded-full border-4 ${localConfig.theme === color ? 'border-gray-300 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: color === 'slate' ? '#475569' : `var(--color-${color}-500)` }}
                                >
                                    <div className={`w-full h-full rounded-full bg-${color}-500`}></div>
                                </button>
                            ))}
                             <button
                                onClick={() => setLocalConfig({...localConfig, theme: 'christmas'})}
                                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center bg-red-600 overflow-hidden ${localConfig.theme === 'christmas' ? 'border-yellow-400 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                title="Modo Navideño"
                            >
                                <Gift size={18} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Printer size={20} /> Diseño del Recibo
                    </h2>
                    
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ancho del Papel</label>
                            <select 
                                className="w-full p-2 border rounded-lg"
                                value={localConfig.receipt.paperSize || '58mm'}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, paperSize: e.target.value as any }})}
                            >
                                <option value="58mm">58mm (Estándar - Impresora Pequeña)</option>
                                <option value="80mm">80mm (Ancho - Impresora Grande)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                             <input 
                                type="checkbox"
                                id="showTax"
                                checked={localConfig.receipt.showTax}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, showTax: e.target.checked }})}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="showTax" className="text-sm text-gray-700">Mostrar desglose de Impuestos en recibo</label>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Mensaje Cabecera</label>
                            <input 
                                type="text"
                                className="w-full p-2 border rounded-lg text-sm mt-1"
                                value={localConfig.receipt.headerText}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, headerText: e.target.value }})}
                                placeholder="Ej. ¡Bienvenido!"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Mensaje Pie de Página</label>
                            <input 
                                type="text"
                                className="w-full p-2 border rounded-lg text-sm mt-1"
                                value={localConfig.receipt.footerText}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, footerText: e.target.value }})}
                                placeholder="Ej. Vuelva pronto"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: DATA (Categories, Backup, Reset) */}
        {activeTab === 'data' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                {/* Categories Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Tag size={20}/> Gestión de Categorías
                    </h2>
                    
                    <div className="flex gap-2 mb-6 max-w-md relative">
                        <input 
                            type="text" 
                            list="category-suggestions"
                            placeholder="Nombre o selecciona de la lista..." 
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <datalist id="category-suggestions">
                            {COMMON_CATEGORIES.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                        <button 
                            onClick={handleAddCategory}
                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                                    <span className="font-medium text-gray-700 truncate">{cat.name}</span>
                                </div>
                                <button 
                                    onClick={() => deleteCategory(cat.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Backup Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Download size={20} className="text-blue-600" />
                            Copia de Seguridad
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Descargue un archivo JSON con toda la información de su negocio (productos, ventas, clientes). Ideal para migrar datos o tener un respaldo local.
                        </p>
                        <button 
                            onClick={handleExportData}
                            className="w-full bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 font-bold flex items-center justify-center gap-2 border border-blue-100"
                        >
                            <Download size={18} />
                            Descargar Respaldo
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 h-full">
                        <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                            <Lock size={20} />
                            Zona de Peligro
                        </h2>
                        
                        {resetStep === 0 && (
                            <div className="space-y-3">
                                <button 
                                    onClick={() => initReset('sales')}
                                    className="w-full bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-sm font-medium"
                                >
                                    <Database size={16} />
                                    Borrar Solo Historial de Ventas
                                </button>
                                <button 
                                    onClick={() => initReset('expenses')}
                                    className="w-full bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-sm font-medium"
                                >
                                    <Database size={16} />
                                    Borrar Solo Historial de Gastos
                                </button>
                                <div className="border-t border-red-200 my-2"></div>
                                <button 
                                    onClick={() => initReset('full')}
                                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                                >
                                    <RefreshCw size={18} />
                                    RESTABLECER DE FÁBRICA (TODO)
                                </button>
                            </div>
                        )}

                        {resetStep === 1 && (
                            <div className="space-y-3 bg-white p-4 rounded-lg border border-red-200 animate-in fade-in">
                                <p className="text-gray-800 font-bold text-sm">
                                    {resetAction === 'full' ? '¿Borrar TODO el sistema?' : 
                                    resetAction === 'sales' ? '¿Borrar todas las ventas?' : '¿Borrar todos los gastos?'}
                                </p>
                                <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
                                
                                <p className="text-gray-700 text-sm mt-2">Escriba <span className="font-mono font-bold text-red-600">{resetAction === 'full' ? 'BORRAR' : 'CONFIRMAR'}</span>:</p>
                                <input 
                                    type="text" 
                                    value={resetInput} 
                                    onChange={(e) => setResetInput(e.target.value)} 
                                    className="border p-2 rounded w-full text-sm"
                                    placeholder={resetAction === 'full' ? 'BORRAR' : 'CONFIRMAR'}
                                    autoFocus
                                />
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => {setResetStep(0); setResetInput(''); setResetAction(null);}} className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 flex-1">Cancelar</button>
                                    <button onClick={executeReset} className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold flex-1">EJECUTAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
