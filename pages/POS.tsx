
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Sale } from '../types';
import { MathUtils } from '../utils/math';
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingBag, ShoppingCart, CheckCircle, Printer, X, AlertOctagon, Loader2, List, ChevronRight } from 'lucide-react';

export const POS: React.FC = () => {
  const { products, categories, config, addSale, clients, showNotification } = useData();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Mobile View State
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_usd');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
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

  const updateQuantity = (id: string, delta: number) => {
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

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calculations using MathUtils
  const subtotalUsd = cart.reduce((sum, item) => MathUtils.add(sum, MathUtils.mul(item.salePrice, item.quantity)), 0);
  const taxAmount = config.taxRate > 0 ? MathUtils.percent(subtotalUsd, config.taxRate) : 0;
  const totalUsd = MathUtils.add(subtotalUsd, taxAmount);
  
  // Generic Local Currency Calculation
  const totalLocal = MathUtils.mul(totalUsd, config.exchangeRate);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    // Generate readable ID client-side
    const saleNumber = 'V-' + Date.now().toString().slice(-6);
    
    try {
        await addSale({
          number: saleNumber,
          date: new Date().toISOString(),
          totalUsd,
          totalLocal, // New generic field
          exchangeRate: config.exchangeRate,
          paymentMethod: paymentMethod as any,
          clientId: selectedClient,
          items: cart,
          taxAmount
        });

        setLastSale({
          id: 'temp', 
          number: saleNumber,
          date: new Date().toISOString(),
          totalUsd, totalLocal, exchangeRate: config.exchangeRate, paymentMethod: paymentMethod as any, items: cart, taxAmount
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
      setMobileTab('products');
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash_usd') return MathUtils.sub(paid, totalUsd);
    if (paymentMethod === 'cash_local') return MathUtils.sub(paid, totalLocal);
    return 0;
  };

  const change = calculateChange();

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

  const Separator = () => (
    <div className="border-b border-black border-dashed my-2 w-full"></div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-gray-50 relative">
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex bg-white border-b border-gray-200">
        <button 
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
            <List size={18} /> Productos
        </button>
        <button 
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
            <ShoppingCart size={18} /> Ticket ({cart.length})
        </button>
      </div>

      {/* Product Area */}
      <div className={`flex-1 flex flex-col p-4 md:p-6 overflow-hidden ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
        <div className="mb-4 md:mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-1 pb-20">
          {filteredProducts.map(product => {
             const isOutOfStock = product.stock <= 0;
             const isDisabled = isOutOfStock && !config.enableNegativeStock;

             return (
                <div 
                key={product.id} 
                className={`bg-white p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-95 touch-manipulation
                    ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'border-gray-100 hover:border-blue-300'}`}
                onClick={() => !isDisabled && addToCart(product)}
                >
                <div className="h-20 md:h-24 w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 relative">
                    {isDisabled && <AlertOctagon className="text-red-400 absolute" size={32} />}
                    <ShoppingBag size={28} />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600">${product.salePrice.toFixed(2)}</span>
                    <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded ${product.stock > product.minStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock}
                    </span>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Cart Button */}
      {mobileTab === 'products' && cart.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 md:hidden z-10">
              <button 
                  onClick={() => setMobileTab('cart')}
                  className={`${getButtonClass()} w-full py-3 rounded-xl shadow-lg flex items-center justify-between px-6 text-white font-bold animate-in slide-in-from-bottom-4`}
              >
                  <div className="flex items-center gap-2">
                      <ShoppingCart size={20} />
                      <span>{cart.length} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${totalUsd.toFixed(2)}</span>
                    <ChevronRight size={20} />
                  </div>
              </button>
          </div>
      )}

      {/* Cart Area */}
      <div className={`w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg ${mobileTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-gray-100 hidden md:block">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={20} />
            Ticket Actual
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 md:pb-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <ShoppingBag size={48} className="opacity-20" />
                <p>Carrito vacío</p>
                <button onClick={() => setMobileTab('products')} className="md:hidden text-blue-600 font-medium text-sm mt-2">
                    Volver a Productos
                </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">${item.salePrice.toFixed(2)}</span>
                    <span className="text-xs text-blue-600 font-bold">${(item.salePrice * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center bg-white rounded-md border border-gray-200 shadow-sm shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-2 md:p-1 hover:bg-gray-100 text-gray-600"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="p-2 md:p-1 hover:bg-gray-100 text-gray-600"><Plus size={14} /></button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-red-400 hover:text-red-600 p-2 shrink-0">
                    <Trash2 size={18} />
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
                        <span className="text-lg font-bold text-blue-600">
                             {config.currencySymbol} {totalLocal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">{config.currencyCode}</span>
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

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {!checkoutSuccess ? (
                <>
                    <div className="bg-gray-800 p-4 text-white flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold">Confirmar Pago</h3>
                        <button onClick={() => setIsCheckoutOpen(false)} className="hover:bg-gray-700 rounded p-1"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500">Monto Total</p>
                            <h2 className="text-3xl font-bold text-gray-800">${totalUsd.toFixed(2)}</h2>
                            <div className="flex justify-center gap-2 mt-1">
                                <p className="text-blue-600 font-semibold text-xl">
                                    {config.currencySymbol} {totalLocal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </p>
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded self-center">{config.currencyCode}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={paymentMethod}
                                onChange={(e) => {
                                    setPaymentMethod(e.target.value);
                                    setAmountPaid('');
                                }}
                            >
                                <option value="cash_usd">Efectivo ($)</option>
                                <option value="cash_local">Efectivo ({config.currencySymbol} {config.currencyCode})</option>
                                <option value="mobile_pay">Pago Móvil / App</option>
                                <option value="transfer">Transferencia</option>
                                <option value="card">Tarjeta / Punto</option>
                                <option value="credit">Fiado / Crédito</option>
                            </select>
                        </div>

                        {paymentMethod === 'credit' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

                        {(paymentMethod === 'cash_usd' || paymentMethod === 'cash_local') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    inputMode="decimal"
                                />
                                {amountPaid && (
                                <div className="mt-2 text-right">
                                        <span className="text-sm text-gray-500">Cambio: </span>
                                        <span className="font-bold text-green-600">
                                            {paymentMethod === 'cash_usd' && `$${change.toFixed(2)}`}
                                            {paymentMethod === 'cash_local' && `${config.currencySymbol} ${change.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                                        </span>
                                </div> 
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
                        <button 
                            onClick={() => setIsCheckoutOpen(false)}
                            className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCheckout}
                            disabled={isProcessing || (paymentMethod === 'credit' && !selectedClient)}
                            className={`flex-1 py-3 text-white font-medium rounded-lg shadow-sm disabled:bg-gray-400 flex items-center justify-center gap-2 ${getButtonClass()}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Confirmar'}
                        </button>
                    </div>
                </>
            ) : (
                // Success View
                <div className="p-8 text-center space-y-6 overflow-y-auto">
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
                                    {paymentMethod === 'cash_usd' ? '$' : config.currencySymbol} {change.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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

                     {/* REAL THERMAL RECEIPT TEMPLATE */}
                     <div className="receipt-print" style={{ width: config.receipt.paperSize || '58mm' }}>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <h2 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{config.businessName}</h2>
                            <p style={{ margin: '2px 0', fontSize: '0.9em' }}>{config.address}</p>
                            <Separator />
                            <p style={{ margin: '2px 0' }}>TICKET: {lastSale?.number}</p>
                            <p style={{ margin: '2px 0' }}>FECHA: {new Date().toLocaleString()}</p>
                        </div>
                        <Separator />
                        <div style={{ display: 'flex', fontWeight: 'bold', fontSize: '0.9em', marginBottom: '5px' }}>
                            <span style={{ width: '15%' }}>CANT</span>
                            <span style={{ flex: 1 }}>DESC</span>
                            <span style={{ width: '25%', textAlign: 'right' }}>TOTAL</span>
                        </div>
                        <Separator />
                        <div style={{ fontSize: '0.9em' }}>
                            {lastSale?.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', marginBottom: '4px' }}>
                                    <span style={{ width: '15%', verticalAlign: 'top' }}>{item.quantity}</span>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '5px' }}>
                                        {item.name}
                                    </span>
                                    <span style={{ width: '25%', textAlign: 'right' }}>${MathUtils.mul(item.quantity, item.salePrice).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1em' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>SUBTOTAL:</span>
                                <span>${(lastSale?.totalUsd - (lastSale?.taxAmount || 0)).toFixed(2)}</span>
                            </div>
                            {config.receipt.showTax && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>IMP:</span>
                                    <span>${(lastSale?.taxAmount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', marginTop: '5px' }}>
                                <span>TOTAL:</span>
                                <span>${lastSale?.totalUsd.toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '0.8em', fontWeight: 'normal', marginTop: '5px' }}>
                                {config.currencySymbol} {lastSale?.totalLocal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ({config.currencyCode})
                            </div>
                        </div>
                        <Separator />
                        <div style={{ fontSize: '0.9em' }}>
                            <p style={{ margin: '2px 0' }}>PAGO: <span style={{ textTransform: 'uppercase' }}>{lastSale?.paymentMethod}</span></p>
                            {amountPaid && (
                                <p style={{ margin: '2px 0' }}>CAMBIO: {paymentMethod === 'cash_usd' ? '$' : config.currencySymbol} {change > 0 ? change.toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}</p>
                            )}
                        </div>
                        {config.receipt.footerText && (
                            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8em' }}>
                                <p>{config.receipt.footerText}</p>
                            </div>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <p style={{ fontSize: '0.8em' }}>*** GRACIAS POR SU COMPRA ***</p>
                        </div>
                     </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
