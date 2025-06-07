import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosConfig';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { FiUsers, FiHash, FiCalendar, FiClock, FiChevronRight } from 'react-icons/fi';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the specific endpoint for guardian's students
        const response = await axiosClient.get('/access/guardian/students');
        
        if (response.data) {
          setStudents(response.data);
          if (response.data.length === 0) {
            // setError('No tienes alumnos asociados a tu cuenta.'); // Or an info message
          }
        } else {
          setStudents([]);
          // setError('No se pudo obtener la lista de alumnos.');
        }
      } catch (err) {
        console.error('Error fetching guardian students:', err);
        let errorMessage = 'No se pudieron cargar los alumnos. Por favor, intenta de nuevo más tarde.';
        if (err.response?.status === 404) {
            errorMessage = 'No se encontraron alumnos asociados a tu cuenta. Si crees que esto es un error, contacta a soporte.';
        } else if (err.response?.data?.detail) {
            errorMessage = err.response.data.detail;
        }
        setError(errorMessage);
        setStudents([]); // Clear students on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []); // Empty dependency array, runs once on mount

  return (
    <div>
      <PageHeader
        title="Panel de Familia"
        subtitle={`Bienvenido, ${user?.first_name}. Aquí puedes ver a tus alumnos y gestionar sus códigos QR.`}
        keyboardShortcut="H"
      />

      {error && (
        <div className={`mb-4 p-4 rounded-md ${
          darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
        }`}>
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* alumnos asociados */}
          <GlassCard className="mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className={`text-lg leading-6 font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Mis alumnos
              </h3>
              <p className={`mt-1 max-w-2xl text-sm ${
                darkMode ? 'text-slate-300' : 'text-gray-500'
              }`}>
                alumnos asociados a tu cuenta.
              </p>
            </div>
            <div className={`border-t ${
              darkMode ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              {students.length > 0 ? (
                <ul className={`divide-y ${
                  darkMode ? 'divide-slate-700/50' : 'divide-slate-200/50'
                }`}>
                  {students.map((student) => (
                    <li key={student.id}>
                      <Link 
                        to={`/app/student/${student.id}`} 
                        className={`block px-4 py-4 sm:px-6 transition-colors duration-200 ${
                          darkMode 
                            ? 'hover:bg-slate-700/50' 
                            : 'hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                            }`}>
                              <FiUsers className={`h-6 w-6 ${
                                darkMode ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {student.full_name || `${student.first_name} ${student.last_name}`}
                              </div>
                              <div className={`text-sm ${
                                darkMode ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                ID: {student.enrollment_id || student.id}
                              </div>
                            </div>
                          </div>
                          <FiChevronRight className={`h-5 w-5 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`px-4 py-5 sm:px-6 text-center ${
                  darkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  No hay alumnos asociados a tu cuenta.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Acciones rápidas */}
          <GlassCard className="mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className={`text-lg leading-6 font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Acciones rápidas
              </h3>
              <p className={`mt-1 max-w-2xl text-sm ${
                darkMode ? 'text-slate-300' : 'text-gray-500'
              }`}>
                Gestiona códigos QR y ve el historial de asistencia.
              </p>
            </div>
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 px-4 py-5 sm:p-6 border-t ${
              darkMode ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              <Link
                to="/app/configuracion"
                className="flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                                  <FiHash className="mr-2 h-5 w-5" />
                Configuración
              </Link>
              
              <Link
                to="/app/asistencia"
                className="flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FiClock className="mr-2 h-5 w-5" />
                Ver Asistencia
              </Link>
            </div>
          </GlassCard>

          {/* Fecha actual */}
          <GlassCard>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${
                  darkMode ? 'bg-slate-700/50' : 'bg-gray-100'
                }`}>
                  <FiCalendar className={`h-6 w-6 ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium truncate ${
                      darkMode ? 'text-slate-300' : 'text-gray-500'
                    }`}>
                      Fecha actual
                    </dt>
                    <dd>
                      <div className={`text-lg font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date().toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default ParentDashboard; 