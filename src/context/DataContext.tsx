'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { 
  getJsonFiles, 
  getStudyRecords, 
  saveStudyRecord, 
  getReviewRecords, 
  saveReviewRecord, 
  deleteStudyRecordAction, 
  getJsonContent, 
  SimuladoRecord, 
  saveSimuladoRecord, 
  updateSimuladoRecord as updateSimuladoRecordAction, 
  deleteSimuladoRecordAction as deleteSimuladoRecordActionImport, 
  getSimuladoRecords,
  exportFullBackupAction,
  restoreFullBackupAction,
  saveStudyCycleToFile,
  getStudyCycleFromFile,
  deleteStudyCycleFile,
  deleteJsonFile,
  updateTopicWeightAction,
  migrateStudyRecordIds,
  clearAllDataAction
} from '../app/actions';
import { useNotification } from './NotificationContext';

// Interfaces
export interface StudyRecord {
  id: string;
  date: string;
  subject: string;
  topic: string;
  studyTime: number;
  questions?: { correct: number; total: number };
  correctQuestions?: number; // Legacy
  incorrectQuestions?: number; // Legacy
  pages: { start: number; end: number }[];
  videos: { title: string; start: string; end: string }[];
  notes: string;
  category: string;
  reviewPeriods?: string[];
  teoriaFinalizada: boolean;
  countInPlanning: boolean;
}

export interface ReviewRecord {
  id: string;
  studyRecordId: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'skipped';
  originalDate: string;
  subject: string;
  topic: string;
  reviewPeriod: string;
  completedDate?: string;
  ignored?: boolean;
}

interface Filters {
  subject: string;
  category: string;
  startDate: string;
  endDate: string;
}

export interface SubjectPerformance {
  [subject: string]: {
    totalStudyTime: number;
    totalQuestions: number;
    correctQuestions: number;
    incorrectQuestions: number;
    performance: number;
    correctPercentage: number;
    incorrectPercentage: number;
  };
}

export interface TopicPerformanceEntry {
  subject: string;
  topic: string;
  totalStudyTime: number;
  totalQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  performance: number;
  correctPercentage: number;
  incorrectPercentage: number;
}

export type TopicPerformance = TopicPerformanceEntry[];

export interface EditalData {
  subject: string;
  topic: string;
  completed: boolean;
}

export interface ConsistencyData {
  date: string;
  studied: boolean;
  active: boolean;
}

export interface ReminderNote {
  id: string;
  text: string;
  completed: boolean;
}

export interface TopicPerformanceMetrics {
  subject: string;
  topic: string;
  hitRate: number;
  totalQuestions: number;
  studyCount: number;
  daysSinceLastStudy: number;
  userWeight: number;
}

export interface TopicScore extends TopicPerformanceMetrics {
  score: number;
  justification: string;
}

export interface StudySession {
  id: any;
  subject: string;
  duration: number;
  color: string;
}

export interface EditalSubject {
    subject: string;
    color: string;
    topics: any[];
}


export interface Stats {
  totalCorrectQuestions: number;
  totalQuestions: number;
  dailyStudyTime: { [date: string]: number };
  dailySubjectStudyTime: { [date: string]: { [subject: string]: number } };
  totalStudyTime: number;
  uniqueStudyDays: number;
  totalPagesRead: number;
  pagesPerHour: number;
  totalVideoTime: number;
  totalDaysSinceFirstRecord: number;
  failedStudyDays: number;
  studyConsistencyPercentage: number;
  consecutiveDays: number;
  consistencyData: ConsistencyData[];
  consistencyStartDate: string | null;
  consistencyEndDate: string | null;
  isConsistencyPrevDisabled: boolean;
  isConsistencyNextDisabled: boolean;
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  overallEditalProgress: number;
  dailyQuestionStats: { [date: string]: { correct: number; total: number; incorrect: number } };
  dailyStudyHours: { [date: string]: number };
  subjectStudyHours: { [subject: string]: number };
  categoryStudyHours: { [category: string]: number };
  subjectPerformance: SubjectPerformance;
  topicPerformance: TopicPerformance;
  editalData: EditalSubject[];
  weeklyHours: number;
  weeklyQuestions: number;
}

