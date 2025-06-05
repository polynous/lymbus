import React, { useMemo } from 'react';
import { FiCheckCircle, FiAlertCircle, FiUser, FiCalendar } from 'react-icons/fi';
import { useStudents } from '../../stores/appStore';

const StudentList = ({ 
  searchQuery, 
  filterGrade, 
  filterStatus, 
  onStudentSelect,
  onToggleEntry 
}) => {
  const students = useStudents();

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.first_name?.toLowerCase().includes(query) ||
        student.last_name?.toLowerCase().includes(query) ||
        student.enrollment_id?.toLowerCase().includes(query) ||
        student.full_name?.toLowerCase().includes(query)
      );
    }

    // Apply grade filter
    if (filterGrade) {
      filtered = filtered.filter(student => student.grade === filterGrade);
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    return filtered;
  }, [students, searchQuery, filterGrade, filterStatus]);

  const renderStatusBadge = (status) => {
    if (status === 'present') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Presente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        <FiAlertCircle className="w-3 h-3 mr-1" />
        Ausente
      </span>
    );
  };

  if (filteredStudents.length === 0) {
    return (
      <div className="text-center py-12">
        <FiUser className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay estudiantes
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchQuery ? 'No se encontraron estudiantes con esos criterios' : 'No hay estudiantes registrados'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.map((student) => (
              <li key={student.id} className="py-4">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {student.full_name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.enrollment_id}
                          </p>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.grade}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {renderStatusBadge(student.status)}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onStudentSelect(student)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiUser className="w-3 h-3 mr-1" />
                        Ver
                      </button>
                      
                      <button
                        onClick={() => onToggleEntry(student.id, student.status)}
                        className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          student.status === 'present'
                            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 dark:border-red-600 dark:text-red-400 dark:bg-red-900 dark:hover:bg-red-800'
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500 dark:border-green-600 dark:text-green-400 dark:bg-green-900 dark:hover:bg-green-800'
                        }`}
                      >
                        <FiCalendar className="w-3 h-3 mr-1" />
                        {student.status === 'present' ? 'Salida' : 'Entrada'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentList; 