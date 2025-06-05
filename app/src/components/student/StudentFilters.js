import React from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

const StudentFilters = ({
  searchQuery,
  setSearchQuery,
  filterGrade,
  setFilterGrade,
  filterStatus,
  setFilterStatus,
  onReset
}) => {
  const gradeOptions = [
    'Preescolar',
    '1° Primaria',
    '2° Primaria',
    '3° Primaria',
    '4° Primaria',
    '5° Primaria',
    '6° Primaria',
    '1° Secundaria',
    '2° Secundaria',
    '3° Secundaria'
  ];

  const statusOptions = [
    { value: 'present', label: 'Presente' },
    { value: 'absent', label: 'Ausente' }
  ];

  const hasActiveFilters = searchQuery || filterGrade || filterStatus;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por nombre o ID..."
            />
          </div>
        </div>

        {/* Grade Filter */}
        <div className="sm:w-48">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los grados</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:w-40">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiX className="w-4 h-4 mr-1" />
            Limpiar
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <FiSearch className="w-3 h-3 mr-1" />
              {searchQuery}
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filterGrade && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <FiFilter className="w-3 h-3 mr-1" />
              {filterGrade}
              <button
                onClick={() => setFilterGrade('')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filterStatus && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <FiFilter className="w-3 h-3 mr-1" />
              {statusOptions.find(s => s.value === filterStatus)?.label}
              <button
                onClick={() => setFilterStatus('')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentFilters; 