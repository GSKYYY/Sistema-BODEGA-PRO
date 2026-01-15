
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { UploadCloud, FileSpreadsheet, Check, AlertTriangle, ArrowRight, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface ProductImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStage = 'upload' | 'mapping' | 'processing' | 'result';

interface MappedData {
    name: string;
    salePrice: number;
    costPrice: number;
    stock: number;
    code: string;
    category: string;
}

export const ProductImporter: React.FC<ProductImporterProps> = ({ onClose, onSuccess }) => {
  const { bulkAddProducts, categories } = useData();
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  
  // Mapping State: DB Field -> Excel Header
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    salePrice: '',
    costPrice: '',
    stock: '',
    code: '',
    category: ''
  });

  const [progress, setProgress] = useState(0);
  const [resultStats, setResultStats] = useState({ added: 0, errors: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        processFile(selectedFile);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length > 0) {
            const extractedHeaders = (data[0] as string[]).map(h => String(h).trim());
            setHeaders(extractedHeaders);
            setRawData(data.slice(1)); // Skip header row
            autoMapHeaders(extractedHeaders);
            setStage('mapping');
        }
    };
    reader.readAsBinaryString(f);
  };

  const autoMapHeaders = (fileHeaders: string[]) => {
      const newMapping = { ...mapping };
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

      fileHeaders.forEach(header => {
          const h = normalize(header);
          if (['nombre', 'producto', 'descripcion', 'name', 'product'].some(k => h.includes(k))) newMapping.name = header;
          if (['precio', 'venta', 'pvp', 'price', 'saleprice'].some(k => h.includes(k) && !h.includes('costo'))) newMapping.salePrice = header;
          if (['costo', 'compra', 'cost'].some(k => h.includes(k))) newMapping.costPrice = header;
          if (['stock', 'cantidad', 'existencia', 'quantity'].some(k => h.includes(k))) newMapping.stock = header;
          if (['codigo', 'code', 'sku', 'ref'].some(k => h.includes(k))) newMapping.code = header;
          if (['categoria', 'category', 'tipo', 'familia'].some(k => h.includes(k))) newMapping.category = header;
      });
      setMapping(newMapping);
  };

  const handleImport = async () => {
      setStage('processing');
      setProgress(10);

      const productsToUpload: Omit<Product, 'id'>[] = [];
      const defaultCategoryId = categories.length > 0 ? categories[0].id : '';

      // Processing Loop
      rawData.forEach((row: any) => {
          // Convert row array to object based on headers index
          const rowObj: any = {};
          headers.forEach((h, i) => {
              rowObj[h] = row[i];
          });

          // Extract values based on mapping
          const name = rowObj[mapping.name];
          // Skip invalid rows
          if (!name || String(name).trim() === '') return;

          const salePrice = parseFloat(rowObj[mapping.salePrice]) || 0;
          const costPrice = parseFloat(rowObj[mapping.costPrice]) || 0;
          const stock = parseInt(rowObj[mapping.stock]) || 0;
          let code = rowObj[mapping.code] ? String(rowObj[mapping.code]) : '';
          if (!code) code = 'IMP-' + Math.floor(Math.random() * 1000000);

          // Category matching logic
          let categoryId = defaultCategoryId;
          const categoryNameInFile = rowObj[mapping.category];
          if (categoryNameInFile) {
              const matchedCat = categories.find(c => c.name.toLowerCase() === String(categoryNameInFile).toLowerCase());
              if (matchedCat) categoryId = matchedCat.id;
          }

          productsToUpload.push({
              name: String(name).trim(),
              code: code,
              salePrice: Math.abs(salePrice),
              costPrice: Math.abs(costPrice),
              stock: stock,
              minStock: 5,
              categoryId: categoryId,
              unit: 'und',
              status: 'active'
          });
      });

      setProgress(50);
      
      // Upload in batch via Context
      if (productsToUpload.length === 0) {
          setResultStats({ added: 0, errors: 0 });
          setStage('result');
          return;
      }

      const result = await bulkAddProducts(productsToUpload);
      
      setProgress(100);
      setResultStats(result);
      setTimeout(() => setStage('result'), 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-green-600" /> Importación Masiva
                    </h3>
                    <p className="text-sm text-gray-500">Sube tus productos desde Excel (.xlsx) o CSV</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
                
                {stage === 'upload' && (
                    <div className="h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer group"
                         onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud size={32} className="text-blue-500" />
                        </div>
                        <p className="text-gray-600 font-medium">Haz clic para seleccionar archivo</p>
                        <p className="text-xs text-gray-400 mt-2">Soporta hasta 5,000 filas</p>
                    </div>
                )}

                {stage === 'mapping' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                            <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-blue-800">
                                <p className="font-bold">Mapeo de Columnas</p>
                                <p>El sistema intentó detectar las columnas automáticamente. Por favor verifica que coincidan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'name', label: 'Nombre del Producto', req: true },
                                { key: 'salePrice', label: 'Precio Venta', req: true },
                                { key: 'costPrice', label: 'Costo (Opcional)', req: false },
                                { key: 'stock', label: 'Stock Inicial', req: false },
                                { key: 'code', label: 'Código (Opcional)', req: false },
                                { key: 'category', label: 'Categoría (Opcional)', req: false },
                            ].map(field => (
                                <div key={field.key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                                        {field.label} {field.req && <span className="text-red-500">*</span>}
                                    </label>
                                    <select 
                                        className={`w-full p-2 rounded border text-sm ${mapping[field.key] ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-300'}`}
                                        value={mapping[field.key as keyof typeof mapping]}
                                        onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                                    >
                                        <option value="">-- Ignorar --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            Filas detectadas: <b>{rawData.length}</b>
                        </div>
                    </div>
                )}

                {stage === 'processing' && (
                    <div className="flex flex-col items-center justify-center h-48 space-y-6">
                        <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-gray-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                <circle className="text-green-500 progress-ring__circle stroke-current transition-all duration-500 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progress) / 100}></circle>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xl font-bold text-green-600">
                                {progress}%
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-bold text-gray-800">Procesando Inventario...</h4>
                            <p className="text-gray-500 text-sm">Optimizando base de datos</p>
                        </div>
                    </div>
                )}

                {stage === 'result' && (
                    <div className="text-center py-8 space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">¡Importación Exitosa!</h3>
                            <p className="text-gray-500">El inventario se ha actualizado.</p>
                        </div>
                        <div className="flex justify-center gap-8">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-gray-800">{resultStats.added}</span>
                                <span className="text-sm text-gray-500">Agregados</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-red-500">{resultStats.errors}</span>
                                <span className="text-sm text-gray-500">Errores/Omitidos</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                {stage === 'upload' && (
                    <button onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                )}
                {stage === 'mapping' && (
                    <>
                        <button onClick={() => setStage('upload')} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Atrás</button>
                        <button 
                            onClick={handleImport} 
                            disabled={!mapping.name || !mapping.salePrice}
                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2 disabled:bg-gray-400 disabled:shadow-none transition-all"
                        >
                            Comenzar Importación <ArrowRight size={18} />
                        </button>
                    </>
                )}
                {stage === 'result' && (
                    <button onClick={onSuccess} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg transition-colors">Finalizar</button>
                )}
            </div>
        </div>
    </div>
  );
};
