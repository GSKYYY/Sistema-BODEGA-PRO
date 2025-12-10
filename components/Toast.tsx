
import React from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications } = useData();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((note) => (
        <div 
          key={note.id} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] animate-in slide-in-from-right fade-in duration-300
            ${note.type === 'success' ? 'bg-green-600' : 
              note.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
        >
          {note.type === 'success' && <CheckCircle size={20} />}
          {note.type === 'error' && <AlertCircle size={20} />}
          {note.type === 'info' && <Info size={20} />}
          
          <span className="flex-1 font-medium text-sm">{note.message}</span>
        </div>
      ))}
    </div>
  );
};
