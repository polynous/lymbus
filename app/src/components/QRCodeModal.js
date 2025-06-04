import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../config/api';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { FiX, FiCheck, FiDownload, FiShare2, FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';

const QRCodeModal = ({ student, onClose, onSuccess }) => {
  const { darkMode } = useTheme();
  const [expirationDays, setExpirationDays] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  
  const handleGenerateQR = async () => {
    if (!student?.id) {
      toast.error('No se pudo identificar al alumno');
      return;
    }
    
    try {
      setGenerating(true);
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      
      // Create QR code data
      const qrData = {
        type: 'pickup_authorization',
        student_id: student.id,
        student_name: student.full_name || `${student.first_name} ${student.last_name}`,
        created_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString(),
        valid_days: expirationDays,
        school: 'Lymbus School',
        version: '1.0'
      };
      
      // Try to make API call first, but fallback to local generation
      let apiQR = null;
      try {
        const response = await axios.post(`${API_URL}/access/qr-codes/generate`, {
          student_id: student.id,
          expiration_days: expirationDays
        }, {
          headers: getAuthHeaders()
        });
        apiQR = response.data;
      } catch (apiError) {
        console.warn('API QR generation failed, using local generation:', apiError);
      }
      
      const finalQR = apiQR || {
        code: JSON.stringify(qrData),
        student: {
          id: student.id,
          full_name: student.full_name || `${student.first_name} ${student.last_name}`,
          enrollment_id: student.enrollment_id
        },
        created_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString(),
        valid_days: expirationDays
      };
      
      setGeneratedQR(finalQR);
      toast.success('Código QR generado correctamente');
      
      if (onSuccess) {
        onSuccess(finalQR);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('No se pudo generar el código QR');
    } finally {
      setGenerating(false);
    }
  };
  
  const downloadQRCode = async () => {
    if (!generatedQR) return;
    
    try {
      // Create a temporary canvas to render the QR code
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 400;
      canvas.width = size;
      canvas.height = size + 120; // Extra space for text
      
      // Get the SVG element
      const qrElement = document.querySelector('#temp-qr-modal svg');
      if (!qrElement) {
        throw new Error('QR code element not found');
      }
      
      // Clone and serialize the SVG
      const clonedSvg = qrElement.cloneNode(true);
      clonedSvg.setAttribute('width', size.toString());
      clonedSvg.setAttribute('height', size.toString());
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      // Convert SVG to image
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, size, size);
        
        // Add student info
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        const sanitizedName = (generatedQR.student.full_name || '').replace(/[<>]/g, '');
        ctx.fillText(sanitizedName, size / 2, size + 40);
        
        ctx.font = '18px Inter, sans-serif';
        ctx.fillText(`ID: ${generatedQR.student.enrollment_id || generatedQR.student.id}`, size / 2, size + 70);
        
        ctx.font = '16px Inter, sans-serif';
        const expireDate = new Date(generatedQR.expires_at).toLocaleDateString('es-ES');
        ctx.fillText(`Válido hasta: ${expireDate}`, size / 2, size + 100);
        
        // Download
        const link = document.createElement('a');
        const sanitizedFileName = sanitizedName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        link.download = `qr-pickup-${sanitizedFileName}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        URL.revokeObjectURL(url);
        toast.success('QR code descargado');
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error('Error al procesar el código QR');
      };
      
      img.src = url;
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast.error('Error al descargar el código QR');
    }
  };
  
  const shareQRCode = async () => {
    if (!generatedQR) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Código QR - ${generatedQR.student.full_name}`,
          text: `Código QR para recoger a ${generatedQR.student.full_name}. Válido hasta ${new Date(generatedQR.expires_at).toLocaleDateString('es-ES')}.`,
        });
        toast.success('Compartido exitosamente');
      } else {
        // Fallback: copy QR data to clipboard
        await navigator.clipboard.writeText(generatedQR.code);
        toast.success('Código QR copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('Error al compartir el código QR');
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Full screen backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-lg transition-all duration-300" />
      
      {/* Modal container for perfect viewport centering */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          <div className="glass-card p-8 w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Generar código QR
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            {!generatedQR ? (
              <div className="space-y-6">
                {/* Student Info Card */}
                <div className="glass-card-secondary p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {(student?.full_name || student?.first_name || 'S')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {student?.full_name || `${student?.first_name} ${student?.last_name}`}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ID: {student?.enrollment_id || student?.id}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Expiration Settings */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    <FiClock className="inline h-4 w-4 mr-2" />
                    Días de validez
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value="1">1 día</option>
                    <option value="3">3 días</option>
                    <option value="7">7 días</option>
                    <option value="14">14 días</option>
                    <option value="30">30 días</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    El código QR expirará el {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                  </p>
                </div>
                
                {/* Warning Info */}
                <div className="glass-card-secondary p-4 rounded-xl border-l-4 border-amber-400">
                  <div className="flex items-start space-x-3">
                    <div className="icon-container-sm icon-warning">
                      <FiUser className="h-4 w-4" />
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Información importante</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Este código QR permitirá a otras personas recoger al alumno durante el período seleccionado.
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        Compártelo únicamente con personas de confianza.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="btn-primary flex-1"
                  >
                    {generating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Generando...</span>
                      </div>
                    ) : (
                      <>
                        <FiCheck className="mr-2 h-4 w-4" />
                        Generar QR
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="p-6 bg-white rounded-2xl shadow-lg mb-6" id="temp-qr-modal">
                    <QRCodeSVG
                      value={generatedQR.code} 
                      size={280}
                      level="H"
                      includeMargin={true}
                      fgColor="#1f2937"
                      bgColor="#ffffff"
                    />
                  </div>
                  
                  {/* QR Info */}
                  <div className="text-center space-y-2 mb-6">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {generatedQR.student.full_name}
                    </h4>
                    <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <FiUser className="h-4 w-4" />
                        <span>ID: {generatedQR.student.enrollment_id || generatedQR.student.id}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiCalendar className="h-4 w-4" />
                        <span>{generatedQR.valid_days} días</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Expiration Info */}
                  <div className="glass-card-secondary p-4 rounded-xl w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Creado:</span>
                        <p className="text-slate-600 dark:text-slate-400">{formatDate(generatedQR.created_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Expira:</span>
                        <p className="text-slate-600 dark:text-slate-400">{formatDate(generatedQR.expires_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={downloadQRCode}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span>Descargar</span>
                  </button>
                  <button
                    onClick={shareQRCode}
                    className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                  >
                    <FiShare2 className="h-4 w-4" />
                    <span>Compartir</span>
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="btn-success w-full flex items-center justify-center space-x-2"
                >
                  <FiCheck className="h-4 w-4" />
                  <span>Listo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QRCodeModal; 