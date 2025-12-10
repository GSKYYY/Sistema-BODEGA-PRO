
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, Package, AlertTriangle, TrendingUp, Trophy, TrendingDown, MinusCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MathUtils } from '../utils/math';

const StatCard: React.FC<{ title: string; value: string; subValue?: React.ReactNode; icon: any; color: string }> = ({ title, value, subValue, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subValue && <div className="mt-1">{subValue}</div>}
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { sales, products, config, user } = useData();

  // Permissions check
  const showStats = user?.role === 'owner' || config.permissions.canViewDashboardStats;

  // Calculate Stats
  const today = new Date().toISOString().split('T')[0];
  const salesToday = sales.filter(s => s.date.startsWith(today));
  
  // Use MathUtils for precise aggregation
  const totalSalesToday = salesToday.reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0);
  const totalBsToday = MathUtils.mul(totalSalesToday, config.exchangeRate);
  const totalCopToday = MathUtils.mul(totalSalesToday, config.copExchangeRate);
  
  const profitToday = salesToday.reduce((total, sale) => {
    const saleCost = sale.items.reduce((cost, item) => MathUtils.add(cost, MathUtils.mul(item.costPrice, item.quantity)), 0);
    return MathUtils.add(total, MathUtils.sub(sale.totalUsd, saleCost));
  }, 0);

  const profitBsToday = MathUtils.mul(profitToday, config.exchangeRate);
  const profitCopToday = MathUtils.mul(profitToday, config.copExchangeRate);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.status === 'active');

  // Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0);
    return {
      name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      ventas: daySales
    };
  });

  // Product Performance Calculation
  const productPerformance = useMemo(() => {
    const salesMap = new Map<string, number>();
    
    // Initialize all active products with 0 sales
    products.filter(p => p.status === 'active').forEach(p => {
        salesMap.set(p.id, 0);
    });

    // Sum up sales
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const current = salesMap.get(item.id) || 0;
            salesMap.set(item.id, current + item.quantity);
        });
    });

    const ranked = products
        .filter(p => p.status === 'active')
        .map(p => ({
            ...p,
            soldQuantity: salesMap.get(p.id) || 0
        }));

    const topSelling = [...ranked].sort((a, b) => b.soldQuantity - a.soldQuantity).slice(0, 5).filter(p => p.soldQuantity > 0);
    const leastSelling = [...ranked].sort((a, b) => a.soldQuantity - b.soldQuantity).slice(0, 5);

    return { topSelling, leastSelling };
  }, [sales, products]);

  // Dynamic colors based on theme
  const getThemeColors = () => {
    const themes: Record<string, { primary: string; secondary: string }> = {
      blue: { primary: 'bg-blue-500 text-blue-600', secondary: '#3b82f6' },
      emerald: { primary: 'bg-emerald-500 text-emerald-600', secondary: '#10b981' },
      violet: { primary: 'bg-violet-500 text-violet-600', secondary: '#8b5cf6' },
      orange: { primary: 'bg-orange-500 text-orange-600', secondary: '#f97316' },
      rose: { primary: 'bg-rose-500 text-rose-600', secondary: '#f43f5e' },
      slate: { primary: 'bg-slate-500 text-slate-600', secondary: '#64748b' },
      christmas: { primary: 'bg-red-600 text-red-700', secondary: '#16A34A' },
    };
    return themes[config.theme] || themes.blue;
  };

  const themeColors = getThemeColors();

  return (
    <div className="p-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {showStats && (
            <>
                <StatCard 
                title="Ventas Hoy" 
                value={`$${totalSalesToday.toFixed(2)}`} 
                subValue={
                    <div className="flex flex-col text-xs text-gray-500">
                        <span>Bs. {totalBsToday.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        {config.showCop && <span>COP. {totalCopToday.toLocaleString('es-CO')}</span>}
                    </div>
                }
                icon={DollarSign} 
                color={themeColors.primary} 
                />
                <StatCard 
                title="Ganancia Estimada" 
                value={`$${profitToday.toFixed(2)}`} 
                subValue={
                     <div className="flex flex-col text-xs text-gray-500">
                        <span>Bs. {profitBsToday.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        {config.showCop && <span>COP. {profitCopToday.toLocaleString('es-CO')}</span>}
                        <span className="text-gray-400 mt-1 block">Basado en costos</span>
                    </div>
                }
                icon={TrendingUp} 
                color="bg-green-500 text-green-600" 
                />
            </>
        )}
        
        <StatCard 
          title="Total Productos" 
          value={products.length.toString()} 
          subValue={<span className="text-xs text-gray-400">En inventario</span>}
          icon={Package} 
          color="bg-purple-500 text-purple-600" 
        />
        <StatCard 
          title="Stock Bajo" 
          value={lowStockProducts.length.toString()} 
          subValue={<span className="text-xs text-gray-400">Requieren reposición</span>}
          icon={AlertTriangle} 
          color="bg-amber-500 text-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        {showStats && (
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Ventas de la Semana</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                    />
                    <Bar dataKey="ventas" fill={themeColors.secondary} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}

        {/* Low Stock List */}
        <div className={`${!showStats ? 'lg:col-span-3' : ''} bg-white p-6 rounded-xl shadow-sm border border-gray-100`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Alertas de Stock</h3>
            {lowStockProducts.length > 0 && <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">Atención</span>}
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {lowStockProducts.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Inventario saludable.</p>
            ) : (
                lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">Min: {p.minStock}</p>
                    </div>
                    </div>
                    <span className="text-sm font-bold text-red-600">{p.stock} und</span>
                </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Product Performance Section */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Top Selling */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="text-yellow-500" size={20} />
                    <h3 className="text-lg font-bold text-gray-800">Productos Más Vendidos</h3>
                </div>
                <div className="space-y-4">
                    {productPerformance.topSelling.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">No hay datos de ventas aún.</p>
                    ) : (
                        productPerformance.topSelling.map((p, index) => (
                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-yellow-50 rounded-lg transition-colors border border-transparent hover:border-yellow-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-gray-800">{p.soldQuantity}</span>
                                    <span className="text-xs text-gray-400">Vendidos</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Least Selling */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingDown className="text-gray-400" size={20} />
                    <h3 className="text-lg font-bold text-gray-800">Productos Menos Vendidos</h3>
                </div>
                <div className="space-y-4">
                     {productPerformance.leastSelling.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">Inventario vacío.</p>
                    ) : (
                        productPerformance.leastSelling.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <MinusCircle size={16} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-gray-600">{p.soldQuantity}</span>
                                    <span className="text-xs text-gray-400">Vendidos</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      )}
    </div>
  );
};
