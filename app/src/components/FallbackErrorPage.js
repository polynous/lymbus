import React from 'react';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const FallbackErrorPage = ({ error, resetError }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const goBack = () => {
    navigate(-1);
  };
  
  const reload = () => {
    window.location.reload();
  };

  return (
    <div className={`p-8 mx-auto max-w-2xl text-center ${
      darkMode ? 'text-slate-300' : 'text-gray-800'
    }`}>
      <div className="flex justify-center mb-6">
        <FiAlertTriangle className={`h-16 w-16 ${
          darkMode ? 'text-amber-400' : 'text-amber-500'
        }`} />
      </div>
      
      <h1 className={`text-2xl font-bold mb-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        No se pudo cargar la página
      </h1>
      
      <p className="mb-6">
        Ocurrió un error al intentar cargar esta información. Por favor, intente de nuevo o vuelva a la página anterior.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={goBack}
          className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
            darkMode 
              ? 'bg-slate-700 hover:bg-slate-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          <FiArrowLeft className="mr-2 h-4 w-4" /> Volver
        </button>
        
        <button
          onClick={reload}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Intentar de nuevo
        </button>
      </div>
      
      {error && import.meta.env.NODE_ENV === 'development' && (
        <div className={`mt-8 p-4 text-left rounded-md overflow-auto ${
          darkMode ? 'bg-slate-800' : 'bg-gray-100'
        }`}>
          <h3 className="text-lg font-medium mb-2">Información del error:</h3>
          <pre className="text-sm">
            {error.toString()}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FallbackErrorPage; 