// Helper function to calculate stats
const calculateStats = async (
  studyRecords: StudyRecord[],
  selectedDataFile: string,
  activeFilters: Filters,
  studyPlans: any[],
  availablePlans: string[],
  consistencyOffset: number,
  studyDays: string[],
  studyCycle: StudySession[] | null
): Promise<Stats> => {
  let totalCorrectQuestions = 0;
  let totalQuestions = 0;
  const dailyStudyTime: { [date: string]: number } = {};
  const dailySubjectStudyTime: { [date: string]: { [subject: string]: number } } = {};
  let totalStudyTime = 0;
  const uniqueDays = new Set<string>();
  let totalPagesRead = 0;
  let totalVideoTime = 0;
  const dailyQuestionStats: { [date: string]: { correct: number; total: number; incorrect: number } } = {};
  const dailyStudyHours: { [date: string]: number } = {};
  const subjectStudyHours: { [subject: string]: number } = {};
  const categoryStudyHours: { [category: string]: number } = {};
  const subjectPerformance: SubjectPerformance = {};
  const topicPerformanceMap = new Map<string, TopicPerformanceEntry>();
  
  let weeklyHours = 0;
  let weeklyQuestions = 0;
  const todayForWeek = new Date();
  const dayOfWeek = todayForWeek.getDay();
  const firstDayOfWeek = new Date(todayForWeek);
  const diff = todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
  firstDayOfWeek.setDate(diff);
  firstDayOfWeek.setHours(0, 0, 0, 0);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  let editalData: EditalSubject[] = [];

  const currentPlanIndex = availablePlans.indexOf(selectedDataFile);
  const currentPlanData = studyPlans[currentPlanIndex];

  if (currentPlanData) {
    console.log("[calculateStats] currentPlanData:", currentPlanData);
    let subjectsToProcess: any[] = [];
    if (Array.isArray(currentPlanData)) {
      subjectsToProcess = currentPlanData;
    } else if (currentPlanData && typeof currentPlanData === 'object' && Array.isArray(currentPlanData.subjects)) {
      subjectsToProcess = currentPlanData.subjects;
    }
    console.log("[calculateStats] subjectsToProcess before map:", subjectsToProcess);

    editalData = subjectsToProcess
      .filter((subject: any) => subject && typeof subject === 'object') // Ensure subject is a valid object
      .map((subject: any) => ({
      subject: subject.subject,
      color: subject.color,
      topics: (subject.topics || []).map((topic: any) => ({
        ...topic,
        completed: 0,
        reviewed: 0,
        total: 0,
        percentage: 0,
        last_study: '-',
        is_completed: false,
      })),
    }));
  }

  let filteredStudyRecords = studyRecords;

  if (activeFilters.subject) {
    filteredStudyRecords = filteredStudyRecords.filter(record => record.subject === activeFilters.subject);
  }
  if (activeFilters.category) {
    filteredStudyRecords = filteredStudyRecords.filter(record => record.category === activeFilters.category);
  }
  if (activeFilters.startDate) {
    const startDate = new Date(activeFilters.startDate);
    filteredStudyRecords = filteredStudyRecords.filter(record => new Date(record.date) >= startDate);
  }
  if (activeFilters.endDate) {
    const endDate = new Date(activeFilters.endDate);
    endDate.setDate(endDate.getDate() + 1);
    filteredStudyRecords = filteredStudyRecords.filter(record => new Date(record.date) < endDate);
  }

  filteredStudyRecords.forEach(record => {
    const [year, month, day] = record.date.split('-').map(Number);
    const recordDate = new Date(year, month - 1, day);

    const date = record.date;
    uniqueDays.add(date);

    let correctQs = 0;
    let totalQs = 0;
    if (typeof record.correctQuestions === 'number' && typeof record.incorrectQuestions === 'number') {
      correctQs = record.correctQuestions;
      totalQs = record.correctQuestions + record.incorrectQuestions;
    } else if (record.questions && typeof record.questions.total === 'number') {
      correctQs = record.questions.correct || 0;
      totalQs = record.questions.total;
    }
    const incorrectQs = totalQs - correctQs;

    if (recordDate >= firstDayOfWeek && recordDate <= lastDayOfWeek) {
      weeklyHours += record.studyTime || 0;
      weeklyQuestions += totalQs;
    }

    dailyStudyTime[date] = (dailyStudyTime[date] || 0) + (record.studyTime || 0);
    if (!dailySubjectStudyTime[date]) {
      dailySubjectStudyTime[date] = {};
    }
    dailySubjectStudyTime[date][record.subject] = (dailySubjectStudyTime[date][record.subject] || 0) + (record.studyTime || 0);
    totalStudyTime += record.studyTime || 0;

    totalCorrectQuestions += correctQs;
    totalQuestions += totalQs;
    if (!dailyQuestionStats[date]) {
      dailyQuestionStats[date] = { correct: 0, total: 0, incorrect: 0 };
    }
    dailyQuestionStats[date].correct += correctQs;
    dailyQuestionStats[date].total += totalQs;
    dailyQuestionStats[date].incorrect += incorrectQs;

    if (record.pages) {
      record.pages.forEach(pageRange => {
        if (typeof pageRange === 'object' && 'start' in pageRange && 'end' in pageRange) {
          totalPagesRead += (pageRange.end - pageRange.start + 1);
        }
      });
    }

    if (record.videos) {
      record.videos.forEach(video => {
        const parseTime = (timeStr: string) => {
          const [h, m, s] = timeStr.split(':').map(Number);
          return (h * 3600 + m * 60 + s) * 1000;
        };
        totalVideoTime += (parseTime(video.end) - parseTime(video.start));
      });
    }

    dailyStudyHours[date] = (dailyStudyHours[date] || 0) + (record.studyTime / 3600000);
    subjectStudyHours[record.subject] = (subjectStudyHours[record.subject] || 0) + (record.studyTime / 3600000);
    categoryStudyHours[record.category] = (categoryStudyHours[record.category] || 0) + (record.studyTime / 3600000);

    if (!subjectPerformance[record.subject]) {
      subjectPerformance[record.subject] = {
        totalStudyTime: 0, totalQuestions: 0, correctQuestions: 0, incorrectQuestions: 0,
        performance: 0, correctPercentage: 0, incorrectPercentage: 0,
      };
    }
    subjectPerformance[record.subject].totalStudyTime += record.studyTime;
    if (record.questions) {
      subjectPerformance[record.subject].totalQuestions += record.questions.total;
      subjectPerformance[record.subject].correctQuestions += record.questions.correct;
      subjectPerformance[record.subject].incorrectQuestions += (record.questions.total - record.questions.correct);
    }
    
    const subjectTotalQuestions = subjectPerformance[record.subject].totalQuestions;
    const subjectCorrectQuestions = subjectPerformance[record.subject].correctQuestions;
    const subjectIncorrectQuestions = subjectPerformance[record.subject].incorrectQuestions;

    subjectPerformance[record.subject].correctPercentage = subjectTotalQuestions > 0 ? (subjectCorrectQuestions / subjectTotalQuestions) * 100 : 0;
    subjectPerformance[record.subject].incorrectPercentage = subjectTotalQuestions > 0 ? (subjectIncorrectQuestions / subjectTotalQuestions) * 100 : 0;
    subjectPerformance[record.subject].performance = subjectPerformance[record.subject].correctPercentage;

    const topicKey = `${record.subject}-${record.topic}`;
    if (!topicPerformanceMap.has(topicKey)) {
      topicPerformanceMap.set(topicKey, {
        subject: record.subject, topic: record.topic, totalStudyTime: 0, totalQuestions: 0,
        correctQuestions: 0, incorrectQuestions: 0, performance: 0, correctPercentage: 0, incorrectPercentage: 0,
      });
    }
    const currentTopicPerf = topicPerformanceMap.get(topicKey)!;
    currentTopicPerf.totalStudyTime += record.studyTime;
    if (record.questions) {
      currentTopicPerf.totalQuestions += record.questions.total;
      currentTopicPerf.correctQuestions += record.questions.correct;
      currentTopicPerf.incorrectQuestions += (record.questions.total - record.questions.correct);
    }

    const topicTotalQuestions = currentTopicPerf.totalQuestions;
    const topicCorrectQuestions = currentTopicPerf.correctQuestions;
    const topicIncorrectQuestions = currentTopicPerf.incorrectQuestions;

    currentTopicPerf.correctPercentage = topicTotalQuestions > 0 ? (topicCorrectQuestions / topicTotalQuestions) * 100 : 0;
    currentTopicPerf.incorrectPercentage = topicTotalQuestions > 0 ? (topicIncorrectQuestions / topicTotalQuestions) * 100 : 0;
    currentTopicPerf.performance = currentTopicPerf.correctPercentage;
  });

  editalData.forEach(subject => {
    subject.topics.forEach(topic => {
      filteredStudyRecords.forEach(record => {
        if (record.subject === subject.subject && record.topic === topic.topic_text) {
          topic.completed += record.questions?.correct || 0;
          topic.reviewed += (record.questions?.total || 0) - (record.questions?.correct || 0);
          if (record.date > topic.last_study) {
            topic.last_study = record.date;
          }
          if (record.teoriaFinalizada) {
            topic.is_completed = true;
          }
        }
      });
      topic.total = topic.completed + topic.reviewed;
      topic.percentage = topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
    });
  });

  const totalTopics = editalData.reduce((sum, subject) => sum + subject.topics.length, 0);
  const completedTopics = editalData.reduce((sum, subject) => sum + subject.topics.filter(t => t.is_completed).length, 0);

  let totalDaysSinceFirstRecord = 0;
  let failedStudyDays = 0;
  let studyConsistencyPercentage = 0;
  const allStudiedDays = new Set(studyRecords.map(r => r.date));

  if (allStudiedDays.size > 0) {
    const sortedDates = Array.from(allStudiedDays).map(d => {
      const [year, month, day] = d.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }).sort((a, b) => a.getTime() - b.getTime());
    
    const firstDay = sortedDates[0];
    const lastDay = new Date();
    lastDay.setUTCHours(0, 0, 0, 0);

    if (lastDay >= firstDay) {
      totalDaysSinceFirstRecord = Math.ceil((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let missedStudyDays = 0;
      const dayNameToNum: { [key: string]: number } = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
      const studyDayNums = new Set(studyDays.map(d => dayNameToNum[d]));

      for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getUTCDay();
        
        if (studyDayNums.has(dayOfWeek) && !allStudiedDays.has(dateStr)) {
          missedStudyDays++;
        }
      }
      failedStudyDays = missedStudyDays;

      if (totalDaysSinceFirstRecord > 0) {
        const totalScheduledDays = Array.from({ length: totalDaysSinceFirstRecord }, (_, i) => {
          const d = new Date(firstDay);
          d.setUTCDate(d.getUTCDate() + i);
          return d;
        }).filter(d => studyDayNums.has(d.getUTCDay())).length;

        studyConsistencyPercentage = totalScheduledDays > 0 ? (allStudiedDays.size / totalScheduledDays) * 100 : 100;
      }
    }
  }

  const dates = studyRecords.map(r => {
    const [year, month, day] = r.date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  });
  const firstStudyDate = dates.length > 0 ? new Date(Math.min.apply(null, dates)) : null;

  const today = new Date();
  today.setDate(today.getDate() - (consistencyOffset * 30));
  
  const consistencyEndDate = new Date(today);
  const consistencyStartDate = new Date(today);
  consistencyStartDate.setDate(today.getDate() - 29);

  const consistencyDaysData: any[] = [];
  let consecutiveDays = 0;
  
  if (firstStudyDate) {
    const dayNameToNum: { [key: string]: number } = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
    const studyDayNums = new Set(studyDays.map(d => dayNameToNum[d]));

    if (consistencyOffset === 0) {
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        if (d < firstStudyDate) break;
        
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        if (studyDayNums.has(dayOfWeek)) {
          if (allStudiedDays.has(dateStr)) {
            consecutiveDays++;
          } else {
            break;
          }
        } else {
          consecutiveDays++;
        }
      }
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const isActive = d >= firstStudyDate;
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isStudyDay = studyDayNums.has(dayOfWeek);
      const studied = allStudiedDays.has(dateStr);
      
      let status = 'inactive';
      if (isActive) {
        if (isStudyDay) {
          status = studied ? 'studied' : 'failed';
        } else {
          status = 'rest';
        }
      }
      
      consistencyDaysData.push({ date: dateStr, status, active: isActive });
    }
  }
  
  const isConsistencyPrevDisabled = !firstStudyDate || consistencyStartDate <= firstStudyDate;
  const isConsistencyNextDisabled = consistencyOffset === 0;

  return {
    totalCorrectQuestions, totalQuestions, dailyStudyTime, dailySubjectStudyTime, totalStudyTime,
    uniqueStudyDays: uniqueDays.size, totalPagesRead, pagesPerHour: totalStudyTime > 0 ? (totalPagesRead / (totalStudyTime / 3600000)) : 0,
    totalVideoTime, totalDaysSinceFirstRecord, failedStudyDays, studyConsistencyPercentage, consecutiveDays,
    consistencyData: consistencyDaysData, consistencyStartDate: consistencyStartDate.toISOString(),
    consistencyEndDate: consistencyEndDate.toISOString(), isConsistencyPrevDisabled, isConsistencyNextDisabled,
    totalTopics, completedTopics, pendingTopics: totalTopics - completedTopics,
    overallEditalProgress: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0,
    dailyQuestionStats, dailyStudyHours, subjectStudyHours, categoryStudyHours, subjectPerformance,
    topicPerformance: Array.from(topicPerformanceMap.values()), editalData, weeklyHours, weeklyQuestions,
  };
};

