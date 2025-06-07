import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationSystem';
import { useAuth } from '../hooks/useAuth';
import { 
  FiLogOut, 
  FiRefreshCw, 
  FiCamera,
  FiUser,
  FiSearch,
  FiClock,
  FiUserCheck,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import axiosClient from '../utils/axiosConfig';
import PageHeader from '../components/PageHeader';
import EnhancedQRScanner from '../components/EnhancedQRScanner';

const StudentCheckout = () => {
  const { success, error, warning, info } = useNotification();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    guardian_id: '',
    guardian_relationship: '',
    notes: '',
    pickup_method: 'guardian' // guardian, authorized_person, emergency
  });
  const [guardians, setGuardians] = useState([]);

  useEffect(() => {
    fetchPresentStudents();
  }, []);

  const fetchPresentStudents = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get('/access/search-students', {
        params: { status: 'present' }
      });
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error fetching present students:', err);
      error('Error al cargar alumnos presentes');
      // Fallback to mock data
      setStudents([
        {
          id: 1,
          first_name: 'María',
          last_name: 'García',
          enrollment_id: 'EST001',
          grade_level: { name: '3° Primaria' },
          guardians: [
            { id: 1, first_name: 'Ana', last_name: 'Pérez', relationship_type: 'madre' },
            { id: 2, first_name: 'Carlos', last_name: 'García', relationship_type: 'padre' }
          ]
        },
        {
          id: 2,
          first_name: 'Luis',
          last_name: 'Martínez',
          enrollment_id: 'EST002',
          grade_level: { name: '4° Primaria' },
          guardians: [
            { id: 3, first_name: 'Elena', last_name: 'Rodríguez', relationship_type: 'madre' }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setGuardians(student.guardians || []);
    setCheckoutData({
      guardian_id: '',
      guardian_relationship: '',
      notes: '',
      pickup_method: 'guardian'
    });
  };

  const handleGuardianSelect = (guardian) => {
    setCheckoutData(prev => ({
      ...prev,
      guardian_id: guardian.id,
      guardian_relationship: guardian.relationship_type
    }));
  };

  const handleCheckout = async () => {
    if (!selectedStudent) {
      error('Selecciona un alumno para la salida');
      return;
    }

    if (checkoutData.pickup_method === 'guardian' && !checkoutData.guardian_id) {
      error('Selecciona un tutor autorizado');
      return;
    }

    try {
      setIsLoading(true);

      const checkoutRequest = {
        student_id: selectedStudent.id,
        guardian_id: checkoutData.guardian_id || null,
        authorized_by_staff_id: user.staff_profile?.id || user.id,
        pickup_method: checkoutData.pickup_method,
        notes: checkoutData.notes,
        checkout_time: new Date().toISOString()
      };

      const response = await axiosClient.post('/access/checkout', checkoutRequest);

      success(`Salida registrada exitosamente para ${selectedStudent.first_name} ${selectedStudent.last_name}`);
      
      // Reset form
      setSelectedStudent(null);
      setGuardians([]);
      setCheckoutData({
        guardian_id: '',
        guardian_relationship: '',
        notes: '',
        pickup_method: 'guardian'
      });

      // Refresh students list
      await fetchPresentStudents();

    } catch (err) {
      console.error('Error processing checkout:', err);
      error(err.response?.data?.detail || 'Error al procesar la salida del alumno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRSuccess = async (qrData) => {
    try {
      setShowQRScanner(false);
      info('Procesando código QR...');

      // Process QR code for guardian verification
      const response = await axiosClient.post('/access/qr-checkout', {
        qr_code: qrData,
        authorized_by_staff_id: user.staff_profile?.id || user.id
      });

      if (response.data.success) {
        success(`Salida autorizada por QR para ${response.data.student_name}`);
        await fetchPresentStudents();
      } else {
        warning(response.data.message || 'Código QR no válido o expirado');
      }

    } catch (err) {
      console.error('Error processing QR checkout:', err);
      error('Error al procesar el código QR');
    }
  };

  const handleQRError = (err) => {
    console.error('QR Scanner error:', err);
    error('Error en el escáner QR');
    setShowQRScanner(false);
  };

  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.enrollment_id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salida de Alumnos"
        subtitle="Gestión de salidas y recogidas autorizadas"
        icon={FiLogOut}
        actions={[
          {
            label: 'Escanear QR',
            icon: FiCamera,
            onClick: () => setShowQRScanner(true),
            variant: 'secondary'
          },
          {
            label: 'Actualizar',
            icon: FiRefreshCw,
            onClick: fetchPresentStudents,
            loading: isLoading
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Alumnos Presentes ({filteredStudents.length})
            </h3>
            
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o matrícula..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <FiUser className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-slate-500 dark:text-slate-400">
                  No hay alumnos presentes
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      selectedStudent?.id === student.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {student.enrollment_id} • {student.grade_level?.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {student.guardians?.length || 0} tutores registrados
                        </div>
                      </div>
                      {selectedStudent?.id === student.id && (
                        <FiCheckCircle className="text-blue-500" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Procesar Salida
            </h3>
          </div>

          <div className="p-6">
            {!selectedStudent ? (
              <div className="text-center py-8">
                <FiAlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-slate-500 dark:text-slate-400">
                  Selecciona un alumno para procesar su salida
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Student Info */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    Alumno Seleccionado
                  </h4>
                  <div className="text-sm">
                    <div className="text-slate-700 dark:text-slate-300">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {selectedStudent.enrollment_id} • {selectedStudent.grade_level?.name}
                    </div>
                  </div>
                </div>

                {/* Pickup Method */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Método de Recogida
                  </label>
                  <select
                    value={checkoutData.pickup_method}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, pickup_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="guardian">Tutor Registrado</option>
                    <option value="authorized_person">Persona Autorizada</option>
                    <option value="emergency">Salida de Emergencia</option>
                  </select>
                </div>

                {/* Guardian Selection */}
                {checkoutData.pickup_method === 'guardian' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tutor Autorizado
                    </label>
                    {guardians.length === 0 ? (
                      <div className="text-sm text-amber-600 dark:text-amber-400">
                        No hay tutores registrados para este alumno
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {guardians.map((guardian) => (
                          <label
                            key={guardian.id}
                            className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="guardian"
                              value={guardian.id}
                              checked={checkoutData.guardian_id === guardian.id}
                              onChange={() => handleGuardianSelect(guardian)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {guardian.first_name} {guardian.last_name}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                                {guardian.relationship_type}
                              </div>
                            </div>
                            <FiUserCheck className="text-green-500" size={16} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={checkoutData.notes}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones sobre la salida..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isLoading || (checkoutData.pickup_method === 'guardian' && !checkoutData.guardian_id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <FiLogOut size={16} />
                    {isLoading ? 'Procesando...' : 'Registrar Salida'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <FiClock size={16} />
          Hora actual: {new Date().toLocaleTimeString('es-ES')}
        </div>
      </div>

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

export default StudentCheckout; 