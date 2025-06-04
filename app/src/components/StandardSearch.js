import React from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';

const StandardSearch = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onReset,
  placeholder = "Buscar alumno por nombre, ID o grado...",
  isLoading = false,
  showSearchButton = true,
  showResetButton = true,
  resetButtonText = "Ver todos",
  searchButtonText = "Buscar",
  filters = [], // Array of filter objects: { value, onChange, options, placeholder }
  resultsCount = 0,
  resultsText = "alumnos",
  className = ""
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={`glass-card p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className="form-input pl-10"
              />
            </div>
          </div>
          
          {/* Dynamic Filters */}
          {filters.map((filter, index) => (
            <div key={index} className="w-full lg:w-48">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="form-select"
              >
                <option value="">{filter.placeholder}</option>
                {filter.options?.map(option => (
                  <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showSearchButton && (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FiSearch className="h-4 w-4" />
                )}
                <span>{searchButtonText}</span>
              </button>
            )}
            
            {showResetButton && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center space-x-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>{resetButtonText}</span>
              </button>
            )}
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {resultsCount} {resultsText}
          </div>
        </div>
      </form>
    </div>
  );
};

export default StandardSearch; 