interface DataContextType {
  selectedDataFile: string;
  setSelectedDataFile: (fileName: string) => void;
  availablePlans: string[];
  studyPlans: any[];
  studyRecords: StudyRecord[];
  reviewRecords: ReviewRecord[];
  simuladoRecords: SimuladoRecord[];
  stats: Stats;
  addStudyRecord: (record: Omit<StudyRecord, 'id'>) => Promise<void>;
  addSimuladoRecord: (record: Omit<SimuladoRecord, 'id'>) => Promise<void>;
  updateStudyRecord: (record: StudyRecord) => Promise<void>;
  updateSimuladoRecord: (record: SimuladoRecord) => Promise<void>;
  deleteStudyRecord: (id: string) => Promise<void>;
  deleteSimuladoRecord: (id: string) => Promise<void>;
  updateReviewRecord: (record: ReviewRecord) => Promise<void>;
  applyFilters: (filters: Filters) => void;
  handleConsistencyNav: (direction: number) => void;
  studyCycle: StudySession[] | null;
  setStudyCycle: React.Dispatch<React.SetStateAction<StudySession[] | null>>;
  generateStudyCycle: (settings: any) => void;
  resetStudyCycle: () => void;
  loading: boolean;
  sessionProgressMap: { [key: string]: number };
  setSessionProgressMap: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  completedCycles: number;
  setCompletedCycles: React.Dispatch<React.SetStateAction<number>>;
  currentProgressMinutes: number;
  setCurrentProgressMinutes: React.Dispatch<React.SetStateAction<number>>;
  currentStudySession: StudySession | null;
  setCurrentStudySession: React.Dispatch<React.SetStateAction<StudySession | null>>;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isStopwatchModalOpen: boolean;
  setIsStopwatchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stopwatchTargetDuration: number | undefined;
  setStopwatchTargetDuration: React.Dispatch<React.SetStateAction<number | undefined>>;
  stopwatchModalSubject: string | undefined;
  setStopwatchModalSubject: React.Dispatch<React.SetStateAction<string | undefined>>;
  initialStudyRecord: Partial<StudyRecord> | null;
  setInitialStudyRecord: React.Dispatch<React.SetStateAction<Partial<StudyRecord> | null>>;
  formatMinutesToHoursMinutes: (minutes: number) => string;
  handleCompleteSession: (completedSession: StudySession, durationInMinutes?: number) => void;
  studyHours: string;
  setStudyHours: React.Dispatch<React.SetStateAction<string>>;
  weeklyQuestionsGoal: string;
  setWeeklyQuestionsGoal: React.Dispatch<React.SetStateAction<string>>;
  studyDays: string[];
  setStudyDays: React.Dispatch<React.SetStateAction<string[]>>;
  reminderNotes: ReminderNote[];
  addReminderNote: (text: string) => void;
  toggleReminderNote: (id: string) => void;
  deleteReminderNote: (id: string) => void;
  updateReminderNote: (id: string, newText: string) => void;
  exportAllData: () => any;
  importAllData: (data: any) => Promise<void>;
  deletePlan: (fileName: string) => Promise<void>;
  topicScores: TopicScore[];
  getRecommendedSession: (options?: { forceSubject?: string | null }) => { recommendedTopic: TopicScore | null; justification: string };
  updateTopicWeight: (subjectName: string, topicText: string, newWeight: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const calculateTopicScores = (
  studyRecords: StudyRecord[],
  studyPlans: any[],
  selectedDataFile: string,
  availablePlans: string[]
): TopicScore[] => {
  if (!studyPlans || studyPlans.length === 0) return [];

  const currentPlanIndex = availablePlans.indexOf(selectedDataFile);
  if (currentPlanIndex === -1) return [];
  const currentPlanData = studyPlans[currentPlanIndex];

  if (!currentPlanData || !currentPlanData.subjects) return [];

  const allTopics = currentPlanData.subjects.flatMap((subject: any) =>
    subject.topics.map((topic: any) => ({
      subject: subject.subject,
      topic: topic.topic_text,
      userWeight: topic.userWeight || 3,
    }))
  );

  const topicMetrics: TopicPerformanceMetrics[] = allTopics.map(t => {
    const recordsForTopic = studyRecords.filter(
      r => r.subject === t.subject && r.topic === t.topic
    );

    let totalQuestions = 0;
    let correctQuestions = 0;
    const studyCount = recordsForTopic.length;
    let daysSinceLastStudy = 999;

    if (recordsForTopic.length > 0) {
      recordsForTopic.forEach(r => {
        if (r.questions) {
          totalQuestions += r.questions.total;
          correctQuestions += r.questions.correct;
        }
      });

      const sortedRecords = recordsForTopic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastStudyDate = new Date(sortedRecords[0].date);
      const today = new Date();
      daysSinceLastStudy = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const hitRate = totalQuestions > 0 ? correctQuestions / totalQuestions : 1.0;

    return {
      subject: t.subject, topic: t.topic, hitRate, totalQuestions,
      studyCount, daysSinceLastStudy, userWeight: t.userWeight,
    };
  });

  const maxDays = Math.max(1, ...topicMetrics.map(t => t.daysSinceLastStudy));
  const maxStudyCount = Math.max(1, ...topicMetrics.map(t => t.studyCount));

  return topicMetrics.map(metric => {
    const w1 = 0.5;
    const w2 = 0.2;
    const w3 = 0.3;

    const errorScore = 1 - metric.hitRate;
    const frequencyScore = 1 - (metric.studyCount / maxStudyCount);
    const timeScore = metric.daysSinceLastStudy / maxDays;
    
    const userWeightFactor = (metric.userWeight / 5);

    const score = errorScore * w1 + frequencyScore * w2 + (timeScore * userWeightFactor) * w3;

    const justification = `Prioridade: Taxa de Acertos (${(metric.hitRate * 100).toFixed(0)}%), Frequência (${metric.studyCount}x), Último Estudo (${metric.daysSinceLastStudy}d atrás), Relevância do Usuário (${metric.userWeight}).`;

    return { ...metric, score, justification };
  }).sort((a, b) => b.score - a.score);
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDataFile, _setSelectedDataFile] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [simuladoRecords, setSimuladoRecords] = useState<SimuladoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>([]);
  const [consistencyOffset, setConsistencyOffset] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Filters>({
    subject: '', category: '', startDate: '', endDate: '',
  });
  const [studyCycle, setStudyCycle] = useState<StudySession[] | null>(null);
  const [sessionProgressMap, setSessionProgressMap] = useState<{[key: string]: number}>({});
  const [completedCycles, setCompletedCycles] = useState(0);
  const [currentProgressMinutes, setCurrentProgressMinutes] = useState(0);
  const [currentStudySession, setCurrentStudySession] = useState<StudySession | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [stopwatchTargetDuration, setStopwatchTargetDuration] = useState<number | undefined>(undefined);
  const [stopwatchModalSubject, setStopwatchModalSubject] = useState<string | undefined>(undefined);
  const [initialStudyRecord, setInitialStudyRecord] = useState<Partial<StudyRecord> | null>(null);
  const [studyHours, setStudyHours] = useState('40');
  const [weeklyQuestionsGoal, setWeeklyQuestionsGoal] = useState('250');
  const [studyDays, setStudyDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [reminderNotes, setReminderNotes] = useState<ReminderNote[]>([]);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [subjects, setSubjects] = useState<EditalSubject[]>([]);
  const [isPlanDataLoaded, setIsPlanDataLoaded] = useState(false);

  const setSelectedDataFile = useCallback((fileName: string) => {
    if (fileName !== selectedDataFile) {
      setIsPlanDataLoaded(false);
      _setSelectedDataFile(fileName);
    }
  }, [selectedDataFile]);
  
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    studyRecords.forEach(record => subjects.add(record.subject));
    // Also add subjects from study plans if they exist and are not in records yet
    studyPlans.forEach(plan => {
      if (plan && plan.subjects) {
        plan.subjects.forEach((s: any) => subjects.add(s.subject));
      }
    });
    return Array.from(subjects).sort();
  }, [studyRecords, studyPlans]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    studyRecords.forEach(record => categories.add(record.category.toLowerCase()));
    
    // Adicionar categorias padrão para garantir que sempre haja opções
    const defaultCategories = ['Teoria', 'Revisão', 'Leitura de Lei', 'Jurisprudência', 'Questões'];
    defaultCategories.forEach(cat => categories.add(cat.toLowerCase()));

    return Array.from(categories).sort().map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
  }, [studyRecords]);

