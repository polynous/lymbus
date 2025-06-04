import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';
import axiosClient from '../utils/axiosConfig';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiList
} from 'react-icons/fi';
import PageLoader from '../components/PageLoader';
import PageHeader from '../components/PageHeader';

const Attendance = () => {
  const { user } = useAuth();
  const { success, error, info } = useNotification();
  
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    averageArrivalTime: '',
    attendanceRate: 0
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const response = await axiosClient.get('/students'); 
        setStudents(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedStudent(response.data[0]); 
        } else {
          info('No se encontraron estudiantes para mostrar asistencia.');
          setSelectedStudent(null);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        error(err.response?.data?.detail || 'Error al cargar lista de estudiantes.');
        setStudents([]);
        setSelectedStudent(null);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [error, info]);

  const fetchAttendanceRecords = useCallback(async () => {
    if (!selectedStudent) {
      setAttendanceData([]);
      return;
    }
    setIsLoadingAttendance(true);
    try {
      const params = {
        student_id: selectedStudent.id,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      };
      if (filterType !== 'all') {
        params.status = filterType;
      }
      const response = await axiosClient.get('/attendance', { params });
      setAttendanceData(response.data || []);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      error(err.response?.data?.detail || 'Error al cargar datos de asistencia.');
      setAttendanceData([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedStudent, dateRange, filterType, error]);

  useEffect(() => {
    if (selectedStudent) { 
      fetchAttendanceRecords();
    } else {
      setAttendanceData([]);
    }
  }, [selectedStudent, dateRange, filterType, fetchAttendanceRecords]);

  useEffect(() => {
    if (isLoadingStudents || isLoadingAttendance) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isLoadingStudents, isLoadingAttendance]);

  const calculateStats = useCallback((data, studentId) => {
    if (!studentId || !data || data.length === 0) {
      setStats({ totalDays: 0, presentDays: 0, absentDays: 0, averageArrivalTime: '', attendanceRate: 0 });
      return;
    }

    const studentData = data.filter(record => record.student_id === studentId);
    const totalDays = studentData.length;
    const presentDays = studentData.filter(record => record.status === 'present' || record.status === 'late').length;
    const absentDays = studentData.filter(record => record.status === 'absent').length;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    const arrivalTimes = studentData
      .filter(record => record.entry_time)
      .map(record => {
        const [hours, minutes] = record.entry_time.split(':').map(Number);
        return hours * 60 + minutes;
      });

    let averageArrivalTime = '';
    if (arrivalTimes.length > 0) {
      const avgMinutes = arrivalTimes.reduce((sum, time) => sum + time, 0) / arrivalTimes.length;
      const hours = Math.floor(avgMinutes / 60);
      const minutes = Math.round(avgMinutes % 60);
      averageArrivalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    setStats({
      totalDays,
      presentDays,
      absentDays,
      averageArrivalTime,
      attendanceRate: parseFloat(attendanceRate)
    });
  }, []);

  useEffect(() => {
    if (selectedStudent) {
        if (!isLoadingAttendance && attendanceData.length === 0) {
            setStats({ totalDays: 0, presentDays: 0, absentDays: 0, averageArrivalTime: '', attendanceRate: 0 });
        } else if (attendanceData && attendanceData.length > 0) {
            calculateStats(attendanceData, selectedStudent.id);
        }
    } else {
        setStats({ totalDays: 0, presentDays: 0, absentDays: 0, averageArrivalTime: '', attendanceRate: 0 });
    }
  }, [attendanceData, selectedStudent, isLoadingAttendance, calculateStats]);

  const gradeAttendance = useMemo(() => {
    console.warn("Grade attendance data is currently mocked.");
    const gradeData = {
      'Kínder 1A': { total: 30, present: 28 },
      'Kínder 1B': { total: 30, present: 27 },
      'Kínder 2A': { total: 32, present: 30 },
      'Kínder 2B': { total: 32, present: 29 },
      '1° Grado A': { total: 34, present: 32 },
      '1° Grado B': { total: 34, present: 31 },
      '2° Grado A': { total: 36, present: 34 },
      '2° Grado B': { total: 36, present: 33 },
      '3° Grado': { total: 36, present: 32 }
    };
    return gradeData;
  }, []);

  const filteredData = useMemo(() => {
    if (!selectedStudent) return [];
    return attendanceData.filter(record => record.student_id === selectedStudent.id);
  }, [attendanceData, selectedStudent]);

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    setSelectedStudent(student);
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterTypeChange = (newFilterType) => {
    setFilterType(newFilterType);
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      error("No hay datos para exportar.");
      return;
    }
    console.log("Exporting data (simulated):", filteredData);
    success('Datos de asistencia listos para exportar (simulado).');
    // TODO: Implement actual data export (e.g., CSV generation/download)
  };

  const handleRefresh = useCallback(async () => {
    info('Actualizando datos...');
    setIsLoading(true); // Indicate overall loading
    setIsLoadingStudents(true); // Specifically for student fetching part
    let currentSelectedStudentId = selectedStudent?.id;

    try {
      const studentResponse = await axiosClient.get('/students');
      const fetchedStudents = studentResponse.data || [];
      setStudents(fetchedStudents);

      if (fetchedStudents.length > 0) {
        const studentToSelect = fetchedStudents.find(s => s.id === currentSelectedStudentId) || fetchedStudents[0];
        setSelectedStudent(studentToSelect);
        // Note: If setSelectedStudent triggers fetchAttendanceRecords via useEffect,
        // we might not need to call it explicitly here unless student didn't change but we still want a refresh.
        // However, explicit call ensures data is fetched even if student selection remains same.
        if (studentToSelect) { // Ensure a student is actually selected before fetching attendance
            await fetchAttendanceRecords(); // Re-fetch attendance for the selected student
        }
      } else {
        setSelectedStudent(null);
        setAttendanceData([]); // Clear attendance if no students
        info('No se encontraron estudiantes.');
      }
      success('Datos actualizados.');
    } catch (err) {
      console.error('Error refreshing data:', err);
      error(err.response?.data?.detail || 'Error al actualizar los datos.');
    } finally {
      setIsLoadingStudents(false);
      // setIsLoadingAttendance is handled by fetchAttendanceRecords itself
      // The main isLoading will be updated by its own useEffect watching isLoadingStudents and isLoadingAttendance
    }
  }, [selectedStudent, fetchAttendanceRecords, success, error, info]); // Removed setIsLoading etc as they are stable

  const getStatusBadge = (status) => {
    const badges = {
      present: { class: 'status-present', icon: FiCheckCircle, text: 'Presente' },
      late: { class: 'status-warning', icon: FiAlertCircle, text: 'Tardía' },
      absent: { class: 'status-absent', icon: FiXCircle, text: 'Ausente' }
    };
    
    const badge = badges[status] || badges.absent;
    const IconComponent = badge.icon;
    
    return (
      <span className={`status-badge ${badge.class} flex items-center space-x-1`}>
        <IconComponent className="h-3 w-3" />
        <span>{badge.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.slice(0, 5);
  };

  if (isLoading) {
    return <PageLoader text="Cargando historial de asistencia..." />;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="icon-container icon-container-lg icon-primary">
              <FiClock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Historial de Asistencia
              </h1>
              <p className="text-secondary">Revisa el registro de asistencia de tus hijos</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200"
              title="Actualizar datos"
            >
              <FiRefreshCw className={`h-5 w-5 text-muted ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleExport}
              className="btn-primary flex items-center space-x-2"
            >
              <FiDownload className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Estudiante
            </label>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="glass-input w-full"
              disabled={isLoadingStudents || students.length === 0}
            >
              {isLoadingStudents ? (
                <option>Cargando estudiantes...</option>
              ) : students.length === 0 ? (
                <option>No hay estudiantes</option>
              ) : (
                students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name || `${student.first_name} ${student.last_name}`}
                    {student.grade ? ` - ${student.grade}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Filtrar por
            </label>
            <select
              value={filterType}
              onChange={(e) => handleFilterTypeChange(e.target.value)}
              className="glass-input w-full"
              disabled={isLoading || !selectedStudent}
            >
              <option value="all">Todos</option>
              <option value="present">Presente</option>
              <option value="late">Tardía</option>
              <option value="absent">Ausente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Fecha inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="glass-input w-full"
              disabled={isLoading || !selectedStudent}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Fecha fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="glass-input w-full"
              disabled={isLoading || !selectedStudent}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10 dark:border-slate-700/30">
          <div className="flex items-center space-x-2">
            <FiFilter className="h-4 w-4 text-muted" />
            <span className="text-sm text-secondary">
              {filteredData.length} registros encontrados
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                  : 'text-muted hover:bg-white/20 dark:hover:bg-slate-700/30'
              }`}
            >
              <FiActivity className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'chart' 
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                  : 'text-muted hover:bg-white/20 dark:hover:bg-slate-700/30'
              }`}
            >
              <FiBarChart2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="stats-content">
              <div className="icon-container icon-container-md icon-primary stats-icon">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Total de Días</div>
                <div className="stats-value">{stats.totalDays}</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="icon-container icon-container-md icon-success stats-icon">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Días Presente</div>
                <div className="stats-value">{stats.presentDays}</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="icon-container icon-container-md icon-error stats-icon">
                <FiXCircle className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">Días Ausente</div>
                <div className="stats-value">{stats.absentDays}</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="icon-container icon-container-md icon-warning stats-icon">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div className="stats-info">
                <div className="stats-title">% Asistencia</div>
                <div className="stats-value">{stats.attendanceRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <PageLoader size="lg" text="Cargando asistencia..." />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center p-12">
              <div className="icon-container icon-container-lg icon-secondary mx-auto mb-4">
                <FiCalendar className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No hay registros de asistencia
              </h3>
              <p className="text-secondary">
                {selectedStudent 
                  ? `No se encontraron registros para ${selectedStudent.name} con los filtros aplicados.`
                  : 'Selecciona un estudiante para ver su asistencia.'
                }
              </p>
            </div>
          ) : (
            <div className="modern-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Fecha</th>
                    <th className="text-left">Estado</th>
                    <th className="text-left">Hora Entrada</th>
                    <th className="text-left">Hora Salida</th>
                    <th className="text-left">Notas</th>
                    <th className="text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => (
                    <tr key={record.id} className="table-row-hover border-b border-white/5 dark:border-slate-700/30">
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-primary">
                            {formatDate(record.date)}
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-4">
                        <span className="text-secondary">
                          {formatTime(record.entry_time)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-secondary">
                          {formatTime(record.exit_time)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-secondary text-sm">
                          {record.notes || 'Sin notas'}
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200">
                          <FiEye className="h-4 w-4 text-muted" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Análisis de Asistencia
            </h3>
            <p className="text-secondary">
              Visualización de datos de asistencia por grado y tendencias
            </p>
          </div>
          
          <div className="mb-8">
            <h4 className="font-medium text-primary mb-4">Asistencia por Grado</h4>
            <div className="space-y-3">
              {Object.entries(gradeAttendance).map(([grade, data]) => {
                const percentage = ((data.present / data.total) * 100);
                return (
                  <div key={grade} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-secondary">{grade}</div>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-secondary text-right">
                      {data.present}/{data.total}
                    </div>
                    <div className="w-12 text-sm font-medium text-primary text-right">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mb-8">
            <h4 className="font-medium text-primary mb-4">Tendencia de la Semana</h4>
            <div className="flex items-end space-x-4 h-32">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, index) => {
                const height = Math.random() * 80 + 20;
                const value = Math.floor(height * 3.3);
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-lg relative overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-1000 ease-out"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-secondary mt-2">{day}</div>
                    <div className="text-xs text-muted">{value}%</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card-secondary p-4 text-center">
              <div className="icon-container icon-container-md icon-success mx-auto mb-2">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.averageArrivalTime}</div>
              <div className="text-sm text-secondary">Hora promedio de llegada</div>
            </div>
            
            <div className="glass-card-secondary p-4 text-center">
              <div className="icon-container icon-container-md icon-warning mx-auto mb-2">
                <FiClock className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.lateArrivals || 0}</div>
              <div className="text-sm text-secondary">Llegadas tardías hoy</div>
            </div>
            
            <div className="glass-card-secondary p-4 text-center">
              <div className="icon-container icon-container-md icon-primary mx-auto mb-2">
                <FiBarChart2 className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.attendanceRate}%</div>
              <div className="text-sm text-secondary">Tasa de asistencia</div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => setViewMode('list')}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiList className="h-4 w-4" />
              <span>Ver Lista</span>
            </button>
          </div>
        </div>
      )}

      {selectedStudent && stats.averageArrivalTime && (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="icon-container icon-container-md icon-secondary">
              <FiUser className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-primary">
              Resumen de {selectedStudent.name}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card-secondary p-4">
              <h4 className="text-sm font-medium text-secondary mb-2">Información Académica</h4>
              <div className="space-y-1">
                <p className="text-sm text-primary">Grado: <span className="font-medium">{selectedStudent.grade}</span></p>
                <p className="text-sm text-primary">Salón: <span className="font-medium">{selectedStudent.classroom}</span></p>
              </div>
            </div>
            
            <div className="glass-card-secondary p-4">
              <h4 className="text-sm font-medium text-secondary mb-2">Puntualidad</h4>
              <div className="space-y-1">
                <p className="text-sm text-primary">Hora promedio: <span className="font-medium">{stats.averageArrivalTime}</span></p>
                <p className="text-sm text-primary">Meta escolar: <span className="font-medium">08:00</span></p>
              </div>
            </div>
            
            <div className="glass-card-secondary p-4">
              <h4 className="text-sm font-medium text-secondary mb-2">Rendimiento</h4>
              <div className="space-y-1">
                <p className="text-sm text-primary">
                  Asistencia: 
                  <span className={`font-medium ml-1 ${
                    stats.attendanceRate >= 95 ? 'text-success-600 dark:text-success-400' :
                    stats.attendanceRate >= 85 ? 'text-warning-600 dark:text-warning-400' :
                    'text-error-600 dark:text-error-400'
                  }`}>
                    {stats.attendanceRate >= 95 ? 'Excelente' :
                     stats.attendanceRate >= 85 ? 'Bueno' : 'Necesita Mejorar'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance; 