import React, { memo, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { 
  FiDownload, 
  FiShare2, 
  FiMaximize2,
  FiHash,
  FiX,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useNotification } from './NotificationSystem';

// Memoized QR Code component
const MemoizedQRCode = memo(({ value, size = 80, id, className = "" }) => (
  <div 
    className={`p-2 bg-white rounded-lg shadow-sm flex-shrink-0 ${className}`} 
    id={id}
    style={{ width: size + 16, height: size + 16 }}
  >
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      includeMargin={true}
      fgColor="#1f2937"
      bgColor="#ffffff"
    />
  </div>
));

MemoizedQRCode.displayName = 'MemoizedQRCode';

// Compact QR code display for tables and lists
const InlineQRCode = memo(({ 
  student, 
  size = 80, 
  showActions = true,
  className = "",
  onDownload,
  onShare,
  generateQRData
}) => {
  const { success, error } = useNotification();
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showQR, setShowQR] = useState(true);

  // Generate QR data
  const qrData = generateQRData ? generateQRData(student) : JSON.stringify({
    type: 'student',
    id: student.id,
    timestamp: Date.now(),
    school: 'Lymbus School'
  });

  const handleDownload = useCallback(async () => {
    try {
      if (onDownload) {
        await onDownload(student);
        return;
      }

      // Default download implementation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const qrSize = 400;
      canvas.width = qrSize;
      canvas.height = qrSize + 80;
      
      const qrElement = document.querySelector(`#inline-qr-${student.id} svg`);
      if (!qrElement) {
        error('No se pudo encontrar el código QR');
        return;
      }
      
      const clonedSvg = qrElement.cloneNode(true);
      clonedSvg.setAttribute('width', qrSize.toString());
      clonedSvg.setAttribute('height', qrSize.toString());
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        const sanitizedName = (student.full_name || '').replace(/[<>]/g, '');
        ctx.fillText(sanitizedName, qrSize / 2, qrSize + 30);
        
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`ID: ${student.id}`, qrSize / 2, qrSize + 55);
        
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
      console.error('Error downloading QR:', err);
      error('Error al descargar el código QR');
    }
  }, [student, onDownload, success, error]);

  const handleShare = useCallback(async () => {
    try {
      if (onShare) {
        await onShare(student);
        return;
      }

      // Default share implementation
      if (navigator.share) {
        await navigator.share({
          title: `QR Code - ${student.full_name}`,
          text: `Código QR para ${student.full_name} (ID: ${student.id})`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(`${student.full_name} - ID: ${student.id}\n${window.location.href}`);
        success('Información copiada al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, [student, onShare, success]);

  if (!showQR) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0 ${className}`} 
        style={{ width: size + 16, height: size + 16 }}
      >
        <button
          onClick={() => setShowQR(true)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          title="Mostrar QR"
        >
          <FiEye className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group flex-shrink-0 ${className}`} style={{ width: size + 16, height: size + 16 }}>
        <MemoizedQRCode
          value={qrData}
          size={size}
          id={`inline-qr-${student.id}`}
        />
        
        {showActions && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-1">
            <button
              onClick={handleDownload}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Descargar"
            >
              <FiDownload className="h-3 w-3" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Compartir"
            >
              <FiShare2 className="h-3 w-3" />
            </button>
            
            <button
              onClick={() => setShowFullScreen(true)}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Pantalla completa"
            >
              <FiMaximize2 className="h-3 w-3" />
            </button>
            
            <button
              onClick={() => setShowQR(false)}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-red-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Ocultar QR"
            >
              <FiEyeOff className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {showFullScreen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg transition-all duration-300"
            onClick={() => setShowFullScreen(false)}
          />
          
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <div className="glass-card p-8 w-full animate-fade-in-scale shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {student.full_name}
                  </h3>
                  <button
                    onClick={() => setShowFullScreen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center space-y-4">
                  <MemoizedQRCode
                    value={qrData}
                    size={300}
                    id={`fullscreen-qr-${student.id}`}
                    className="mx-auto"
                  />
                  
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ID: {student.id}
                      {student.grade && ` | ${student.grade}`}
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <FiDownload className="h-4 w-4" />
                        <span>Descargar</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <FiShare2 className="h-4 w-4" />
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

InlineQRCode.displayName = 'InlineQRCode';

export default InlineQRCode; 