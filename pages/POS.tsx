
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Sale } from '../types';
import { MathUtils } from '../utils/math';
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingBag, ShoppingCart, CheckCircle, Printer, X, AlertOctagon, Loader2 } from 'lucide-react';

export const POS: React.FC = () => {
  const { products, categories, config, addSale, clients, showNotification } = useData();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Changed to string
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_usd');
  const [selectedClient, setSelectedClient] = useState<string | null>(null); // Changed to string
  
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
      return matchesSearch && matchesCategory && p.status === 'active';
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product: Product) => {
    if (!config.enableNegativeStock && product.stock <= 0) {
        showNotification('Stock insuficiente y ventas negativas desactivadas', 'error');
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (!config.enableNegativeStock && existing.quantity >= product.stock) {
             showNotification('No hay más stock disponible', 'warning');
             return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, priceAtSale: product.salePrice }];
    });
  };

  const updateQuantity = (id: string, delta: number) => { // id is string
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (!config.enableNegativeStock && delta > 0 && newQty > item.stock) {
             return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => { // id is string
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calculations using MathUtils
  const subtotalUsd = cart.reduce((sum, item) => MathUtils.add(sum, MathUtils.mul(item.salePrice, item.quantity)), 0);
  const taxAmount = config.taxRate > 0 ? MathUtils.percent(subtotalUsd, config.taxRate) : 0;
  const totalUsd = MathUtils.add(subtotalUsd, taxAmount);
  
  const totalBs = MathUtils.mul(totalUsd, config.exchangeRate);
  const totalCop = MathUtils.mul(totalUsd, config.copExchangeRate);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    // Generate readable ID client-side (server transaction will handle safety)
    const saleNumber = 'V-' + Date.now().toString().slice(-6);
    
    try {
        await addSale({
          number: saleNumber,
          date: new Date().toISOString(),
          totalUsd,
          totalBs,
          exchangeRate: config.exchangeRate,
          paymentMethod: paymentMethod as any,
          clientId: selectedClient || undefined,
          items: cart,
          taxAmount
        });

        // Store for receipt
        setLastSale({
          id: 'temp', 
          number: saleNumber,
          date: new Date().toISOString(),
          totalUsd, totalBs, exchangeRate: config.exchangeRate, paymentMethod: paymentMethod as any, items: cart, taxAmount
        });
        
        setCheckoutSuccess(true);
        setCart([]);
    } catch (error) {
        // Error is handled in context notifications
    } finally {
        setIsProcessing(false);
    }
  };

  const resetCheckout = () => {
      setIsCheckoutOpen(false);
      setCheckoutSuccess(false);
      setLastSale(null);
      setAmountPaid('');
      setSearch('');
      setPaymentMethod('cash_usd');
      setSelectedClient(null);
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash_usd') return MathUtils.sub(paid, totalUsd);
    if (paymentMethod === 'cash_bs') return MathUtils.sub(paid, totalBs);
    if (paymentMethod === 'cash_cop') return MathUtils.sub(paid, totalCop);
    return 0;
  };

  const change = calculateChange();

  // Button Class Helper
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
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-gray-50">
      
      {/* Product Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Search & Categories */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o código..." 
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === null ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
          {filteredProducts.map(product => {
             const isOutOfStock = product.stock <= 0;
             const isDisabled = isOutOfStock && !config.enableNegativeStock;

             return (
                <div 
                key={product.id} 
                className={`bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md 
                    ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'border-gray-100 hover:border-blue-300'}`}
                onClick={() => !isDisabled && addToCart(product)}
                >
                <div className="h-24 w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 relative">
                    {isDisabled && <AlertOctagon className="text-red-400 absolute" size={32} />}
                    <ShoppingBag size={32} />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600">${product.salePrice.toFixed(2)}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${product.stock > product.minStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock} {product.unit}
                    </span>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={20} />
            Ticket Actual
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <ShoppingBag size={48} className="opacity-20" />
                <p>Carrito vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">${item.salePrice.toFixed(2)}</span>
                    <span className="text-xs text-blue-600 font-bold">${(item.salePrice * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-md border border-gray-200 shadow-sm">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-1 hover:bg-gray-100 text-gray-600"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="p-1 hover:bg-gray-100 text-gray-600"><Plus size={14} /></button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotalUsd.toFixed(2)}</span>
                </div>
                
                {config.taxRate > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                        <span>Impuesto ({config.taxRate}%)</span>
                        <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>
                )}

                <div className="border-t border-gray-200 pt-2 flex justify-between items-end">
                    <div>
                        <span className="text-gray-500 text-sm block">Total a Pagar</span>
                        <span className="text-2xl font-bold text-gray-800">${totalUsd.toFixed(2)}</span>
                    </div>
                    <div className="text-right flex flex-col">
                        <span className="text-lg font-bold text-blue-600">Bs. {totalBs.toFixed(2)}</span>
                        {config.showCop && <span className="text-sm font-bold text-gray-500">COP {totalCop.toLocaleString('es-CO')}</span>}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0}
                className={`w-full text-white py-3 rounded-lg font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed ${getButtonClass()}`}
            >
                <CreditCard size={20} />
                Cobrar
            </button>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            
            {!checkoutSuccess ? (
                // Checkout Form
                <>
                    <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
                        <h3 className="text-lg font-bold">Confirmar Pago</h3>
                        <button onClick={() => setIsCheckoutOpen(false)} className="hover:bg-gray-700 rounded p-1"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500">Monto Total</p>
                            <h2 className="text-3xl font-bold text-gray-800">${totalUsd.toFixed(2)}</h2>
                            <div className="flex justify-center gap-4 mt-1">
                                <p className="text-blue-600 font-semibold">Bs. {totalBs.toFixed(2)}</p>
                                {config.showCop && <p className="text-gray-500 font-semibold">COP {totalCop.toLocaleString('es-CO')}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={paymentMethod}
                                onChange={(e) => {
                                    setPaymentMethod(e.target.value);
                                    setAmountPaid('');
                                }}
                            >
                                <option value="cash_usd">Efectivo ($)</option>
                                <option value="cash_bs">Efectivo (Bs)</option>
                                {config.showCop && <option value="cash_cop">Efectivo (COP)</option>}
                                <option value="mobile_pay">Pago Móvil</option>
                                <option value="transfer">Transferencia</option>
                                <option value="card">Punto de Venta</option>
                                <option value="credit">Fiado / Crédito</option>
                            </select>
                        </div>

                        {paymentMethod === 'credit' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedClient || ''}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                >
                                    <option value="">Seleccionar Cliente...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} (Deuda: ${c.debt.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(paymentMethod === 'cash_usd' || paymentMethod === 'cash_bs' || paymentMethod === 'cash_cop') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                />
                                {amountPaid && (
                                <div className="mt-2 text-right">
                                        <span className="text-sm text-gray-500">Cambio: </span>
                                        <span className="font-bold text-green-600">
                                            {paymentMethod === 'cash_usd' && `$${change.toFixed(2)}`}
                                            {paymentMethod === 'cash_bs' && `Bs. ${change.toFixed(2)}`}
                                            {paymentMethod === 'cash_cop' && `COP ${change.toLocaleString('es-CO')}`}
                                        </span>
                                </div> 
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                        <button 
                            onClick={() => setIsCheckoutOpen(false)}
                            className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCheckout}
                            disabled={isProcessing || (paymentMethod === 'credit' && !selectedClient)}
                            className={`flex-1 py-2 text-white font-medium rounded-lg shadow-sm disabled:bg-gray-400 flex items-center justify-center gap-2 ${getButtonClass()}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Confirmar'}
                        </button>
                    </div>
                </>
            ) : (
                // Success / Print View
                <div className="p-8 text-center space-y-6">
                     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                         <CheckCircle size={40} />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold text-gray-800">¡Venta Exitosa!</h3>
                         <p className="text-gray-500">Ticket #{lastSale?.number}</p>
                     </div>
                     
                     <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Total</span>
                            <span className="font-bold">${lastSale?.totalUsd.toFixed(2)}</span>
                        </div>
                        {change > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Cambio</span>
                                <span className="font-bold">
                                    {paymentMethod === 'cash_usd' && `$${change.toFixed(2)}`}
                                    {paymentMethod === 'cash_bs' && `Bs. ${change.toFixed(2)}`}
                                    {paymentMethod === 'cash_cop' && `COP ${change.toLocaleString('es-CO')}`}
                                </span>
                            </div>
                        )}
                     </div>

                     <button 
                        onClick={() => window.print()}
                        className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-900"
                     >
                         <Printer size={20} />
                         Imprimir Recibo
                     </button>
                     
                     <button 
                        onClick={resetCheckout}
                        className="w-full py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg"
                     >
                         Nueva Venta
                     </button>

                     {/* Hidden Print Receipt Template */}
                     <div className="hidden print-only receipt-print text-left" style={{ width: config.receipt.paperSize }}>
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold uppercase">{config.businessName}</h2>
                            <p className="text-sm">{config.address}</p>
                            <p className="text-sm">Ticket: {lastSale?.number}</p>
                            <p className="text-xs">{new Date().toLocaleString()}</p>
                        </div>
                        <div className="mb-4">
                            {config.receipt.headerText && <p className="text-xs text-center mb-2">{config.receipt.headerText}</p>}
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th className="text-left py-1">Cant</th>
                                        <th className="text-left py-1">Prod</th>
                                        <th className="text-right py-1">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastSale?.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-1">{item.quantity}</td>
                                            <td className="py-1">{item.name}</td>
                                            <td className="text-right py-1">${MathUtils.mul(item.quantity, item.salePrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-black pt-2 text-right">
                             {config.receipt.showTax && lastSale?.taxAmount ? (
                                <p className="text-xs">Impuesto: ${lastSale.taxAmount.toFixed(2)}</p>
                             ) : null}
                             <p className="font-bold">Total: ${lastSale?.totalUsd.toFixed(2)}</p>
                             <p className="text-xs">Bs. {lastSale?.totalBs.toFixed(2)}</p>
                             {config.showCop && <p className="text-xs">COP {(MathUtils.mul(lastSale?.totalUsd || 0, config.copExchangeRate)).toLocaleString('es-CO')}</p>}
                        </div>
                        {config.receipt.footerText && (
                            <div className="mt-4 text-center text-xs border-t border-black pt-2">
                                {config.receipt.footerText}
                            </div>
                        )}
                     </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
