import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiCamera, FiX, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiEdit3, FiSearch, FiZap } from 'react-icons/fi';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNotification } from './NotificationSystem';

const EnhancedQRScanner = ({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Escanear Código QR",
  expectedDataType = "student" 
}) => {
  const { success, error } = useNotification();
  const [manualInput, setManualInput] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const qrScannerRef = useRef(null);

  const processQRResult = useCallback((data) => {
    if (!data || data === lastResult) return;
    
    setLastResult(data);
    
    try {
      console.log('📝 Processing QR data:', data, 'Expected type:', expectedDataType);
      
      let parsedData;
      const trimmedData = data.trim();
      
      // Try to parse as JSON first
      try {
        parsedData = JSON.parse(trimmedData);
        console.log('✅ Parsed as JSON:', parsedData);
      } catch {
        console.log('📄 Not JSON, processing as raw data...');
        
        // If not JSON, treat as raw string - could be just a student ID
        if (/^\d+$/.test(trimmedData)) {
          // If it's just a number, assume it's a student ID
          parsedData = { type: 'student', id: parseInt(trimmedData) };
          console.log('🔢 Processed as student ID:', parsedData);
        } else if (trimmedData.length > 0) {
          // For any non-empty string, if we expect a student type, try to extract ID
          if (expectedDataType === 'student') {
            // Try to extract numbers from the string
            const numberMatch = trimmedData.match(/\d+/);
            if (numberMatch) {
              parsedData = { type: 'student', id: parseInt(numberMatch[0]) };
              console.log('🔍 Extracted student ID from string:', parsedData);
            } else {
              parsedData = { type: 'student', raw: trimmedData };
              console.log('📝 Treating as raw student data:', parsedData);
            }
          } else {
            parsedData = { raw: trimmedData };
            console.log('📄 Stored as raw data:', parsedData);
          }
        } else {
          error('Código vacío o inválido');
          return;
        }
      }
      
      console.log('🎯 Final parsed data:', parsedData);
      
      // More flexible validation - if we expect a student type, ensure we have student data
      if (expectedDataType === 'student') {
        if (!parsedData.type) {
          // If no type specified but we expect student, assume it's student data
          parsedData.type = 'student';
        }
        
        if (parsedData.type !== 'student') {
          console.warn('❌ Type mismatch:', parsedData.type, 'expected:', expectedDataType);
          error(`Código QR inválido. Se esperaba tipo "${expectedDataType}"`);
          return;
        }
        
        // Ensure we have some form of student identifier
        if (!parsedData.id && !parsedData.raw) {
          console.warn('❌ No student identifier found');
          error('Código QR no contiene información de alumno válida');
          return;
        }
      }
      
      console.log('✅ Validation passed, sending data to parent');
      // Don't show success message here - let the parent handle all messaging
      onScan(parsedData);
      onClose();
      
    } catch (err) {
      console.error('❌ Error processing QR result:', err);
      error('Error al procesar el código QR');
    }
  }, [lastResult, expectedDataType, onScan, onClose, success, error]);

  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      processQRResult(manualInput.trim());
    }
  }, [manualInput, processQRResult]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  }, [handleManualSubmit]);

  const handleClose = useCallback(() => {
    setManualInput('');
    setLastResult(null);
    setCameraError(null);
    setShowManualInput(false);
    setIsScanning(false);
    setScannerReady(false);
    
    // Clean up QR scanner
    if (qrScannerRef.current) {
      qrScannerRef.current.clear().catch(console.error);
      qrScannerRef.current = null;
    }
    
    onClose();
  }, [onClose]);

  // Initialize QR scanner when modal opens
  useEffect(() => {
    if (isOpen && !showManualInput && !qrScannerRef.current) {
      setIsScanning(true);
      setScannerReady(false);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const config = {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          rememberLastUsedCamera: true,
          // Custom styling for professional look
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        const scanner = new Html5QrcodeScanner(
          'qr-scanner-container',
          config,
          false
        );

        scanner.render(
          (decodedText) => {
            console.log('QR Code scanned:', decodedText);
            setIsScanning(false);
            processQRResult(decodedText);
          },
          (error) => {
            // Handle scan errors - usually not critical
            console.debug('QR scan error:', error);
          }
        );

        qrScannerRef.current = scanner;
        setScannerReady(true);
        setIsScanning(false);
        setCameraError(null);
      }, 100);
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(console.error);
        qrScannerRef.current = null;
      }
    };
  }, [isOpen, showManualInput, processQRResult]);

  // Handle camera initialization errors
  useEffect(() => {
    if (isOpen) {
      // Check for camera permissions
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(() => {
          setCameraError(null);
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setCameraError('No se pudo acceder a la cámara. Usa la entrada manual.');
          setShowManualInput(true);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Simple backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-lg transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* Modal container for perfect viewport centering */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="glass-card p-8 w-full animate-fade-in-scale shadow-2xl">
            {/* Simple header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
                         {/* Camera Scanner or Manual Input */}
             {showManualInput ? (
               <div className="mb-6">
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                     Código QR o ID del alumno
                   </label>
                   <input
                     type="text"
                     value={manualInput}
                     onChange={(e) => setManualInput(e.target.value)}
                     onKeyPress={handleKeyPress}
                     placeholder="Introduce el código aquí..."
                     className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     autoFocus
                   />
                 </div>
                 
                 <button
                   onClick={handleManualSubmit}
                   disabled={!manualInput.trim()}
                   className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2 mb-3"
                 >
                   <FiCheckCircle className="h-4 w-4" />
                   <span>Procesar</span>
                 </button>
                 
                 {/* Switch to camera option */}
                 <div className="text-center">
                   <button
                     onClick={() => setShowManualInput(false)}
                     className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-2 mx-auto"
                   >
                     <FiCamera className="h-4 w-4" />
                     <span>Usar cámara</span>
                   </button>
                 </div>
               </div>
            ) : (
              <div className="mb-6">
                {/* Loading state */}
                {isScanning && (
                  <div className="text-center py-4 mb-4">
                    <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Iniciando cámara...</span>
                    </div>
                  </div>
                )}
                
                {/* QR Scanner Container */}
                <div 
                  id="qr-scanner-container" 
                  ref={scannerRef}
                  className="w-full"
                />
                
                {/* Camera error */}
                {cameraError && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
                    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center">
                      <FiAlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      {cameraError}
                    </p>
                  </div>
                )}
                
                {/* Manual input option */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-2 mx-auto"
                  >
                    <FiEdit3 className="h-4 w-4" />
                    <span>Entrada manual</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Simple help text */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {showManualInput 
                  ? 'Introduce el código QR completo o simplemente el ID del alumno.'
                  : 'Apunta la cámara hacia el código QR del alumno.'
                }
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {showManualInput 
                  ? 'Ejemplo: 12345 o código QR completo'
                  : 'Asegúrate de que haya buena iluminación'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EnhancedQRScanner; 