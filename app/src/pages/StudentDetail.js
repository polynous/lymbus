import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';
import axiosClient from '../utils/axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiHash,
  FiDownload,
  FiShare2,
  FiEdit,
  FiActivity
} from 'react-icons/fi';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useNotification();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const isParent = user?.user_type === 'parent';

  useEffect(() => {
    fetchStudentDetail();
    fetchAttendanceHistory();
  }, [id]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/access/student/${id}`);
      
      const studentData = {
        ...response.data,
        full_name: response.data.full_name || `${response.data.first_name} ${response.data.last_name}`,
        grade: response.data.grade_level?.name || response.data.classroom?.grade_level?.name || response.data.grade || 'Sin grado',
        qr_code: response.data.qr_code || generateStudentQRCode(response.data.id)
      };
      
      setStudent(studentData);
    } catch (err) {
      console.error('Error fetching student detail:', err);
      error('Error al cargar los detalles del estudiante');
      // Consider navigating to a more generic error page or parent dashboard if student not found for this user
      // navigate('/app'); 
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoadingAttendance(true);
      const response = await axiosClient.get(`/access/student/${id}/attendance`);
      setAttendanceHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      // Do not show error for attendance as it might not be critical for parent view initially,
      // or could be handled with a message in the attendance section itself.
    } finally {
      setLoadingAttendance(false);
    }
  };

  const generateStudentQRCode = (studentId) => {
    return JSON.stringify({
      type: 'student',
      id: studentId,
      timestamp: Date.now(),
      school: 'Lymbus School'
    });
  };

  const downloadQRCode = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 400;
      canvas.width = size;
      canvas.height = size + 80;
      
      // Safely get the SVG element and clone it to avoid XSS
      const svgElement = document.querySelector('#student-qr svg');
      if (!svgElement) {
        error('No se pudo encontrar el código QR');
        return;
      }
      
      // Clone the SVG element to safely manipulate it
      const clonedSvg = svgElement.cloneNode(true);
      clonedSvg.setAttribute('width', size.toString());
      clonedSvg.setAttribute('height', size.toString());
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Serialize the SVG safely
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, size, size);
        
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // Sanitize student data to prevent any potential issues
        const sanitizedName = (student.full_name || '').replace(/[<>]/g, '');
        ctx.fillText(sanitizedName, size / 2, size + 30);
        
        ctx.font = '16px Inter, sans-serif';
        const sanitizedGrade = (student.grade || '').replace(/[<>]/g, '');
        ctx.fillText(`ID: ${student.id} | ${sanitizedGrade}`, size / 2, size + 55);
        
        const link = document.createElement('a');
        const sanitizedFileName = sanitizedName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        link.download = `qr-${sanitizedFileName}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        URL.revokeObjectURL(url);
        success(`QR de ${sanitizedName} descargado`);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        error('Error al procesar el código QR');
      };
      
      img.src = url;
    } catch (err) {
      console.error('Error downloading QR code:', err);
      error('Error al descargar el código QR');
    }
  };

  const shareStudent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${student.full_name} - Lymbus`,
          text: `Información del estudiante ${student.full_name} (ID: ${student.id})`,
          url: window.location.href
        });
        success('Información compartida');
      } catch (err) {
        if (err.name !== 'AbortError') {
          error('Error al compartir');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        success('Enlace copiado al portapapeles');
      } catch (err) {
        error('Error al copiar al portapapeles');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando detalles del estudiante..." />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-4">
          Estudiante no encontrado
        </h2>
        <button
          onClick={() => navigate('/app')}
          className="btn-primary"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-scale">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="glass-button"
            title="Volver"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {student.full_name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Detalles del estudiante
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={shareStudent}
            className="glass-button"
            title="Compartir"
          >
            <FiShare2 className="h-4 w-4" />
          </button>
          {!isParent && (
            <button
              onClick={() => navigate(`/app/student/${id}/edit`)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiEdit className="h-4 w-4" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              <FiUser className="h-5 w-5" />
              <span>Información Personal</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Nombre Completo
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {student.full_name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    ID del Estudiante
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 font-mono">
                    {student.id}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Grado
                  </label>
                  <p className="text-slate-900 dark:text-slate-100">
                    {student.grade}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {student.email && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Email
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {student.email}
                    </p>
                  </div>
                )}
                
                {student.phone && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Teléfono
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {student.phone}
                    </p>
                  </div>
                )}
                
                {student.address && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Dirección
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {student.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              <FiActivity className="h-5 w-5" />
              <span>Historial de Asistencia</span>
            </h2>
            
            {loadingAttendance ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Cargando historial..." />
              </div>
            ) : attendanceHistory.length > 0 ? (
              <div className="space-y-3">
                {attendanceHistory.slice(0, 10).map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        record.type === 'entry' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {record.type === 'entry' ? 'Entrada' : 'Salida'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(record.timestamp).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(record.timestamp).toLocaleTimeString('es-ES')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiClock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  No hay registros de asistencia disponibles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Sidebar */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              <FiHash className="h-5 w-5" />
              <span>Código QR</span>
            </h2>
            
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-xl shadow-inner mb-4" id="student-qr">
                <QRCodeSVG
                  value={student.qr_code}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#1f2937"
                  bgColor="#ffffff"
                />
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Usa este código para entrada y salida
              </p>
              
              <button
                onClick={downloadQRCode}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <FiDownload className="h-4 w-4" />
                <span>Descargar QR</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Estadísticas Rápidas
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Registros este mes
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {attendanceHistory.filter(record => {
                    const recordDate = new Date(record.timestamp);
                    const now = new Date();
                    return recordDate.getMonth() === now.getMonth() && 
                           recordDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Última actividad
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {attendanceHistory.length > 0 
                    ? new Date(attendanceHistory[0].timestamp).toLocaleDateString('es-ES')
                    : 'Sin registros'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Estado actual
                </span>
                <span className="status-badge status-present">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail; 