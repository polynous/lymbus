import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosConfig';
import { 
  FiCheck, 
  FiAlertTriangle, 
  FiCopy, 
  FiUserPlus,
  FiSend,
  FiTrash2,
  FiRefreshCw,
  FiArrowRight,
  FiArrowLeft,
  FiUsers
} from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import PageLoader from '../components/PageLoader';
import PageHeader from '../components/PageHeader';
import { createPortal } from 'react-dom';
import { allStudents, mockInvitations as centralizedInvitations } from '../data/mockData';
import { LocalStorage } from '../utils/localStorage';
import { useAuth } from '../hooks/useAuth'; // Import useAuth

const InviteUsers = () => {
  const { user: authUser } = useAuth(); // Get the authenticated user
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [invitations, setInvitations] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    invitationType: 'guardian',
    firstName: '',
    lastName: '',
    studentId: '',
    relationshipType: 'padre',
    position: '',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  let successInvitationUrl = ''; // Temporary variable for the modal

  // Using centralized mock data for consistency

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Try to fetch from real API first using axiosClient
      const response = await axiosClient.get(`/invitations`); // API_URL is base for axiosClient, getAuthHeaders not needed
      
      // Assuming server returns the list directly in response.data
      setInvitations(response.data);
      LocalStorage.setInvitations(response.data); // Sync localStorage with server truth
      setNotification({ type: 'info', message: 'Invitaciones cargadas desde el servidor.' });
      
      setStudents(allStudents); // Keep mock students for now
      
    } catch (error) {
      console.error('Error loading invitations from server:', error);
      
      // Fallback to localStorage
      const localInvitations = LocalStorage.getInvitations();
      if (localInvitations && localInvitations.length > 0) {
        setInvitations(localInvitations);
        setNotification({
          type: 'warning',
          message: 'Error al cargar desde el servidor. Mostrando invitaciones guardadas localmente.'
        });
      } else {
        // If localStorage is also empty, use mock (should be rare if server was ever reached)
        setInvitations(centralizedInvitations); 
        LocalStorage.setInvitations(centralizedInvitations); // Initialize localStorage if empty
        setNotification({
          type: 'error',
          message: 'Error al cargar los datos. Usando datos de ejemplo.'
        });
      }
      setStudents(allStudents); // Keep mock students for now
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email || !formData.email.includes('@')) {
        newErrors.email = 'Por favor ingresa un email válido';
      }
      if (!formData.firstName) {
        newErrors.firstName = 'El nombre es requerido';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'El apellido es requerido';
      }
    }

    if (step === 2) {
      if (formData.invitationType === 'guardian') {
        if (!formData.studentId) {
          newErrors.studentId = 'Por favor selecciona un estudiante';
        }
        if (!formData.relationshipType) {
          newErrors.relationshipType = 'Por favor especifica la relación';
        }
      } else if (formData.invitationType === 'staff') {
        if (!formData.position) {
          newErrors.position = 'El cargo es requerido';
        }
        if (!formData.department) {
          newErrors.department = 'El departamento es requerido';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    if (!authUser || !authUser.school_id) {
      setNotification({
        type: 'error',
        message: 'No se pudo determinar el ID de la escuela. Asegúrate de que tu perfil de administrador esté configurado correctamente.'
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: '', message: '' });

    try {
      const invitationPayload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        invitation_type: formData.invitationType,
        student_id: formData.invitationType === 'guardian' ? parseInt(formData.studentId) : undefined,
        relationship_type: formData.invitationType === 'guardian' ? formData.relationshipType : undefined,
        position: formData.invitationType === 'staff' ? formData.position : undefined,
        department: formData.invitationType === 'staff' ? formData.department : undefined,
        school_id: authUser.school_id // ADDED school_id from authUser
      };

      try {
        const response = await axiosClient.post(`/invitations`, invitationPayload);
        
        if (response.status >= 200 && response.status < 300 && response.data && response.data.invitation_url) {
          const newApiInvitation = response.data;
          setInvitations(prev => [newApiInvitation, ...prev]);
          
          const updatedInvitations = LocalStorage.getInvitations();
          updatedInvitations.unshift({ ...newApiInvitation, id: newApiInvitation.id || Date.now() });
          LocalStorage.setInvitations(updatedInvitations);
          
          setNotification({
            type: 'success',
            message: 'Invitación enviada y URL generada por el servidor.'
          });
          successInvitationUrl = newApiInvitation.invitation_url; // Use temporary var for modal
          setShowSuccessModal(true);
          // Reset form on successful API submission
          setFormData({
            email: '', invitationType: 'guardian', firstName: '', lastName: '',
            studentId: '', relationshipType: 'padre', position: '', department: ''
          });
          setCurrentStep(1);
        } else {
          console.warn('API POST for invitation did not return expected successful structure:', response);
          setNotification({
            type: 'error',
            message: 'Error del servidor al crear invitación. Inténtalo de nuevo.'
          });
          // Do NOT show success modal or use client-generated URL if API fails to confirm
        }
      } catch (apiError) {
        console.error('API POST /invitations failed:', apiError);
        setNotification({
          type: 'error',
          message: apiError.response?.data?.detail || 'Error de conexión al enviar invitación.'
        });
        // Do NOT show success modal or use client-generated URL if API fails
        // The old logic of saving to LocalStorage here with a client token is problematic and removed for now.
        // A more robust offline queueing system would be needed.
      }
    } catch (error) {
      // This catch is for errors in preparing data before API call (e.g. validation, though unlikely here)
      console.error('Error preparing invitation data:', error);
      setNotification({
        type: 'error',
        message: 'Error al preparar los datos de la invitación.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInvitationUrl = () => {
    navigator.clipboard.writeText(successInvitationUrl).then(() => { // Use the temp var
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const deleteInvitation = async (id) => {
    try {
      await axiosClient.delete(`/invitations/${id}`);
      
      // If API call is successful, then remove from local state and localStorage
      setInvitations(prev => prev.filter(inv => inv.id !== id));
      LocalStorage.deleteInvitation(id);
      
      setNotification({
        type: 'success',
        message: 'Invitación eliminada correctamente del servidor.'
      });

    } catch (error) {
      console.error('API delete invitation failed:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error al eliminar la invitación del servidor. Inténtalo de nuevo.'
      });
      // DO NOT remove from local state or LocalStorage if API call fails
    }
  };

  const resendInvitation = async (id) => {
    try {
      const response = await axiosClient.post(`/invitations/${id}/resend`); // API now returns the updated invitation
      
      if (response.status >= 200 && response.status < 300 && response.data) {
        const updatedInvitationFromServer = response.data;

        // Update local state
        setInvitations(prev => prev.map(inv => 
          inv.id === updatedInvitationFromServer.id 
            ? updatedInvitationFromServer 
            : inv
        ));
        
        // Update localStorage
        LocalStorage.updateInvitation(id, updatedInvitationFromServer);
        
        setNotification({
          type: 'success',
          message: 'Invitación reenviada exitosamente. La URL y la fecha de expiración han sido actualizadas.'
        });
      } else {
        console.warn('API resend response not as expected:', response);
        setNotification({
          type: 'error',
          message: 'Respuesta inesperada del servidor al reenviar invitación.'
        });
      }
    } catch (error) {
      console.error('API resend invitation failed:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error al reenviar la invitación. Inténtalo de nuevo.'
      });
    }
  };

  const getFilteredInvitations = () => {
    if (filterStatus === 'all') return invitations;
    return invitations.filter(inv => inv.status === filterStatus);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-badge status-warning',
      accepted: 'status-badge status-present',
      expired: 'status-badge status-absent'
    };
    return badges[status] || 'status-badge status-warning';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      expired: 'Expirada'
    };
    return texts[status] || 'Pendiente';
  };

  if (isLoading) {
    return <PageLoader text="Cargando sistema de invitaciones..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Invitar Usuarios"
        subtitle="Envía invitaciones a padres de familia y personal del colegio para unirse a la plataforma"
        keyboardShortcut="I"
      />

      {/* Notification */}
      {notification.message && (
        <div className={`notification ${notification.type === 'error' ? 'notification-error' : 'notification-success'} animate-fade-in`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'error' ? (
              <FiAlertTriangle className="h-5 w-5" />
            ) : (
              <FiCheck className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Invitation Form */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="icon-container icon-container-lg icon-primary">
              <FiUserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Nueva Invitación</h2>
              <p className="text-sm text-secondary">Paso {currentStep} de 3</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                1
              </div>
              <div className={`flex-1 h-2 rounded-full ${
                currentStep >= 2 
                  ? 'bg-blue-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                2
              </div>
              <div className={`flex-1 h-2 rounded-full ${
                currentStep >= 3 
                  ? 'bg-blue-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between text-xs text-secondary">
              <span>Información básica</span>
              <span>Configuración</span>
              <span>Confirmación</span>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`glass-input ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Nombre"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`glass-input ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Apellido"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`glass-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Tipo de usuario *
                </label>
                <select
                  value={formData.invitationType}
                  onChange={(e) => handleInputChange('invitationType', e.target.value)}
                  className="glass-input"
                >
                  <option value="guardian">Padre de familia / Tutor</option>
                  <option value="staff">Personal del colegio</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Siguiente</span>
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              {formData.invitationType === 'guardian' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Estudiante asociado *
                    </label>
                    <select
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      className={`glass-input ${errors.studentId ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccionar estudiante</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.grade} {student.group}
                        </option>
                      ))}
                    </select>
                    {errors.studentId && (
                      <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Relación con el estudiante *
                    </label>
                    <select
                      value={formData.relationshipType}
                      onChange={(e) => handleInputChange('relationshipType', e.target.value)}
                      className={`glass-input ${errors.relationshipType ? 'border-red-500' : ''}`}
                    >
                      <option value="padre">Padre</option>
                      <option value="madre">Madre</option>
                      <option value="tutor">Tutor legal</option>
                      <option value="abuelo">Abuelo/a</option>
                      <option value="tio">Tío/a</option>
                      <option value="hermano">Hermano/a</option>
                      <option value="otro">Otro familiar</option>
                    </select>
                    {errors.relationshipType && (
                      <p className="text-red-500 text-xs mt-1">{errors.relationshipType}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Cargo / Posición *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className={`glass-input ${errors.position ? 'border-red-500' : ''}`}
                      placeholder="Ej: Director, Maestro, Secretario"
                    />
                    {errors.position && (
                      <p className="text-red-500 text-xs mt-1">{errors.position}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Departamento *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`glass-input ${errors.department ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccionar departamento</option>
                      <option value="administracion">Administración</option>
                      <option value="academico">Académico</option>
                      <option value="preescolar">Preescolar</option>
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                      <option value="servicios">Servicios generales</option>
                      <option value="psicologia">Psicología</option>
                      <option value="enfermeria">Enfermería</option>
                    </select>
                    {errors.department && (
                      <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                    )}
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Siguiente</span>
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card-secondary p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-3">Resumen de la invitación</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Nombre:</span>
                    <span className="text-primary font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Email:</span>
                    <span className="text-primary font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Tipo:</span>
                    <span className="text-primary font-medium">
                      {formData.invitationType === 'guardian' ? 'Padre de familia' : 'Personal del colegio'}
                    </span>
                  </div>
                  {formData.invitationType === 'guardian' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-secondary">Estudiante:</span>
                        <span className="text-primary font-medium">
                          {students.find(s => s.id === parseInt(formData.studentId))?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Relación:</span>
                        <span className="text-primary font-medium capitalize">{formData.relationshipType}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-secondary">Cargo:</span>
                        <span className="text-primary font-medium">{formData.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Departamento:</span>
                        <span className="text-primary font-medium capitalize">{formData.department}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <FiSend className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Invitación'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invitations List */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="icon-container icon-container-md icon-secondary">
                <FiUsers className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-primary">Invitaciones Enviadas</h2>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="glass-input text-sm"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="accepted">Aceptadas</option>
                <option value="expired">Expiradas</option>
              </select>
              <button
                onClick={fetchInitialData}
                className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200"
                title="Actualizar lista"
              >
                <FiRefreshCw className="h-4 w-4 text-muted" />
              </button>
            </div>
          </div>

          <div className="modern-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left w-2/5">Usuario</th>
                  <th className="text-left w-1/5">Tipo</th>
                  <th className="text-center w-1/5">Estado</th>
                  <th className="text-center w-1/5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredInvitations().map((invitation, index, array) => {
                  // Determine which actions to show
                  const showResend = invitation.status === 'pending';
                  const showDelete = true; // Always show delete
                  const actionCount = (showResend ? 1 : 0) + (showDelete ? 1 : 0);
                  
                  return (
                    <tr 
                      key={invitation.id} 
                      className="table-row-hover border-b border-white/5 dark:border-slate-700/30"
                    >
                      <td className={`py-4 ${index === array.length - 1 ? 'rounded-bl-lg' : ''}`}>
                        <div className="min-w-0">
                          <div className="font-medium text-primary truncate">
                            {invitation.firstName} {invitation.lastName}
                          </div>
                          <div className="text-sm text-secondary truncate max-w-xs">
                            {invitation.email}
                          </div>
                          {invitation.student_name && (
                            <div className="text-xs text-muted truncate max-w-xs">
                              Estudiante: {invitation.student_name}
                            </div>
                          )}
                          {invitation.position && (
                            <div className="text-xs text-muted truncate max-w-xs">
                              {invitation.position} - {invitation.department}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`status-badge ${
                          invitation.invitation_type === 'guardian' ? 'status-badge-guardian' : 'status-badge-staff'
                        }`}>
                          {invitation.invitation_type === 'guardian' ? 'Padre/Tutor' : 'Personal'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={getStatusBadge(invitation.status)}>
                          {getStatusText(invitation.status)}
                        </span>
                      </td>
                      <td className={`py-4 ${index === array.length - 1 ? 'rounded-br-lg' : ''}`}>
                        <div className={`flex items-center space-x-2 ${
                          actionCount === 1 ? 'justify-center' : 
                          actionCount === 2 ? 'justify-center' : 
                          'justify-start'
                        }`}>
                          {showResend && (
                            <button
                              onClick={() => resendInvitation(invitation.id)}
                              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200 flex-shrink-0"
                              title="Reenviar invitación"
                            >
                              <FiRefreshCw className="h-4 w-4 text-muted" />
                            </button>
                          )}
                          {showDelete && (
                            <button
                              onClick={() => deleteInvitation(invitation.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors duration-200 flex-shrink-0"
                              title="Eliminar invitación"
                            >
                              <FiTrash2 className="h-4 w-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {getFilteredInvitations().length === 0 && (
              <div className="text-center py-8">
                <FiUsers className="h-12 w-12 text-muted mx-auto mb-3" />
                <p className="text-secondary">
                  {filterStatus === 'all' ? 'No hay invitaciones enviadas' : `No hay invitaciones ${getStatusText(filterStatus).toLowerCase()}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Full screen backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-lg transition-all duration-300"
            onClick={() => {
              setShowSuccessModal(false);
              setCopySuccess(false);
            }}
          />
          
          {/* Modal container for perfect viewport centering */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <div className="glass-card p-6 w-full animate-fade-in-scale shadow-2xl">
                <div className="text-center">
                  <div className="icon-container icon-container-xl icon-success mx-auto mb-4">
                    <FiCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">¡Invitación Enviada!</h3>
                  <p className="text-secondary mb-6">
                    La invitación ha sido enviada exitosamente. El usuario recibirá un correo con las instrucciones.
                  </p>
                  <div className="space-y-3">
                    <div className="glass-card-secondary p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary">URL de invitación:</span>
                        <button
                          onClick={copyInvitationUrl}
                          className="p-1 rounded hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors duration-200"
                        >
                          {copySuccess ? (
                            <FiCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <FiCopy className="h-4 w-4 text-muted" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-primary break-all mt-1">
                        {successInvitationUrl}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        setCopySuccess(false);
                      }}
                      className="btn-primary w-full"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default InviteUsers; 