  const [cycleJustCompleted, setCycleJustCompleted] = useState(false);
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<Stats>({
    totalCorrectQuestions: 0, totalQuestions: 0, dailyStudyTime: {}, dailySubjectStudyTime: {},
    totalStudyTime: 0, uniqueStudyDays: 0, totalPagesRead: 0, pagesPerHour: 0, totalVideoTime: 0,
    totalDaysSinceFirstRecord: 0, failedStudyDays: 0, studyConsistencyPercentage: 0, totalTopics: 0,
    completedTopics: 0, pendingTopics: 0, overallEditalProgress: 0, dailyQuestionStats: {},
    dailyStudyHours: {}, subjectStudyHours: {}, categoryStudyHours: {}, subjectPerformance: {},
    topicPerformance: [], editalData: [], consecutiveDays: 0, consistencyData: [],
    consistencyStartDate: null, consistencyEndDate: null, isConsistencyPrevDisabled: true,
    isConsistencyNextDisabled: true, weeklyHours: 0, weeklyQuestions: 0,
  });

  useEffect(() => {
    if (studyRecords.length > 0 && studyPlans.length > 0 && selectedDataFile) {
      const scores = calculateTopicScores(studyRecords, studyPlans, selectedDataFile, availablePlans);
      setTopicScores(scores);
    }
  }, [studyRecords, studyPlans, selectedDataFile, availablePlans]);

