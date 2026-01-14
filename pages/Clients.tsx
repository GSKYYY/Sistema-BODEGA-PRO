
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import { Search, Plus, Edit, Trash2, X, DollarSign, UserCheck, AlertCircle, Printer, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, registerClientPayment, config, user } = useData();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (user?.role === 'employee' && !config.permissions.canManageClients) {
        navigate('/');
    }
  }, [user, config.permissions, navigate]);

  const canEdit = user?.role === 'owner';
  const canDelete = user?.role === 'owner';

  const initialFormState: Omit<Client, 'id'> = { name: '', identityCard: '', phone: '', debt: 0, creditLimit: 50 };
  const [formData, setFormData] = useState(initialFormState);

  const filteredClients = clients.filter(c => c.id !== '1' && (c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.identityCard?.includes(search)));

  const handleEdit = (client: Client) => { setEditingClient(client); setFormData(client); setIsFormOpen(true); };
  const handleDelete = (id: string) => { if (window.confirm('¿Seguro que desea eliminar este cliente?')) deleteClient(id); };
  const handlePaymentClick = (client: Client) => { setPayingClient(client); setPaymentAmount(''); setIsPaymentOpen(true); };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) updateClient({ ...formData, id: editingClient.id });
    else addClient(formData);
    setIsFormOpen(false); setEditingClient(null); setFormData(initialFormState);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingClient || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    registerClientPayment(payingClient.id, amount);
    setIsPaymentOpen(false); setPayingClient(null); setPaymentAmount('');
  };

  const totalDebt = clients.reduce((sum, c) => sum + c.debt, 0);

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

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Cédula', 'Teléfono', 'Deuda ($)', `Deuda (${config.currencyCode})`, 'Límite ($)'];
    const rows = filteredClients.map(c => [
        `"${c.name}"`, 
        `"${c.identityCard}"`, 
        `"${c.phone}"`, 
        c.debt.toFixed(2), 
        (c.debt * config.exchangeRate).toFixed(2),
        c.creditLimit.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role === 'employee' && !config.permissions.canManageClients) return null;

  return (
    <div className="p-8">
      <div className="print-only mb-6 text-center">
        <h1 className="text-2xl font-bold">{config.businessName}</h1>
        <p className="text-gray-600">Reporte de Deudores (Fiado)</p>
        <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
        <div className="mt-4 border-b border-gray-300"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">Total Clientes</p>
                <h3 className="text-2xl font-bold text-gray-800">{clients.length - 1}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><UserCheck size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">Deuda Total (Fiado)</p>
                <h3 className="text-2xl font-bold text-red-600">${totalDebt.toFixed(2)}</h3>
                <div className="flex flex-col text-xs text-gray-500">
                    <span>{config.currencySymbol} {(totalDebt * config.exchangeRate).toFixed(2)} {config.currencyCode}</span>
                </div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-red-600"><AlertCircle size={24} /></div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
        <div className="flex gap-2">
            <button onClick={handleExportCSV} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-200 transition-colors shadow-sm">
                <Download size={20} /> Exportar CSV
            </button>
            <button onClick={() => window.print()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-sm">
                <Printer size={20} /> Imprimir
            </button>
            {canEdit && (
                <button onClick={() => { setEditingClient(null); setFormData(initialFormState); setIsFormOpen(true); }} className={`${getButtonClass()} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm`}>
                <Plus size={20} /> Nuevo Cliente
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 no-print">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar por nombre o cédula..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-semibold">Cédula</th>
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Teléfono</th>
                <th className="p-4 font-semibold">Deuda Actual</th>
                <th className="p-4 font-semibold">Límite</th>
                <th className="p-4 font-semibold text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-mono text-sm">{client.identityCard || '-'}</td>
                    <td className="p-4 font-medium text-gray-800">{client.name}</td>
                    <td className="p-4 text-gray-600">{client.phone || '-'}</td>
                    <td className="p-4">
                        <div className={`font-bold ${client.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>${client.debt.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{config.currencySymbol} {(client.debt * config.exchangeRate).toFixed(2)}</div>
                    </td>
                    <td className="p-4 text-gray-600">${client.creditLimit.toFixed(2)}</td>
                    <td className="p-4 no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handlePaymentClick(client)} disabled={client.debt <= 0} title="Registrar Abono" className="p-1 text-green-600 hover:bg-green-50 rounded disabled:text-gray-300">
                            <DollarSign size={18} />
                        </button>
                        {canEdit && <button onClick={() => handleEdit(client)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>}
                        {canDelete && <button onClick={() => handleDelete(client.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>}
                      </div>
                    </td>
                  </tr>
              ))}
              {filteredClients.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No se encontraron clientes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label><input required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Identidad</label><input required type="text" className="w-full p-2 border rounded-lg" value={formData.identityCard} onChange={e => setFormData({...formData, identityCard: e.target.value})} placeholder="V-12345678" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito ($)</label><input required type="number" className="w-full p-2 border rounded-lg" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value)})} /></div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button><button type="submit" className={`flex-1 py-2 text-white font-medium rounded-lg ${getButtonClass()}`}>Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {isPaymentOpen && payingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="bg-green-600 p-6 text-white rounded-t-xl">
              <h3 className="text-xl font-bold">Registrar Abono</h3>
              <p className="opacity-90 mt-1">{payingClient.name}</p>
            </div>
            <form onSubmit={submitPayment} className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Deuda Actual</p>
                <h2 className="text-3xl font-bold text-red-600">${payingClient.debt.toFixed(2)}</h2>
                <div className="text-sm text-gray-500">
                    <span>{config.currencySymbol} {(payingClient.debt * config.exchangeRate).toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Abonar ($)</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="number" step="0.01" max={payingClient.debt} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00"/>
                </div>
              </div>
              <div className="flex gap-4"><button type="button" onClick={() => setIsPaymentOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg">Confirmar Pago</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
