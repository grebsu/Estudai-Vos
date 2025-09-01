'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BsCheckLg, BsXLg, BsPencilFill, BsPlusCircleFill, 
  BsChevronUp, BsChevronDown, BsFolder, BsPlus, BsPercent
} from 'react-icons/bs';
import { useData, StudyRecord, EditalSubject as Subject, EditalTopic as Topic } from '../../context/DataContext'; // Interfaces importadas do DataContext
import { useNotification } from '../../context/NotificationContext';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import StopwatchModal from '../../components/StopwatchModal';
import PlanSelector from '../../components/PlanSelector';

const SUBJECT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

const EditalPage = () => {
  const { 
    selectedDataFile, 
    setSelectedDataFile, 
    availablePlans, 
    addStudyRecord, 
    updateStudyRecord, 
    studyRecords, 
    stats,
    loading // Usando o loading do DataContext
  } = useData();
  
  const { showNotification } = useNotification();
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  
  // State for StudyRegisterModal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ subject: string; topic: Topic } | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);

  // State for StopwatchModal
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [savedStudyTime, setSavedStudyTime] = useState(0);

  const handleSubjectClick = (index: number) => {
    setExpandedSubject(expandedSubject === index ? null : index);
  };

  // --- Modal Handlers ---

  const openRegisterModalForTopic = (subject: string, topic: Topic) => {
    setSelectedTopic({ subject, topic });
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const openRegisterModalForNew = () => {
    setSelectedTopic(null);
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setSelectedTopic(null);
    setEditingRecord(null);
    setIsRegisterModalOpen(false);
  };

  const handleSaveStudy = (record: StudyRecord) => {
    if (editingRecord) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }
    closeRegisterModal();
  };

  const openStopwatchModal = () => setIsStopwatchModalOpen(true);
  const closeStopwatchModal = () => setIsStopwatchModalOpen(false);

  const handleStopwatchSave = (timeInSeconds: number) => {
    console.log(`Stopwatch saved time: ${timeInSeconds} seconds`);
    setSavedStudyTime(timeInSeconds);
    closeStopwatchModal();
    openRegisterModalForNew(); 
  };

  // --- Other Handlers ---

  const handleToggleCompletion = async (subjectText: string, topicText: string) => {
    const recordToUpdate = studyRecords.find(
      record => record.subject === subjectText && record.topic === topicText
    );

    if (recordToUpdate) {
      const updatedRecord = { ...recordToUpdate, teoriaFinalizada: !recordToUpdate.teoriaFinalizada };
      await updateStudyRecord(updatedRecord);
    } else {
      const newRecord: Omit<StudyRecord, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        subject: subjectText,
        topic: topicText,
        studyTime: 0,
        questions: { correct: 0, total: 0 },
        pages: [],
        videos: [],
        notes: '',
        category: 'teoria',
        teoriaFinalizada: true,
        countInPlanning: false,
      };
      await addStudyRecord(newRecord);
    }
  };

  // --- Render Logic ---

  const { editalData, totalTopics, completedTopics, overallEditalProgress } = stats;

  if (loading) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"><p className="dark:text-gray-100">Carregando edital...</p></div>;
  }

  const getPerformancePillColor = (p: number) => {
    if (p >= 80) return 'bg-green-100 text-green-700';
    if (p >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
        {/* Header */}
        <div className="mb-6">
          <header className="flex justify-between items-center pt-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Edital Verticalizado</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={openRegisterModalForNew} 
                className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 text-base font-semibold"
              >
                <BsPlusCircleFill className="mr-2 text-lg" />
                Adicionar Estudo
              </button>
              
            </div>
          </header>
          <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
        </div>

        {/* Overall Progress */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <h2 className="text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase">PROGRESSO NO EDITAL</h2>
          <div className="flex justify-between items-end mb-2">
            <p className="text-gray-700 dark:text-gray-300 text-sm">{completedTopics} de {totalTopics} Tópicos concluídos</p>
            <p className="text-gray-700 dark:text-gray-300 font-bold text-3xl">{stats.overallEditalProgress.toFixed(0)}%</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div className="bg-green-600 h-4 rounded-full transition-all duration-300" style={{ width: `${stats.overallEditalProgress}%` }}></div>
          </div>
        </div>

        {/* Subjects List */}
        <ul className="space-y-4">
          {editalData.map((subject, subjectIndex) => {
            const subjectColor = SUBJECT_COLORS[subjectIndex % SUBJECT_COLORS.length];
            const totalSubjectTopics = subject.topics.length;
            const completedSubjectTopics = subject.topics.filter(t => t.is_completed).length;
            const subjectCompletionPercentage = totalSubjectTopics > 0 ? Math.round((completedSubjectTopics / totalSubjectTopics) * 100) : 0;
            const totalSubjectCompleted = subject.topics.reduce((sum, topic) => sum + (topic.completed || 0), 0);
            const totalSubjectReviewed = subject.topics.reduce((sum, topic) => sum + (topic.reviewed || 0), 0);
            const totalSubjectQuestions = totalSubjectCompleted + totalSubjectReviewed;
            const subjectPerformance = totalSubjectQuestions > 0 ? Math.round((totalSubjectCompleted / totalSubjectQuestions) * 100) : 0;

            return (
              <li key={subjectIndex} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex flex-col">
                <div className="w-full flex items-center justify-between cursor-pointer" onClick={() => handleSubjectClick(subjectIndex)}>
                  <div className="flex items-center">
                    <div className={`w-2 h-6 rounded-l-lg ${subjectColor} mr-4`}></div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{subject.subject}</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    {expandedSubject !== subjectIndex && (
                      <>
                        <div className="flex items-center text-sm font-semibold">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-l-md" title="Acertos">{totalSubjectCompleted}</span>
                          <span className="bg-red-100 text-red-700 px-2 py-1" title="Erros">{totalSubjectReviewed}</span>
                          <span className="bg-gray-200 text-gray-800 dark:text-gray-100 px-2 py-1" title="Total de Questões">{totalSubjectQuestions}</span>
                          <span className={`${getPerformancePillColor(subjectPerformance)} px-2 py-1 rounded-r-md`} title="Percentual de Acerto">{subjectPerformance}%</span>
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className={`${subjectColor} h-2 rounded-full`} style={{ width: `${subjectCompletionPercentage}%` }}></div></div>
                        <span className="text-sm text-gray-600">{subjectCompletionPercentage}%</span>
                      </>
                    )}
                    <span className="text-xl">{expandedSubject === subjectIndex ? <BsChevronUp /> : <BsChevronDown />}</span>
                  </div>
                </div>

                {expandedSubject === subjectIndex && (
                  <div className="mt-4 w-full">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-900">
                            <th className="p-2 text-gray-800 dark:text-gray-100">Tópico</th>
                            <th className="p-2 w-16 text-teal-500 dark:text-teal-400" title="Questões Corretas"><div className="flex justify-center"><BsCheckLg /></div></th>
                            <th className="p-2 w-16 text-red-500 dark:text-red-400" title="Questões Erradas"><div className="flex justify-center"><BsXLg /></div></th>
                                                        <th className="p-2 w-16 dark:text-gray-100" title="Total de Questões"><div className="flex justify-center text-gray-800 dark:text-gray-100"><BsPencilFill /></div></th>
                            <th className="p-2 w-20 dark:text-gray-100" title="Percentual de Acerto"><div className="flex justify-center text-gray-800 dark:text-gray-100"><BsPercent /></div></th>
                            <th className="p-2 w-32 text-center text-gray-800 dark:text-gray-100">Último Estudo</th>
                            <th className="p-2 w-16 text-center text-gray-800 dark:text-gray-100">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.topics.map((topic, topicIndex) => {
                            const completed = topic.completed || 0;
                            const reviewed = topic.reviewed || 0;
                            const totalQuestions = completed + reviewed;
                            const percentageCorrect = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
                            const getPerformanceTextColor = (p: number) => {
                              if (p >= 80) return 'text-green-600';
                              if (p >= 60) return 'text-yellow-600';
                              return 'text-red-600';
                            };

                            return (
                              <tr key={topicIndex} className={`border-b border-gray-200 dark:border-gray-700 ${topic.is_completed ? 'bg-green-50 dark:bg-green-900/50' : 'bg-white dark:bg-gray-800'}`}>
                                <td className="p-2 flex items-center dark:text-gray-100">
                                  <input type="checkbox" checked={topic.is_completed || false} onChange={() => handleToggleCompletion(subject.subject, topic.topic_text)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"/>
                                  <span className="text-gray-900 dark:text-gray-100">{topic.topic_text}</span>
                                </td>
                                <td className="p-2 text-center font-bold text-green-600">{completed}</td>
                                <td className="p-2 text-center font-bold text-red-600">{reviewed}</td>
                                <td className="p-2 text-center text-gray-900 dark:text-gray-100">{totalQuestions}</td>
                                <td className={`p-2 text-center font-bold ${getPerformanceTextColor(percentageCorrect)}`}>{percentageCorrect}</td>
                                <td className="p-2 text-center text-gray-900 dark:text-gray-300">{formatDate(topic.last_study)}</td>
                                <td className="p-2 text-center">
                                  <button onClick={() => openRegisterModalForTopic(subject.subject, topic)} className="text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-500" title="Adicionar estudo a este Tópico"><BsPlusCircleFill /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-600 dark:text-gray-100">TOTAL:</span>
                        <div className="flex items-center text-sm font-semibold">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-l-md" title="Acertos">{totalSubjectCompleted}</span>
                          <span className="bg-red-100 text-red-700 px-2 py-1" title="Erros">{totalSubjectReviewed}</span>
                          <span className="bg-gray-200 text-gray-800 px-2 py-1" title="Total de Questões">{totalSubjectQuestions}</span>
                          <span className={`${getPerformancePillColor(subjectPerformance)} px-2 py-1 rounded-r-md`} title="Percentual de Acerto">{subjectPerformance}%</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-600 dark:text-gray-100">PROGRESSO:</span>
                        <div className="flex items-center w-full">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className={`${subjectColor} h-2 rounded-full`} style={{ width: `${subjectCompletionPercentage}%` }}></div></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">{subjectCompletionPercentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <StudyRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={closeRegisterModal}
          onSave={handleSaveStudy}
          initialRecord={editingRecord}
          topic={selectedTopic}
          initialTime={savedStudyTime}
          showDeleteButton={!!editingRecord?.id}
        />
      </div>

      
    </>
  );
};

export default EditalPage;
