
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { Search, Plus, Edit, Trash2, X, Printer, Calculator, ArrowRight, UploadCloud } from 'lucide-react';
import { ProductImporter } from '../components/ProductImporter';

export const Inventory: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, config, user } = useData();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [profitMargin, setProfitMargin] = useState('');

  const initialFormState: Omit<Product, 'id'> = {
    code: '',
    name: '',
    categoryId: '',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'und',
    status: 'active'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Permissions
  const canEdit = user?.role === 'owner' || config.permissions.canEditProducts;
  const canViewCost = user?.role === 'owner' || config.permissions.canViewCosts;
  const canDelete = user?.role === 'owner' || config.permissions.canDeleteItems;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
    setShowCalculator(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Seguro que desea eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate code if empty
    const finalData = { ...formData };
    if (!finalData.code.trim()) {
        finalData.code = 'AUTO-' + Date.now().toString().slice(-6);
    }

    if (editingProduct) {
      updateProduct({ ...finalData, id: editingProduct.id });
    } else {
      addProduct(finalData);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
    setShowCalculator(false);
  };

  const handleCalculatePrice = () => {
    const margin = parseFloat(profitMargin);
    const cost = formData.costPrice;
    
    if (!isNaN(margin) && cost > 0 && margin < 100) {
        // Formula: Cost / (1 - Margin%)
        // Example: 100 / (1 - 0.30) = 142.85
        const price = cost / (1 - (margin / 100));
        setFormData(prev => ({ ...prev, salePrice: parseFloat(price.toFixed(2)) }));
        setShowCalculator(false);
        setProfitMargin('');
    } else {
        alert('Ingrese un margen válido (0-99) y asegúrese de que el costo sea mayor a 0');
    }
  };

  // Helper for button color
  const getButtonClass = () => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        emerald: 'bg-emerald-600 hover:bg-emerald-700',
        violet: 'bg-violet-600 hover:bg-violet-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
        rose: 'bg-rose-600 hover:bg-rose-700',
        slate: 'bg-slate-600 hover:bg-slate-700',
        christmas: 'bg-green-600 hover:bg-green-700 border-b-2 border-red-600',
    };
    return colors[config.theme] || 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="p-8">
      {/* Print Header */}
      <div className="print-only mb-6 text-center">
        <h1 className="text-2xl font-bold">{config.businessName}</h1>
        <p className="text-gray-600">Reporte de Inventario</p>
        <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
        <div className="mt-4 border-b border-gray-300"></div>
      </div>

      <div className="flex justify-between items-center mb-8 no-print flex-wrap gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
            <p className="text-gray-500">Gestión de productos y existencias</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => window.print()} 
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-sm"
            >
            <Printer size={20} />
            Imprimir
            </button>
            
            {canEdit && (
                <>
                <button 
                    onClick={() => setIsImportOpen(true)}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-200 transition-colors shadow-sm font-medium"
                >
                    <UploadCloud size={20} />
                    Importar
                </button>
                <button 
                    onClick={() => { setEditingProduct(null); setFormData(initialFormState); setIsModalOpen(true); setShowCalculator(false); }}
                    className={`${getButtonClass()} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium`}
                >
                    <Plus size={20} />
                    Nuevo Producto
                </button>
                </>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 no-print">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Categoría</th>
                {canViewCost && <th className="p-4 font-semibold">Costo ($)</th>}
                <th className="p-4 font-semibold">Venta ($)</th>
                <th className="p-4 font-semibold">Stock</th>
                {(canEdit || canDelete) && <th className="p-4 font-semibold text-center no-print">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-mono text-sm">{product.code}</td>
                    <td className="p-4 font-medium text-gray-800">{product.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {category?.name || 'N/A'}
                      </span>
                    </td>
                    {canViewCost && <td className="p-4 text-gray-600">${product.costPrice.toFixed(2)}</td>}
                    <td className="p-4 font-bold text-gray-800">${product.salePrice.toFixed(2)}</td>
                    <td className="p-4">
                        <span className={`font-semibold ${product.stock <= product.minStock ? 'text-red-500' : 'text-green-600'}`}>
                            {product.stock} {product.unit}
                        </span>
                    </td>
                    {(canEdit || canDelete) && (
                        <td className="p-4 no-print">
                        <div className="flex items-center justify-center gap-2">
                            {canEdit && <button onClick={() => handleEdit(product)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>}
                            {canDelete && <button onClick={() => handleDelete(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>}
                        </div>
                        </td>
                    )}
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                  <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                          <p>No se encontraron productos.</p>
                          {canEdit && <p className="text-sm mt-2 text-blue-500 cursor-pointer" onClick={() => setIsImportOpen(true)}>Intente importar desde Excel</p>}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Importer Modal */}
      {isImportOpen && (
          <ProductImporter 
            onClose={() => setIsImportOpen(false)} 
            onSuccess={() => { setIsImportOpen(false); setSearch(''); }} 
          />
      )}

      {/* Product Modal (Hidden on Print) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código (Opcional)</label>
                  <input type="text" className="w-full p-2 border rounded-lg" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Auto-generado si vacío" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select className="w-full p-2 border rounded-lg" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">Seleccione Categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <select className="w-full p-2 border rounded-lg" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                        <option value="und">Unidad</option>
                        <option value="kg">Kg</option>
                        <option value="lt">Litro</option>
                    </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo ($)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border rounded-lg" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} />
                </div>
                
                {/* Sale Price with Calculator */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta ($)</label>
                  <div className="flex gap-2">
                    <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full p-2 border rounded-lg font-bold text-gray-800" 
                        value={formData.salePrice} 
                        onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value)})} 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg border border-gray-300"
                        title="Calcular Precio por Margen"
                    >
                        <Calculator size={20} />
                    </button>
                  </div>

                  {/* Calculator Popover */}
                  {showCalculator && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-800 text-sm">Calcular Precio</h4>
                            <button type="button" onClick={() => setShowCalculator(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Margen de Ganancia (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className="w-full p-2 pr-8 border rounded-lg text-sm" 
                                        placeholder="30" 
                                        value={profitMargin}
                                        onChange={(e) => setProfitMargin(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                Formula: Costo / (1 - %)
                            </div>
                            <button 
                                type="button"
                                onClick={handleCalculatePrice}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                Aplicar <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                  <input required type="number" className="w-full p-2 border rounded-lg" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" className="w-full p-2 border rounded-lg" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" className={`flex-1 py-2 text-white font-medium rounded-lg ${getButtonClass()}`}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
