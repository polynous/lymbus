import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../components/NotificationSystem';

const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { info } = useNotification();

  const shortcuts = {
    // Navigation shortcuts
    'ctrl+h': () => {
      navigate('/app');
      info('Navegando al Dashboard');
    },
    'ctrl+e': () => {
      navigate('/app/entry');
      info('Navegando a Registro de Entrada');
    },
    'ctrl+p': () => {
      navigate('/app/checkout');
      info('Navegando a Coordinación de Salidas');
    },
    'ctrl+g': () => {
      navigate('/app/teacher-pickup');
      info('Navegando a Salidas por Grupo');
    },
    'ctrl+a': () => {
      navigate('/app/attendance');
      info('Navegando a Asistencia');
    },
    'ctrl+q': () => {
      navigate('/app/qr-codes');
      info('Navegando a Códigos QR');
    },
    'ctrl+i': () => {
      navigate('/app/invite');
      info('Navegando a Invitar Usuarios');
    },
    'ctrl+n': () => {
      navigate('/app/notifications');
      info('Navegando a Notificaciones');
    },
    'ctrl+s': () => {
      navigate('/app/settings');
      info('Navegando a Configuración');
    },
    
    // Utility shortcuts
    'ctrl+/': () => {
      showHelp();
    },
    'ctrl+r': (e) => {
      e.preventDefault();
      window.location.reload();
    },
    'esc': () => {
      // Close any open modals or dropdowns
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
  };

  const showHelp = useCallback(() => {
    const helpModal = document.createElement('div');
    helpModal.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/30 backdrop-blur-lg transition-all duration-300"></div>
        <div class="flex min-h-screen items-center justify-center p-4">
          <div class="relative w-full max-w-2xl">
            <div class="glass-card p-6 w-full animate-fade-in-scale shadow-2xl">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                  <div class="icon-container icon-container-md icon-primary">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-primary">Atajos de Teclado</h3>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200">
                  <svg class="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <h4 class="font-semibold text-primary mb-3 flex items-center space-x-2">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <span>Navegación Principal</span>
                  </h4>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Dashboard</span>
                      <kbd class="kbd">Ctrl + H</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Entrada de Estudiantes</span>
                      <kbd class="kbd">Ctrl + E</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Coordinación de Recogida</span>
                      <kbd class="kbd">Ctrl + P</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Vista de Maestros</span>
                      <kbd class="kbd">Ctrl + G</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Asistencia</span>
                      <kbd class="kbd">Ctrl + A</kbd>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <h4 class="font-semibold text-primary mb-3 flex items-center space-x-2">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>Gestión y Herramientas</span>
                  </h4>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Códigos QR</span>
                      <kbd class="kbd">Ctrl + Q</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Gestión de Usuarios</span>
                      <kbd class="kbd">Ctrl + I</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Notificaciones</span>
                      <kbd class="kbd">Ctrl + N</kbd>
                    </div>
                    <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                      <span class="text-secondary text-sm">Configuración</span>
                      <kbd class="kbd">Ctrl + S</kbd>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 space-y-3">
                <h4 class="font-semibold text-primary flex items-center space-x-2">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span>Utilidades del Sistema</span>
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                    <span class="text-secondary text-sm">Mostrar ayuda</span>
                    <kbd class="kbd">Ctrl + /</kbd>
                  </div>
                  <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                    <span class="text-secondary text-sm">Recargar página</span>
                    <kbd class="kbd">Ctrl + R</kbd>
                  </div>
                  <div class="flex justify-between items-center p-3 glass-card-secondary rounded-lg">
                    <span class="text-secondary text-sm">Cerrar modal</span>
                    <kbd class="kbd">Esc</kbd>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 glass-card-secondary rounded-lg">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 mt-0.5">
                    <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-primary mb-1">Consejos de Productividad</p>
                    <p class="text-xs text-secondary">
                      Los atajos de teclado funcionan desde cualquier página de la aplicación y son una forma rápida de navegar sin usar el mouse. Puedes combinar estos atajos con la búsqueda rápida para una experiencia más eficiente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpModal);
  }, []);

  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
      // Only allow help shortcut in input fields
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        showHelp();
      }
      return;
    }

    const key = e.key.toLowerCase();
    let shortcutKey = '';

    if (e.ctrlKey && e.key !== 'Control') {
      shortcutKey = `ctrl+${key}`;
    } else if (key === 'escape') {
      shortcutKey = 'esc';
    }

    if (shortcuts[shortcutKey]) {
      e.preventDefault();
      shortcuts[shortcutKey](e);
    }
  }, [navigate, showHelp]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: Object.keys(shortcuts),
    showHelp
  };
};

export default useKeyboardShortcuts; 