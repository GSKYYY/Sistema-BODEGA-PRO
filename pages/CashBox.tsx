
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';
import { Plus, Trash2, Wallet, ArrowDownCircle, ArrowUpCircle, X, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MathUtils } from '../utils/math';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const CashBox: React.FC = () => {
  const { sales, expenses, addExpense, deleteExpense, config, user } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'employee' && !config.permissions.canAccessCashbox) {
        navigate('/');
    }
  }, [user, config.permissions, navigate]);

  const canDelete = user?.role === 'owner' || config.permissions.canDeleteItems;
  const canViewStats = user?.role === 'owner';

  const [expenseForm, setExpenseForm] = useState<Omit<Expense, 'id' | 'date'>>({
    description: '',
    amount: 0,
    category: 'Gastos Varios',
    paymentMethod: 'cash_usd'
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const todayExpenses = expenses.filter(e => e.date.startsWith(today));

  const salesByMethod = {
    cash_usd: todaySales.filter(s => s.paymentMethod === 'cash_usd').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    cash_local: todaySales.filter(s => s.paymentMethod === 'cash_local' || s.paymentMethod === 'cash_bs' || s.paymentMethod === 'cash_cop').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    mobile_pay: todaySales.filter(s => s.paymentMethod === 'mobile_pay').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    transfer: todaySales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    card: todaySales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
  };

  const totalSalesUsd = Object.values(salesByMethod).reduce((a, b) => MathUtils.add(a, b), 0);
  const totalExpensesUsd = todayExpenses.reduce((sum, e) => MathUtils.add(sum, e.amount), 0);
  const netBalance = MathUtils.sub(totalSalesUsd, totalExpensesUsd);

  const expensesChartData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutOffDate = thirtyDaysAgo.toISOString().split('T')[0];
    const recentExpenses = expenses.filter(e => e.date.split('T')[0] >= cutOffDate);
    const grouped = recentExpenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#ec4899'];

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({ date: new Date().toISOString(), ...expenseForm });
    setIsModalOpen(false);
    setExpenseForm({ description: '', amount: 0, category: 'Gastos Varios', paymentMethod: 'cash_usd' });
  };

  const getThemeClass = () => {
    const colors: Record<string, string> = {
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
        violet: 'text-violet-600',
        orange: 'text-orange-600',
        rose: 'text-rose-600',
        slate: 'text-slate-600',
        christmas: 'text-red-600',
    };
    return colors[config.theme] || 'text-blue-600';
  };

  if (user?.role === 'employee' && !config.permissions.canAccessCashbox) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Caja Diaria</h1>
            <p className="text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm">
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      {canViewStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Ventas Totales</p>
                    <h3 className="text-2xl font-bold text-green-600">${totalSalesUsd.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400">
                        <span>{config.currencySymbol} {MathUtils.mul(totalSalesUsd, config.exchangeRate).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-green-600"><ArrowUpCircle size={28} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Gastos Totales</p>
                    <h3 className="text-2xl font-bold text-red-600">${totalExpensesUsd.toFixed(2)}</h3>
                     <div className="text-xs text-gray-400">
                        <span>{config.currencySymbol} {MathUtils.mul(totalExpensesUsd, config.exchangeRate).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-red-600"><ArrowDownCircle size={28} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Balance Neto</p>
                    <h3 className={`text-2xl font-bold ${netBalance >= 0 ? getThemeClass() : 'text-red-500'}`}>${netBalance.toFixed(2)}</h3>
                     <div className="text-xs text-gray-400">
                        <span>{config.currencySymbol} {MathUtils.mul(netBalance, config.exchangeRate).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className={`bg-gray-100 p-3 rounded-lg ${getThemeClass()}`}><Wallet size={28} /></div>
            </div>
        </div>
      )}

      {canViewStats && expensesChartData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-gray-500" /> Gastos por Categoría (Últimos 30 días)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                             {expensesChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {canViewStats && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Desglose de Ingresos</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Efectivo ($)</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.cash_usd.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">{config.currencySymbol} {MathUtils.mul(salesByMethod.cash_usd, config.exchangeRate).toLocaleString('es-ES', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Efectivo ({config.currencyCode})</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.cash_local.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">{config.currencySymbol} {MathUtils.mul(salesByMethod.cash_local, config.exchangeRate).toLocaleString('es-ES', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Pago Móvil / App</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.mobile_pay.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">{config.currencySymbol} {MathUtils.mul(salesByMethod.mobile_pay, config.exchangeRate).toLocaleString('es-ES', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Tarjeta / Punto</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.card.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">{config.currencySymbol} {MathUtils.mul(salesByMethod.card, config.exchangeRate).toLocaleString('es-ES', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${!canViewStats ? 'lg:col-span-2' : ''}`}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Gastos del Día</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {todayExpenses.length === 0 ? <p className="text-center text-gray-400 py-8">No hay gastos registrados hoy.</p> : todayExpenses.map(expense => (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                        <div>
                            <p className="font-bold text-gray-800">{expense.description}</p>
                            <p className="text-xs text-red-500 capitalize">{expense.category} • {expense.paymentMethod.replace('cash_local', `Efectivo ${config.currencyCode}`).replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-red-600">-${expense.amount.toFixed(2)}</span>
                            {canDelete && <button onClick={() => deleteExpense(expense.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16} /></button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Registrar Gasto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Ej. Almuerzo, Pago Proveedor..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select className="w-full p-2 border rounded-lg" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                    <option value="Gastos Varios">Gastos Varios</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Proveedores">Pago a Proveedores</option>
                    <option value="Nomina">Nómina</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <input required type="number" step="0.01" className="w-full p-2 border rounded-lg" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select className="w-full p-2 border rounded-lg" value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value as any})}>
                    <option value="cash_usd">Efectivo ($)</option>
                    <option value="cash_local">Efectivo ({config.currencySymbol} {config.currencyCode})</option>
                    <option value="mobile_pay">Pago Móvil</option>
                    <option value="transfer">Transferencia</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