  const getRecommendedSession = useCallback((options: { forceSubject?: string | null } = {}) => {
    const { forceSubject } = options;

    if (forceSubject) {
        const recommendedTopic = topicScores.find(t => t.subject === forceSubject) || null;
        return {
            recommendedTopic,
            justification: recommendedTopic ? recommendedTopic.justification : `Nenhum tópico encontrado para ${forceSubject}.`
        };
    }

    const recommendedTopic = topicScores[0] || null;
    return {
        recommendedTopic,
        justification: recommendedTopic ? recommendedTopic.justification : "Nenhum tópico para recomendar."
    };
  }, [topicScores]);

  useEffect(() => {
    async function loadPlansAndData() {
      setLoading(true);
      const allPlanFiles = await getJsonFiles();
      const planFiles = allPlanFiles.filter(plan => plan.toUpperCase() !== 'USERS.JSON');
      setAvailablePlans(planFiles);

      const planDataPromises = planFiles.map(file => getJsonContent(file));
      const plansData = await Promise.all(planDataPromises);
      setStudyPlans(plansData);

      const lastSelected = localStorage.getItem('selectedDataFile');
      let initialSelectedFile = '';
      if (lastSelected && planFiles.includes(lastSelected)) {
        initialSelectedFile = lastSelected;
      } else if (planFiles.length > 0) {
        initialSelectedFile = planFiles[0];
      }
      
      if (initialSelectedFile) {
        setSelectedDataFile(initialSelectedFile);
        const serverCycleData = await getStudyCycleFromFile(initialSelectedFile);
        if (serverCycleData) {
          // Backward compatibility: check for old A/B structure and flatten it
          if (serverCycleData.studyCycle && (serverCycleData.studyCycle.groupA || serverCycleData.studyCycle.groupB)) {
            const flatCycle = [...(serverCycleData.studyCycle.groupA || []), ...(serverCycleData.studyCycle.groupB || [])];
            setStudyCycle(flatCycle);
          } else {
            setStudyCycle(serverCycleData.studyCycle);
          }
          setStudyHours(serverCycleData.studyHours);
          setWeeklyQuestionsGoal(serverCycleData.weeklyQuestionsGoal);
          setCurrentProgressMinutes(serverCycleData.currentProgressMinutes);
          setSessionProgressMap(serverCycleData.sessionProgressMap);
          setReminderNotes(serverCycleData.reminderNotes);
          setStudyDays(serverCycleData.studyDays);
          setCompletedCycles(serverCycleData.completedCycles || 0);
        }
      }
      setLoading(false);
    }
    loadPlansAndData();
  }, []);

  useEffect(() => {
    async function loadRecordsForSelectedFile() {
      if (selectedDataFile) {
        setLoading(true);
        setIsPlanDataLoaded(false); // Bloqueia o salvamento

        await migrateStudyRecordIds(selectedDataFile);
        const records = await getStudyRecords(selectedDataFile);
        setStudyRecords(records);
        const reviews = await getReviewRecords(selectedDataFile);
        setReviewRecords(reviews);
        const simulados = await getSimuladoRecords(selectedDataFile);
        setSimuladoRecords(simulados);
        
        const serverCycleData = await getStudyCycleFromFile(selectedDataFile);
        if (serverCycleData) {
          if (serverCycleData.studyCycle && (serverCycleData.studyCycle.groupA || serverCycleData.studyCycle.groupB)) {
            const flatCycle = [...(serverCycleData.studyCycle.groupA || []), ...(serverCycleData.studyCycle.groupB || [])];
            setStudyCycle(flatCycle);
          } else {
            setStudyCycle(serverCycleData.studyCycle);
          }
          setStudyHours(serverCycleData.studyHours);
          setWeeklyQuestionsGoal(serverCycleData.weeklyQuestionsGoal);
          setCurrentProgressMinutes(serverCycleData.currentProgressMinutes);
          setSessionProgressMap(serverCycleData.sessionProgressMap);
          setReminderNotes(serverCycleData.reminderNotes);
          setStudyDays(serverCycleData.studyDays);
          setCompletedCycles(serverCycleData.completedCycles || 0);
        } else {
          setStudyCycle(null);
          setStudyHours('40');
          setWeeklyQuestionsGoal('250');
          setCurrentProgressMinutes(0);
          setSessionProgressMap({});
          setReminderNotes([]);
          setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
          setCompletedCycles(0);
        }
        setLoading(false);
        setIsPlanDataLoaded(true); // Libera o salvamento
      }
    }
    loadRecordsForSelectedFile();
  }, [selectedDataFile]);

  useEffect(() => {
    // Apenas salva se não estiver carregando E se os dados do plano já tiverem sido carregados.
    if (!loading && isPlanDataLoaded && selectedDataFile) {
      const cycleData = {
        studyCycle, studyHours, weeklyQuestionsGoal, currentProgressMinutes,
        sessionProgressMap, reminderNotes, studyDays, completedCycles,
      };
      saveStudyCycleToFile(selectedDataFile, cycleData);
    }
  }, [studyCycle, studyHours, weeklyQuestionsGoal, currentProgressMinutes, sessionProgressMap, reminderNotes, studyDays, completedCycles, loading, isPlanDataLoaded, selectedDataFile]);

