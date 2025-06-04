import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiTruck, 
  FiClock, 
  FiCheck, 
  FiActivity,
  FiSend,
  FiUser,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiArrowRight,
  FiEye,
  FiUserCheck
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';
import PageHeader from '../components/PageHeader';
import StandardSearch from '../components/StandardSearch';
// import { mockParentArrivals, mockPickupQueue, mockCompletedPickups, allStudents } from '../data/mockData'; // Mock data commented out
import axiosClient from '../utils/axiosConfig'; // Added axiosClient

const PickupCoordination = ({ role = 'staff' }) => {
  const { user } = useAuth();
  const { success, error, info } = useNotification();
  
  // Unified state management
  const [activeTab, setActiveTab] = useState('arrivals');
  const [parentArrivals, setParentArrivals] = useState([]);
  const [pickupQueue, setPickupQueue] = useState([]);
  const [completedPickups, setCompletedPickups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('6A');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadPickupData();
  }, [role, selectedGroup]);

  const loadPickupData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (role === 'staff') {
        console.log("Fetching staff pickup data...");
        const [arrivalsRes, queueRes, completedRes] = await Promise.all([
          axiosClient.get('/pickup/arrivals'),
          axiosClient.get('/pickup/queue'),
          axiosClient.get('/pickup/completed')
        ]);
        setParentArrivals(arrivalsRes.data || []);
        setPickupQueue(queueRes.data || []);
        setCompletedPickups(completedRes.data || []);
        info('Datos de recogida (staff) cargados.');
      } else if (role === 'teacher') {
        console.log(`Fetching teacher pickup data for group ${selectedGroup}...`);
        // Example: Adjust endpoint and data structure as per actual API for teachers
        const teacherDataRes = await axiosClient.get(`/pickup/teacher/dashboard`, { params: { groupId: selectedGroup } });
        // Assuming teacherDataRes.data contains { pendingRequests: [], readyForPickup: [], completedByTeacher: [] }
        setParentArrivals(teacherDataRes.data?.pendingRequests || []); 
        setPickupQueue(teacherDataRes.data?.readyForPickup || []); 
        setCompletedPickups(teacherDataRes.data?.completedByTeacher || []);
        info(`Datos de recogida para grupo ${selectedGroup} (profesor) cargados.`);
      }
      // mock data usage removed
      // setParentArrivals(mockParentArrivals);
      // setPickupQueue(mockPickupQueue);
      // setCompletedPickups(mockCompletedPickups);
    } catch (err) {
      console.error('Error loading pickup data:', err);
      error(err.response?.data?.detail || 'Error cargando datos de recogida. Intente de nuevo.');
      setParentArrivals([]);
      setPickupQueue([]);
      setCompletedPickups([]);
    } finally {
      setIsLoading(false);
    }
  }, [role, selectedGroup, error, info, setIsLoading, setParentArrivals, setPickupQueue, setCompletedPickups]); // Added state setters to dependencies

  // Calculate statistics
  const stats = {
    totalArrivals: parentArrivals.length,
    queueLength: pickupQueue.length,
    completedToday: completedPickups.length,
    avgWaitTime: 5
  };

  // Filter data based on search
  const filteredArrivals = parentArrivals.filter(arrival =>
    arrival.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    arrival.student_names.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQueue = pickupQueue.filter(item =>
    item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.parent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Action handlers
  const handleRegisterArrival = useCallback(async (arrivalData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Simulating parent arrival registration with data:', arrivalData);
      success(`Llegada registrada. Datos: ${JSON.stringify(arrivalData)}`);
      loadPickupData();
    } catch (err) {
      console.error('Error registering arrival:', err);
      error(err.response?.data?.detail || 'Error al registrar llegada.');
    } finally {
      setIsLoading(false);
    }
  }, [success, error, loadPickupData, setIsLoading]);

  const handleRequestStudent = useCallback(async (studentId, studentName) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Simulating pickup request for ${studentName} (ID: ${studentId})`);
      success(`Solicitud de recogida enviada para ${studentName}`);
      loadPickupData();
    } catch (err) {
      console.error('Error requesting student:', err);
      error(err.response?.data?.detail || 'Error al solicitar estudiante.');
    } finally {
      setIsLoading(false);
    }
  }, [success, error, loadPickupData, setIsLoading]);

  const handleCompletePickup = useCallback(async (queueIdOrStudentId, studentName) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Simulating completion of pickup for ${studentName} (ID: ${queueIdOrStudentId})`);
      success(`Recogida completada para ${studentName}`);
      loadPickupData();
    } catch (err) {
      console.error('Error completing pickup:', err);
      error(err.response?.data?.detail || 'Error al completar recogida.');
    } finally {
      setIsLoading(false);
    }
  }, [success, error, loadPickupData, setIsLoading]);

  const handleSendToExit = useCallback(async (studentId, exitPoint) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Simulating sending student ${studentId} to exit point ${exitPoint}`);
      success(`Estudiante enviado a la salida ${exitPoint}`);
      loadPickupData();
    } catch (err) {
      console.error('Error sending student to exit:', err);
      error(err.response?.data?.detail || 'Error al enviar estudiante a salida.');
    } finally {
      setIsLoading(false);
    }
  }, [success, error, loadPickupData, setIsLoading]);

  // Tab configuration
  const tabs = [
    { id: 'arrivals', label: 'Llegadas', icon: FiTruck, count: stats.totalArrivals },
    { id: 'queue', label: 'Cola de Recogida', icon: FiClock, count: stats.queueLength },
    { id: 'dispatch', label: 'Envío a Maestros', icon: FiSend, count: 0 },
    { id: 'completed', label: 'Completadas', icon: FiCheck, count: stats.completedToday }
  ];

  if (role === 'teacher') {
    tabs.splice(0, 4, 
      { id: 'requests', label: 'Solicitudes', icon: FiAlertCircle, count: 3 },
      { id: 'roster', label: 'Grupo Actual', icon: FiUsers, count: 25 },
      { id: 'exits', label: 'Envío a Salidas', icon: FiArrowRight, count: 4 }
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-scale">
      {/* Header */}
      <PageHeader 
        title={role === 'teacher' ? 'Gestión de Grupo - Recogida' : 'Coordinación de Recogida'}
        subtitle={role === 'teacher' ? 'Administra las solicitudes de recogida de tu grupo actual' : 'Coordina las llegadas de padres y la recogida de estudiantes'}
        keyboardShortcut="P"
      >
        <div className="flex items-center space-x-3">
          {role === 'teacher' && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="form-select"
            >
              <option value="6A">6º A</option>
              <option value="6B">6º B</option>
              <option value="5A">5º A</option>
              <option value="5B">5º B</option>
            </select>
          )}
          
          <button
            onClick={loadPickupData}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-icon icon-container-md icon-primary">
              <FiTruck className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">
                {role === 'teacher' ? 'Solicitudes Activas' : 'Padres Llegados'}
              </div>
              <div className="stats-value">{stats.totalArrivals}</div>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-icon icon-container-md icon-warning">
              <FiClock className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">
                {role === 'teacher' ? 'Pendientes Envío' : 'Cola de Espera'}
              </div>
              <div className="stats-value">{stats.queueLength}</div>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-icon icon-container-md icon-success">
              <FiCheck className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Completadas Hoy</div>
              <div className="stats-value">{stats.completedToday}</div>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-icon icon-container-md icon-secondary">
              <FiActivity className="h-5 w-5" />
            </div>
            <div className="stats-info">
              <div className="stats-title">Tiempo Promedio</div>
              <div className="stats-value">{stats.avgWaitTime}min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <StandardSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {}}
        onReset={() => setSearchQuery('')}
        placeholder="Buscar por nombre de padre, alumno o teléfono..."
        isLoading={false}
        showSearchButton={false}
        resultsCount={activeTab === 'arrivals' ? filteredArrivals.length : filteredQueue.length}
      />

      {/* Tab Content */}
      <div className="glass-card">
        {activeTab === 'arrivals' && (
          <ArrivalsTab 
            arrivals={filteredArrivals}
            onRegisterArrival={handleRegisterArrival}
            onRequestStudent={handleRequestStudent}
          />
        )}
        
        {activeTab === 'queue' && (
          <QueueTab 
            queue={filteredQueue}
            onCompletePickup={handleCompletePickup}
          />
        )}
        
        {activeTab === 'dispatch' && (
          <DispatchTab 
            onSendRequest={() => {}}
          />
        )}
        
        {activeTab === 'completed' && (
          <CompletedTab 
            completed={completedPickups}
          />
        )}
        
        {/* Teacher-specific tabs */}
        {role === 'teacher' && activeTab === 'requests' && (
          <RequestsTab 
            group={selectedGroup}
            onSendToExit={handleSendToExit}
          />
        )}
        
        {role === 'teacher' && activeTab === 'roster' && (
          <RosterTab 
            group={selectedGroup}
          />
        )}
        
        {role === 'teacher' && activeTab === 'exits' && (
          <ExitsTab 
            group={selectedGroup}
          />
        )}
      </div>
    </div>
  );
};

// Tab Components
const ArrivalsTab = ({ arrivals, onRegisterArrival, onRequestStudent }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiTruck className="h-5 w-5" />
        <span>Llegadas de Padres</span>
      </h3>
      <div className="flex space-x-2">
        <button 
          onClick={() => onRegisterArrival('manual')}
          className="btn-primary flex items-center space-x-2"
        >
          <FiUser className="h-4 w-4" />
          <span>Registro Manual</span>
        </button>
        <button 
          onClick={() => onRegisterArrival('qr')}
          className="btn-secondary flex items-center space-x-2"
        >
          <FiCheckCircle className="h-4 w-4" />
          <span>Escanear QR</span>
        </button>
      </div>
    </div>
    
    {arrivals.length === 0 ? (
      <div className="text-center py-12">
        <FiTruck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">No hay padres registrados</p>
      </div>
    ) : (
      <div className="space-y-4">
        {arrivals.map(arrival => (
          <div key={arrival.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container-md icon-primary">
                  <FiUser className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">{arrival.parent_name}</h4>
                  <p className="text-sm text-secondary">{arrival.parent_phone}</p>
                  <p className="text-xs text-muted">
                    Estudiantes: {arrival.student_names.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted">
                  {new Date(arrival.arrived_at).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => onRequestStudent(arrival.student_ids[0], arrival.student_names[0])}
                  className="btn-success flex items-center space-x-1 text-sm"
                >
                  <FiSend className="h-3 w-3" />
                  <span>Solicitar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const QueueTab = ({ queue, onCompletePickup }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiClock className="h-5 w-5" />
        <span>Cola de Recogida</span>
      </h3>
    </div>
    
    {queue.length === 0 ? (
      <div className="text-center py-12">
        <FiClock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">No hay estudiantes en cola</p>
      </div>
    ) : (
      <div className="space-y-4">
        {queue.map(item => (
          <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container-md icon-warning">
                  <FiUsers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">{item.student_name}</h4>
                  <p className="text-sm text-secondary">Padre: {item.parent_name}</p>
                  <p className="text-xs text-muted">Aula: {item.classroom}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'ready' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {item.status === 'ready' ? 'Listo' : 'Solicitado'}
                </span>
                <button
                  onClick={() => onCompletePickup(item.id, item.student_name)}
                  disabled={item.status !== 'ready'}
                  className="btn-success flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheck className="h-3 w-3" />
                  <span>Completar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DispatchTab = ({ onSendRequest }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <FiSend className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-primary mb-2">Envío a Maestros</h3>
      <p className="text-slate-500 mb-4">Panel para enviar solicitudes masivas a maestros</p>
      <button className="btn-primary">Configurar Envíos</button>
    </div>
  </div>
);

const CompletedTab = ({ completed }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiCheck className="h-5 w-5" />
        <span>Recogidas Completadas</span>
      </h3>
    </div>
    
    {completed.length === 0 ? (
      <div className="text-center py-12">
        <FiCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">No hay recogidas completadas hoy</p>
      </div>
    ) : (
      <div className="space-y-4">
        {completed.map(item => (
          <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container-md icon-success">
                  <FiCheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">{item.student_name}</h4>
                  <p className="text-sm text-secondary">Padre: {item.parent_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">{item.pickup_time}</p>
                <p className="text-xs text-muted">
                  {new Date(item.completed_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Teacher-specific tabs
const RequestsTab = ({ group, onSendToExit }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiAlertCircle className="h-5 w-5" />
        <span>Solicitudes de Recogida - {group}</span>
      </h3>
    </div>
    
    <div className="text-center py-12">
      <FiAlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-500">No hay solicitudes pendientes para {group}</p>
    </div>
  </div>
);

const RosterTab = ({ group }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiUsers className="h-5 w-5" />
        <span>Grupo Actual - {group}</span>
      </h3>
    </div>
    
    <div className="text-center py-12">
      <FiUsers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-500">Lista de estudiantes del grupo {group}</p>
    </div>
  </div>
);

const ExitsTab = ({ group }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
        <FiArrowRight className="h-5 w-5" />
        <span>Envío a Salidas - {group}</span>
      </h3>
    </div>
    
    <div className="text-center py-12">
      <FiArrowRight className="h-12 w-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-500">Panel de asignación de salidas</p>
    </div>
  </div>
);

export default PickupCoordination; 