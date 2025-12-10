
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, RefreshCw, Trash2, Plus, Lock, Layout, Shield, Tag, Server, Download, FileText, Gift, Percent, AlertTriangle, Box, Printer, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { config, updateConfig, categories, addCategory, deleteCategory, resetSystem, clearSalesHistory, clearExpensesHistory, user, products, sales, clients, suppliers, expenses } = useData();
  const navigate = useNavigate();
  
  // Local state for config form to avoid context thrashing on every keystroke
  const [localConfig, setLocalConfig] = useState(config);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'permissions' | 'appearance' | 'categories' | 'system'>('general');
  
  // Reset confirmation state
  const [resetStep, setResetStep] = useState(0); // 0: initial, 1: confirm, 2: input validation
  const [resetInput, setResetInput] = useState('');
  const [resetAction, setResetAction] = useState<'full' | 'sales' | 'expenses' | null>(null);

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
        color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
    });
    setNewCategoryName('');
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
    const data = {
        config,
        categories,
        products,
        sales,
        clients,
        suppliers,
        expenses
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Theme colors for UI
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
    { id: 'general', icon: Layout, label: 'Negocio' },
    { id: 'operations', icon: Box, label: 'Operaciones' },
    { id: 'permissions', icon: Shield, label: 'Permisos' },
    { id: 'appearance', icon: Printer, label: 'Apariencia' },
    { id: 'categories', icon: Tag, label: 'Categorías' },
    { id: 'system', icon: Server, label: 'Sistema' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
        <button 
            onClick={handleConfigSave}
            className={`text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${getButtonClass()}`}
        >
            <Save size={20} />
            Guardar Todo
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto bg-white p-1 rounded-xl shadow-sm border border-gray-100">
        {tabs.map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
                    activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Identidad del Negocio</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg"
                            value={localConfig.businessName}
                            onChange={(e) => setLocalConfig({...localConfig, businessName: e.target.value})}
                        />
                         <p className="text-xs text-gray-500 mt-1">Se mostrará en la barra lateral y recibos.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Ubicación</label>
                        <textarea 
                            className="w-full p-2 border rounded-lg"
                            rows={2}
                            value={localConfig.address}
                            onChange={(e) => setLocalConfig({...localConfig, address: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Monedas e Impuestos</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tasa BCV (Bs/$)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg font-bold text-green-600"
                                value={localConfig.exchangeRate}
                                onChange={(e) => setLocalConfig({...localConfig, exchangeRate: parseFloat(e.target.value)})}
                            />
                        </div>
                        {localConfig.showCop && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa COP (COP/$)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded-lg font-bold text-blue-600"
                                    value={localConfig.copExchangeRate}
                                    onChange={(e) => setLocalConfig({...localConfig, copExchangeRate: parseFloat(e.target.value)})}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Percent size={14} /> Impuesto / IVA (%)
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg"
                                placeholder="0"
                                value={localConfig.taxRate || ''}
                                onChange={(e) => setLocalConfig({...localConfig, taxRate: parseFloat(e.target.value) || 0})}
                            />
                            <span className="absolute right-3 top-2 text-gray-400">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Se sumará automáticamente al total en el Punto de Venta.</p>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: OPERATIONS (NEW) */}
        {activeTab === 'operations' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                        <Box size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Reglas de Inventario</h2>
                        <p className="text-gray-500">Controle cómo se comporta el sistema al vender.</p>
                    </div>
                </div>

                <div className="space-y-6 max-w-2xl">
                    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox"
                            id="negativeStock"
                            checked={localConfig.enableNegativeStock}
                            onChange={(e) => setLocalConfig({...localConfig, enableNegativeStock: e.target.checked})}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                            <label htmlFor="negativeStock" className="font-semibold text-gray-800 cursor-pointer">Permitir Stock Negativo</label>
                            <p className="text-sm text-gray-500 mt-1">
                                Si está activado, podrá vender productos incluso si el inventario llega a cero (quedará en negativo).
                                <br/><span className="text-orange-600 font-medium text-xs">Recomendado: Desactivar para mejor control.</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-gray-50">
                        <label className="block font-semibold text-gray-800 mb-1">Umbral de Alerta de Stock Bajo</label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="number"
                                className="w-24 p-2 border rounded-lg"
                                value={localConfig.lowStockThreshold || 5}
                                onChange={(e) => setLocalConfig({...localConfig, lowStockThreshold: parseInt(e.target.value)})}
                            />
                            <span className="text-sm text-gray-500">unidades</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Se mostrará una alerta en el panel cuando un producto tenga esta cantidad o menos (si no tiene un mínimo específico).
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: PERMISSIONS */}
        {activeTab === 'permissions' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Permisos de Empleado</h2>
                        <p className="text-gray-500">Controle qué pueden ver y hacer los usuarios con rol "Empleado".</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {[
                        { key: 'canViewCosts', label: 'Ver Costos y Ganancias', desc: 'Permite ver el precio de costo y margen de ganancia.' },
                        { key: 'canEditProducts', label: 'Crear/Editar Productos', desc: 'Permite agregar nuevos productos o modificar existentes.' },
                        { key: 'canViewDashboardStats', label: 'Ver Estadísticas Financieras', desc: 'Muestra totales de venta y ganancias en el panel principal.' },
                        { key: 'canManageClients', label: 'Gestionar Clientes', desc: 'Acceso al módulo de clientes y registro de abonos.' },
                        { key: 'canAccessCashbox', label: 'Acceso a Caja Diaria', desc: 'Permite ver el módulo de caja y registrar gastos.' },
                        { key: 'canDeleteItems', label: 'Eliminar Registros', desc: 'Permite eliminar productos, ventas o gastos.' },
                    ].map((perm) => (
                        <div key={perm.key} className="flex items-start gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                            <input 
                                type="checkbox"
                                id={perm.key}
                                checked={(localConfig.permissions as any)[perm.key]}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    permissions: { ...localConfig.permissions, [perm.key]: e.target.checked }
                                })}
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <label htmlFor={perm.key} className="font-semibold text-gray-800 cursor-pointer select-none">{perm.label}</label>
                                <p className="text-sm text-gray-500 mt-1">{perm.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: APPEARANCE */}
        {activeTab === 'appearance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Temas y Visualización</h2>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <input 
                                type="checkbox" 
                                id="showCop"
                                checked={localConfig.showCop}
                                onChange={(e) => setLocalConfig({...localConfig, showCop: e.target.checked})}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="showCop" className="text-sm text-gray-700">Habilitar Pesos Colombianos (COP)</label>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Color del Sistema</label>
                        <div className="grid grid-cols-7 gap-2">
                            {['blue', 'emerald', 'violet', 'orange', 'rose', 'slate'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setLocalConfig({...localConfig, theme: color})}
                                    className={`w-8 h-8 rounded-full border-2 ${localConfig.theme === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color === 'slate' ? '#475569' : `var(--color-${color}-500)` }}
                                >
                                    <div className={`w-full h-full rounded-full bg-${color}-500`}></div>
                                </button>
                            ))}
                             <button
                                onClick={() => setLocalConfig({...localConfig, theme: 'christmas'})}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-red-600 overflow-hidden ${localConfig.theme === 'christmas' ? 'border-yellow-400 scale-110' : 'border-transparent'}`}
                                title="Modo Navideño"
                            >
                                <Gift size={16} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Printer size={20} /> Configuración de Recibo
                    </h2>
                    
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de Papel</label>
                            <select 
                                className="w-full p-2 border rounded-lg"
                                value={localConfig.receipt.paperSize || '58mm'}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, paperSize: e.target.value as any }})}
                            >
                                <option value="58mm">58mm (Térmica Estándar)</option>
                                <option value="80mm">80mm (Térmica Ancha)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                             <input 
                                type="checkbox"
                                id="showTax"
                                checked={localConfig.receipt.showTax}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, showTax: e.target.checked }})}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="showTax" className="text-sm text-gray-700">Mostrar desglose de Impuestos</label>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500">Cabecera (Saludo)</label>
                            <input 
                                type="text"
                                className="w-full p-2 border rounded-lg text-sm"
                                value={localConfig.receipt.headerText}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, headerText: e.target.value }})}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Pie de Página (Despedida)</label>
                            <input 
                                type="text"
                                className="w-full p-2 border rounded-lg text-sm"
                                value={localConfig.receipt.footerText}
                                onChange={(e) => setLocalConfig({...localConfig, receipt: { ...localConfig.receipt, footerText: e.target.value }})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: CATEGORIES */}
        {activeTab === 'categories' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Categorías</h2>
                
                <div className="flex gap-2 mb-6 max-w-md">
                    <input 
                        type="text" 
                        placeholder="Nueva categoría..." 
                        className="flex-1 p-2 border rounded-lg"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button 
                        onClick={handleAddCategory}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                <span className="font-medium text-gray-700">{cat.name}</span>
                            </div>
                            <button 
                                onClick={() => deleteCategory(cat.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: SYSTEM */}
        {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Download size={20} className="text-blue-600" />
                        Respaldo de Datos
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                        Descargue una copia de seguridad de todos sus datos (productos, ventas, clientes) en formato JSON.
                    </p>
                    <button 
                        onClick={handleExportData}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
                    >
                        <Download size={18} />
                        Exportar Datos
                    </button>
                </div>

                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                        <Lock size={20} />
                        Gestión de Datos (Peligro)
                    </h2>
                    
                    {resetStep === 0 && (
                        <div className="space-y-3">
                             <button 
                                onClick={() => initReset('sales')}
                                className="w-full bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Database size={18} />
                                Borrar Historial de Ventas (Solo Ventas)
                            </button>
                            <button 
                                onClick={() => initReset('expenses')}
                                className="w-full bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Database size={18} />
                                Borrar Historial de Gastos (Solo Gastos)
                            </button>
                            <div className="border-t border-red-200 my-2"></div>
                            <button 
                                onClick={() => initReset('full')}
                                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-bold shadow-sm"
                            >
                                <RefreshCw size={18} />
                                RESTABLECER DE FÁBRICA (TODO)
                            </button>
                        </div>
                    )}

                    {resetStep === 1 && (
                        <div className="space-y-3 bg-white p-4 rounded-lg border border-red-200 animate-in fade-in">
                            <p className="text-gray-800 font-bold">
                                {resetAction === 'full' ? '¿Borrar TODO el sistema?' : 
                                 resetAction === 'sales' ? '¿Borrar todas las ventas?' : '¿Borrar todos los gastos?'}
                            </p>
                            <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
                            
                            <p className="text-gray-700 text-sm mt-2">Escriba <span className="font-mono font-bold text-red-600">{resetAction === 'full' ? 'BORRAR' : 'CONFIRMAR'}</span>:</p>
                            <input 
                                type="text" 
                                value={resetInput} 
                                onChange={(e) => setResetInput(e.target.value)} 
                                className="border p-2 rounded w-full"
                                placeholder={resetAction === 'full' ? 'BORRAR' : 'CONFIRMAR'}
                                autoFocus
                            />
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => {setResetStep(0); setResetInput(''); setResetAction(null);}} className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 flex-1">Cancelar</button>
                                <button onClick={executeReset} className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold flex-1">EJECUTAR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
