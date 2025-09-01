'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { getJsonContent } from '../app/actions';
import { useNotification } from '../context/NotificationContext';

interface Subject {
  subject: string;
  color: string;
}

const StudySessionList: React.FC = () => {
  const { studyCycle, setStudyCycle, sessionProgressMap, selectedDataFile } = useData();
  const { showNotification } = useNotification();
  const [newSessionData, setNewSessionData] = useState<{ subject: string; duration: number } | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      if (selectedDataFile) {
        const data: Subject[] | { subjects: Subject[] } = await getJsonContent(selectedDataFile);
        let subjectsArray: Subject[] = [];
        if (Array.isArray(data)) {
          subjectsArray = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.subjects)) {
          subjectsArray = data.subjects;
        }
        const subjectsWithColors = subjectsArray.map((s: Subject) => ({
          ...s,
          color: s.color || '#94A3B8'
        }));
        setSubjects(subjectsWithColors);
      }
    }
    if (selectedDataFile) {
      loadSubjects();
    }
  }, [selectedDataFile]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && studyCycle) {
      setStudyCycle((items) => {
        const oldIndex = items!.findIndex((item) => item.id === active.id);
        const newIndex = items!.findIndex((item) => item.id === over!.id);
        return arrayMove(items!, oldIndex, newIndex);
      });
    }
  };

  const handleAddSessionClick = () => {
    setNewSessionData({ subject: '', duration: 0 });
  };

  const handleSaveNewSession = () => {
    if (!newSessionData) return;
    if (!newSessionData.subject) {
      showNotification('Por favor, selecione uma matéria.', 'error');
      return;
    }
    if (newSessionData.duration <= 0) {
      showNotification('A duração da sessão deve ser maior que zero.', 'error');
      return;
    }

    const subjectData = subjects.find(s => s.subject === newSessionData.subject);
    const newSession = {
      id: `${Date.now()}`,
      subject: newSessionData.subject,
      duration: newSessionData.duration,
      color: subjectData?.color || '#94A3B8',
    };

    setStudyCycle(prevCycle => [...(prevCycle || []), newSession]);
    setNewSessionData(null);
  };

  const handleCancelNewSession = () => {
    setNewSessionData(null);
  };

  return (
    <div className="relative space-y-4 h-96 overflow-y-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={studyCycle || []} strategy={verticalListSortingStrategy}>
          {studyCycle && studyCycle.length > 0 ? (
            <div className="space-y-2">
              {studyCycle.filter(session => (sessionProgressMap[session.id] || 0) < session.duration).map((session, index) => (
                <SortableItem
                  key={session.id}
                  session={session}
                  index={index}
                />
              ))}
              {newSessionData && (
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2 border border-blue-300">
                  <select
                    value={newSessionData.subject}
                    onChange={(e) => setNewSessionData(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Selecione a matéria</option>
                    {subjects.map(s => (
                      <option key={s.subject} value={s.subject}>{s.subject}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Minutos"
                    value={newSessionData.duration === 0 ? '' : newSessionData.duration}
                    onChange={(e) => setNewSessionData(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                    className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveNewSession}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelNewSession}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-md text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-8">Nenhuma sessão de estudo. Adicione uma para começar!</p>
          )}
        </SortableContext>
      </DndContext>

      {!newSessionData && (
        <button
          onClick={handleAddSessionClick}
          className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
        >
          + Adicionar Sessão
        </button>
      )}
    </div>
  );
};

export default StudySessionList;