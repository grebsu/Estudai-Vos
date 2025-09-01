'use client';

import React from 'react';
import { useData } from '../../context/DataContext';
import { BsPlusCircleFill, BsFunnel, BsArrowUp, BsArrowDown } from 'react-icons/bs';
import ChartComponents from '../../components/ChartComponents';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import FilterModal from '../../components/FilterModal';
import PlanSelector from '../../components/PlanSelector';
import StopwatchModal from '../../components/StopwatchModal';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, BarElement, RadialLinearScale, TooltipItem } from 'chart.js';
import 'chartjs-adapter-date-fns';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { TopicPerformance, TopicPerformanceEntry } from '../../context/DataContext';

import CategoryHoursChart from '../../components/CategoryHoursChart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, BarElement, RadialLinearScale);

export default function Estatisticas() {
  const { selectedDataFile, setSelectedDataFile, availablePlans, stats, addStudyRecord, updateStudyRecord, applyFilters, availableSubjects, availableEditalData, availableCategories } = useData();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [chartJsLoaded, setChartJsLoaded] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [editingRecord, setEditingRecord] = React.useState<StudyRecord | null>(null);
  const [showStopwatchModal, setShowStopwatchModal] = React.useState(false);
  const [stopwatchTargetDuration, setStopwatchTargetDuration] = React.useState<number | undefined>(undefined);
  const [stopwatchModalSubject, setStopwatchModalSubject] = React.useState<string | undefined>(undefined);

  const openStopwatchModal = () => {
    setStopwatchModalSubject(''); // Define um valor padrão
    setShowStopwatchModal(true);
  };
  const closeStopwatchModal = () => setShowStopwatchModal(false);

  const handleStopwatchSave = (time: number) => {
    const newRecord: StudyRecord = {
      id: Date.now().toString(), // Gerar um ID único
      date: new Date().toISOString().split('T')[0],
      studyTime: time,
      subject: stopwatchModalSubject || '',
      topic: '',
      questions: { correct: 0, total: 0 },
      material: '',
      category: 'teoria',
      comments: '',
      reviewPeriods: [],
      teoriaFinalizada: false,
      countInPlanning: false,
      pages: [],
      videos: [],
    };
    setEditingRecord(newRecord);
    setShowStopwatchModal(false);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    import('chartjs-plugin-zoom').then((mod) => {
      ChartJS.register(mod.default);
      setChartJsLoaded(true);
    });
  }, []);

  const lineData = {
    labels: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    datasets: [
      {
        label: 'Acertos Diários',
        data: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyQuestionStats ?? {})[date].correct),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Erros Diários',
        data: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyQuestionStats ?? {})[date].incorrect),
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4B5563', // Cor para ambos os modos (cinza médio-escuro)
        }
      },
      title: {
        display: false,
        text: 'Acertos e Erros Diários',
      },
      tooltip: {
        titleColor: '#4B5563', // Cor do título do tooltip
        bodyColor: '#4B5563', // Cor do corpo do tooltip
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const,
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: { day: 'dd/MM/yyyy' }
        },
        title: {
          display: true,
          text: 'Data',
          color: '#4B5563',
        },
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: '#D1D5DB',
        }
      },
      y: {
        title: {
          display: true,
          text: 'Quantidade de Questões',
          color: '#4B5563',
        },
        beginAtZero: true,
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: '#D1D5DB',
        }
      },
    },
  };

  const formatTime = (milliseconds: number) => {
    if (isNaN(milliseconds) || milliseconds < 0) {
      return '0h 0m';
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleAddStudyClick = () => {
    setIsModalOpen(true);
  };

  const handleSaveStudy = (record: StudyRecord) => {
    if (record.id) {
      updateStudyRecord(record); // Se tem ID, atualiza
    } else {
      addStudyRecord({ ...record, id: Date.now().toString() }); // Se não tem ID, adiciona com um novo ID
    }
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTopicPerformance = React.useMemo(() => {
    if (!stats.topicPerformance) return [];

    const sortable = [...stats.topicPerformance];

    if (!sortColumn) return sortable;

    return sortable.sort((a: TopicPerformanceEntry, b: TopicPerformanceEntry) => {
      const aValue = a[sortColumn as keyof TopicPerformanceEntry];
      const bValue = b[sortColumn as keyof TopicPerformanceEntry];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });
  }, [stats.topicPerformance, sortColumn, sortDirection]);

  const getPerformancePillColor = (p: number) => {
    if (p >= 80) return 'bg-green-100 text-green-700';
    if (p >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      {/* Cabeçalho e Linha Divisória */}
      <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Estatísticas</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAddStudyClick} 
              className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 text-base font-semibold"
            >
              <BsPlusCircleFill className="mr-2 text-lg" />
              Adicionar Estudo
            </button>
            
            <button 
              onClick={() => setIsFilterModalOpen(true)} 
              className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 text-base font-semibold"
            >
              <BsFunnel className="mr-2" />
              Filtros
            </button>
          </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
      </div>

      {/* Conteúdo da Página */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1 */}
        <div className="col-span-1 flex flex-col min-h-[416px] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex-grow flex flex-col items-start">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4 text-left">Desempenho Geral</h2>
          <ChartComponents stats={stats} />
        </div>

        {/* Coluna 2 */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Tempo Total de Estudo</h2>
            <p className="text-3xl font-bold text-teal-500">{formatTime(stats.totalStudyTime)}</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{formatTime(stats.totalStudyTime / stats.uniqueStudyDays || 0)} por dia estudado (média)</p>
            <p className="text-gray-600 dark:text-gray-300">Total de {stats.uniqueStudyDays} dias estudados</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Páginas Lidas</h2>
              <p className="text-3xl font-bold text-teal-500">{stats.totalPagesRead}</p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.pagesPerHour.toFixed(1)} páginas/hora</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Tempo Total de Videoaulas</h2>
              <p className="text-3xl font-bold text-teal-500">{formatTime(stats.totalVideoTime)}</p>
            </div>
          </div>
        </div>

        {/* Coluna 3 */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Constância nos Estudos</h2>
            <p className="text-3xl font-bold text-teal-500">{stats.studyConsistencyPercentage.toFixed(1)}%</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.uniqueStudyDays} dias estudados de {stats.totalDaysSinceFirstRecord} dias</p>
            <p className="text-gray-600 dark:text-gray-300">({stats.failedStudyDays} dias falhados)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Progresso no Edital</h2>
            <p className="text-3xl font-bold text-teal-500">{stats.overallEditalProgress.toFixed(1)}%</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.completedTopics} tópicos concluídos de {stats.totalTopics}</p>
            <p className="text-gray-600 dark:text-gray-300">({stats.pendingTopics} tópicos pendentes)</p>
          </div>
        </div>
      </div>

      {/* Nova Sessão Abaixo */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md col-span-full min-h-[500px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Evolução no Tempo</h2>
        <div className="h-full flex-grow">
          {chartJsLoaded && Object.keys(stats.dailyQuestionStats ?? {}).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhum registro de estudo diário.</p>
          ) : (
            chartJsLoaded && (
              <Line data={lineData} options={lineOptions} />
            )
          )}
        </div>
        
      </div>

      {/* Mais uma Nova Sessão Abaixo */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md col-span-full min-h-[500px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">HORAS DE ESTUDO</h2>
        <div className="h-full flex-grow">
          {chartJsLoaded && Object.keys(stats.dailyStudyHours).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhum registro de horas de estudo diário.</p>
          ) : (
            chartJsLoaded && (
              <Bar
                data={{
                  labels: Object.keys(stats.dailyStudyHours ?? {}).sort((a, b) => {
                    return new Date(a).getTime() - new Date(b).getTime();
                  }).map(date => {
                    const [year, month, day] = date.split('-').map(Number);
                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                  }),
                  datasets: [{
                    label: 'Horas de Estudo',
                    data: Object.keys(stats.dailyStudyHours ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyStudyHours ?? {})[date]),
                    backgroundColor: '#26A69A',
                    borderColor: '#26A69A',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      title: { display: false },
                      ticks: { font: { size: 12 }, color: '#4B5563' },
                      grid: { color: '#D1D5DB' }
                    },
                    y: {
                      title: { display: false, text: 'Horas' },
                      min: 0,
                      max: 8,
                      ticks: { stepSize: 2, color: '#4B5563' },
                      grid: { color: '#D1D5DB' }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      titleColor: '#4B5563',
                      bodyColor: '#4B5563',
                    },
                    datalabels: {
                      anchor: 'end',
                      align: 'top',
                      color: '#26A69A',
                      font: { size: 12 },
                      formatter: (value: number) => value > 0 ? `${value.toFixed(1)}h` : ''
                    }
                  }
                }}
              />
            )
          )}
        </div>
      </div>

      {/* Duas Novas Sessões Lado a Lado */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[600px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">DISCIPLINAS x HORAS DE ESTUDO</h2>
          <div className="h-full flex-grow relative">
            {chartJsLoaded && Object.keys(stats.subjectStudyHours).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de horas de estudo por disciplina.</p>
            ) : (
              chartJsLoaded && (
                <Bar
                  data={{
                    labels: Object.keys(stats.subjectStudyHours ?? {}).sort(),
                    datasets: [{
                      label: 'Horas de Estudo',
                      data: Object.keys(stats.subjectStudyHours ?? {}).sort().map(subject => (stats.subjectStudyHours ?? {})[subject]),
                      backgroundColor: '#26A69A',
                      borderColor: '#26A69A',
                      borderWidth: 1,
                      barPercentage: 0.8,
                      categoryPercentage: 0.8
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: false },
                        min: 0,
                        max: 20,
                        ticks: { stepSize: 4, callback: (value: number) => `${value}h`, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      },
                      y: {
                        title: { display: false },
                        ticks: { font: { size: 12 }, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        enabled: true,
                        titleColor: '#4B5563',
                        bodyColor: '#4B5563',
                      },
                      datalabels: {
                        anchor: 'end',
                        align: 'right',
                        color: '#26A69A',
                        font: { size: 12 },
                        formatter: (value: number) => {
                          const hours = Math.floor(value);
                          const minutes = Math.round((value % 1) * 60);
                          return `${hours}h${minutes.toString().padStart(2, '0')}min`;
                        }
                      }
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[1000px] flex flex-col">
          <CategoryHoursChart categoryStudyHours={stats.categoryStudyHours} />
        </div>
      </div>

      {/* Duas Novas Sessões Empilhadas */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">DISCIPLINAS x DESEMPENHO</h2>
          <div className="h-full flex-grow relative">
            {chartJsLoaded && Object.keys(stats.subjectPerformance).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de desempenho por disciplina.</p>
            ) : (
              chartJsLoaded && (
                <Bar
                  data={{
                    labels: Object.keys(stats.subjectPerformance ?? {}).sort(),
                    datasets: [
                      {
                        label: 'Acertos',
                        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(subject => parseFloat(((stats.subjectPerformance ?? {})[subject]?.correctPercentage || 0).toFixed(1))),
                        backgroundColor: '#26A69A',
                      },
                      {
                        label: 'Erros',
                        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(subject => parseFloat(((stats.subjectPerformance ?? {})[subject]?.incorrectPercentage || 0).toFixed(1))),
                        backgroundColor: '#FF7043',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: false },
                        ticks: { font: { size: 12 }, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      },
                      y: {
                        title: { display: false },
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, callback: (value: number) => `${value}%`, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      }
                    },
                    plugins: {
                      legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, color: '#4B5563' } },
                      tooltip: {
                        enabled: true,
                        titleColor: '#4B5563',
                        bodyColor: '#4B5563',
                      },
                      datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#26A69A',
                        font: { size: 12 },
                        formatter: (value: number) => value > 0 ? `${value.toFixed(1)}%` : ''
                      }
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">TÓPICO X DESEMPENHO</h2>
          <div className="h-full flex-grow relative overflow-x-auto">
            {chartJsLoaded && Object.keys(stats.topicPerformance).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de desempenho por tópico.</p>
            ) : (
              chartJsLoaded && (
                <table className="divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-teal-50 dark:bg-teal-900">
                    <tr>
                      <th scope="col" className="w-1/5 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words border-r border-teal-200 dark:border-teal-700" onClick={() => handleSort('subject')}>
                        <div className="flex items-center justify-between">
                          Disciplina
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'subject' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="w-2/5 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words border-r border-teal-200 dark:border-teal-700" onClick={() => handleSort('topic')}>
                        <div className="flex items-center justify-between">
                          Tópico
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'topic' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="w-1/10 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words border-r border-teal-200 dark:border-teal-700" onClick={() => handleSort('correctQuestions')}>
                        <div className="flex items-center justify-between">
                          Acertos
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'correctQuestions' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="w-1/10 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words border-r border-teal-200 dark:border-teal-700" onClick={() => handleSort('incorrectQuestions')}>
                        <div className="flex items-center justify-between">
                          Erros
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'incorrectQuestions' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="w-1/10 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words border-r border-teal-200 dark:border-teal-700" onClick={() => handleSort('totalQuestions')}>
                        <div className="flex items-center justify-between">
                          Total
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'totalQuestions' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="w-1/10 px-6 py-3 text-left text-xs font-medium text-teal-700 dark:text-teal-300 uppercase tracking-wider cursor-pointer break-words" onClick={() => handleSort('performance')}>
                        <div className="flex items-center justify-between">
                          Desempenho
                          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                            {sortColumn === 'performance' && sortDirection === 'asc' ? <BsArrowUp className="h-4 w-4" /> : <BsArrowDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTopicPerformance.map((topicPerf: TopicPerformance, index: number) => (
                      <tr key={index} className={`${getPerformancePillColor(Math.round(topicPerf.performance))} bg-opacity-20`}>
                        <td className="w-1/5 px-6 py-4 text-sm font-medium text-teal-900 dark:text-teal-200 break-words border-r border-teal-200 dark:border-teal-700">{topicPerf.subject}</td>
                        <td className="w-2/5 px-6 py-4 text-sm text-teal-700 dark:text-teal-300 break-words border-r border-teal-200 dark:border-teal-700">{topicPerf.topic}</td>
                        <td className="w-1/10 px-6 py-4 text-sm text-teal-700 dark:text-teal-300 break-words text-center border-r border-teal-200 dark:border-teal-700">{topicPerf.correctQuestions}</td>
                        <td className="w-1/10 px-6 py-4 text-sm text-teal-700 dark:text-teal-300 break-words text-center border-r border-teal-200 dark:border-teal-700">{topicPerf.incorrectQuestions}</td>
                        <td className="w-1/10 px-6 py-4 text-sm text-teal-700 dark:text-teal-300 break-words text-center border-r border-teal-200 dark:border-teal-700">{topicPerf.totalQuestions}</td>
                        <td className="w-1/10 px-6 py-4 whitespace-nowrap text-sm text-center border-r border-teal-200 dark:border-teal-700 ${getPerformancePillColor(Math.round(topicPerf.performance))}">{topicPerf.performance.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </div>
    <StudyRegisterModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSave={handleSaveStudy}
      initialRecord={editingRecord}
      showDeleteButton={!!editingRecord?.id}
    />
    <FilterModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      onApply={(filters) => {
        applyFilters(filters);
        setIsFilterModalOpen(false);
      }}
      sessions={stats.allRecords || []}
      availableSubjects={availableSubjects}
      availableEditalData={stats.editalData}
      availableCategories={availableCategories}
    />
    <StopwatchModal
      isOpen={showStopwatchModal}
      onClose={closeStopwatchModal}
      onSaveAndClose={(time, subject, topic) => {
        const newRecord: Partial<StudyRecord> = {
          date: new Date().toISOString().split('T')[0],
          studyTime: time,
          subject: subject || '',
          topic: topic || '',
          questions: { correct: 0, total: 0 },
          material: '',
          category: 'teoria',
          notes: 'Estudo cronometrado.',
          reviewPeriods: [],
          teoriaFinalizada: false,
          countInPlanning: false,
          pages: [],
          videos: [],
        };
        setEditingRecord(newRecord as StudyRecord);
        setShowStopwatchModal(false);
        setIsModalOpen(true);
      }}
      targetDuration={stopwatchTargetDuration}
      subject={stopwatchModalSubject}
    />
    </>
  );
}