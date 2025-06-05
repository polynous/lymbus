import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationSystem';
import { FiUsers, FiRefreshCw, FiCamera } from 'react-icons/fi';
import useAppStore from '../stores/appStore';
import simpleWebSocket from '../services/simpleWebSocket';
import PageHeader from '../components/PageHeader';
import StudentFilters from '../components/student/StudentFilters';
import StudentList from '../components/student/StudentList';
import EnhancedQRScanner from '../components/EnhancedQRScanner';
import axiosClient from '../utils/axiosConfig';

const StudentEntry = () => {
  const { success, error } = useNotification();
  
  // Local UI state only
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Global state from store
  const { 
    isLoading, 
    error: storeError, 
    fetchStudents 
  } = useAppStore();

  // Initialize data and WebSocket
  useEffect(() => {
    fetchStudents();
    simpleWebSocket.connect();
    
    return () => {
      simpleWebSocket.disconnect();
    };
  }, [fetchStudents]);

  // Handle student entry/exit
  const handleToggleEntry = async (studentId, currentStatus) => {
    try {
      if (currentStatus === 'absent') {
        // Register entry
        await axiosClient.post(`/attendance/entry/${studentId}`);
        success('Entrada registrada exitosamente');
      } else {
        // Register exit (if you have this endpoint)
        await axiosClient.post(`/attendance/exit/${studentId}`);
        success('Salida registrada exitosamente');
      }
      
      // Refresh data
      await fetchStudents();
    } catch (err) {
      error(err.response?.data?.detail || 'Error al procesar la operación');
    }
  };

  // Handle student selection (navigate to detail or show modal)
  const handleStudentSelect = (student) => {
    // You can implement navigation or modal logic here
    console.log('Selected student:', student);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterGrade('');
    setFilterStatus('');
  };

  // QR Scanner handlers
  const handleQRSuccess = async (qrData) => {
    try {
      // Process QR code data
      console.log('QR scanned:', qrData);
      
      // Close scanner
      setShowQRScanner(false);
      
      // You can implement QR processing logic here
      success('QR escaneado exitosamente');
    } catch (err) {
      error('Error al procesar el código QR');
    }
  };

  const handleQRError = (err) => {
    console.error('QR Scanner error:', err);
    error('Error en el escáner QR');
  };

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{storeError.message}</p>
          <button
            onClick={fetchStudents}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Entrada"
        subtitle="Gestión de entradas y salidas de estudiantes"
        icon={FiUsers}
        actions={[
          {
            label: 'Escanear QR',
            icon: FiCamera,
            onClick: () => setShowQRScanner(true),
            variant: 'primary'
          },
          {
            label: 'Actualizar',
            icon: FiRefreshCw,
            onClick: fetchStudents,
            loading: isLoading
          }
        ]}
      />

      <StudentFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterGrade={filterGrade}
        setFilterGrade={setFilterGrade}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <StudentList
          searchQuery={searchQuery}
          filterGrade={filterGrade}
          filterStatus={filterStatus}
          onStudentSelect={handleStudentSelect}
          onToggleEntry={handleToggleEntry}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <EnhancedQRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onSuccess={handleQRSuccess}
          onError={handleQRError}
        />
      )}
    </div>
  );
};

export default StudentEntry; 