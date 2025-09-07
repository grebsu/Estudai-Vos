'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

interface Topic {
  topic_text: string;
  userWeight?: number;
}

interface Subject {
  subject: string;
  topics: Topic[];
}

interface TopicWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
}

const TopicWeightsModal: React.FC<TopicWeightsModalProps> = ({ isOpen, onClose, subject }) => {
  const { updateTopicWeight } = useData();
  const [topicWeights, setTopicWeights] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (subject) {
      const initialWeights = subject.topics.reduce((acc, topic) => {
        acc[topic.topic_text] = topic.userWeight || 3;
        return acc;
      }, {} as { [key: string]: number });
      setTopicWeights(initialWeights);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleWeightChange = (topicText: string, weight: number) => {
    setTopicWeights(prev => ({ ...prev, [topicText]: weight }));
    // Debounce or save on button click could be an option here
    updateTopicWeight(subject.subject, topicText, weight);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Ajustar Relevância: <span className="text-amber-500">{subject.subject}</span>
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {subject.topics.map(topic => (
            <div key={topic.topic_text} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-700 dark:text-gray-300 flex-1 mb-2 sm:mb-0">{topic.topic_text}</p>
              <div className="flex items-center space-x-4 w-full sm:w-1/2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={topicWeights[topic.topic_text] || 3}
                  onChange={(e) => handleWeightChange(topic.topic_text, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-amber-500"
                />
                <span className="font-bold text-amber-500 w-8 text-center">{topicWeights[topic.topic_text] || 3}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <button
            onClick={onClose}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicWeightsModal;
