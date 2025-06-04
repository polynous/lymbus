import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiCommand } from 'react-icons/fi';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const KeyboardShortcutIndicator = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const { showHelp } = useKeyboardShortcuts();

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 192; // w-48 = 12rem = 192px
      const tooltipHeight = 70; // Approximate height
      
      // Calculate position
      let top = rect.bottom + 8; // 8px gap (mt-2)
      let left = rect.right - tooltipWidth; // Right-aligned
      
      // Adjust for viewport boundaries
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Horizontal adjustment
      if (left < 8) {
        left = 8; // Minimum left margin
      } else if (left + tooltipWidth > viewportWidth - 8) {
        left = viewportWidth - tooltipWidth - 8; // Adjust to fit
      }
      
      // Vertical adjustment
      if (top + tooltipHeight > viewportHeight - 8) {
        top = rect.top - tooltipHeight - 8; // Show above if no space below
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showTooltip]);

  const tooltipContent = showTooltip ? createPortal(
    <div 
      className="fixed z-[9999] w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-xs border border-slate-200 dark:border-slate-600"
      style={{ 
        top: `${tooltipPosition.top}px`, 
        left: `${tooltipPosition.left}px`,
        pointerEvents: 'none' // Prevent tooltip from interfering with mouse events
      }}
    >
      <div className="font-medium mb-1">Atajos de Teclado</div>
      <div className="text-slate-500 dark:text-slate-400">
        Presiona <kbd className="kbd kbd-sm">Ctrl + /</kbd> para ver todos los atajos disponibles
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        className="flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 transition-colors duration-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
        onClick={showHelp}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <FiCommand className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Atajos</span>
      </button>
      
      {tooltipContent}
    </div>
  );
};

export default KeyboardShortcutIndicator; 