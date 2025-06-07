import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiArrowRight, 
  FiMapPin, 
  FiUsers, 
  FiClock, 
  FiCheckCircle, 
  FiPlay, 
  FiPause, 
  FiRefreshCw, 
  FiSettings,
  FiUser,
  FiTruck,
  FiPhone,
  FiSend,
  FiEye,
  FiArrowLeft
} from 'react-icons/fi';
import { useNotification } from './NotificationSystem';

const PickupWorkflowDemo = () => {
  const { success, info, warning } = useNotification();
  
  // Workflow states
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [studentsInQueue, setStudentsInQueue] = useState([]);
  const [completedPickups, setCompletedPickups] = useState([]);
  const [autoInterval, setAutoInterval] = useState(null);
  const [workflowStats, setWorkflowStats] = useState({
    totalProcessed: 0,
    averageTime: 0,
    currentWaitTime: 0,
    efficiency: 0
  });

  // Workflow steps definition
  const workflowSteps = [
    {
      id: 0,
      title: 'Llegada de Padres',
      description: 'Padres llegan y se registran en el sistema',
      icon: FiUser,
      color: 'blue',
      duration: 3000,
      autoAction: () => addParentArrival()
    },
    {
      id: 1,
      title: 'Verificación de Identidad',
      description: 'Se verifica la identidad del padre/tutor',
      icon: FiEye,
      color: 'orange',
      duration: 2000,
      autoAction: () => verifyParentIdentity()
    },
    {
      id: 2,
      title: 'Localización de alumno',
      description: 'Se localiza al alumno en el aula correspondiente',
      icon: FiMapPin,
      color: 'purple',
      duration: 4000,
      autoAction: () => locateStudent()
    },
    {
      id: 3,
      title: 'Notificación a Maestro',
      description: 'Se notifica al maestro para preparar al alumno',
      icon: FiSend,
      color: 'teal',
      duration: 2500,
      autoAction: () => notifyTeacher()
    },
    {
      id: 4,
      title: 'Preparación de alumno',
      description: 'El maestro prepara al alumno para la salida',
      icon: FiUsers,
      color: 'green',
      duration: 3500,
      autoAction: () => prepareStudent()
    },
    {
      id: 5,
      title: 'Traslado a Punto de Recogida',
      description: 'El alumno es trasladado al área de recogida',
      icon: FiTruck,
      color: 'indigo',
      duration: 2000,
      autoAction: () => moveToPickupArea()
    },
    {
      id: 6,
      title: 'Entrega del alumno',
      description: 'Se realiza la entrega segura del alumno',
      icon: FiCheckCircle,
      color: 'emerald',
      duration: 1500,
      autoAction: () => completePickup()
    }
  ];

  // Sample students data
  const sampleStudents = [
    { id: 1, name: 'Ana Martínez', grade: 'Kínder 1A', parent: 'María González' },
    { id: 2, name: 'Carlos Rodríguez', grade: '1° Grado A', parent: 'José Rodríguez' },
    { id: 3, name: 'Sofia López', grade: 'Kínder 2B', parent: 'Carmen López' },
    { id: 4, name: 'Diego Hernández', grade: '2° Grado A', parent: 'Ana Hernández' },
    { id: 5, name: 'Valentina Castro', grade: '1° Grado B', parent: 'Luis Castro' }
  ];

  // Auto workflow functions
  const addParentArrival = useCallback(() => {
    const student = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
    const newRequest = {
      id: Date.now(),
      student: student.name,
      grade: student.grade,
      parent: student.parent,
      arrivalTime: new Date(),
      currentStep: 0,
      status: 'En proceso'
    };
    
    setStudentsInQueue(prev => [...prev, newRequest]);
    info(`${student.parent} ha llegado a recoger a ${student.name}`);
  }, [info]);

  const verifyParentIdentity = useCallback(() => {
    setStudentsInQueue(prev => prev.map(student => 
      student.currentStep === 0 ? { ...student, currentStep: 1 } : student
    ));
    info('Identidad verificada correctamente');
  }, [info]);

  const locateStudent = useCallback(() => {
    setStudentsInQueue(prev => prev.map(student => 
      student.currentStep === 1 ? { ...student, currentStep: 2 } : student
    ));
    info('alumno localizado en el aula');
  }, [info]);

  const notifyTeacher = useCallback(() => {
    setStudentsInQueue(prev => prev.map(student => 
      student.currentStep === 2 ? { ...student, currentStep: 3 } : student
    ));
    success('Maestro notificado exitosamente');
  }, [success]);

  const prepareStudent = useCallback(() => {
    setStudentsInQueue(prev => prev.map(student => 
      student.currentStep === 3 ? { ...student, currentStep: 4 } : student
    ));
    info('alumno preparado para la salida');
  }, [info]);

  const moveToPickupArea = useCallback(() => {
    setStudentsInQueue(prev => prev.map(student => 
      student.currentStep === 4 ? { ...student, currentStep: 5 } : student
    ));
    info('alumno en camino al punto de recogida');
  }, [info]);

  const completePickup = useCallback(() => {
    setStudentsInQueue(prev => {
      const completedStudent = prev.find(student => student.currentStep === 5);
      if (completedStudent) {
        const completed = {
          ...completedStudent,
          currentStep: 6,
          completedTime: new Date(),
          duration: new Date() - completedStudent.arrivalTime
        };
        
        setCompletedPickups(prevCompleted => [completed, ...prevCompleted.slice(0, 4)]);
        success(`Recogida de ${completedStudent.student} completada exitosamente`);
        
        // Update stats
        setWorkflowStats(prevStats => ({
          totalProcessed: prevStats.totalProcessed + 1,
          averageTime: (prevStats.averageTime + completed.duration / 1000) / 2,
          currentWaitTime: Math.max(0, prevStats.currentWaitTime - 30),
          efficiency: Math.min(100, prevStats.efficiency + 2)
        }));
      }
      
      return prev.filter(student => student.currentStep < 5);
    });
  }, [success]);

  // Auto workflow control
  const startAutoWorkflow = () => {
    setIsAutoRunning(true);
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = (prev + 1) % workflowSteps.length;
        const step = workflowSteps[nextStep];
        if (step.autoAction) {
          setTimeout(() => step.autoAction(), 500);
        }
        return nextStep;
      });
    }, 3000);
    
    setAutoInterval(interval);
    success('Flujo de trabajo automático iniciado');
  };

  const pauseAutoWorkflow = () => {
    setIsAutoRunning(false);
    if (autoInterval) {
      clearInterval(autoInterval);
      setAutoInterval(null);
    }
    warning('Flujo de trabajo pausado');
  };

  const resetWorkflow = () => {
    pauseAutoWorkflow();
    setCurrentStep(0);
    setStudentsInQueue([]);
    setCompletedPickups([]);
    setWorkflowStats({
      totalProcessed: 0,
      averageTime: 0,
      currentWaitTime: 0,
      efficiency: 0
    });
    info('Flujo de trabajo reiniciado');
  };

  // Manual step control
  const goToStep = (stepIndex) => {
    if (!isAutoRunning) {
      setCurrentStep(stepIndex);
      const step = workflowSteps[stepIndex];
      if (step.autoAction) {
        step.autoAction();
      }
    }
  };

  const nextStep = () => {
    if (!isAutoRunning) {
      const nextStepIndex = (currentStep + 1) % workflowSteps.length;
      goToStep(nextStepIndex);
    }
  };

  const previousStep = () => {
    if (!isAutoRunning) {
      const prevStepIndex = currentStep === 0 ? workflowSteps.length - 1 : currentStep - 1;
      goToStep(prevStepIndex);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoInterval) {
        clearInterval(autoInterval);
      }
    };
  }, [autoInterval]);

  // Update workflow stats periodically
  useEffect(() => {
    const statsInterval = setInterval(() => {
      setWorkflowStats(prev => ({
        ...prev,
        currentWaitTime: Math.max(0, prev.currentWaitTime + (studentsInQueue.length > 0 ? 5 : -2)),
        efficiency: Math.min(100, Math.max(0, prev.efficiency + (studentsInQueue.length < 3 ? 1 : -1)))
      }));
    }, 5000);

    return () => clearInterval(statsInterval);
  }, [studentsInQueue.length]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="icon-container icon-container-md icon-primary">
            <FiTruck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">Flujo de Trabajo de Recogida</h3>
            <p className="text-sm text-secondary">
              Sistema de coordinación automática y manual para el proceso de recogida
            </p>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center space-x-2">
          {!isAutoRunning ? (
            <button
              onClick={startAutoWorkflow}
              className="btn-success flex items-center space-x-2"
            >
              <FiPlay className="h-4 w-4" />
              <span>Automático</span>
            </button>
          ) : (
            <button
              onClick={pauseAutoWorkflow}
              className="btn-warning flex items-center space-x-2"
            >
              <FiPause className="h-4 w-4" />
              <span>Pausar</span>
            </button>
          )}
          <button
            onClick={resetWorkflow}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card-secondary p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary">Procesados</span>
            <FiCheckCircle className="h-4 w-4 text-success-600 dark:text-success-400" />
          </div>
          <div className="text-lg font-bold text-primary">{workflowStats.totalProcessed}</div>
        </div>
        <div className="glass-card-secondary p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary">Tiempo Prom.</span>
            <FiClock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-primary">{Math.round(workflowStats.averageTime)}s</div>
        </div>
        <div className="glass-card-secondary p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary">En Cola</span>
            <FiUsers className="h-4 w-4 text-warning-600 dark:text-warning-400" />
          </div>
          <div className="text-lg font-bold text-primary">{studentsInQueue.length}</div>
        </div>
        <div className="glass-card-secondary p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary">Eficiencia</span>
            <FiSettings className="h-4 w-4 text-success-600 dark:text-success-400" />
          </div>
          <div className="text-lg font-bold text-primary">{Math.round(workflowStats.efficiency)}%</div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-primary">Pasos del Proceso</h4>
          {!isAutoRunning && (
            <div className="flex items-center space-x-1">
              <button
                onClick={previousStep}
                className="p-1 rounded hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
                title="Paso anterior"
              >
                <FiArrowLeft className="h-4 w-4 text-muted" />
              </button>
              <button
                onClick={nextStep}
                className="p-1 rounded hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
                title="Siguiente paso"
              >
                <FiArrowRight className="h-4 w-4 text-muted" />
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {workflowSteps.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = (!isAutoRunning && currentStep > index) || (isAutoRunning && currentStep > index);
            const IconComponent = step.icon;
            
            return (
              <div
                key={step.id}
                onClick={() => !isAutoRunning && goToStep(index)}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-lg transform scale-[1.02]' 
                    : isCompleted
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/30 hover:bg-white/50 dark:hover:bg-slate-700/30'
                }`}
              >
                <div className={`icon-container-md ${
                  isActive 
                    ? `icon-${step.color}` 
                    : isCompleted 
                    ? 'icon-success' 
                    : 'icon-secondary'
                } ${isActive ? 'animate-bounce-subtle' : ''}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : 
                    isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 
                    'text-primary'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-sm ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 
                    isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 
                    'text-secondary'
                  }`}>
                    {step.description}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isCompleted && <FiCheckCircle className="h-5 w-5 text-emerald-500" />}
                  {isActive && isAutoRunning && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  )}
                  <span className="text-xs text-muted font-medium">
                    {Math.round(step.duration / 1000)}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Queue and Completed Pickups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Queue */}
        <div>
          <h4 className="font-semibold text-primary mb-3 flex items-center space-x-2">
            <FiClock className="h-4 w-4" />
            <span>Cola Actual ({studentsInQueue.length})</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {studentsInQueue.length === 0 ? (
              <div className="text-center py-6 text-secondary">
                <FiUsers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay recogidas en proceso</p>
              </div>
            ) : (
              studentsInQueue.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-primary truncate">{student.student}</div>
                    <div className="text-xs text-secondary">{student.grade} • {student.parent}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      Paso {student.currentStep + 1}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Completions */}
        <div>
          <h4 className="font-semibold text-primary mb-3 flex items-center space-x-2">
            <FiCheckCircle className="h-4 w-4" />
            <span>Completadas Recientes</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {completedPickups.length === 0 ? (
              <div className="text-center py-6 text-secondary">
                <FiCheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aún no hay recogidas completadas</p>
              </div>
            ) : (
              completedPickups.map((pickup) => (
                <div key={pickup.id} className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-primary truncate">{pickup.student}</div>
                    <div className="text-xs text-secondary">{pickup.grade} • {pickup.parent}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                      {Math.round(pickup.duration / 1000)}s
                    </span>
                    <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupWorkflowDemo; 