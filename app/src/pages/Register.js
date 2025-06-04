import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FiCheck, FiAlertTriangle, FiMail, FiUser, FiLock, FiPhone } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [invitationData, setInvitationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Extraer token de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setVerificationError('No se ha proporcionado un token de invitación válido');
      setIsVerifying(false);
    }
  }, [location]);

  // Verificar invitación
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) return;

      try {
        const response = await axios.post(`${API_URL}/invitations/verify`, { token });
        if (response.data.valid) {
          setInvitationData(response.data);
        } else {
          setVerificationError('La invitación no es válida o ha expirado');
        }
      } catch (error) {
        console.error('Error al verificar la invitación:', error);
        setVerificationError('Error al verificar la invitación. Por favor, inténtalo de nuevo.');
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyInvitation();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/invitations/register`, {
        token,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        phone: formData.phone || undefined
      });

      setSubmitSuccess('Tu cuenta ha sido creada con éxito. Serás redirigido al inicio de sesión.');
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error al completar el registro:', error);
      setSubmitError(error.response?.data?.detail || 'Error al completar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar spinner mientras se verifica la invitación
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Verificando invitación...</p>
      </div>
    );
  }

  // Mostrar error si la invitación no es válida
  if (verificationError) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-start mb-6">
          <FiAlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Invitación no válida</p>
            <p>{verificationError}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-16 w-auto"
          src="/logo.svg"
          alt="Lymbus Logo"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Completa tu registro
        </h2>
        {invitationData && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Hola, has sido invitado a unirte como{' '}
            <span className="font-medium">
              {invitationData.invitation_type === 'staff' ? 'personal' : 'tutor/padre de familia'}
            </span>
            <br />
            <span className="text-blue-600">{invitationData.email}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {submitSuccess && (
            <div className="mb-4 p-4 rounded-md bg-green-50 text-green-700 flex">
              <FiCheck className="h-5 w-5 mr-2" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 flex">
              <FiAlertTriangle className="h-5 w-5 mr-2" />
              <span>{submitError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`pl-10 block w-full shadow-sm ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                />
              </div>
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Apellido
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`pl-10 block w-full shadow-sm ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                />
              </div>
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={invitationData?.email || ''}
                  className="pl-10 block w-full shadow-sm border-gray-300 bg-gray-50 text-gray-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 block w-full shadow-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 block w-full shadow-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 block w-full shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completando registro...
                  </>
                ) : (
                  'Completar registro'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 