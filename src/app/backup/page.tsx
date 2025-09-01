'use client';

import React, { useState, useRef } from 'react';
import { FaDownload, FaUpload, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { useData } from '../../context/DataContext';

const BackupPage = () => {
  const { exportAllData, importAllData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportAllData(); // Changed to await
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date().toISOString().split('T')[0];
      link.download = `backup-estudai-vos-completo-${date}.json`; // Updated filename
      link.click();
      setSuccess('Backup completo exportado com sucesso!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao exportar os dados.');
      setSuccess(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmImport = window.confirm(
      'AVISO: A importação de um arquivo substituirá TODOS os seus dados atuais para o plano selecionado. Esta ação não pode ser desfeita. Deseja continuar?'
    );

    if (confirmImport) {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') {
            throw new Error('Formato de arquivo inválido.');
          }
          const data = JSON.parse(text);
          
          await importAllData(data);

          setSuccess('Dados importados com sucesso! A página será recarregada para refletir as mudanças.');
          setTimeout(() => {
            window.location.reload();
          }, 2000);

        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Ocorreu um erro ao importar o arquivo. Verifique se o arquivo é um backup válido.');
          setSuccess(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    }
    
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-slate-200">Backup e Restauração</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel de Exportação */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border dark:border-slate-700">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-teal-600 dark:text-teal-400">
            <FaDownload className="mr-3" />
            Exportar Dados
          </h2>
          <p className="mb-4 text-gray-600 dark:text-slate-300">
            Crie um backup de todos os seus dados, incluindo planos de estudo, matérias, histórico e simulados. Salve este arquivo em um local seguro.
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            <FaDownload className="mr-2" />
            Exportar para Arquivo
          </button>
        </div>

        {/* Painel de Importação */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border dark:border-slate-700">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-teal-600 dark:text-teal-400">
            <FaUpload className="mr-3" />
            Importar Dados
          </h2>
          <div className="bg-orange-100 dark:bg-orange-500/20 border-l-4 border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-300 p-4 rounded-md mb-4" role="alert">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 mr-3 mt-1" />
              <div>
                <p className="font-bold">Atenção!</p>
                <p>A importação de um arquivo substituirá permanentemente todos os dados atuais. Use com cuidado.</p>
              </div>
            </div>
          </div>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400 mt-4"
          >
            {isLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaUpload className="mr-2" />
            )}
            {isLoading ? 'Importando...' : 'Importar de Arquivo'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400 rounded-lg text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-400 rounded-lg text-center">
          {success}
        </div>
      )}
    </div>
  );
};

export default BackupPage;
