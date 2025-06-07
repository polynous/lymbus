import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosConfig';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';
import TimeSettingsDropdown from '../components/TimeSettingsDropdown';
import { 
  FiUsers, 
  FiCalendar, 
  FiArrowRight, 
  FiArrowLeft, 
  FiLogIn,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiTarget,
  FiAward,
  FiAlertTriangle,
  FiSettings
} from 'react-icons/fi';
import PageLoader from '../components/PageLoader';
import PageHeader from '../components/PageHeader';
import PickupWorkflowDemo from '../components/PickupWorkflowDemo';
import { mockGradeStats, getTotalStats } from '../mocks/mockData';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error, info } = useNotification();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalEntries: 0,
    totalExits: 0,
    attendanceRate: 0,
    gradeStats: [],
    peakEntryTime: '',
    peakExitTime: '',
    lateArrivals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [schoolTimes, setSchoolTimes] = useState({
    startTime: '08:00',
    endTime: '15:30'
  });
  
  // Ref for the settings button to position the dropdown
  const settingsButtonRef = useRef(null);

  // Using centralized mock data for consistency

  useEffect(() => {
    fetchDashboardStats();
    // Load school times from localStorage
    const savedTimes = localStorage.getItem('schoolTimes');
    if (savedTimes) {
      setSchoolTimes(JSON.parse(savedTimes));
    }
    
    // Expose fetchDashboardStats to global scope for other components
    window.updateDashboardStats = fetchDashboardStats;
    
    // Cleanup function
    return () => {
      if (window.updateDashboardStats === fetchDashboardStats) {
        delete window.updateDashboardStats;
      }
    };
  }, [selectedDate]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // API call for real stats would go here
      const response = await axiosClient.get('/access/stats/dashboard', {
        params: { date: selectedDate }
      });
      
      // Use centralized stats calculation
      const centralizedStats = getTotalStats();
      
      setStats({
        totalStudents: response.data?.totalStudents || centralizedStats.totalStudents,
        totalPresent: response.data?.studentsPresent || centralizedStats.totalPresent,
        totalEntries: response.data?.totalEntries || centralizedStats.totalEntries,
        totalExits: response.data?.totalExits || centralizedStats.totalExits,
        attendanceRate: response.data?.attendanceRate || centralizedStats.attendanceRate,
        gradeStats: mockGradeStats,
        peakEntryTime: centralizedStats.peakEntryTime,
        peakExitTime: centralizedStats.peakExitTime,
        lateArrivals: centralizedStats.lateArrivals
      });
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      error('No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.');
      
      // Fallback to centralized mock data
      const centralizedStats = getTotalStats();
      
      setStats({
        totalStudents: centralizedStats.totalStudents,
        totalPresent: centralizedStats.totalPresent,
        totalEntries: centralizedStats.totalEntries,
        totalExits: centralizedStats.totalExits,
        attendanceRate: centralizedStats.attendanceRate,
        gradeStats: mockGradeStats,
        peakEntryTime: centralizedStats.peakEntryTime,
        peakExitTime: centralizedStats.peakExitTime,
        lateArrivals: centralizedStats.lateArrivals
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  const exportData = () => {
    try {
      success('Preparando exportación de datos del dashboard...');
      
      // Generate comprehensive dashboard export
      setTimeout(() => {
        const exportDate = new Date().toISOString().split('T')[0];
        
        // Create dashboard summary CSV
        const summaryData = [
          'Tipo de Dato,Valor',
          `Fecha del Reporte,${selectedDate}`,
          `Total de alumnos,${stats.totalStudents}`,
          `alumnos Presentes,${stats.totalPresent}`,
          `alumnos Ausentes,${stats.totalStudents - stats.totalPresent}`,
          `Entradas Registradas,${stats.totalEntries}`,
          `Salidas Registradas,${stats.totalExits}`,
          `Llegadas Tardías,${stats.lateArrivals}`,
          `Tasa de Asistencia Promedio,${stats.averageAttendance.toFixed(1)}%`,
          '',
          'Estadísticas por Grado',
          'Grado,Total alumnos,Presentes,Tasa de Asistencia',
          ...stats.gradeStats.map(grade => 
            `${grade.grade},${grade.totalStudents},${grade.present},${grade.attendanceRate.toFixed(1)}%`
          )
        ].join('\n');
        
        // Create and download the file
        const blob = new Blob([summaryData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard_${exportDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        success('Datos del dashboard exportados exitosamente');
        info(`Archivo: dashboard_${exportDate}.csv`);
      }, 1500);
      
         } catch (error) {
       console.error('Error exporting dashboard data:', error);
       error('Error al exportar datos del dashboard');
     }
  };

  const handleSaveTimeSettings = async () => {
    try {
      localStorage.setItem('schoolTimes', JSON.stringify(schoolTimes));
      success('Horarios guardados correctamente');
    } catch (error) {
      console.error('Error saving time settings:', error);
      throw error; // Re-throw so dropdown can handle error
    }
  };

  const handleTimeChange = (field, value) => {
    setSchoolTimes(prev => ({ ...prev, [field]: value }));
  };

  // Calculate total number of active alerts
  const getTotalAlerts = () => {
    let alertCount = 0;
    
    // Students still at school alert
    if (stats.totalPresent - stats.totalExits > 0) {
      alertCount++;
    }
    
    // Late arrivals alert
    if (stats.lateArrivals > 0) {
      alertCount++;
    }
    
    // Low attendance alert
    if (stats.gradeStats.some(grade => grade.attendanceRate < 90)) {
      alertCount++;
    }
    
    return alertCount;
  };

  if (isLoading) {
    return <PageLoader text="Cargando dashboard administrativo..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard Administrativo"
        subtitle={`Bienvenido, ${user?.first_name}. Aquí tienes un resumen de la actividad escolar.`}
        keyboardShortcut="H"
      >
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="glass-input"
          />
          <button
            ref={settingsButtonRef}
            onClick={() => setShowTimeSettings(true)}
            className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200"
            title="Configurar horarios"
          >
            <FiSettings className="h-5 w-5 text-muted" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200"
            title="Actualizar datos"
          >
            <FiRefreshCw className={`h-5 w-5 text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportData}
            className="btn-primary flex items-center space-x-2"
          >
            <FiDownload className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </PageHeader>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-lg icon-primary stats-icon">
              <FiUsers className="h-6 w-6" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Total alumnos</div>
              <div className="stats-value">{stats.totalStudents}</div>
              <div className="stats-subtitle">{stats.totalPresent} presentes hoy</div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-lg icon-success stats-icon">
              <FiArrowRight className="h-6 w-6" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Entradas Hoy</div>
              <div className="stats-value">{stats.totalEntries}</div>
              <div className="stats-subtitle">Pico: {stats.peakEntryTime}</div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-lg icon-warning stats-icon">
              <FiArrowLeft className="h-6 w-6" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Salidas Hoy</div>
              <div className="stats-value">{stats.totalExits}</div>
              <div className="stats-subtitle">Pico: {stats.peakExitTime}</div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-lg icon-secondary stats-icon">
              <FiTarget className="h-6 w-6" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Asistencia</div>
              <div className="stats-value">{stats.attendanceRate}%</div>
              <div className="stats-subtitle">{stats.lateArrivals} llegadas tardías</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Level Statistics */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 dark:border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="icon-container icon-container-md icon-primary">
                <FiBarChart2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-primary">Estadísticas por Grado</h2>
            </div>
            <div className="flex items-center space-x-6 text-sm text-secondary">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30 border border-blue-400/30"></div>
                <span className="font-medium">Entradas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/30 border border-red-400/30"></div>
                <span className="font-medium">Salidas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30 border border-emerald-400/30"></div>
                <span className="font-medium">Presentes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modern-table">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Grado</th>
                <th className="text-left">Total</th>
                <th className="text-left">Presentes</th>
                <th className="text-left">Entradas</th>
                <th className="text-left">Salidas</th>
                <th className="text-left">% Asistencia</th>
                <th className="text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.gradeStats.map((grade, index) => (
                <tr key={grade.grade} className="table-row-hover border-b border-white/5 dark:border-slate-700/30">
                  <td className="py-4">
                    <div className="font-medium text-primary">{grade.grade}</div>
                  </td>
                  <td className="py-4">
                    <span className="text-secondary">{grade.total}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-md shadow-emerald-500/25 border border-emerald-400/20"></div>
                      <span className="font-medium text-primary">{grade.present}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md shadow-blue-500/25 border border-blue-400/20"></div>
                      <span className="font-medium text-primary">{grade.entries}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md shadow-red-500/25 border border-red-400/20"></div>
                      <span className="font-medium text-primary">{grade.exits}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`font-medium ${
                      grade.attendanceRate >= 95 ? 'text-success-600 dark:text-success-400' :
                      grade.attendanceRate >= 90 ? 'text-warning-600 dark:text-warning-400' :
                      'text-error-600 dark:text-error-400'
                    }`}>
                      {grade.attendanceRate}%
                    </span>
                  </td>
                  <td className="py-4">
                    {grade.attendanceRate >= 95 ? (
                      <span className="status-badge status-present flex items-center space-x-1">
                        <FiAward className="h-3 w-3" />
                        <span>Excelente</span>
                      </span>
                    ) : grade.attendanceRate >= 90 ? (
                      <span className="status-badge status-warning flex items-center space-x-1">
                        <FiTrendingUp className="h-3 w-3" />
                        <span>Bueno</span>
                      </span>
                    ) : (
                      <span className="status-badge status-absent flex items-center space-x-1">
                        <FiAlertTriangle className="h-3 w-3" />
                        <span>Atención</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts & Notifications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="icon-container icon-container-md icon-warning">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Alertas del Sistema</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              getTotalAlerts() > 0 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            }`}>
              {getTotalAlerts()} alerta{getTotalAlerts() !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
            {/* Students still at school alert */}
            {stats.totalPresent - stats.totalExits > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                <div className="icon-container-sm icon-warning">
                  <FiUsers className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    alumnos aún en la escuela
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                    {stats.totalPresent - stats.totalExits} alumnos no han registrado su salida después de las {schoolTimes.endTime}
                  </p>
                  <Link 
                    to="/app/recogida" 
                    className="text-xs text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 font-medium mt-2 inline-block"
                  >
                    Registrar salidas →
                  </Link>
                </div>
              </div>
            )}

            {/* Late arrivals alert */}
            {stats.lateArrivals > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                <div className="icon-container-sm icon-warning">
                  <FiClock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Llegadas tardías registradas
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    {stats.lateArrivals} alumnos llegaron después de las {schoolTimes.startTime}
                  </p>
                </div>
              </div>
            )}

            {/* Low attendance alert */}
            {stats.gradeStats.some(grade => grade.attendanceRate < 90) && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <div className="icon-container-sm icon-error">
                  <FiTrendingDown className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Asistencia baja detectada
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {stats.gradeStats.filter(grade => grade.attendanceRate < 90).length} grado(s) con asistencia inferior al 90%
                  </p>
                </div>
              </div>
            )}

            {/* No alerts state */}
            {stats.totalPresent - stats.totalExits === 0 && stats.lateArrivals === 0 && stats.gradeStats.every(grade => grade.attendanceRate >= 90) && (
              <div className="flex items-center justify-center space-x-3 p-6 text-center">
                <div className="icon-container-md icon-success">
                  <FiTarget className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    ¡Todo en orden!
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                    No hay alertas que requieran atención
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Summary */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="icon-container icon-container-md icon-secondary">
              <FiCalendar className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Resumen del Día</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <FiClock className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium text-secondary">Inicio de clases</span>
              </div>
              <span className="text-sm font-semibold text-primary">{schoolTimes.startTime}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <FiClock className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium text-secondary">Fin de clases</span>
              </div>
              <span className="text-sm font-semibold text-primary">{schoolTimes.endTime}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <FiUsers className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium text-secondary">alumnos aún en escuela</span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {stats.totalPresent - stats.totalExits}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <FiCalendar className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium text-secondary">Fecha</span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {new Date(selectedDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-md icon-success stats-icon">
              <FiTrendingUp className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Mejor Grado</div>
              <div className="stats-value text-lg">
                {stats.gradeStats.reduce((best, current) => 
                  current.attendanceRate > best.attendanceRate ? current : best
                ).grade}
              </div>
              <div className="stats-subtitle">
                {Math.max(...stats.gradeStats.map(g => g.attendanceRate))}% asistencia
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-md icon-warning stats-icon">
              <FiTrendingDown className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Requiere Atención</div>
              <div className="stats-value text-lg">
                {stats.gradeStats.reduce((worst, current) => 
                  current.attendanceRate < worst.attendanceRate ? current : worst
                ).grade}
              </div>
              <div className="stats-subtitle">
                {Math.min(...stats.gradeStats.map(g => g.attendanceRate))}% asistencia
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="icon-container icon-container-md icon-primary stats-icon">
              <FiAward className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Promedio Escuela</div>
              <div className="stats-value text-lg">{stats.attendanceRate}%</div>
              <div className="stats-subtitle">
                {stats.gradeStats.filter(g => g.attendanceRate >= 95).length} grados excelentes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Workflow Demo */}
      <PickupWorkflowDemo />

      {/* Time Settings Dropdown */}
      <TimeSettingsDropdown
        schoolTimes={schoolTimes}
        onTimeChange={handleTimeChange}
        onSaveSettings={handleSaveTimeSettings}
        isVisible={showTimeSettings}
        onClose={() => setShowTimeSettings(false)}
        triggerRef={settingsButtonRef}
      />
    </div>
  );
};

export default Dashboard; 