
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';
import { Plus, Trash2, Wallet, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MathUtils } from '../utils/math';

export const CashBox: React.FC = () => {
  const { sales, expenses, addExpense, deleteExpense, config, user } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect if no permission
  useEffect(() => {
    if (user?.role === 'employee' && !config.permissions.canAccessCashbox) {
        navigate('/');
    }
  }, [user, config.permissions, navigate]);

  // Permissions for specific actions
  const canDelete = user?.role === 'owner' || config.permissions.canDeleteItems;
  const canViewStats = user?.role === 'owner';

  // Initial state for expense form
  const [expenseForm, setExpenseForm] = useState<Omit<Expense, 'id' | 'date'>>({
    description: '',
    amount: 0,
    category: 'Gastos Varios',
    paymentMethod: 'cash_usd'
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const todayExpenses = expenses.filter(e => e.date.startsWith(today));

  // Totals Calculation using MathUtils
  const salesByMethod = {
    cash_usd: todaySales.filter(s => s.paymentMethod === 'cash_usd').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    cash_bs: todaySales.filter(s => s.paymentMethod === 'cash_bs').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    cash_cop: todaySales.filter(s => s.paymentMethod === 'cash_cop').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    mobile_pay: todaySales.filter(s => s.paymentMethod === 'mobile_pay').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    transfer: todaySales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
    card: todaySales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => MathUtils.add(sum, s.totalUsd), 0),
  };

  const totalSalesUsd = Object.values(salesByMethod).reduce((a, b) => MathUtils.add(a, b), 0);
  const totalExpensesUsd = todayExpenses.reduce((sum, e) => MathUtils.add(sum, e.amount), 0);
  const netBalance = MathUtils.sub(totalSalesUsd, totalExpensesUsd);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
        date: new Date().toISOString(),
        ...expenseForm
    });
    setIsModalOpen(false);
    setExpenseForm({ description: '', amount: 0, category: 'Gastos Varios', paymentMethod: 'cash_usd' });
  };

  // Helper for button color
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Registrar Gasto
        </button>
      </div>

      {/* Stats Cards - Only for Owner */}
      {canViewStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Ventas Totales</p>
                    <h3 className="text-2xl font-bold text-green-600">${totalSalesUsd.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400">
                        <span>Bs. {MathUtils.mul(totalSalesUsd, config.exchangeRate).toFixed(2)}</span>
                        {config.showCop && <span className="ml-2">COP {MathUtils.mul(totalSalesUsd, config.copExchangeRate).toLocaleString('es-CO')}</span>}
                    </div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-green-600">
                    <ArrowUpCircle size={28} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Gastos Totales</p>
                    <h3 className="text-2xl font-bold text-red-600">${totalExpensesUsd.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400">
                        <span>Bs. {MathUtils.mul(totalExpensesUsd, config.exchangeRate).toFixed(2)}</span>
                        {config.showCop && <span className="ml-2">COP {MathUtils.mul(totalExpensesUsd, config.copExchangeRate).toLocaleString('es-CO')}</span>}
                    </div>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-red-600">
                    <ArrowDownCircle size={28} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">Balance Neto</p>
                    <h3 className={`text-2xl font-bold ${netBalance >= 0 ? getThemeClass() : 'text-red-500'}`}>${netBalance.toFixed(2)}</h3>
                    <div className="text-xs text-gray-400">
                        <span>Bs. {MathUtils.mul(netBalance, config.exchangeRate).toFixed(2)}</span>
                        {config.showCop && <span className="ml-2">COP {MathUtils.mul(netBalance, config.copExchangeRate).toLocaleString('es-CO')}</span>}
                    </div>
                </div>
                <div className={`bg-gray-100 p-3 rounded-lg ${getThemeClass()}`}>
                    <Wallet size={28} />
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Breakdown - Only for Owner */}
        {canViewStats && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Desglose de Ingresos</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Efectivo ($)</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.cash_usd.toFixed(2)}</span>
                            {config.showCop && <span className="text-xs text-gray-500">COP {MathUtils.mul(salesByMethod.cash_usd, config.copExchangeRate).toLocaleString('es-CO')}</span>}
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Efectivo (Bs)</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.cash_bs.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">Bs. {MathUtils.mul(salesByMethod.cash_bs, config.exchangeRate).toFixed(2)}</span>
                        </div>
                    </div>
                    {config.showCop && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-600">Efectivo (COP)</span>
                            <div className="text-right">
                                <span className="font-bold text-gray-800 block">${salesByMethod.cash_cop.toFixed(2)}</span>
                                <span className="text-xs text-gray-500">COP {MathUtils.mul(salesByMethod.cash_cop, config.copExchangeRate).toLocaleString('es-CO')}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Pago Móvil</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.mobile_pay.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">Bs. {MathUtils.mul(salesByMethod.mobile_pay, config.exchangeRate).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Punto de Venta</span>
                        <div className="text-right">
                            <span className="font-bold text-gray-800 block">${salesByMethod.card.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">Bs. {MathUtils.mul(salesByMethod.card, config.exchangeRate).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Expenses List - Visible to all */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${!canViewStats ? 'lg:col-span-2' : ''}`}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Gastos del Día</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {todayExpenses.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No hay gastos registrados hoy.</p>
                ) : (
                    todayExpenses.map(expense => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                            <div>
                                <p className="font-bold text-gray-800">{expense.description}</p>
                                <p className="text-xs text-red-500 capitalize">{expense.category} • {expense.paymentMethod.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-red-600">-${expense.amount.toFixed(2)}</span>
                                {canDelete && (
                                    <button 
                                        onClick={() => deleteExpense(expense.id)}
                                        className="text-red-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Expense Modal */}
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
                <input 
                    required 
                    type="text" 
                    className="w-full p-2 border rounded-lg" 
                    value={expenseForm.description} 
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} 
                    placeholder="Ej. Almuerzo, Pago Proveedor..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                    className="w-full p-2 border rounded-lg"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                >
                    <option value="Gastos Varios">Gastos Varios</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Proveedores">Pago a Proveedores</option>
                    <option value="Nomina">Nómina</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-2 border rounded-lg" 
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select 
                    className="w-full p-2 border rounded-lg"
                    value={expenseForm.paymentMethod}
                    onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value as any})}
                >
                    <option value="cash_usd">Efectivo ($)</option>
                    <option value="cash_bs">Efectivo (Bs)</option>
                    {config.showCop && <option value="cash_cop">Efectivo (COP)</option>}
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
