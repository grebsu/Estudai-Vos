'use client';

import React, { useState, useEffect } from 'react';
import AddTopicModal from './AddTopicModal'; // Import AddTopicModal
import { FaArrowUp, FaArrowDown, FaEdit, FaTrash } from 'react-icons/fa'; // Importar ícones
import { useNotification } from '../context/NotificationContext';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectName: string, topics: string[], color: string) => void;
  initialSubjectData?: Subject; // Nova propriedade para edição
}

const colors = [
  // Reds
  '#EF4444', '#F87171', '#DC2626', '#B91C1C',
  // Oranges
  '#F97316', '#FB923C', '#EA580C', '#C2410C',
  // Yellows
  '#F59E0B', '#FBBF24', '#D97706', '#B45309',
  // Greens
  '#84CC16', '#A3E635', '#65A30D', '#4D7C0F',
  '#22C55E', '#4ADE80', '#16A34A', '#15803D',
  // Teals
  '#14B8A6', '#2DD4BF', '#0D9488', '#0F766E',
  // Blues
  '#0EA5E9', '#38BDF8', '#0284C7', '#0369A1',
  '#3B82F6', '#60A5FA', '#2563EB', '#1D4ED8',
  // Purples
  '#8B5CF6', '#A78BFA', '#7C3AED', '#6D28D9',
  '#A855F7', '#C084FC', '#9333EA', '#7E22CE',
  // Pinks
  '#EC4899', '#F472B6', '#DB2777', '#BE185D',
];

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({ isOpen, onClose, onSave, initialSubjectData }) => {
  const { showNotification } = useNotification();
  const [subjectName, setSubjectName] = useState(initialSubjectData?.subject || '');
  const [topics, setTopics] = useState<string[]>(initialSubjectData?.topics.map(t => t.topic_text) || []);
  const [selectedColor, setSelectedColor] = useState(initialSubjectData?.color || colors[0]);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false); // Adicionando a declaração do estado
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Novo estado para controlar a edição
  const [editingText, setEditingText] = useState(''); // Novo estado para o texto em edição
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSubjectName(initialSubjectData?.subject || '');
      setTopics(initialSubjectData?.topics.map(t => t.topic_text) || []);
      setSelectedColor(initialSubjectData?.color || colors[0]);
      setEditingIndex(null); // Reset editing state
      setEditingText(''); // Reset editing text
    }
  }, [isOpen, initialSubjectData]);

  if (!isOpen) return null;

  const handleAddTopicsFromModal = (newTopics: string[], shouldContinue: boolean) => {
    setTopics(prevTopics => [...prevTopics, ...newTopics]);
    if (!shouldContinue) {
      setIsAddTopicModalOpen(false);
    }
  };

  const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
    setTopics(prevTopics => {
      const newTopics = [...prevTopics];
      const [movedTopic] = newTopics.splice(index, 1);
      if (direction === 'up') {
        newTopics.splice(index - 1, 0, movedTopic);
      } else {
        newTopics.splice(index + 1, 0, movedTopic);
      }
      return newTopics;
    });
  };

  const handleEditTopic = (index: number) => {
    setEditingIndex(index);
    setEditingText(topics[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingText.trim() !== '') {
      setTopics(prevTopics => {
        const newTopics = [...prevTopics];
        newTopics[editingIndex] = editingText.trim();
        return newTopics;
      });
      setEditingIndex(null);
      setEditingText('');
    } else if (editingIndex !== null && editingText.trim() === '') {
      // Se o texto estiver vazio, exclui o tópico
      handleDeleteTopic(editingIndex);
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const handleDeleteTopic = (index: number) => {
    setTopics(prevTopics => prevTopics.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (subjectName.trim()) {
      onSave(subjectName.trim(), topics, selectedColor);
      setSubjectName(''); // Limpa os campos após salvar
      setTopics([]); // Limpa os tópicos
      setSelectedColor(colors[0]); // Reseta a cor para a padrão
    } else {
      showNotification('O nome da disciplina não pode estar vazio.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Nova Disciplina</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-3/4">
            <label htmlFor="subjectName" className="block text-sm font-bold text-teal-800 dark:text-teal-300 mb-2">
              NOME DA DISCIPLINA
            </label>
            <input
              type="text"
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ex: Direito Constitucional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
              autoFocus
            />
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-sm font-bold text-teal-800 dark:text-teal-300 mb-2">
              SELECIONAR UMA COR
            </label>
            <div className="relative" ref={colorPickerRef}>
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md" style={{ backgroundColor: selectedColor }}></span>
                  <span className="text-gray-700 dark:text-gray-100">Selecionar Cor...</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">▼</span>
              </button>
              {isColorPickerOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-full h-8 rounded-md border-2 ${
                          selectedColor === color ? 'border-teal-500 ring-2 ring-teal-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedColor(color);
                          setIsColorPickerOpen(false);
                        }}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <label htmlFor="customColor" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Cor Personalizada
                    </label>
                    <input
                      type="color"
                      id="customColor"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer dark:border-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-teal-800 dark:text-teal-300">
              Tópicos
            </label>
            <button
              onClick={() => setIsAddTopicModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-1 px-3 rounded-lg text-sm dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              + ADICIONAR NOVO TÓPICO
            </button>
          </div>
          <div className="border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto dark:border-gray-600">
            {topics.length === 0 ? (
              <p className="text-gray-500 italic dark:text-gray-400">Nenhum tópico adicionado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {topics.map((topic, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md dark:bg-gray-700">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleSaveEdit} // Salva ao perder o foco
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          }
                        }}
                        className="flex-grow px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:focus:ring-teal-400"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-700 dark:text-gray-100">{topic}</span>
                    )}
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleMoveTopic(index, 'up')}
                        disabled={index === 0}
                        className="text-blue-500 hover:text-blue-700 text-sm disabled:text-gray-400 p-1 rounded dark:text-blue-400 dark:hover:text-blue-500 dark:disabled:text-gray-500"
                        title="Subir"
                      >
                        <FaArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveTopic(index, 'down')}
                        disabled={index === topics.length - 1}
                        className="text-blue-500 hover:text-blue-700 text-sm disabled:text-gray-400 p-1 rounded dark:text-blue-400 dark:hover:text-blue-500 dark:disabled:text-gray-500"
                        title="Descer"
                      >
                        <FaArrowDown size={14} />
                      </button>
                      {editingIndex === index ? (
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-500 hover:text-green-700 text-sm p-1 rounded dark:text-green-400 dark:hover:text-green-500"
                          title="Salvar"
                        >
                          <FaEdit size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditTopic(index)}
                          className="text-yellow-500 hover:text-yellow-700 text-sm p-1 rounded dark:text-yellow-400 dark:hover:text-yellow-500"
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTopic(index)}
                        className="text-red-500 hover:text-red-700 text-sm p-1 rounded dark:text-red-400 dark:hover:text-red-500"
                        title="Excluir"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
          >
            Salvar
          </button>
        </div>
      </div>

      {isAddTopicModalOpen && (
        <AddTopicModal
          isOpen={isAddTopicModalOpen}
          onClose={() => setIsAddTopicModalOpen(false)}
          onAdd={handleAddTopicsFromModal}
          existingTopics={topics}
        />
      )}
    </div>
  );
};

export default AddSubjectModal;
