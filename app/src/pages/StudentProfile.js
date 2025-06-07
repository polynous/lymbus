import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiUser, 
  FiCalendar, 
  FiBook, 
  FiPhone, 
  FiHome, 
  FiActivity,
  FiUsers,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiClipboard,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiCamera,
  FiToggleLeft,
  FiToggleRight,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import ErrorBoundary from '../components/ErrorBoundary';
import FallbackErrorPage from '../components/FallbackErrorPage';
import axiosClient from '../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sanitizeData } from '../utils/safeDataUtils';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';

// We'll create a wrapper component that utilizes the ErrorBoundary
const StudentProfileWrapper = () => {
  return (
    <ErrorBoundary fallback={(error) => <FallbackErrorPage error={error} />}>
      <StudentProfile />
    </ErrorBoundary>
  );
};

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [student, setStudent] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [error, setError] = useState(null);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student details directly with axiosClient
        const studentResponse = await axiosClient.get(`/access/student/${studentId}`);
        setStudent(studentResponse.data);
        
        // Fetch guardians directly with axiosClient
        const guardiansResponse = await axiosClient.get(`/access/student/${studentId}/guardians`);
        setGuardians(guardiansResponse.data || []);
        
        // Fetch access logs directly with axiosClient
        const logsResponse = await axiosClient.get(`/access/student/${studentId}/logs`, {
          params: { limit: 50, offset: 0 }
        });
        setAccessLogs(logsResponse.data);
        
      } catch (err) {
        console.error('Error fetching student data:', err);
        
        let errorMessage = 'No se pudo cargar la información del alumno. Por favor, intente de nuevo.';
        
        if (err.response) {
          // The request was made and the server responded with an error status code
          if (err.response.status === 404) {
            errorMessage = 'alumno no encontrado.';
          } else if (err.response.status === 403) {
            errorMessage = 'No tienes permiso para ver este alumno.';
          } else if (err.response.data && err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No se pudo conectar con el servidor. Comprueba tu conexión a internet.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [studentId]);

  const goBack = () => {
    navigate(-1);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      return format(new Date(dateString), 'p', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const getAccessTypeIcon = (type) => {
    switch(type) {
      case 'ENTRADA':
        return <FiLogIn className="text-green-500" />;
      case 'SALIDA':
        return <FiLogOut className="text-red-500" />;
      default:
        return <FiActivity />;
    }
  };

  const getStatusBadgeClass = (type) => {
    if (type === 'ENTRADA') {
      return darkMode 
        ? 'bg-green-900/50 text-green-200' 
        : 'bg-green-100 text-green-800';
    } else {
      return darkMode 
        ? 'bg-red-900/50 text-red-200' 
        : 'bg-red-100 text-red-800';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`p-4 rounded-md ${
        darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
      }`}>
        <p>{error}</p>
        <button 
          onClick={goBack}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiArrowLeft className="mr-2" /> Volver
        </button>
      </div>
    );
  }
  
  // Render no data state
  if (!student) {
    return (
      <div className={`p-4 rounded-md ${
        darkMode ? 'bg-yellow-900/50 text-yellow-200' : 'bg-yellow-50 text-yellow-700'
      }`}>
        <p>No se encontró información del alumno.</p>
        <button 
          onClick={goBack}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiArrowLeft className="mr-2" /> Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-8 flex items-center">
        <button 
          onClick={goBack}
          className={`mr-4 p-2 rounded-full ${
            darkMode 
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Perfil de alumno
          </h1>
          <p className={`mt-1 text-sm ${
            darkMode ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Información detallada sobre {typeof student.full_name === 'object' ? 'alumno' : (student.full_name || `${student.first_name || ''} ${student.last_name || ''}`)}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'info'
                  ? darkMode
                    ? 'text-blue-500 border-blue-500'
                    : 'text-blue-600 border-blue-600'
                  : darkMode
                    ? 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-700'
                    : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FiUser className="mr-2 w-4 h-4" />
              Información
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('guardians')}
              className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'guardians'
                  ? darkMode
                    ? 'text-blue-500 border-blue-500'
                    : 'text-blue-600 border-blue-600'
                  : darkMode
                    ? 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-700'
                    : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FiUsers className="mr-2 w-4 h-4" />
              Tutores
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {guardians.length}
              </span>
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'logs'
                  ? darkMode
                    ? 'text-blue-500 border-blue-500'
                    : 'text-blue-600 border-blue-600'
                  : darkMode
                    ? 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-700'
                    : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FiClock className="mr-2 w-4 h-4" />
              Registros
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {accessLogs.length}
              </span>
            </button>
          </li>
        </ul>
      </div>

      {/* Content for each tab */}
      {activeTab === 'info' && (
        <GlassCard>
          <div className="px-4 py-5 sm:px-6">
            <h3 className={`text-lg leading-6 font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Información del alumno
            </h3>
            <p className={`mt-1 max-w-2xl text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-500'
            }`}>
              Detalles personales y académicos.
            </p>
          </div>
          <div className={`border-t ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            <dl>
              <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                darkMode ? 'bg-slate-800/50' : 'bg-gray-50'
              }`}>
                <dt className={`text-sm font-medium ${
                  darkMode ? 'text-slate-300' : 'text-gray-500'
                }`}>
                  <FiUser className="inline mr-1" /> Nombre completo
                </dt>
                <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {typeof student.full_name === 'object' ? `${student.first_name || ''} ${student.last_name || ''}` : (student.full_name || `${student.first_name || ''} ${student.last_name || ''}`)}
                </dd>
              </div>
              <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                darkMode ? '' : 'bg-white'
              }`}>
                <dt className={`text-sm font-medium ${
                  darkMode ? 'text-slate-300' : 'text-gray-500'
                }`}>
                  <FiBook className="inline mr-1" /> ID de matrícula
                </dt>
                <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {typeof student.enrollment_id === 'object' ? 'No disponible' : student.enrollment_id}
                </dd>
              </div>
              <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                darkMode ? 'bg-slate-800/50' : 'bg-gray-50'
              }`}>
                <dt className={`text-sm font-medium ${
                  darkMode ? 'text-slate-300' : 'text-gray-500'
                }`}>
                  <FiCalendar className="inline mr-1" /> Fecha de nacimiento
                </dt>
                <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {student.date_of_birth && typeof student.date_of_birth !== 'object' ? formatDate(student.date_of_birth) : 'No disponible'}
                </dd>
              </div>
              <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                darkMode ? '' : 'bg-white'
              }`}>
                <dt className={`text-sm font-medium ${
                  darkMode ? 'text-slate-300' : 'text-gray-500'
                }`}>
                  <FiActivity className="inline mr-1" /> Género
                </dt>
                <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {typeof student.gender === 'object' ? 'No especificado' : (student.gender || 'No especificado')}
                </dd>
              </div>
              {student.classroom && (
                <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                  darkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                }`}>
                  <dt className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-gray-500'
                  }`}>
                    <FiBook className="inline mr-1" /> Aula / Grado
                  </dt>
                  <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {(() => {
                      try {
                        // Check if classroom or classroom.name are objects
                        if (!student.classroom || typeof student.classroom === 'object' && !student.classroom.name) {
                          return 'Información no disponible';
                        }
                        
                        const className = typeof student.classroom.name === 'object' ? 'Aula' : student.classroom.name;
                        
                        // Safely check for grade level name
                        let gradeLevelText = '';
                        if (student.classroom?.grade_level?.name && 
                            typeof student.classroom.grade_level.name !== 'object') {
                          gradeLevelText = ` - ${student.classroom.grade_level.name}`;
                        }
                        
                        return className + gradeLevelText;
                      } catch (err) {
                        console.error('Error rendering classroom data:', err);
                        return 'Información no disponible';
                      }
                    })()}
                  </dd>
                </div>
              )}
              {student.medical_notes && (
                <div className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                  darkMode ? '' : 'bg-white'
                }`}>
                  <dt className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-gray-500'
                  }`}>
                    <FiActivity className="inline mr-1" /> Notas médicas
                  </dt>
                  <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {typeof student.medical_notes === 'object' ? 'No disponible' : (student.medical_notes || 'No disponible')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </GlassCard>
      )}

      {activeTab === 'guardians' && (
        <GlassCard>
          <div className="px-4 py-5 sm:px-6">
            <h3 className={`text-lg leading-6 font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Tutores del alumno
            </h3>
            <p className={`mt-1 max-w-2xl text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-500'
            }`}>
              Información de contacto de los tutores asociados a {typeof student.first_name === 'object' ? 'alumno' : student.first_name || 'alumno'}.
            </p>
          </div>
          <div className={`border-t ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            {guardians.length > 0 ? (
              <div className="divide-y dark:divide-slate-700/50">
                {guardians.map((guardian, index) => (
                  <div key={guardian.id} className={`px-4 py-5 ${
                    index % 2 === 0 
                      ? darkMode ? 'bg-slate-800/50' : 'bg-gray-50' 
                      : darkMode ? '' : 'bg-white'
                  }`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-slate-700' : 'bg-gray-200'
                      }`}>
                        <FiUser className={`h-6 w-6 ${
                          darkMode ? 'text-slate-300' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="ml-4">
                        <h4 className={`text-lg font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {typeof guardian.full_name === 'object' ? 'Tutor' : guardian.full_name}
                        </h4>
                        <p className={`text-sm ${
                          darkMode ? 'text-slate-300' : 'text-gray-500'
                        }`}>
                          {typeof guardian.relationship === 'object' ? 'Relación no especificada' : guardian.relationship}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-1">
                          <div className="flex items-center">
                            <FiPhone className={`mr-2 ${
                              darkMode ? 'text-slate-400' : 'text-gray-500'
                            }`} />
                            <span className={
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }>
                              {typeof guardian.phone === 'object' ? 'No disponible' : (guardian.phone || 'No disponible')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FiHome className={`mr-2 ${
                              darkMode ? 'text-slate-400' : 'text-gray-500'
                            }`} />
                            <span className={
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }>
                              {typeof guardian.email === 'object' ? 'No disponible' : (guardian.email || 'No disponible')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`px-4 py-5 text-center ${
                darkMode ? 'text-slate-300' : 'text-gray-500'
              }`}>
                No hay tutores asociados a este alumno.
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {activeTab === 'logs' && (
        <GlassCard>
          <div className="px-4 py-5 sm:px-6">
            <h3 className={`text-lg leading-6 font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Historial de Accesos
            </h3>
            <p className={`mt-1 max-w-2xl text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-500'
            }`}>
              Registros de entrada y salida.
            </p>
          </div>
          <div className={`border-t ${
            darkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            {accessLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${
                  darkMode ? 'divide-slate-700/50' : 'divide-gray-200'
                }`}>
                  <thead className={darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        Tipo
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        Fecha
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        Hora
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        Autorizado por
                      </th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    darkMode ? 'divide-slate-700/50' : 'divide-gray-200'
                  }`}>
                    {accessLogs.map((log) => (
                      <tr key={log.id} className={darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 whitespace-nowrap ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="flex items-center">
                            {getAccessTypeIcon(log.type)} 
                            <span className="ml-2">
                              {log.type === 'ENTRADA' ? 'Entrada' : log.type === 'SALIDA' ? 'Salida' : (typeof log.type === 'object' ? 'Desconocido' : log.type)}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-slate-300' : 'text-gray-500'
                        }`}>
                          {log.timestamp && typeof log.timestamp !== 'object' ? formatDate(log.timestamp) : 'Fecha no disponible'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-slate-300' : 'text-gray-500'
                        }`}>
                          {log.timestamp && typeof log.timestamp !== 'object' ? formatTime(log.timestamp) : 'Hora no disponible'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-slate-300' : 'text-gray-500'
                        }`}>
                          {log.picked_up_by ? 
                            (typeof log.picked_up_by === 'object' && log.picked_up_by.full_name && typeof log.picked_up_by.full_name !== 'object' ? 
                              log.picked_up_by.full_name : 'Contacto') : 
                            (typeof log.authorized_by === 'object' ? 'Personal autorizado' : log.authorized_by || 'No especificado')}
                        </td>
                        <td className={`px-6 py-4 text-sm ${
                          darkMode ? 'text-slate-300' : 'text-gray-500'
                        }`}>
                          {typeof log.notes === 'object' ? '-' : (log.notes || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`px-4 py-5 text-center ${
                darkMode ? 'text-slate-300' : 'text-gray-500'
              }`}>
                No hay registros de acceso para este alumno.
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default StudentProfileWrapper;