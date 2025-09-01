'use client';

import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { FaHome, FaClipboardList, FaBook, FaFileAlt, FaDatabase, FaRedoAlt, FaHistory, FaChartBar, FaCalendarAlt, FaGraduationCap } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsList } from 'react-icons/bs';
import ThemeToggleButton from './ThemeToggleButton';
import PlanSelector from './PlanSelector';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' ? '/logo-modo-escuro.svg' : '/logo.svg';

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}
      bg-teal-500 text-white w-72 p-4 transition-transform duration-300 ease-in-out z-50 flex flex-col dark:bg-gray-800 dark:text-gray-100`}>
      
      <div className="flex-grow">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          <button onClick={toggleSidebar} className="text-white p-2 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-white dark:hover:bg-gray-700 dark:focus:ring-gray-500">
            <BsList size={24} />
          </button>
          <img src={logoSrc} alt="Estudei Logo" className="h-10 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <Link href="/dashboard" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/dashboard' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHome className="mr-2" />Home</Link>
            </li>
            <li className="mb-2">
              <Link href="/planos" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/planos' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaClipboardList className="mr-2" />Planos</Link>
            </li>
            <li className="mb-2">
              <Link href="/materias" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/materias' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaBook className="mr-2" />Matérias</Link>
            </li>
            
            <li className="mb-2">
              <Link href="/edital" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/edital' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaFileAlt className="mr-2" />Edital</Link>
            </li>
            
            <li className="mb-2">
              <Link href="/planejamento" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/planejamento' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaCalendarAlt className="mr-2" />Planejamento</Link>
            </li>
            <li className="mb-2">
              <Link href="/historico" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/historico' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHistory className="mr-2" />Histórico</Link>
            </li>
            <li className="mb-2">
              <Link href="/revisoes" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/revisoes' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaRedoAlt className="mr-2" />Revisões</Link>
            </li>
            <li className="mb-2">
              <Link href="/estatisticas" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/estatisticas' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaChartBar className="mr-2" />Estatísticas</Link>
            </li>
            <li className="mb-2">
              <Link href="/simulados" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/simulados' ? 'bg-teal-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaGraduationCap className="mr-2" />Simulados</Link>
            </li>
            <li className="mb-2">
              <Link href="/backup" className={`flex items-center p-2 rounded-md hover:bg-teal-600 transition-colors duration-200 ${pathname === '/backup' ? 'bg-teal-600 dark:bg-gray-700' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaDatabase className="mr-2" />Backup</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-teal-400 dark:border-gray-700">
        <div className="flex items-center justify-between space-x-2">
          <ThemeToggleButton />
          <div className="flex-grow">
            <PlanSelector />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Sidebar;