
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Sale, CartItem } from '../types';
import { X, Eye, TrendingUp, DollarSign, Calendar, Printer } from 'lucide-react';

export const Sales: React.FC = () => {
  const { sales, clients, config } = useData();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const getClientName = (id?: number) => {
    if (!id) return 'General';
    return clients.find(c => c.id === id)?.name || 'Desconocido';
  };

  const getPaymentLabel = (method: string) => {
    switch(method) {
        case 'cash_usd': return 'Efectivo $';
        case 'cash_bs': return 'Efectivo Bs';
        case 'cash_cop': return 'Efectivo COP';
        case 'mobile_pay': return 'Pago Móvil';
        case 'credit': return 'Fiado';
        default: return method;
    }
  };

  // Analytics Calculation
  const stats = useMemo(() => {
    const now = new Date();
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (timeFilter === 'day') {
        return saleDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return saleDate >= oneWeekAgo;
      } else if (timeFilter === 'month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      } else {
        return saleDate.getFullYear() === now.getFullYear();
      }
    });

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalUsd, 0);
    const totalCost = filteredSales.reduce((sum, s) => {
      return sum + s.items.reduce((cost, item) => cost + (item.costPrice * item.quantity), 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const count = filteredSales.length;

    return { totalRevenue, totalCost, totalProfit, count };
  }, [sales, timeFilter]);

  // Helper for button color
  const getButtonClass = () => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        emerald: 'bg-emerald-600 hover:bg-emerald-700',
        violet: 'bg-violet-600 hover:bg-violet-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
        rose: 'bg-rose-600 hover:bg-rose-700',
        slate: 'bg-slate-600 hover:bg-slate-700',
        christmas: 'bg-red-600 hover:bg-red-700 border-b-2 border-green-700',
    };
    return colors[config.theme] || 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="p-8 space-y-8">
      
      {/* Print Header */}
      <div className="print-only mb-6 text-center">
        <h1 className="text-2xl font-bold">{config.businessName}</h1>
        <p className="text-gray-600">Reporte de Ventas</p>
        <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
        <div className="mt-4 border-b border-gray-300"></div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Reporte de Ganancias
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['day', 'week', 'month', 'year'] as const).map(period => (
                    <button
                        key={period}
                        onClick={() => setTimeFilter(period)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            timeFilter === period 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {period === 'day' && 'Hoy'}
                        {period === 'week' && '7 Días'}
                        {period === 'month' && 'Este Mes'}
                        {period === 'year' && 'Este Año'}
                    </button>
                ))}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Ventas Totales</p>
                <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        <p>Bs. {(stats.totalRevenue * config.exchangeRate).toFixed(2)}</p>
                        {config.showCop && <p>COP {(stats.totalRevenue * config.copExchangeRate).toLocaleString('es-CO')}</p>}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.count} transacciones</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Costo de Mercancía</p>
                <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-gray-500">${stats.totalCost.toFixed(2)}</h3>
                     <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        <p>Bs. {(stats.totalCost * config.exchangeRate).toFixed(2)}</p>
                        {config.showCop && <p>COP {(stats.totalCost * config.copExchangeRate).toLocaleString('es-CO')}</p>}
                    </div>
                </div>
            </div>
            <div className="p-6 text-center bg-green-50">
                <p className="text-sm text-green-600 mb-1 font-semibold">Ganancia Neta</p>
                <div className="flex flex-col items-center">
                    <h3 className="text-3xl font-bold text-green-700">${stats.totalProfit.toFixed(2)}</h3>
                     <div className="text-xs text-green-600/70 mt-1 space-y-0.5">
                        <p>Bs. {(stats.totalProfit * config.exchangeRate).toFixed(2)}</p>
                        {config.showCop && <p>COP {(stats.totalProfit * config.copExchangeRate).toLocaleString('es-CO')}</p>}
                    </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Margen: {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%</p>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Historial Detallado</h1>
          <button 
            onClick={() => window.print()} 
            className={`no-print ${getButtonClass()} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm`}
          >
            <Printer size={20} />
            Imprimir Reporte
          </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-semibold"># Ticket</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Total ($)</th>
                <th className="p-4 font-semibold">Método</th>
                <th className="p-4 font-semibold text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600 font-mono text-sm">{sale.number}</td>
                  <td className="p-4 text-gray-600 text-sm">{new Date(sale.date).toLocaleString()}</td>
                  <td className="p-4 font-medium text-gray-800">{getClientName(sale.clientId)}</td>
                  <td className="p-4 font-bold text-gray-800">${sale.totalUsd.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sale.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {getPaymentLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="p-4 text-center no-print">
                    <button 
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 text-sm font-medium"
                    >
                        <Eye size={16} />
                        Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">No hay ventas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Detalle de Venta</h3>
                    <p className="text-sm text-gray-500 font-mono">{selectedSale.number}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>
            
            <div className="p-6">
                <div className="flex justify-between items-end mb-4 text-sm text-gray-600">
                    <span>Fecha: {new Date(selectedSale.date).toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded font-medium ${selectedSale.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {getPaymentLabel(selectedSale.paymentMethod)}
                    </span>
                </div>

                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3 text-left">Producto</th>
                                <th className="p-3 text-center">Cant.</th>
                                <th className="p-3 text-right">Precio</th>
                                <th className="p-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {selectedSale.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3 text-gray-800">{item.name}</td>
                                    <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                                    <td className="p-3 text-right text-gray-600">${item.salePrice.toFixed(2)}</td>
                                    <td className="p-3 text-right font-medium text-gray-800">${(item.salePrice * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-800 pt-2 border-t border-gray-100">
                        <span>Total Pagado</span>
                        <span>${selectedSale.totalUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Equivalente en Bs</span>
                        <span>Bs. {selectedSale.totalBs.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm text-gray-500">
                        <span>Equivalente en COP</span>
                        <span>COP {(selectedSale.totalUsd * config.copExchangeRate).toLocaleString('es-CO')}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-gray-50 text-center">
                <button 
                    onClick={() => setSelectedSale(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                    Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};