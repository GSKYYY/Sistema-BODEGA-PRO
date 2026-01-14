
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Sale } from '../types';
import { X, Eye, TrendingUp, Printer, Filter, Calendar, User, CreditCard, Download, DollarSign } from 'lucide-react';
import { MathUtils } from '../utils/math';

export const Sales: React.FC = () => {
  const { sales, clients, config, user } = useData();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const canViewCosts = user?.role === 'owner' || config.permissions.canViewCosts;

  const getClientName = (id?: string) => {
    if (!id) return 'General';
    return clients.find(c => c.id === id)?.name || 'Desconocido';
  };

  const getPaymentLabel = (method: string) => {
    switch(method) {
        case 'cash_usd': return 'Efectivo $';
        case 'cash_local': return `Efectivo ${config.currencyCode}`;
        case 'cash_bs': return `Efectivo ${config.currencyCode}`; // Legacy fallback
        case 'cash_cop': return `Efectivo ${config.currencyCode}`; // Legacy fallback
        case 'mobile_pay': return 'Pago Móvil / App';
        case 'credit': return 'Fiado';
        case 'transfer': return 'Transferencia';
        case 'card': return 'Tarjeta / Punto';
        default: return method;
    }
  };

  const stats = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const saleDate = sale.date.split('T')[0];
      const matchStart = startDate ? saleDate >= startDate : true;
      const matchEnd = endDate ? saleDate <= endDate : true;
      const matchClient = filterClient ? sale.clientId === filterClient : true;
      const matchMethod = filterMethod ? sale.paymentMethod === filterMethod : true;
      return matchStart && matchEnd && matchClient && matchMethod;
    });

    let totalRevenue = 0;
    let totalCost = 0;

    filteredSales.forEach(s => {
        totalRevenue = MathUtils.add(totalRevenue, s.totalUsd);
        if (canViewCosts) {
            const saleCost = s.items.reduce((acc, item) => MathUtils.add(acc, MathUtils.mul(item.costPrice, item.quantity)), 0);
            totalCost = MathUtils.add(totalCost, saleCost);
        }
    });

    const totalProfit = MathUtils.sub(totalRevenue, totalCost);
    const count = filteredSales.length;

    return { totalRevenue, totalCost, totalProfit, count, filteredSales };
  }, [sales, filterClient, filterMethod, startDate, endDate, canViewCosts]);

  const clearFilters = () => {
      setFilterClient('');
      setFilterMethod('');
      setStartDate('');
      setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['Ticket', 'Fecha', 'Cliente', 'Método', 'Total ($)', `Total (${config.currencyCode})`];
    if (canViewCosts) {
        headers.push('Costo ($)', 'Ganancia ($)');
    }

    const rows = stats.filteredSales.map(s => {
        const row = [
            s.number,
            new Date(s.date).toLocaleDateString() + ' ' + new Date(s.date).toLocaleTimeString(),
            `"${getClientName(s.clientId)}"`,
            getPaymentLabel(s.paymentMethod),
            s.totalUsd.toFixed(2),
            (s.totalLocal || 0).toFixed(2)
        ];

        if (canViewCosts) {
            const saleCost = s.items.reduce((acc, item) => MathUtils.add(acc, MathUtils.mul(item.costPrice, item.quantity)), 0);
            const profit = MathUtils.sub(s.totalUsd, saleCost);
            row.push(saleCost.toFixed(2), profit.toFixed(2));
        }

        return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="p-4 md:p-8 space-y-8">
      <div className="print-only mb-6 text-center">
        <h1 className="text-2xl font-bold">{config.businessName}</h1>
        <p className="text-gray-600">Reporte de Ventas</p>
        <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
        <div className="mt-4 border-b border-gray-300"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Reporte Financiero
            </h2>
            {canViewCosts && (
                <div className="text-sm text-gray-500 flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <DollarSign size={14} className="text-yellow-600" />
                    Vista de Costos y Ganancias Activada
                </div>
            )}
        </div>
        
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 font-medium mb-1 block flex items-center gap-1"><User size={12}/> Cliente</label>
                <select 
                    className="w-full p-2 border rounded-lg text-sm"
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                >
                    <option value="">Todos los clientes</option>
                    <option value="null">General (Sin registrar)</option>
                    {clients.filter(c => c.id !== '1').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-gray-500 font-medium mb-1 block flex items-center gap-1"><CreditCard size={12}/> Método</label>
                <select 
                    className="w-full p-2 border rounded-lg text-sm"
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="cash_usd">Efectivo $</option>
                    <option value="cash_local">Efectivo {config.currencyCode}</option>
                    <option value="mobile_pay">Pago Móvil</option>
                    <option value="card">Tarjeta / Punto</option>
                    <option value="transfer">Transferencia</option>
                    <option value="credit">Fiado (Crédito)</option>
                </select>
            </div>
            <div className="flex-1 min-w-[130px]">
                <label className="text-xs text-gray-500 font-medium mb-1 block flex items-center gap-1"><Calendar size={12}/> Desde</label>
                <input type="date" className="w-full p-2 border rounded-lg text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[130px]">
                <label className="text-xs text-gray-500 font-medium mb-1 block flex items-center gap-1"><Calendar size={12}/> Hasta</label>
                <input type="date" className="w-full p-2 border rounded-lg text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button onClick={clearFilters} className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className={`grid grid-cols-1 ${canViewCosts ? 'md:grid-cols-3' : 'md:grid-cols-1'} divide-y md:divide-y-0 md:divide-x divide-gray-100`}>
            <div className="p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Ingresos Totales (Filtrado)</p>
                <div className="flex flex-col items-center">
                    <h3 className="text-3xl font-bold text-gray-800">${stats.totalRevenue.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        <p>{config.currencySymbol} {MathUtils.mul(stats.totalRevenue, config.exchangeRate).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {config.currencyCode}</p>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.count} transacciones encontradas</p>
            </div>
            
            {canViewCosts && (
                <>
                    <div className="p-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">Costo de Mercancía</p>
                        <div className="flex flex-col items-center">
                            <h3 className="text-2xl font-bold text-gray-500">${stats.totalCost.toFixed(2)}</h3>
                        </div>
                    </div>
                    <div className="p-6 text-center bg-green-50">
                        <p className="text-sm text-green-600 mb-1 font-semibold">Ganancia Neta</p>
                        <div className="flex flex-col items-center">
                            <h3 className="text-3xl font-bold text-green-700">${stats.totalProfit.toFixed(2)}</h3>
                        </div>
                        <p className="text-xs text-green-600 mt-2">Margen: {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%</p>
                    </div>
                </>
            )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Historial Detallado</h1>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-200 transition-colors shadow-sm font-medium">
                <Download size={20} /> Exportar CSV
            </button>
            <button onClick={() => window.print()} className={`no-print ${getButtonClass()} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium`}>
                <Printer size={20} /> Imprimir
            </button>
          </div>
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
                {canViewCosts && <th className="p-4 font-semibold text-gray-500">Ganancia</th>}
                <th className="p-4 font-semibold">Método</th>
                <th className="p-4 font-semibold text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.filteredSales.slice().reverse().map(sale => {
                const saleCost = canViewCosts ? sale.items.reduce((acc, item) => MathUtils.add(acc, MathUtils.mul(item.costPrice, item.quantity)), 0) : 0;
                const profit = MathUtils.sub(sale.totalUsd, saleCost);

                return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-mono text-sm">{sale.number}</td>
                    <td className="p-4 text-gray-600 text-sm">
                        <div className="flex flex-col">
                            <span>{new Date(sale.date).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString()}</span>
                        </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{getClientName(sale.clientId)}</td>
                    <td className="p-4 font-bold text-gray-800">${sale.totalUsd.toFixed(2)}</td>
                    {canViewCosts && <td className="p-4 font-medium text-green-600 text-sm">${profit.toFixed(2)}</td>}
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${sale.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {getPaymentLabel(sale.paymentMethod)}
                        </span>
                    </td>
                    <td className="p-4 text-center no-print">
                        <button onClick={() => setSelectedSale(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 text-sm font-medium">
                            <Eye size={16} />
                        </button>
                    </td>
                    </tr>
                );
              })}
              {stats.filteredSales.length === 0 && (
                <tr>
                    <td colSpan={canViewCosts ? 7 : 6} className="p-8 text-center text-gray-400">No hay ventas que coincidan con los filtros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Detalle de Venta</h3>
                    <p className="text-sm text-gray-500 font-mono">{selectedSale.number}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
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
                                    <td className="p-3 text-right font-medium text-gray-800">${MathUtils.mul(item.salePrice, item.quantity).toFixed(2)}</td>
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
                        <span>Equivalente Local</span>
                        <span>{config.currencySymbol} {selectedSale.totalLocal?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-gray-50 text-center">
                <button onClick={() => setSelectedSale(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
