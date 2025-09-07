'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { getJsonContent } from '../app/actions';
import { useNotification } from '../context/NotificationContext';
import { FaMagic, FaTools, FaSearch, FaTimes, FaStar, FaClock, FaCalendarAlt, FaHourglassHalf, FaQuestionCircle, FaCheckCircle, FaCopy, FaHandSparkles } from 'react-icons/fa';
import TopicWeightsModal from './TopicWeightsModal'; // Importar o novo modal

// Interfaces
interface Subject {
  subject: string;
  topics: Topic[];
  color: string;
}

interface Topic {
  topic_text: string;
  userWeight?: number;
}

interface SubjectSettings {
  [key: string]: { importance: number; knowledge: number };
}

interface StudySession {
  id: any;
  subject: string;
  duration: number;
  color: string;
}

interface CycleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  initialData?: {
    studyHours: string;
    weeklyQuestionsGoal: string;
    subjectSettings: SubjectSettings;
    selectedSubjects: string[];
    minSession: string;
    maxSession: string;
    studyDays: string[];
  };
}

const CycleCreationModal: React.FC<CycleCreationModalProps> = ({ isOpen, onClose, isEditing = false, initialData }) => {
  const { generateStudyCycle, selectedDataFile, setStudyCycle, setCurrentProgressMinutes, setCompletedCycles, setSessionProgressMap, studyHours: dataContextStudyHours, weeklyQuestionsGoal: dataContextWeeklyQuestionsGoal, setStudyHours: setContextStudyHours, setWeeklyQuestionsGoal: setContextWeeklyQuestionsGoal, setStudyDays: setContextStudyDays } = useData();
  const { showNotification } = useNotification();
  const [modalStep, setModalStep] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSettings, setSubjectSettings] = useState<SubjectSettings>({});
  const [studyHours, setStudyHours] = useState('40');
  const [studyDays, setStudyDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [minSession, setMinSession] = useState('60');
  const [maxSession, setMaxSession] = useState('120');
  const [weeklyQuestionsGoal, setWeeklyQuestionsGoal] = useState('250');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualStudySessions, setManualStudySessions] = useState<StudySession[]>([]);
  const [newManualSessionSubject, setNewManualSessionSubject] = useState('');
  const [newManualSessionDuration, setNewManualSessionDuration] = useState('60');
  const [isManualSubjectDropdownOpen, setIsManualSubjectDropdownOpen] = useState(false);
  const manualSubjectDropdownRef = React.useRef<HTMLDivElement>(null);

  // Estados para o novo modal de pesos de tópicos
  const [isTopicWeightsModalOpen, setIsTopicWeightsModalOpen] = useState(false);
  const [selectedSubjectForWeights, setSelectedSubjectForWeights] = useState<Subject | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setStudyHours(initialData.studyHours || dataContextStudyHours);
        setWeeklyQuestionsGoal(initialData.weeklyQuestionsGoal || dataContextWeeklyQuestionsGoal);
        setSelectedSubjects(initialData.selectedSubjects || []);
        setSubjectSettings(initialData.subjectSettings || {});
        setMinSession(initialData.minSession || '60');
        setMaxSession(initialData.maxSession || '120');
        setStudyDays(initialData.studyDays || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
        setModalStep(1); // Pula para a seleção de matérias
      } else {
        // Reset para o estado padrão de criação
        setStudyHours(dataContextStudyHours || '40');
        setWeeklyQuestionsGoal(dataContextWeeklyQuestionsGoal || '250');
        setSelectedSubjects([]);
        setSubjectSettings({});
        setMinSession('60');
        setMaxSession('120');
        setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
        setModalStep(0);
      }
    }
  }, [isOpen, isEditing, initialData, dataContextStudyHours, dataContextWeeklyQuestionsGoal]);

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

  useEffect(() => {
    if (isOpen && selectedSubjects.length > 0) {
      setSubjectSettings(prevSettings => {
        const newSettings = { ...prevSettings };
        let changed = false;
        selectedSubjects.forEach(subject => {
          if (!newSettings[subject]) {
            newSettings[subject] = { importance: 3, knowledge: 3 };
            changed = true;
          }
        });
        return changed ? newSettings : prevSettings;
      });
    }
  }, [selectedSubjects, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (manualSubjectDropdownRef.current && !manualSubjectDropdownRef.current.contains(event.target as Node)) {
        setIsManualSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const percentages = useMemo(() => {
    const weights: { [key: string]: number } = {};
    let totalWeight = 0;
    Object.keys(subjectSettings).forEach(subject => {
      const { importance, knowledge } = subjectSettings[subject];
      const weight = importance / knowledge;
      weights[subject] = weight;
      totalWeight += weight;
    });
    const newPercentages: { [key: string]: string } = {};
    Object.keys(weights).forEach(subject => {
      newPercentages[subject] = totalWeight > 0 ? ((weights[subject] / totalWeight) * 100).toFixed(2) : '0.00';
    });
    return newPercentages;
  }, [subjectSettings]);

  const handleSubjectSelect = (subjectName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectName) ? prev.filter(s => s !== subjectName) : [...prev, subjectName]
    );
  };

  const handleSettingChange = (subject: string, type: 'importance' | 'knowledge', value: number) => {
    setSubjectSettings(prev => ({ ...prev, [subject]: { ...prev[subject], [type]: value } }));
  };

  const handleDaySelect = (day: string) => {
    setStudyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const validateNumericalInputs = () => {
    const hours = parseInt(studyHours);
    const min = parseInt(minSession);
    const max = parseInt(maxSession);
    const questionsGoal = parseInt(weeklyQuestionsGoal);

    if (isNaN(hours) || hours <= 0) {
      showNotification('Por favor, insira um número válido e positivo para as horas de estudo semanais.', 'error');
      return false;
    }
    if (isNaN(questionsGoal) || questionsGoal < 0) {
      showNotification('Por favor, insira um número válido e positivo para a meta de questões.', 'error');
      return false;
    }
    if (isNaN(min) || min <= 0) {
      showNotification('Por favor, insira um número válido e positivo para a duração mínima da sessão.', 'error');
      return false;
    }
    if (isNaN(max) || max <= 0) {
      showNotification('Por favor, insira um número válido e positivo para a duração máxima da sessão.', 'error');
      return false;
    }
    if (min > max) {
      showNotification('A duração mínima da sessão não pode ser maior que a duração máxima.', 'error');
      return false;
    }
    return true;
  };

  const handleGenerateCycle = () => {
    if (!validateNumericalInputs()) return;

    generateStudyCycle({
      studyHours: parseInt(studyHours),
      minSession: parseInt(minSession),
      maxSession: parseInt(maxSession),
      subjectSettings,
      subjects,
      weeklyQuestionsGoal: weeklyQuestionsGoal, // Passa a meta de questões como string
    });
    setContextStudyDays(studyDays); // Salva os dias de estudo no contexto
    onClose();
  };

  const handleCreateEmptyCycle = () => {
    setStudyCycle([]);
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setContextStudyHours(studyHours); // Define as horas de estudo no DataContext
    setContextWeeklyQuestionsGoal(weeklyQuestionsGoal); // Define a meta de questões no DataContext como string
    onClose();
    showNotification('Ciclo de estudos em branco criado com sucesso! Você pode preenchê-lo manualmente.', 'success');
  };

  const handleAddManualSession = () => {
    if (!newManualSessionSubject || !newManualSessionDuration) {
      showNotification('Por favor, selecione uma matéria e insira a duração da sessão.', 'error');
      return;
    }
    const duration = parseInt(newManualSessionDuration);
    if (isNaN(duration) || duration <= 0) {
      showNotification('A duração da sessão deve ser um número positivo.', 'error');
      return;
    }

    const selectedSubjectData = subjects.find(s => s.subject === newManualSessionSubject);
    const newSession: StudySession = {
      id: Date.now(), // Simple unique ID
      subject: newManualSessionSubject,
      duration: duration,
      color: selectedSubjectData?.color || '#94A3B8',
    };

    setManualStudySessions(prev => [...prev, newSession]);
    setNewManualSessionSubject('');
    setNewManualSessionDuration('60');
    showNotification('Sessão adicionada com sucesso!', 'success');
  };

  const handleDuplicateManualSession = (sessionToDuplicate: StudySession) => {
    const newSession: StudySession = {
      ...sessionToDuplicate,
      id: Date.now() + Math.random(), // Generate a new unique ID for the duplicated session
    };
    setManualStudySessions(prev => [...prev, newSession]);
    showNotification('Sessão duplicada com sucesso!', 'success');
  };

  const handleRemoveManualSession = (id: any) => {
    setManualStudySessions(prev => prev.filter(session => session.id !== id));
    showNotification('Sessão removida.', 'info');
  };

  const handleSaveManualCycle = () => {
    if (manualStudySessions.length === 0) {
      showNotification('Adicione pelo menos uma sessão para salvar o ciclo.', 'error');
      return;
    }
    const totalManualDurationMinutes = manualStudySessions.reduce((sum, session) => sum + session.duration, 0);
    setStudyCycle(manualStudySessions);
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setContextStudyHours((totalManualDurationMinutes / 60).toFixed(1)); // Define as horas de estudo no DataContext
    setContextWeeklyQuestionsGoal(weeklyQuestionsGoal); // Define a meta de questões no DataContext como string
    setContextStudyDays(studyDays); // Define os dias de estudo no DataContext
    onClose();
    showNotification('Ciclo de estudos manual salvo com sucesso!', 'success');
  };

  const openTopicWeightsModal = (subjectName: string) => {
    const subjectData = subjects.find(s => s.subject === subjectName);
    if (subjectData) {
      setSelectedSubjectForWeights(subjectData);
      setIsTopicWeightsModalOpen(true);
    }
  };

  const renderModalContent = () => {
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    switch (modalStep) {
      case 0:
        return (
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{isEditing ? 'Editar Ciclo de Estudos' : 'Criar Novo Ciclo de Estudos'}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Escolha como você prefere montar seu plano de estudos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => setModalStep(1)} className="group border-2 border-gray-200 hover:border-teal-500 p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 dark:border-gray-700 dark:hover:border-teal-400">
                <FaMagic className="text-4xl text-teal-500 mx-auto mb-4 transition-transform duration-300 group-hover:rotate-12 dark:text-teal-400" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Modo Guiado</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Nós guiaremos você passo a passo para criar um plano otimizado e personalizado.</p>
              </div>
              <div onClick={() => setModalStep(4)} className="group border-2 border-gray-200 hover:border-purple-500 p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 dark:border-gray-700 dark:hover:border-purple-400">
                <FaTools className="text-4xl text-purple-500 mx-auto mb-4 transition-transform duration-300 group-hover:rotate-12 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Modo Manual</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Crie seu ciclo de estudos adicionando sessões de estudo uma a uma.</p>
              </div>
            </div>
          </div>
        );
      case 1:
        const filteredSubjects = subjects.filter(s =>
          s.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Selecione as Matérias</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Clique nas matérias que você deseja incluir no seu ciclo de estudos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ minHeight: '400px' }}>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Matérias Disponíveis</h3>
                <div className="relative mb-4">
                  <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar matéria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                  />
                </div>
                <div className="flex items-center mb-3 pl-1">
                    <input
                        type="checkbox"
                        id="selectAll"
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 accent-teal-500"
                        onChange={() => {
                            const allSubjectNames = filteredSubjects.map(s => s.subject);
                            const allSelected = allSubjectNames.every(s => selectedSubjects.includes(s));
                            if (allSelected) {
                                setSelectedSubjects(prev => prev.filter(s => !allSubjectNames.includes(s)));
                            } else {
                                setSelectedSubjects(prev => [...new Set([...prev, ...allSubjectNames])]);
                            }
                        }}
                        checked={filteredSubjects.length > 0 && filteredSubjects.every(s => selectedSubjects.includes(s.subject))}
                    />
                    <label htmlFor="selectAll" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-100">
                        Selecionar Todas
                    </label>
                </div>
                <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: '260px' }}>
                  {filteredSubjects.map(s => (
                    <div
                      key={s.subject}
                      onClick={() => handleSubjectSelect(s.subject)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${selectedSubjects.includes(s.subject) ? 'bg-teal-100 text-teal-800 font-semibold dark:bg-teal-800 dark:text-teal-100' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'}`}>
                      <span className="text-gray-800">{s.subject}</span>
                      {selectedSubjects.includes(s.subject) && <FaCheckCircle className="text-teal-500 dark:text-teal-400" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Matérias Selecionadas ({selectedSubjects.length})</h3>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '340px' }}>
                  {selectedSubjects.length > 0 ? (
                    selectedSubjects.map(subjectName => (
                      <div key={subjectName} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{subjectName}</span>
                        <button onClick={() => handleSubjectSelect(subjectName)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                          <FaTimes />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 pt-16">
                      <p>Nenhuma matéria selecionada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={isEditing ? onClose : () => setModalStep(0)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={() => setModalStep(2)} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors dark:bg-teal-600 dark:hover:bg-teal-700" disabled={selectedSubjects.length === 0}>Avançar</button>
            </div>
          </div>
        );
      case 2:
        const totalWeight = Object.values(subjectSettings).reduce((acc, { importance, knowledge }) => acc + (importance / knowledge), 0);
        const StarRating = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <FaStar
                key={star}
                className={`cursor-pointer ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => onChange(star)}
              />
            ))}
          </div>
        );
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Ajuste de Peso das Matérias</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Defina a importância e seu conhecimento em cada matéria para balancear o ciclo.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ minHeight: '400px' }}>
              <div className="space-y-4 overflow-y-auto pr-4" style={{ maxHeight: '450px' }}>
                {selectedSubjects.map(subject => (
                  <div key={subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600 relative">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">{subject}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Importância</label>
                      <StarRating
                        value={subjectSettings[subject]?.importance || 3}
                        onChange={(value) => handleSettingChange(subject, 'importance', value)}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Conhecimento</label>
                      <StarRating
                        value={subjectSettings[subject]?.knowledge || 3}
                        onChange={(value) => handleSettingChange(subject, 'knowledge', value)}
                      />
                    </div>
                    <button
                      onClick={() => openTopicWeightsModal(subject)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                      title="Ajustar relevância dos tópicos"
                    >
                      <FaHandSparkles />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-6 rounded-lg dark:bg-gray-700">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Distribuição do Tempo</h3>
                {totalWeight > 0 ? (
                  <DonutChartForModal data={percentages} subjects={subjects} />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-200 dark:bg-gray-600 rounded-full mx-auto flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Ajuste os pesos para ver o gráfico</p>
                  </div>
                )}
                <div className="w-full mt-6 space-y-2 overflow-y-auto" style={{ maxHeight: '180px' }}>
                  {Object.entries(percentages).map(([subject, percentage]) => {
                    const subjectData = subjects.find(s => s.subject === subject);
                    const color = subjectData ? subjectData.color : '#94A3B8';
                    return (
                      <div key={subject} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                          <span className="text-gray-700 dark:text-gray-100">{subject}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(1)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={() => setModalStep(3)} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors dark:bg-teal-600 dark:hover:bg-teal-700">Avançar</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Planejamento Semanal</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Defina a estrutura do seu ciclo de estudos semanal.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaClock className="mr-3 text-teal-500" />
                    Horas Semanais
                  </label>
                  <input
                    type="number"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                    placeholder="Ex: 40"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaQuestionCircle className="mr-3 text-teal-500" />
                    Meta de Questões
                  </label>
                  <input
                    type="number"
                    value={weeklyQuestionsGoal}
                    onChange={(e) => setWeeklyQuestionsGoal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                    placeholder="Ex: 250"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaHourglassHalf className="mr-3 text-teal-500" />
                    Duração da Sessão (min)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={minSession}
                      onChange={(e) => setMinSession(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                    />
                    <span className="text-gray-500 font-bold dark:text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={maxSession}
                      onChange={(e) => setMaxSession(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-3 flex items-center">
                  <FaCalendarAlt className="mr-3 text-teal-500" />
                  Dias de Estudo
                </label>
                <div className="flex justify-around items-center pt-4">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      onClick={() => handleDaySelect(day)}
                      className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${studyDays.includes(day) ? 'bg-teal-500 text-white transform scale-110 shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}
                      title={day}
                    >
                      {day.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-teal-50 dark:bg-teal-900/50 rounded-lg border-2 border-teal-200 dark:border-teal-700">
              <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-4">Resumo do seu Planejamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-teal-900 dark:text-teal-100">
                <p><strong>Matérias:</strong> {selectedSubjects.length}</p>
                <p><strong>Horas/Semana:</strong> {studyHours}h</p>
                <p><strong>Meta de Questões:</strong> {weeklyQuestionsGoal}</p>
                <p><strong>Dias de Estudo:</strong> {studyDays.length}</p>
                <p><strong>Duração da Sessão:</strong> {minSession}-{maxSession} min</p>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(2)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={handleGenerateCycle} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors dark:bg-teal-600 dark:hover:bg-teal-700">Gerar Ciclo</button>
            </div>
          </div>
        );
      case 4:
        const totalManualDuration = manualStudySessions.reduce((sum, session) => sum + session.duration, 0);
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Criação Manual do Ciclo</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione sessões de estudo uma a uma para montar seu ciclo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="manualSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-100">Matéria</label>
                <div className="flex items-end gap-2">
                  <div className="relative w-full" ref={manualSubjectDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsManualSubjectDropdownOpen(!isManualSubjectDropdownOpen)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-left text-base border-2 border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                    >
                      <span className="block truncate text-gray-900">{newManualSessionSubject || 'Selecione uma matéria'}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </button>
                    {isManualSubjectDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm dark:bg-gray-700 dark:ring-gray-600">
                        {subjects.map(s => (
                          <div
                            key={s.subject}
                            onClick={() => {
                              setNewManualSessionSubject(s.subject);
                              setIsManualSubjectDropdownOpen(false);
                            }}
                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-teal-100 dark:text-gray-100 dark:hover:bg-teal-800"
                          >
                            <span className="block whitespace-normal">{s.subject}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openTopicWeightsModal(newManualSessionSubject)}
                    disabled={!newManualSessionSubject}
                    className="p-3 h-full text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    title="Ajustar Relevância dos Tópicos"
                  >
                    <FaHandSparkles />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="manualDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-100">Duração (min)</label>
                <input
                  type="number"
                  id="manualDuration"
                  value={newManualSessionDuration}
                  onChange={(e) => setNewManualSessionDuration(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                  placeholder="Ex: 60"
                  min="1"
                />
              </div>
            </div>
            <button
              onClick={handleAddManualSession}
              className="w-full py-2 px-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors mb-6 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              Adicionar Sessão
            </button>

            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sessões Adicionadas ({manualStudySessions.length})</h3>
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
              {manualStudySessions.length > 0 ? (
                manualStudySessions.map((session, index) => (
                  <div key={session.id} className="flex justify-between items-stretch p-3 bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: session.color }}></span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{session.subject}</span>
                      <span className="ml-4 text-gray-700 dark:text-gray-100">{session.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleDuplicateManualSession(session)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <FaCopy />
                      </button>
                      <button onClick={() => handleRemoveManualSession(session.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 pt-8">
                  <p>Nenhuma sessão adicionada ainda.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <FaClock className="mr-3 text-teal-500 dark:text-teal-400" />
                  Horas Semanais
                </label>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{(totalManualDuration / 60).toFixed(1)}h</p>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <FaQuestionCircle className="mr-3 text-teal-500 dark:text-teal-400" />
                  Meta de Questões
                </label>
                <input
                  type="number"
                  value={weeklyQuestionsGoal}
                  onChange={(e) => setWeeklyQuestionsGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                  placeholder="Ex: 250"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <FaCalendarAlt className="mr-3 text-teal-500 dark:text-teal-400" />
                Dias de Estudo
              </label>
              <div className="flex justify-around items-center pt-4">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${studyDays.includes(day) ? 'bg-teal-500 text-white transform scale-110 shadow-lg dark:bg-teal-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}
                    title={day}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(0)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={handleSaveManualCycle} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors dark:bg-teal-600 dark:hover:bg-teal-700">Salvar Ciclo</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl w-full mx-4 relative transform transition-all duration-300 ease-out scale-95 hover:scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10 dark:text-gray-400 dark:hover:text-gray-100">
          <FaTimes className="text-2xl" />
        </button>
        {renderModalContent()}
        
        {/* Renderiza o novo modal de pesos de tópicos */}
        <TopicWeightsModal
          isOpen={isTopicWeightsModalOpen}
          onClose={() => setIsTopicWeightsModalOpen(false)}
          subject={selectedSubjectForWeights}
        />
      </div>
    </div>
  );
};

const DonutChartForModal = ({ data, subjects }: { data: { [key: string]: string }, subjects: Subject[] }) => {
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const subjectColorMap = new Map(subjects.map(s => [s.subject, s.color]));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 mx-auto">
      {Object.entries(data).map(([subject, percentage]) => {
        const color = subjectColorMap.get(subject) || '#94A3B8';
        const dash = (parseFloat(percentage) / 100) * circumference;
        const strokeDasharray = `${dash} ${circumference - dash}`;
        const strokeDashoffset = -offset;
        offset += dash;

        return (
          <circle
            key={subject}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </svg>
  );
};

export default CycleCreationModal;