  useEffect(() => {
    async function updateStats() {
      if (studyPlans.length > 0 && availablePlans.length > 0 && selectedDataFile) {
        const newStats = await calculateStats(studyRecords, selectedDataFile, activeFilters, studyPlans, availablePlans, consistencyOffset, studyDays, studyCycle);
        setStats(newStats);
      }
    }
    updateStats();
  }, [studyRecords, selectedDataFile, activeFilters, studyPlans, availablePlans, consistencyOffset, studyDays, studyCycle]);

  useEffect(() => {
    if (!studyCycle || cycleJustCompleted) return;

    if (studyCycle.length === 0) return;

    const allSessionsCompleted = studyCycle.every(session => 
      (sessionProgressMap[session.id as string] || 0) >= session.duration
    );

    if (allSessionsCompleted && Object.keys(sessionProgressMap).length > 0) {
        setCompletedCycles(prev => prev + 1);
        setCycleJustCompleted(true);
    }
  }, [sessionProgressMap, studyCycle, cycleJustCompleted]);

  useEffect(() => {
    if (cycleJustCompleted) {
      showNotification('Parabéns! Você concluiu um ciclo de estudos completo!', 'success');
      const timer = setTimeout(() => {
        setSessionProgressMap({});
        setCurrentProgressMinutes(0);
        setCycleJustCompleted(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [cycleJustCompleted, showNotification]);

  const addStudyRecord = useCallback(async (record: Omit<StudyRecord, 'id'>) => {
    if (!selectedDataFile) {
      showNotification('Nenhum plano de estudos selecionado.', 'error');
      return;
    }
    
    const newRecord = { ...record, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    
    try {
      setStudyRecords(prevRecords => [...prevRecords, newRecord]);
      await saveStudyRecord(selectedDataFile, newRecord);
      showNotification('Registro de estudo salvo com sucesso!', 'success');

      if (newRecord.reviewPeriods && newRecord.reviewPeriods.length > 0) {
        const newReviewRecords: ReviewRecord[] = [];
        newRecord.reviewPeriods.forEach(period => {
          const [year, month, day] = newRecord.date.split('-').map(Number);
          const originalDate = new Date(Date.UTC(year, month - 1, day));
          let scheduledDate = new Date(originalDate);

          if (period.endsWith('d')) {
            scheduledDate.setUTCDate(originalDate.getUTCDate() + parseInt(period.slice(0, -1)));
          } else if (period.endsWith('w')) {
            scheduledDate.setUTCDate(originalDate.getUTCDate() + (parseInt(period.slice(0, -1)) * 7));
          } else if (period.endsWith('m')) {
            scheduledDate.setUTCMonth(originalDate.getUTCMonth() + parseInt(period.slice(0, -1)));
          }

          newReviewRecords.push({
            id: `${newRecord.id}-${period}`, studyRecordId: newRecord.id,
            scheduledDate: scheduledDate.toISOString().split('T')[0], status: 'pending',
            originalDate: newRecord.date, subject: newRecord.subject, topic: newRecord.topic,
            reviewPeriod: period,
          });
        });

        setReviewRecords(prevReviews => [...prevReviews, ...newReviewRecords]);
        for (const review of newReviewRecords) {
          await saveReviewRecord(selectedDataFile, review);
        }
      }
    } catch (error) {
      console.error("Falha ao salvar o registro de estudo:", error);
      showNotification('Erro ao salvar o registro. Tente novamente.', 'error');
      setStudyRecords(prevRecords => prevRecords.filter(r => r.id !== newRecord.id));
    }
  }, [selectedDataFile, showNotification]);

  const addSimuladoRecord = useCallback(async (record: Omit<SimuladoRecord, 'id'>) => {
    if (!selectedDataFile) {
      showNotification('Nenhum plano de estudos selecionado para salvar o simulado.', 'error');
      return;
    }
    const newRecord = { ...record, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    try {
      setSimuladoRecords(prevRecords => [...prevRecords, newRecord]);
      await saveSimuladoRecord(selectedDataFile, newRecord);
      showNotification('Simulado salvo com sucesso!', 'success');
    } catch (error) {
      console.error("Falha ao salvar o simulado:", error);
      showNotification('Erro ao salvar o simulado. Tente novamente.', 'error');
      setSimuladoRecords(prevRecords => prevRecords.filter(r => r.id !== newRecord.id));
    }
  }, [selectedDataFile, showNotification]);

  const updateSimuladoRecord = useCallback(async (record: SimuladoRecord) => {
    if (!selectedDataFile) return;
    try {
      await updateSimuladoRecordAction(selectedDataFile, record);
      setSimuladoRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));
      showNotification('Simulado atualizado com sucesso!', 'success');
    } catch (error) {
      console.error("Falha ao atualizar o simulado:", error);
      showNotification('Erro ao atualizar o simulado. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification]);

  const deleteSimuladoRecord = useCallback(async (id: string) => {
    if (!selectedDataFile) return;
    try {
      await deleteSimuladoRecordActionImport(selectedDataFile, id);
      setSimuladoRecords(prevRecords => prevRecords.filter(r => r.id !== id));
      showNotification('Simulado excluído com sucesso!', 'info');
    } catch (error) {
      console.error("Falha ao excluir o simulado:", error);
      showNotification('Erro ao excluir o simulado. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification]);

  const updateStudyRecord = useCallback(async (record: StudyRecord) => {
    if (!selectedDataFile) return;
    await saveStudyRecord(selectedDataFile, record);
    setStudyRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));

    setReviewRecords(prevReviews => prevReviews.filter(r => r.studyRecordId !== record.id));

    if (record.reviewPeriods && record.reviewPeriods.length > 0) {
      const newReviewRecords: ReviewRecord[] = [];
      record.reviewPeriods.forEach(period => {
        const [year, month, day] = record.date.split('-').map(Number);
        const originalDate = new Date(Date.UTC(year, month - 1, day)); 
        let scheduledDate = new Date(originalDate);

        if (period.endsWith('d')) {
          scheduledDate.setUTCDate(originalDate.getUTCDate() + parseInt(period.slice(0, -1)));
        } else if (period.endsWith('w')) {
          scheduledDate.setUTCDate(originalDate.getUTCDate() + (parseInt(period.slice(0, -1)) * 7));
        } else if (period.endsWith('m')) {
          scheduledDate.setUTCMonth(originalDate.getUTCMonth() + parseInt(period.slice(0, -1)));
        }

        newReviewRecords.push({
          id: `${record.id}-${period}`, studyRecordId: record.id,
          scheduledDate: scheduledDate.toISOString().split('T')[0], status: 'pending',
          originalDate: record.date, subject: record.subject, topic: record.topic,
          reviewPeriod: period, completedDate: undefined, ignored: false,
        });
      });

      for (const review of newReviewRecords) {
        await saveReviewRecord(selectedDataFile, review);
      }
      setReviewRecords(prevReviews => [...prevReviews, ...newReviewRecords]);
    }
  }, [selectedDataFile]);

  const deleteStudyRecord = useCallback(async (id: string) => {
    if (!selectedDataFile) return;
    try {
      await deleteStudyRecordAction(selectedDataFile, id);
      setStudyRecords(prevRecords => prevRecords.filter(r => r.id !== id));
      setReviewRecords(prevReviews => prevReviews.filter(rr => rr.studyRecordId !== id));
    } catch (error) {
      console.error("Failed to delete study record:", error);
    }
  }, [selectedDataFile]);

  const updateReviewRecord = useCallback(async (record: ReviewRecord) => {
    if (!selectedDataFile) return;
    await saveReviewRecord(selectedDataFile, record);
    setReviewRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));
  }, [selectedDataFile]);

  const applyFilters = useCallback((filters: Filters) => {
    setActiveFilters(filters);
  }, []);

  const generateStudyCycleLogic = (settings: {
    studyHours: number;
    minSession: number;
    maxSession: number;
    subjectSettings: any;
    subjects: any[];
  }): StudySession[] => {
    const { studyHours, minSession, maxSession, subjectSettings, subjects: allSelectedSubjects } = settings;
    const totalMinutes = studyHours * 60;
  
    const minS = minSession;
    const maxS = maxSession;
  
    const subjectMinutes: { [key: string]: number } = {};
    let totalImportance = 0;
  
    // Calculate total importance
    Object.keys(subjectSettings).forEach(subject => {
      const { importance } = subjectSettings[subject] as { importance: number; knowledge: number };
      totalImportance += importance;
    });
  
    if (totalImportance === 0) return [];
  
    // Allocate time based on importance
    Object.keys(subjectSettings).forEach(subject => {
      const { importance } = subjectSettings[subject] as { importance: number; knowledge: number };
      subjectMinutes[subject] = totalMinutes * (importance / totalImportance);
    });
  
    // Determine session duration
    const subjectSessionDurations: { [key: string]: number } = {};
    Object.keys(subjectSettings).forEach(subject => {
        const { importance, knowledge } = subjectSettings[subject] as { importance: number; knowledge: number };
        const effectiveWeight = importance / (knowledge || 1);
        const normalizedWeight = (effectiveWeight - 1/5) / (5 - 1/5);
        let calculatedDuration = minS + (maxS - minS) * normalizedWeight;
        calculatedDuration = Math.round(calculatedDuration / 5) * 5;
        subjectSessionDurations[subject] = Math.max(minS, Math.min(maxS, calculatedDuration));
    });
  
    const sessionsBySubject: { [subject: string]: StudySession[] } = {};
    const alphabeticallySortedSubjects = Object.keys(subjectSettings).sort((a, b) => a.localeCompare(b));
    let sessionCounter = 0;
    let totalMinutesAccountedFor = 0;

    alphabeticallySortedSubjects.forEach(subjectName => {
        const sessionDuration = subjectSessionDurations[subjectName] || minS;
        if (sessionDuration === 0) return;
        const allocatedTime = subjectMinutes[subjectName];
        const count = Math.floor(allocatedTime / sessionDuration);
        totalMinutesAccountedFor += count * sessionDuration;
        const subjectData = allSelectedSubjects.find(s => s.subject === subjectName);
        const color = subjectData ? subjectData.color : '#94A3B8';

        sessionsBySubject[subjectName] = [];
        for (let i = 0; i < count; i++) {
            sessionsBySubject[subjectName].push({ id: `${Date.now()}-${subjectName}-${sessionCounter++}`, subject: subjectName, duration: sessionDuration, color });
        }
    });

    const sessionPool: StudySession[] = [];
    let sessionsPlaced = true;
    while(sessionsPlaced) {
        sessionsPlaced = false;
        alphabeticallySortedSubjects.forEach(subject => {
            if (sessionsBySubject[subject] && sessionsBySubject[subject].length > 0) {
                sessionPool.push(sessionsBySubject[subject].shift()!);
                sessionsPlaced = true;
            }
        });
    }
  
    const lostTime = totalMinutes - totalMinutesAccountedFor;
    if (sessionPool.length > 0 && lostTime > 0) {
      const baseExtraTime = Math.floor(lostTime / sessionPool.length);
      let remainder = lostTime % sessionPool.length;

      for (let i = 0; i < sessionPool.length; i++) {
        sessionPool[i].duration += baseExtraTime;
        if (remainder > 0) {
          sessionPool[i].duration += 1;
          remainder--;
        }
      }
    }
    
    return sessionPool;
  };

  const generateStudyCycle = useCallback((settings: {
    studyHours: number;
    minSession: number;
    maxSession: number;
    subjectSettings: any;
    subjects: any[];
    weeklyQuestionsGoal: string;
  }) => {
    const finalCycle = generateStudyCycleLogic(settings);
    setStudyCycle(finalCycle);
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setStudyHours(String(settings.studyHours));
    setWeeklyQuestionsGoal(settings.weeklyQuestionsGoal);
  }, []);

  const resetStudyCycle = useCallback(async () => {
    if (selectedDataFile) {
      await deleteStudyCycleFile(selectedDataFile);
    }
    setStudyCycle(null);
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
    showNotification('Planejamento removido. Você pode criar um novo ciclo.', 'success');
  }, [selectedDataFile, showNotification]);

  const handleConsistencyNav = useCallback((direction: number) => {
    setConsistencyOffset(prev => prev + direction);
  }, []);

  const formatMinutesToHoursMinutes = useCallback((totalMinutes: number) => {
    if (totalMinutes < 0) return '0min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h${String(minutes).padStart(2, '0')}min`;
    } else {
      return `${minutes}min`;
    }
  }, []);

  const handleCompleteSession = useCallback((completedSession: StudySession, durationInMinutes?: number) => {
    if (!studyCycle) return;
    const sessionDuration = durationInMinutes ?? completedSession.duration;

    setSessionProgressMap(prevMap => ({
      ...prevMap,
      [completedSession.id as string]: (prevMap[completedSession.id as string] || 0) + sessionDuration,
    }));
    
    setCurrentProgressMinutes(prevMinutes => prevMinutes + sessionDuration);
  }, [studyCycle]);

  const addReminderNote = useCallback((text: string) => {
    const newNote: ReminderNote = {
      id: Date.now().toString(), text, completed: false,
    };
    setReminderNotes(prevNotes => [...prevNotes, newNote]);
    showNotification('Lembrete adicionado!', 'success');
  }, [showNotification]);

  const toggleReminderNote = useCallback((id: string) => {
    setReminderNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  }, []);

  const deleteReminderNote = useCallback((id: string) => {
    setReminderNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    showNotification('Lembrete removido.', 'info');
  }, [showNotification]);

  const updateReminderNote = useCallback((id: string, newText: string) => {
    setReminderNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, text: newText } : note
      )
    );
    showNotification('Lembrete atualizado!', 'success');
  }, [showNotification]);

  const updateTopicWeight = useCallback(async (subjectName: string, topicText: string, newWeight: number) => {
    if (!selectedDataFile) return;

    setStudyPlans(prevPlans => {
      const planIndex = availablePlans.indexOf(selectedDataFile);
      if (planIndex === -1) return prevPlans;

      const newPlans = [...prevPlans];
      const planToUpdate = { ...newPlans[planIndex] };

      const subjectIndex = planToUpdate.subjects.findIndex((s:any) => s.subject === subjectName);
      if (subjectIndex === -1) return prevPlans;
      
      const topicIndex = planToUpdate.subjects[subjectIndex].topics.findIndex((t:any) => t.topic_text === topicText);
      if (topicIndex === -1) return prevPlans;

      const updatedTopic = { ...planToUpdate.subjects[subjectIndex].topics[topicIndex], userWeight: newWeight };
      const updatedTopics = [...planToUpdate.subjects[subjectIndex].topics];
      updatedTopics[topicIndex] = updatedTopic;
      
      const updatedSubject = { ...planToUpdate.subjects[subjectIndex], topics: updatedTopics };
      const updatedSubjects = [...planToUpdate.subjects];
      updatedSubjects[subjectIndex] = updatedSubject;

      newPlans[planIndex] = { ...planToUpdate, subjects: updatedSubjects };
      return newPlans;
    });

    const result = await updateTopicWeightAction(selectedDataFile, subjectName, topicText, newWeight);
    if (!result.success) {
      showNotification('Erro ao salvar o peso do tópico.', 'error');
    }
  }, [selectedDataFile, showNotification, availablePlans]);

  const deletePlan = useCallback(async (fileName: string) => {
    try {
      await deleteJsonFile(fileName);
      await deleteStudyCycleFile(fileName);

      const updatedPlans = availablePlans.filter(p => p !== fileName);
      setAvailablePlans(updatedPlans);

      if (selectedDataFile === fileName) {
        const newSelectedFile = updatedPlans[0] || '';
        setSelectedDataFile(newSelectedFile);
        localStorage.setItem('selectedDataFile', newSelectedFile);
        setStudyCycle(null);
      }

      showNotification(`Plano "${fileName}" e seu ciclo associado foram excluídos.`, 'success');
    } catch (error) {
      console.error("Falha ao excluir o plano:", error);
      showNotification('Erro ao excluir o plano. Tente novamente.', 'error');
    }
  }, [availablePlans, selectedDataFile, showNotification]);

  const clearAllData = useCallback(async () => {
    try {
      await clearAllDataAction(); // Call the server action to delete all files

      // Reset local state
      setStudyRecords([]);
      setReviewRecords([]);
      setSimuladoRecords([]);
      setStudyCycle(null);
      setSessionProgressMap({});
      setCurrentProgressMinutes(0);
      setCompletedCycles(0);
      setReminderNotes([]);
      // Also reset selectedDataFile and availablePlans as all plans are gone
      _setSelectedDataFile('');
      setAvailablePlans([]);
      setStudyPlans([]);

      showNotification('Todos os dados foram apagados com sucesso!', 'success');
    } catch (error) {
      console.error("Falha ao apagar todos os dados:", error);
      showNotification('Erro ao apagar todos os dados. Tente novamente.', 'error');
      throw error; // Re-throw to be caught by the UI
    }
  }, [showNotification]);

  const exportAllData = useCallback(async () => {
    const serverData = await exportFullBackupAction();
    const clientData = {
      version: 3,
      selectedDataFile, studyCycle, sessionProgressMap, completedCycles,
      currentProgressMinutes, studyHours, weeklyQuestionsGoal, studyDays, reminderNotes,
    };
    return { ...serverData, clientData };
  }, [
    selectedDataFile, studyCycle, sessionProgressMap, completedCycles,
    currentProgressMinutes, studyHours, weeklyQuestionsGoal, studyDays, reminderNotes,
  ]);

  const importAllData = useCallback(async (data: any) => {
    if (!data.clientData || !data.plans) {
      throw new Error('Arquivo de backup inválido ou incompatível.');
    }

    const result = await restoreFullBackupAction(data);

    if (result.success) {
      const { clientData } = data;
      setSelectedDataFile(clientData.selectedDataFile || '');
      setStudyCycle(clientData.studyCycle || null);
      setSessionProgressMap(clientData.sessionProgressMap || {});
      setCompletedCycles(clientData.completedCycles || 0);
      setCurrentProgressMinutes(clientData.currentProgressMinutes || 0);
      setStudyHours(clientData.studyHours || '40');
      setWeeklyQuestionsGoal(clientData.weeklyQuestionsGoal || '250');
      setStudyDays(clientData.studyDays || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
      setReminderNotes(clientData.reminderNotes || []);
      
      window.location.reload();
    } else {
      throw new Error(result.error || 'Falha ao restaurar o backup no servidor.');
    }
  }, []);

  return (
    <DataContext.Provider value={{
      selectedDataFile, setSelectedDataFile, availablePlans, studyPlans,
      studyRecords, reviewRecords, simuladoRecords, stats, addStudyRecord,
      addSimuladoRecord, updateStudyRecord, deleteStudyRecord, updateReviewRecord,
      updateSimuladoRecord, deleteSimuladoRecord, applyFilters, studyCycle,
      setStudyCycle, generateStudyCycle, resetStudyCycle, handleConsistencyNav,
      loading, sessionProgressMap, setSessionProgressMap, completedCycles,
      setCompletedCycles, currentProgressMinutes, setCurrentProgressMinutes,
      currentStudySession, setCurrentStudySession, isRegisterModalOpen,
      setIsRegisterModalOpen, isStopwatchModalOpen, setIsStopwatchModalOpen,
      stopwatchTargetDuration, setStopwatchTargetDuration, stopwatchModalSubject,
      setStopwatchModalSubject, initialStudyRecord, setInitialStudyRecord,
      formatMinutesToHoursMinutes, handleCompleteSession, studyHours, setStudyHours,
      weeklyQuestionsGoal, setWeeklyQuestionsGoal, studyDays, setStudyDays,
      reminderNotes, addReminderNote, toggleReminderNote, deleteReminderNote,
      updateReminderNote, exportAllData, importAllData, deletePlan,
      topicScores, getRecommendedSession, updateTopicWeight, availableSubjects, availableCategories, clearAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};