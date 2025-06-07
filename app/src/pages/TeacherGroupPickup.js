import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationSystem';
import { useAuth } from '../hooks/useAuth';
import { 
  FiUsers, 
  FiRefreshCw, 
  FiCheck, 
  FiClock, 
  FiCalendar,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import axiosClient from '../utils/axiosConfig';
import PageHeader from '../components/PageHeader';

const TeacherGroupPickup = () => {
  const { success, error, info } = useNotification();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Fetch students present at school for teacher's classes
      const response = await axiosClient.get('/teacher/students', {
        params: { status: 'present' }
      });
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      error('Error al cargar la lista de alumnos');
      // Fallback to mock data for development
      setStudents([
        {
          id: 1,
          first_name: 'María',
          last_name: 'García',
          grade_level: { name: '3° Primaria' },
          entry_time: '08:15:00',
          status: 'present'
        },
        {
          id: 2,
          first_name: 'Carlos',
          last_name: 'López',
          grade_level: { name: '3° Primaria' },
          entry_time: '08:20:00',
          status: 'present'
        },
        {
          id: 3,
          first_name: 'Ana',
          last_name: 'Martínez',
          grade_level: { name: '4° Primaria' },
          entry_time: '08:10:00',
          status: 'present'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredStudentIds = getFilteredStudents().map(s => s.id);
    if (selectedStudents.length === filteredStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudentIds);
    }
  };

  const handleGroupPickup = async () => {
    if (selectedStudents.length === 0) {
      error('Selecciona al menos un alumno para la recogida grupal');
      return;
    }

    try {
      setIsLoading(true);
      
      // Process group pickup
      const response = await axiosClient.post('/teacher/group-pickup', {
        student_ids: selectedStudents,
        pickup_time: new Date().toISOString(),
        authorized_by_teacher: user.id,
        notes: `Recogida grupal autorizada por ${user.first_name} ${user.last_name}`
      });

      success(`Recogida grupal procesada exitosamente para ${selectedStudents.length} alumnos`);
      setSelectedStudents([]);
      
      // Refresh the list
      await fetchStudents();
      
    } catch (err) {
      console.error('Error processing group pickup:', err);
      error(err.response?.data?.detail || 'Error al procesar la recogida grupal');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = searchQuery === '' || 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGrade = filterGrade === '' || 
        student.grade_level?.name === filterGrade;
      
      const matchesStatus = filterStatus === 'all' || 
        student.status === filterStatus;

      return matchesSearch && matchesGrade && matchesStatus;
    });
  };

  const exportPickupReport = () => {
    const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));
    const csvContent = [
      'Nombre,Apellido,Grado,Hora de Entrada,Estado',
      ...selectedStudentData.map(student => 
        `${student.first_name},${student.last_name},${student.grade_level?.name || 'N/A'},${student.entry_time || 'N/A'},${student.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recogida_grupal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    info('Reporte de recogida exportado exitosamente');
  };

  const filteredStudents = getFilteredStudents();
  const grades = [...new Set(students.map(s => s.grade_level?.name).filter(Boolean))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recogida Grupal de Profesores"
        subtitle="Gestión de recogidas grupales por clase"
        icon={FiUsers}
        actions={[
          {
            label: 'Actualizar',
            icon: FiRefreshCw,
            onClick: fetchStudents,
            loading: isLoading
          },
          {
            label: selectedStudents.length > 0 ? `Procesar Recogida (${selectedStudents.length})` : 'Procesar Recogida',
            icon: FiCheck,
            onClick: handleGroupPickup,
            disabled: selectedStudents.length === 0,
            variant: 'primary'
          }
        ]}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Buscar alumno
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o apellido..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filtrar por grado
            </label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Todos los grados</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="present">Presentes</option>
            </select>
          </div>

          <div className="flex items-end">
            {selectedStudents.length > 0 && (
              <button
                onClick={exportPickupReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FiDownload size={16} />
                Exportar ({selectedStudents.length})
              </button>
            )}
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
              onChange={handleSelectAll}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Seleccionar todos ({filteredStudents.length})
            </span>
          </label>

          <div className="text-sm text-slate-600 dark:text-slate-400">
            {selectedStudents.length} de {filteredStudents.length} seleccionados
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              No hay alumnos disponibles
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              No se encontraron alumnos que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  selectedStudents.includes(student.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentSelect(student.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        ID: {student.id}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {student.grade_level?.name || 'Sin grado'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <FiClock size={14} />
                      {student.entry_time || 'N/A'}
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'present' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {student.status === 'present' ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Recogida Grupal Preparada
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedStudents.length} alumnos seleccionados para recogida grupal
              </p>
            </div>
            <button
              onClick={handleGroupPickup}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <FiCheck size={16} />
              {isLoading ? 'Procesando...' : 'Confirmar Recogida'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGroupPickup; 