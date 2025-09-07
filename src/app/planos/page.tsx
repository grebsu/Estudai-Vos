'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getJsonContent, createPlanFile, getJsonFiles } from '../actions';
import Link from 'next/link';
import Image from 'next/image';
import CreatePlanModal from '../../components/CreatePlanModal';
import { FaPlusCircle, FaFileAlt, FaTrash } from 'react-icons/fa';
import { useNotification } from '../../context/NotificationContext';
import ConfirmationModal from '../../components/ConfirmationModal';

// Interfaces atualizadas
interface PlanContent {
  name: string;
  observations: string;
  iconUrl?: string;
  subjects: Subject[];
}

interface Subject {
  subject: string;
  topics: Topic[];
}

interface Topic {
  topic_number: string;
  topic_text: string;
  subtopics?: Subtopic[];
}

interface Subtopic {
  subtopic_number: string;
  subtopic_text: string;
}

interface PlanInfo {
  fileName: string;
  name: string;
  iconUrl?: string;
  subjectCount: number;
  topicCount: number;
}

interface PlanFormData {
  name: string;
  observations: string;
  cargo: string;
  edital: string;
  image?: File;
}

export default function Planos() {
  const { deletePlan } = useData();
  const { showNotification } = useNotification();
  const [planos, setPlanos] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanInfo | null>(null);

  const fetchPlanData = useCallback(async () => {
    setLoading(true);
    const allFiles = await getJsonFiles();
    const filesToLoad = allFiles.filter(file => file.toUpperCase() !== 'USERS.JSON');
    const loadedPlanos: PlanInfo[] = [];

    for (const file of filesToLoad) {
      if (file === 'study_records.json') continue;

      const rawData = await getJsonContent(file);
      let plan: PlanContent; // Declare a variable to hold the normalized plan data

      if (Array.isArray(rawData)) {
        // If it's an array of subjects (like sefaz-df.json)
        plan = {
          name: file.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          observations: '',
          iconUrl: undefined,
          subjects: rawData, // rawData is already Subject[]
        };
      } else if (rawData && typeof rawData === 'object' && rawData.subjects !== undefined) {
        // If it's a PlanContent object (like meu-plano.json or newly created plans)
        plan = rawData as PlanContent; // Cast it, assuming it matches PlanContent structure
      } else {
        // Handle cases where the file might be empty or malformed, or just {}
        // Treat it as an empty plan
        plan = {
          name: file.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          observations: '',
          iconUrl: undefined,
          subjects: [],
        };
      }

      // Ensure subjects array exists for counting, even if empty
      const subjectsToCount = plan.subjects || [];

      let totalTopics = 0;
      subjectsToCount.forEach(subject => {
        totalTopics += (subject.topics || []).length;
        (subject.topics || []).forEach(topic => {
          if (topic.subtopics) {
            totalTopics += topic.subtopics.length;
          }
        });
      });

      loadedPlanos.push({
        fileName: file,
        name: plan.name || file.replace('.json', '').toUpperCase(), // Use plan.name if available
        iconUrl: plan.iconUrl,
        subjectCount: subjectsToCount.length,
        topicCount: totalTopics,
      });
    }
    setPlanos(loadedPlanos);
    setLoading(false);
  }, []);

  const handleDeleteClick = (event: React.MouseEvent, plan: PlanInfo) => {
    event.preventDefault();
    event.stopPropagation();
    setPlanToDelete(plan);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete.fileName);
      showNotification(`Plano "${planToDelete.name}" excluído com sucesso.`, 'success');
      setPlanToDelete(null);
      setIsConfirmModalOpen(false);
      await fetchPlanData();
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const handleSavePlan = async (planData: { name: string; observations: string; cargo: string; edital: string; image?: File }) => {
    const formData = new FormData();
    formData.append('name', planData.name);
    formData.append('observations', planData.observations);
    formData.append('cargo', planData.cargo);
    formData.append('edital', planData.edital);
    if (planData.image) {
      formData.append('image', planData.image);
    }

    const result = await createPlanFile(formData);

    if (result.success) {
      showNotification(`Plano "${planData.name}" criado com sucesso!`, 'success');
      setIsModalOpen(false);
      await fetchPlanData();
    } else {
      showNotification(`Erro: ${result.error}`, 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"><p>Carregando planos...</p></div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
        <div className="w-full">
          <div className="mb-6">
          <header className="flex justify-between items-center pt-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Meus Planos de Estudo</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold"
                title="Criar Novo Plano"
              >
                <FaPlusCircle className="mr-2 text-lg" />
                Criar Novo Plano
              </button>
            </div>
          </header>
          <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
        </div>

          {/* Seção de Planos Existentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planos.map((plan) => (
              <div key={plan.fileName} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center p-6 group">
                <Link href={`/planos/${plan.fileName}`} className="w-full h-full">
                  {plan.iconUrl ? (
                    <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-amber-500 shadow-md mx-auto">
                      <Image src={plan.iconUrl} alt={`Ícone do plano ${plan.name}`} layout="fill" objectFit="cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mb-4 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 mx-auto">
                      <FaFileAlt size={48} />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{plan.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Matérias: <span className="font-semibold">{plan.subjectCount}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Tópicos: <span className="font-semibold">{plan.topicCount}</span></p>
                </Link>
                <button
                  onClick={(e) => handleDeleteClick(e, plan)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity duration-300"
                  title="Excluir Plano"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o plano "${planToDelete?.name}"? Esta ação é irreversível.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
}