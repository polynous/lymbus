import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { FiSearch, FiX, FiUsers } from 'react-icons/fi';
import { useDebounce, usePerformanceMonitor } from '../hooks/usePerformance';

const EnhancedSearch = memo(({ 
  placeholder = "Buscar alumno por nombre, ID o grado...",
  onSearch,
  onSelect,
  suggestions = [],
  isLoading = false,
  showStats = false,
  stats = {},
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // Performance monitoring disabled to prevent excessive logging
  // const { logRender } = usePerformanceMonitor('EnhancedSearch');

  // Memoized filtered suggestions for performance
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return suggestions.filter(item => 
      item.full_name?.toLowerCase().includes(searchTerm) ||
      item.first_name?.toLowerCase().includes(searchTerm) ||
      item.last_name?.toLowerCase().includes(searchTerm) ||
      item.enrollment_id?.toLowerCase().includes(searchTerm) ||
      item.grade?.toLowerCase().includes(searchTerm)
    );
  }, [suggestions, query]);

  // Debounced search function
  const debouncedSearch = useDebounce(useCallback((searchQuery) => {
    if (onSearch) {
      onSearch(searchQuery);
      // logRender(`Search triggered for: "${searchQuery}"`);
    }
  }, [onSearch]), 300);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredSuggestions]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setSelectedIndex(-1);
    
    // Use debounced search
    debouncedSearch(value);
  }, [debouncedSearch]);

  const scrollToSuggestion = useCallback((index) => {
    setTimeout(() => {
      if (suggestionRefs.current[index]) {
        suggestionRefs.current[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 0);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < filteredSuggestions.length - 1 ? prev + 1 : prev;
          scrollToSuggestion(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          if (newIndex >= 0) {
            scrollToSuggestion(newIndex);
          }
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        // No action needed for other keys
        break;
    }
  }, [showSuggestions, filteredSuggestions, selectedIndex, scrollToSuggestion]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch, query]);

  const handleSelectSuggestion = useCallback((suggestion) => {
    const fullName = suggestion.full_name || `${suggestion.first_name} ${suggestion.last_name}`;
    setQuery(fullName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSelect) {
      onSelect(suggestion);
      // logRender(`Suggestion selected: ${fullName}`);
    }
  }, [onSelect]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const highlightMatch = useCallback((text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  }, []);

  // Memoized suggestion items for performance
  const SuggestionItem = memo(({ suggestion, index, isSelected, onClick, onMouseEnter }) => {
    const isFirst = index === 0;
    const isLast = index === filteredSuggestions.length - 1;
    const isSingle = filteredSuggestions.length === 1;
    
    let roundedClass = '';
    if (isSingle) {
      roundedClass = 'list-item-single';
    } else if (isFirst) {
      roundedClass = 'list-item-first';
    } else if (isLast) {
      roundedClass = 'list-item-last';
    } else {
      roundedClass = 'list-item-middle';
    }
    
    return (
      <button
        ref={el => suggestionRefs.current[index] = el}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`w-full text-left px-3 py-3 transition-all duration-150 flex items-center justify-between mb-1 ${roundedClass} ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700'
            : 'list-item-hover'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
            {highlightMatch(suggestion.full_name || `${suggestion.first_name} ${suggestion.last_name}`, query)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>ID: {suggestion.enrollment_id || suggestion.id}</span>
            <span>•</span>
            <span>{suggestion.grade}</span>
            {suggestion.status && (
              <>
                <span>•</span>
                <span className={`font-medium ${
                  suggestion.status === 'present' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {suggestion.status === 'present' ? 'Presente' : 'Ausente'}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="ml-3 flex items-center space-x-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${
            suggestion.status === 'present'
              ? 'bg-emerald-500'
              : 'bg-slate-300 dark:bg-slate-600'
          }`} />
          
          {isSelected && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              ↵
            </div>
          )}
        </div>
      </button>
    );
  });

  return (
    <div className={`search-dropdown-container ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <FiSearch className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length > 0)}
            onBlur={() => {
              // Delay hiding suggestions to allow for clicks and scrolling
              setTimeout(() => setShowSuggestions(false), 300);
            }}
            placeholder={placeholder}
            className="glass-input pl-10 pr-20 w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
            autoComplete="off"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Limpiar búsqueda"
              >
                <FiX className="h-3 w-3 text-slate-400" />
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              title="Buscar"
            >
              <FiSearch className="h-3 w-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="search-dropdown">
          <div className="glass-card border border-white/20 dark:border-slate-700/50 rounded-lg shadow-xl overflow-hidden">
            {/* Header with count */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-white/10 dark:border-slate-700/30 px-4 py-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{filteredSuggestions.length} resultado{filteredSuggestions.length !== 1 ? 's' : ''}</span>
                {filteredSuggestions.length > 8 && (
                  <span className="text-blue-600 dark:text-blue-400">↓ Desplázate para ver más</span>
                )}
              </div>
            </div>
            
            {/* Scrollable suggestions list */}
            <div className="search-dropdown-list p-2">
              {filteredSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
              
              {/* Bottom padding for better scroll experience */}
              <div className="h-2"></div>
            </div>
            
            {/* Footer with keyboard shortcut info */}
            {filteredSuggestions.length > 0 && (
              <div className="sticky bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-white/10 dark:border-slate-700/30 px-4 py-2">
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>↑↓ navegar</span>
                  <span>↵ seleccionar</span>
                  <span>Esc cerrar</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Stats */}
      {showStats && (
        <div className="flex items-center space-x-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
          {stats.total !== undefined && (
            <div className="flex items-center space-x-1">
              <FiUsers className="h-4 w-4" />
              <span>{stats.total} total</span>
            </div>
          )}
          {stats.present !== undefined && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>{stats.present} presentes</span>
            </div>
          )}
          {stats.absent !== undefined && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <span>{stats.absent} ausentes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedSearch.displayName = 'EnhancedSearch';

export default EnhancedSearch; 