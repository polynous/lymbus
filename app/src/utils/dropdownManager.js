import React, { useEffect, useCallback, useMemo } from 'react';

/**
 * Global dropdown manager to handle outside clicks for all dropdowns
 * This prevents conflicts between multiple mousedown event listeners
 */

class DropdownManager {
  constructor() {
    this.activeDropdowns = new Map(); // Changed to Map for better tracking
    this.isInitialized = false;
    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.handleGlobalKeydown = this.handleGlobalKeydown.bind(this);
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('DropdownManager: Initializing global event listeners');
    // Use capture phase to ensure we handle events before other handlers
    document.addEventListener('mousedown', this.handleGlobalClick, true);
    document.addEventListener('keydown', this.handleGlobalKeydown, true);
    
    this.isInitialized = true;
  }

  cleanup() {
    console.log('DropdownManager: Cleaning up global event listeners');
    document.removeEventListener('mousedown', this.handleGlobalClick, true);
    document.removeEventListener('keydown', this.handleGlobalKeydown, true);
    this.isInitialized = false;
    this.activeDropdowns.clear();
  }

  register(id, dropdown) {
    console.log(`DropdownManager: Registering dropdown ${id}`);
    this.activeDropdowns.set(id, dropdown);
    this.init();
    
    // Return cleanup function
    return () => {
      console.log(`DropdownManager: Unregistering dropdown ${id}`);
      this.activeDropdowns.delete(id);
      if (this.activeDropdowns.size === 0) {
        this.cleanup();
      }
    };
  }

  handleGlobalClick(event) {
    console.log('DropdownManager: Global click detected, checking', this.activeDropdowns.size, 'dropdowns');
    
    // Check all active dropdowns to see if the click is outside
    for (const [id, dropdown] of this.activeDropdowns) {
      if (dropdown.isOpen && dropdown.shouldCloseOnOutsideClick) {
        const isOutside = !dropdown.contains(event.target);
        
        console.log(`DropdownManager: Dropdown ${id} - isOpen: ${dropdown.isOpen}, isOutside: ${isOutside}`);
        
        if (isOutside) {
          console.log(`DropdownManager: Closing dropdown ${id}`);
          // Use requestAnimationFrame to ensure this runs after React's event handling
          requestAnimationFrame(() => {
            dropdown.close();
          });
        }
      }
    }
  }

  handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
      console.log('DropdownManager: Escape key pressed, closing all dropdowns');
      // Close all dropdowns on escape
      for (const [id, dropdown] of this.activeDropdowns) {
        if (dropdown.isOpen) {
          event.preventDefault();
          event.stopPropagation();
          console.log(`DropdownManager: Closing dropdown ${id} via Escape`);
          dropdown.close();
        }
      }
    }
  }
}

// Create singleton instance
const dropdownManager = new DropdownManager();

export default dropdownManager;

/**
 * Hook to use the dropdown manager
 */
export const useDropdownManager = ({ 
  isOpen, 
  close, 
  dropdownRef, 
  triggerRef,
  shouldCloseOnOutsideClick = true,
  id = 'default' // Add unique ID for better tracking
}) => {
  
  // Memoize the contains function
  const contains = useCallback((target) => {
    const inDropdown = dropdownRef.current?.contains(target);
    const inTrigger = triggerRef.current?.contains(target);
    console.log(`DropdownManager: Contains check - dropdown: ${inDropdown}, trigger: ${inTrigger}`);
    return inDropdown || inTrigger;
  }, [dropdownRef, triggerRef]);

  // Memoize the dropdown instance to prevent unnecessary re-registrations
  const dropdownInstance = useMemo(() => ({
    isOpen,
    close,
    shouldCloseOnOutsideClick,
    contains
  }), [isOpen, close, shouldCloseOnOutsideClick, contains]);

  // Register with the dropdown manager
  useEffect(() => {
    if (isOpen) {
      console.log(`DropdownManager Hook: Registering dropdown ${id}`);
      const cleanup = dropdownManager.register(id, dropdownInstance);
      return cleanup;
    }
  }, [isOpen, dropdownInstance, id]);
}; 