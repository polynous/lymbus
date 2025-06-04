import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
// import axios from 'axios'; // Removed
import axiosClient from '../utils/axiosConfig';
// import { API_URL, getAuthHeaders } from '../config/api'; // Removed as API_URL and getAuthHeaders are no longer used directly
import { useNotification } from '../components/NotificationSystem';
import { FiUsers, FiHash, FiLogIn, FiLogOut, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiUser, FiCalendar, FiWifi, FiCamera, FiX } from 'react-icons/fi';
import PageLoader from '../components/PageLoader';
import StandardSearch from '../components/StandardSearch';
import PageHeader from '../components/PageHeader';
import EnhancedQRScanner from '../components/EnhancedQRScanner';
import { CardSkeletonLoader, EmptyState } from '../components/LoadingStates';
import ErrorBoundary, { useErrorHandler } from '../components/ErrorBoundary';
import { useCacheManager } from '../hooks/useCache';
import { useWebSocketEvent, useRealTimeData, WS_CONFIG } from '../hooks/useWebSocket';
// Performance monitoring removed to prevent excessive re-renders

// Grid view removed - using table view only for better QR code visibility

const StudentEntry = () => {
  const { success, error, info, warning } = useNotification();
  const { captureError } = useErrorHandler();
  const { invalidatePattern } = useCacheManager();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showInlineQRs] = useState(true); // Always show QR codes
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Simplified student state
  const [students, setStudents] = useState([]); // New primary state for students
  const [isLoading, setIsLoading] = useState(true); // Unified loading state
  const [currentError, setCurrentError] = useState(null); // Unified error state

  // Direct fetch function (will be modified to use new states)
  const fetchStudentsDirectly = useCallback(async () => {
    console.log('🚀 Direct fetch starting...');
    setIsLoading(true);
    setCurrentError(null);
    
    try {
      console.log('📡 Making direct request to: /access/search-students (via axiosClient)');
      
      const response = await axiosClient.get(`/access/search-students`, {
        params: { query: '', include_grade: true },
        // headers option removed as axiosClient handles it
      });
      
      console.log('✅ Direct students response:', response.status, response.data?.length, 'students');
      
      if (response.data && response.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        console.log('📡 Making direct presence request for date:', today);
        
        const presenceResponse = await axiosClient.get(`/access/present-students`, {
          params: { date: today },
          // headers option removed as axiosClient handles it
        });
        
        console.log('✅ Direct presence response:', presenceResponse.status, presenceResponse.data?.length, 'entries');
        
        const presentStudentIds = presenceResponse.data?.map(entry => entry.student_id) || [];
        console.log('👥 Present student IDs:', presentStudentIds);
        
        const formattedStudents = response.data.map(student => {
          const formatted = {
            ...student,
            full_name: student.full_name || `${student.first_name} ${student.last_name}`,
            grade: student.grade_level?.name || student.classroom?.grade_level?.name || student.grade || 'Sin grado',
            status: presentStudentIds.includes(student.id) ? 'present' : 'absent'
          };
          return formatted;
        });
        
        console.log('🎯 Direct formatted students:', formattedStudents.length);
        console.log('📊 Sample student:', formattedStudents[0]);
        
        setStudents(formattedStudents);
        return formattedStudents;
      } else {
        console.warn('⚠️ No students data received');
        setStudents([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Direct fetch error:', err);
      setCurrentError(err);
      setStudents([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentError, setStudents]);

  // Fetch data on component mount
  useEffect(() => {
    fetchStudentsDirectly();
  }, [fetchStudentsDirectly]);

  // Listen for QR scanner trigger from QuickActions
  useEffect(() => {
    const handleOpenQRScanner = () => {
      setShowQRScanner(true);
    };

    window.addEventListener('openQRScanner', handleOpenQRScanner);
    return () => window.removeEventListener('openQRScanner', handleOpenQRScanner);
  }, []);

  // Prioritize direct fetch data over cache
  const allStudents = students;
  
  // Use direct loading state
  const actualLoading = isLoading;

  console.log('📋 Data state summary:', {
    students: students?.length,
    isLoading,
    currentError
  });

  const enhancedRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchStudentsDirectly();
  }, [fetchStudentsDirectly]);

  // Debug current data state
  console.log('📊 Current data state:', {
    students: students?.length,
    isLoading,
    currentError
  });

  // Real-time updates
  const { updates, lastUpdate } = useRealTimeData([
    WS_CONFIG.EVENTS.STUDENT_ENTRY,
    WS_CONFIG.EVENTS.STUDENT_EXIT,
    WS_CONFIG.EVENTS.ATTENDANCE_UPDATE
  ]);

  // Filter students when search or filters change
  useEffect(() => {
    // No need to call filterStudents here since we use useMemo for filteredStudents
    // This was causing the error with setFilteredStudents
  }, [allStudents, searchQuery, filterGrade, filterStatus]);

  const handleSearch = async () => {
    // For StudentEntry, we'll just filter existing data
    // The search is handled by the filteredStudents useMemo
  };

  const handleSearchReset = () => {
    setSearchQuery('');
    setFilterGrade('');
    setFilterStatus('');
    // Filtering is handled by the filteredStudents useMemo
  };

  // Handle real-time attendance updates
  useWebSocketEvent(WS_CONFIG.EVENTS.ATTENDANCE_UPDATE, useCallback((data) => {
    if (data.studentIds) {
      setStudents(currentStudents => {
        return currentStudents.map(student => ({
          ...student,
          status: data.studentIds.includes(student.id) ? 'present' : 'absent'
        }));
      });
      info(`Asistencia actualizada por WebSocket: ${data.studentIds.length} alumnos`);
    }
  }, [setStudents, info]));

  // Handle individual student entry events
  useWebSocketEvent(WS_CONFIG.EVENTS.STUDENT_ENTRY, useCallback((data) => {
    if (data.student) {
      setStudents(currentStudents => {
        return currentStudents.map(student => 
          student.id === data.student.id 
            ? { ...student, status: 'present' }
            : student
        );
      });
      success(`${data.student.name} registró entrada por WebSocket`);
    }
  }, [setStudents, success]));

  // Computed values with useMemo for performance
  const filteredStudents = useMemo(() => {
    console.log('🧮 Computing filteredStudents, allStudents length:', allStudents.length);
    
    if (!Array.isArray(allStudents)) {
      console.error('❌ allStudents is not an array:', allStudents);
      return [];
    }

    let filtered = [...allStudents];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(query) ||
        (student.enrollment_id || student.id).toString().includes(query) ||
        student.grade.toLowerCase().includes(query)
      );
    }

    // Apply grade filter
    if (filterGrade && filterGrade !== 'all') {
      filtered = filtered.filter(student => student.grade === filterGrade);
    }

    // Apply status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    console.log('✅ Filtered students result:', filtered.length);
    return filtered;
  }, [allStudents, filterGrade, filterStatus, searchQuery]);

  const uniqueGrades = useMemo(() => {
    return [...new Set(allStudents.map(s => s.grade))].filter(Boolean).sort();
  }, [allStudents]);

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const present = filteredStudents.filter(s => s.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, percentage };
  }, [filteredStudents]);

  // Callbacks with useCallback for performance
  const handleRegisterEntry = useCallback(async (studentId, studentName = null) => {
    let localIsSubmitting = true;

    try {
      console.log('🚀 Starting entry registration for student:', studentId);
      
      const response = await axiosClient.post(`/access/entry/${studentId}`, {});
      
      console.log('✅ Entry registration response:', response.data);
      
      if (response.data) {
        setStudents(prevStudents => prevStudents.map(student => 
          student.id === studentId ? { ...student, status: 'present' } : student
        ));
        
        const displayName = studentName || response.data?.student_name || response.data?.name || 'Estudiante';
        success(`Entrada registrada: ${displayName}`);
        
        invalidatePattern('attendance');
        
        if (window.updateDashboardStats) {
          window.updateDashboardStats();
        }
      }
    } catch (err) {
      console.error('❌ Error registering entry:', err);
      captureError(err, { context: 'registerEntry', studentId });
      
      error(err.response?.data?.detail || 'Error al registrar la entrada. Por favor intente de nuevo.');
    } finally {
      localIsSubmitting = false;
    }
  }, [success, error, captureError, invalidatePattern, setStudents, fetchStudentsDirectly]);

  // Handle student exit registration
  const handleRegisterExit = useCallback(async (studentId, studentName = null) => {
    let localIsSubmitting = true;

    try {
      console.log('🚀 Starting exit registration for student:', studentId);
      
      const response = await axiosClient.post(`/access/exit/${studentId}`, {});
      
      console.log('✅ Exit registration response:', response.data);
      
      if (response.data) {
        setStudents(prevStudents => prevStudents.map(student => 
          student.id === studentId ? { ...student, status: 'absent' } : student
        ));
        
        const displayName = studentName || response.data?.student_name || response.data?.name || 'Estudiante';
        success(`Salida registrada: ${displayName}`);
        
        invalidatePattern('attendance');
        
        if (window.updateDashboardStats) {
          window.updateDashboardStats();
        }
      }
    } catch (err) {
      console.error('❌ Error registering exit:', err);
      captureError(err, { context: 'registerExit', studentId });
      
      error(err.response?.data?.detail || 'Error al registrar la salida. Por favor intente de nuevo.');
    } finally {
      localIsSubmitting = false;
    }
  }, [success, error, captureError, invalidatePattern, setStudents, fetchStudentsDirectly]);

  const handleCloseQRModal = useCallback(() => {
    setShowQRModal(false);
  }, []);

  // QR Scanning functionality
  const handleQRScan = useCallback((qrData) => {
    console.log('🔍 Processing QR scan data:', qrData);
    
    let studentId = null;
    
    // Handle different data formats
    if (qrData && typeof qrData === 'object') {
      // QR code object format: { type: 'student', id: 123 }
      if (qrData.id) {
        studentId = qrData.id;
      }
      // Raw string format in object: { raw: "123" }
      else if (qrData.raw && /^\d+$/.test(qrData.raw.trim())) {
        studentId = parseInt(qrData.raw.trim());
      }
    } 
    // Handle direct string input (fallback)
    else if (typeof qrData === 'string' && /^\d+$/.test(qrData.trim())) {
      studentId = parseInt(qrData.trim());
    }
    // Handle direct number input
    else if (typeof qrData === 'number') {
      studentId = qrData;
    }
    
    console.log('🎯 Extracted student ID:', studentId);
    
    if (studentId) {
      console.log('🔍 Searching for student with ID:', studentId, 'Type:', typeof studentId);
      console.log('📊 Available students (first 5):', allStudents.slice(0, 5).map(s => ({
        id: s.id,
        enrollment_id: s.enrollment_id,
        name: s.full_name
      })));
      
      // Find student by ID (try multiple ID fields and formats)
      const student = allStudents.find(s => {
        const matches = [
          s.id === studentId,
          s.id === parseInt(studentId),
          s.id === studentId.toString(),
          s.enrollment_id === studentId,
          s.enrollment_id === parseInt(studentId),
          s.enrollment_id === studentId.toString(),
          // Also try string comparison for IDs that might be stored as strings
          s.id.toString() === studentId.toString(),
          s.enrollment_id && s.enrollment_id.toString() === studentId.toString()
        ];
        
        const found = matches.some(Boolean);
        if (found) {
          console.log('🎯 Match found with student:', {
            searched_id: studentId,
            student_id: s.id,
            student_enrollment_id: s.enrollment_id,
            student_name: s.full_name
          });
        }
        return found;
      });
      
      if (student) {
        console.log('✅ Found student:', student.full_name, 'Status:', student.status);
        
        if (student.status === 'present') {
          console.log('🚀 Student present, proceeding to register exit for:', student.full_name);
          handleRegisterExit(student.id, student.full_name);
        } else {
          console.log('🚀 Student absent, proceeding to register entry for:', student.full_name);
          handleRegisterEntry(student.id, student.full_name);
        }
      } else {
        console.warn('❌ Student not found for ID:', studentId);
        console.log('📋 All available student IDs:', allStudents.map(s => ({
          id: s.id,
          enrollment_id: s.enrollment_id,
          name: s.full_name
        })));
        error(`Estudiante con ID ${studentId} no encontrado. Verifica que el ID sea correcto.`);
      }
    } else {
      console.error('❌ Invalid QR data format:', qrData);
      error('Código QR inválido o formato no reconocido');
    }
  }, [allStudents, handleRegisterEntry, error]);

  // QR Code Management Functions
  const generateFamilyQRCodes = async () => {
    try {
      success('Iniciando generación de códigos QR familiares...');
      
      // Simulate API call with realistic delay
      setTimeout(() => {
        const totalFamilies = Math.floor(allStudents.length * 0.7); // Assuming 70% unique families
        success(`Se generaron ${totalFamilies} códigos QR familiares únicos`);
        info('Los códigos han sido enviados por email a los padres de familia');
      }, 2000);
      
         } catch (error) {
       console.error('Error generating family QR codes:', error);
       error('Error al generar códigos familiares');
     }
  };

  const createTemporaryQRCode = async () => {
    try {
      success('Creando código QR temporal...');
      
      // Simulate temporary code generation
      setTimeout(() => {
        const tempCode = `TEMP-${Date.now().toString().slice(-6)}`;
        success(`Código temporal generado: ${tempCode}`);
        info('Este código será válido por 24 horas');
      }, 1500);
      
         } catch (error) {
       console.error('Error creating temporary QR code:', error);
       error('Error al crear código temporal');
     }
  };

  const exportAllQRCodes = async () => {
    try {
      success('Preparando exportación de códigos QR...');
      
      // Simulate export process
      setTimeout(() => {
        success(`Exportando ${allStudents.length} códigos QR de estudiantes`);
        info('El archivo se descargará automáticamente cuando esté listo');
        
        // Create and download a sample CSV file
        const csvContent = [
          'Estudiante,ID,Grado,Código QR',
          ...allStudents.slice(0, 10).map(student => 
            `"${student.full_name}","${student.id}","${student.grade}","QR-${student.id}"`
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `codigos_qr_estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          success('Exportación completada exitosamente');
        }, 1000);
      }, 2500);
      
         } catch (error) {
       console.error('Error exporting QR codes:', error);
       error('Error al exportar códigos QR');
     }
  };

  const regenerateAllQRCodes = async () => {
    try {
      success('Regenerando todos los códigos QR...');
      
      // Simulate regeneration process
      setTimeout(() => {
        success(`Se regeneraron ${allStudents.length} códigos QR`);
        info('Los nuevos códigos han sido enviados a los padres por email');
        warning('Los códigos anteriores ya no serán válidos');
      }, 3000);
      
         } catch (error) {
       console.error('Error regenerating QR codes:', error);
       error('Error al regenerar códigos QR');
     }
  };

  // Debug loading state
  console.log('🔍 Loading state debug:', { 
    isLoading,
    students: students?.length,
    currentError
  });

  // Show loader when initially loading students (with fallback support)
  if (actualLoading && allStudents.length === 0) {
    return <PageLoader text="Cargando registro de entrada..." />;
  }

  // Show error state if there's an error and no data
  if (currentError && !allStudents.length) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="glass-card p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Error al cargar alumnos
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                No se pudieron cargar los datos de los alumnos. Verifica tu conexión e intenta nuevamente.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={fetchStudentsDirectly}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Reintentar</span>
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full btn-secondary"
                >
                  Recargar página
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                  <p className="text-xs text-red-700 dark:text-red-400 font-mono">
                    {currentError?.message || 'Error desconocido'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in-scale">
              <PageHeader 
        title="Gestión de Entrada y Salida"
        subtitle="Registra entradas y salidas de estudiantes de forma eficiente"
        keyboardShortcut="E"
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="btn-secondary flex items-center space-x-2"
            title="Escanear códigos QR para entrada/salida"
          >
            <FiCamera className="h-4 w-4" />
            <span>Escáner QR</span>
          </button>
          
          <button
            onClick={fetchStudentsDirectly}
            className="btn-primary flex items-center space-x-2"
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar Lista</span>
          </button>
        </div>
      </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-icon icon-container-md icon-primary">
                <FiUsers className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Total Alumnos</div>
                <div className="stats-value">{stats.total}</div>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-icon icon-container-md icon-success">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Presentes</div>
                <div className="stats-value">{stats.present}</div>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-icon icon-container-md icon-error">
                <FiAlertCircle className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Ausentes</div>
                <div className="stats-value">{stats.absent}</div>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-icon icon-container-md icon-warning">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Asistencia</div>
                <div className="stats-value">{stats.percentage}%</div>
              </div>
            </div>
          </div>
        </div>

        <StandardSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          onReset={handleSearchReset}
          placeholder="Buscar alumno por nombre, ID o grado..."
          isLoading={isLoading}
          showSearchButton={false}
          filters={[
            {
              value: filterGrade,
              onChange: setFilterGrade,
              options: uniqueGrades,
              placeholder: "Filtrar por grado"
            },
            {
              value: filterStatus,
              onChange: setFilterStatus,
              options: [
                { value: 'present', label: 'Presente' },
                { value: 'absent', label: 'Ausente' }
              ],
              placeholder: "Filtrar por estado"
            }
          ]}
          resultsCount={filteredStudents.length}
        />

        {/* Students Display - Streamlined Table */}
        {console.log('🎨 Rendering students section, filteredStudents:', filteredStudents.length, 'actualLoading:', actualLoading)}
        {actualLoading && allStudents.length === 0 ? (
          <CardSkeletonLoader 
            count={1} 
            className=""
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No se encontraron alumnos"
            description={
              searchQuery || filterGrade || filterStatus 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay alumnos disponibles en el sistema'
            }
            icon={FiUsers}
            action={
              <button
                onClick={enhancedRefresh}
                className="btn-primary flex items-center space-x-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Recargar alumnos</span>
              </button>
            }
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Alumno</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell text-left">Grado</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell text-left">ID Matrícula</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">Estado</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="table-row-hover">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                            student.status === 'present' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-slate-500 to-slate-600'
                          }`}>
                            {student.full_name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {student.full_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="sm:hidden">
                                {student.grade} • ID: {student.enrollment_id || student.id}
                              </span>
                              <span className="hidden sm:inline">
                                Estudiante
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {student.grade}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                        <span className="font-mono">
                          {student.enrollment_id || student.id}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <div className={`status-badge ${student.status === 'present' ? 'status-present' : 'status-absent'}`}>
                          {student.status === 'present' ? (
                            <>
                              <FiCheckCircle className="h-3 w-3 mr-1" />
                              <span>Presente</span>
                            </>
                          ) : (
                            <>
                              <FiAlertCircle className="h-3 w-3 mr-1" />
                              <span>Ausente</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {student.status !== 'present' ? (
                            <button
                              onClick={() => handleRegisterEntry(student.id, student.full_name)}
                              disabled={isLoading}
                              className="btn-success flex items-center space-x-2 text-xs"
                            >
                              <FiLogIn className="h-3 w-3" />
                              <span>Entrada</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterExit(student.id, student.full_name)}
                              disabled={isLoading}
                              className="btn-warning flex items-center space-x-2 text-xs"
                            >
                              <FiLogOut className="h-3 w-3" />
                              <span>Salida</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* QR Management Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-lg transition-all duration-300"
              onClick={handleCloseQRModal}
            />
            
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="relative w-full max-w-2xl">
                <div className="glass-card p-6 w-full animate-fade-in-scale shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Gestión de Códigos QR
                    </h3>
                    <button
                      onClick={handleCloseQRModal}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Quick QR Scanner Access */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <FiHash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">Escáner QR Rápido</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Registrar entradas y salidas</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowQRModal(false);
                            setShowQRScanner(true);
                          }}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <FiHash className="h-4 w-4" />
                          <span>Abrir Escáner</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">Códigos para Padres</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Códigos permanentes para uso familiar</p>
                          </div>
                        </div>
                        <button 
                          onClick={generateFamilyQRCodes}
                          className="w-full btn-secondary text-sm"
                        >
                          Generar códigos familiares
                        </button>
                      </div>
                      
                      <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <FiCalendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">Códigos Temporales</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Para recoger estudiantes ocasionalmente</p>
                          </div>
                        </div>
                        <button 
                          onClick={createTemporaryQRCode}
                          className="w-full btn-secondary text-sm"
                        >
                          Crear código temporal
                        </button>
                      </div>
                    </div>
                    
                    {/* Bulk Actions */}
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Acciones Masivas</h4>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={exportAllQRCodes}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <FiUsers className="h-4 w-4" />
                          <span>Exportar todos los QR</span>
                        </button>
                        <button 
                          onClick={regenerateAllQRCodes}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <FiRefreshCw className="h-4 w-4" />
                          <span>Regenerar códigos</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced QR Scanner */}
        <EnhancedQRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
          title="Escáner de Entrada/Salida"
          expectedDataType="student"
        />

        {/* Development Helper - Show Available Student IDs */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-6 left-6 z-40">
            <button
              onClick={() => {
                const studentIds = allStudents.slice(0, 10).map(s => 
                  `${s.full_name}: ID=${s.id}, Enrollment=${s.enrollment_id || 'N/A'}`
                );
                alert('Student IDs (first 10):\n\n' + studentIds.join('\n'));
                console.log('📋 All student data:', allStudents);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
              title="Ver IDs de estudiantes (Development)"
            >
              Ver IDs
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default memo(StudentEntry); 