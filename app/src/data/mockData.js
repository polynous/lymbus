// Centralized Mock Data for Lymbus School Management System
// This ensures all components use the same students, statistics, and information

// Extended student list with full counts for each grade
const generateStudentsForGrade = (gradeInfo, startId) => {
  const baseNames = [
    "Alejandro", "Sofia", "Mateo", "Valentina", "Sebastian", "Camila", "Nicolas", "Isabella", 
    "Diego", "Martina", "Leonardo", "Lucia", "Gabriel", "Elena", "Emilio", "Adriana",
    "Santiago", "Antonella", "Maximiliano", "Ana", "Carlos", "Valeria", "Pablo", "Emma"
  ];
  
  const lastNames = [
    "Martinez Lopez", "Hernandez Garcia", "Rodriguez Torres", "Sanchez Morales", "Gonzalez Castro",
    "Ramirez Ortega", "Flores Herrera", "Vargas Medina", "Castro Delgado", "Moreno Aguilar",
    "Jimenez Romero", "Gutierrez Silva", "Perez Navarro", "Ruiz Campos", "Fernandez Vega",
    "Lopez Torres", "Garcia Herrera", "Torres Gonzalez", "Santos Garcia", "Moreno Ruiz"
  ];

  const parentNames = [
    "Carmen Lopez Ruiz", "Luis Hernandez Silva", "Ana Torres Mendez", "Pedro Sanchez Vega",
    "Maria Castro Jimenez", "Jose Ramirez Luna", "Sandra Herrera Ramos", "Carlos Vargas Espinoza",
    "Lucia Delgado Torres", "Miguel Moreno Cruz", "Elena Romero Santos", "Roberto Gutierrez Diaz"
  ];

  const students = [];
  for (let i = 0; i < gradeInfo.total; i++) {
    const isPresent = i < gradeInfo.present;
    students.push({
      id: startId + i,
      name: `${baseNames[i % baseNames.length]} ${lastNames[i % lastNames.length]}`,
      full_name: `${baseNames[i % baseNames.length]} ${lastNames[i % lastNames.length]}`,
      grade: gradeInfo.grade,
      group: gradeInfo.groups[i % gradeInfo.groups.length],
      status: isPresent ? "present" : "absent",
      parent_name: parentNames[i % parentNames.length],
      parent_phone: `+34 ${600 + Math.floor(Math.random() * 99)} ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 900) + 100)}`,
      classroom: gradeInfo.classroom,
      arrival_time: isPresent ? `08:${String(5 + Math.floor(Math.random() * 20)).padStart(2, '0')}` : null,
      photo: "/api/placeholder/60/60",
      enrollment_id: `E${String(startId + i).padStart(4, '0')}`
    });
  }
  return students;
};

// Grade configuration matching ACTUAL DATABASE STRUCTURE (330 students total, 96 present)
const gradeConfigs = [
  { grade: "Kínder 1", total: 30, present: 8, groups: ["K1A", "K1B"], classroom: "Aula Infantil 1" },
  { grade: "Kínder 2", total: 32, present: 9, groups: ["K2A", "K2B"], classroom: "Aula Infantil 2" },
  { grade: "Kínder 3", total: 34, present: 10, groups: ["K3A", "K3B"], classroom: "Aula Infantil 3" },
  { grade: "1er Grado", total: 38, present: 12, groups: ["1A", "1B"], classroom: "Aula 1" },
  { grade: "2do Grado", total: 42, present: 14, groups: ["2A", "2B"], classroom: "Aula 2" },
  { grade: "3er Grado", total: 40, present: 13, groups: ["3A", "3B"], classroom: "Aula 3" },
  { grade: "4to Grado", total: 36, present: 11, groups: ["4A", "4B"], classroom: "Aula 4" },
  { grade: "5to Grado", total: 38, present: 10, groups: ["5A", "5B"], classroom: "Aula 5" },
  { grade: "6to Grado", total: 40, present: 9, groups: ["6A", "6B"], classroom: "Aula 6" }
];

// Generate complete student list
export const allStudents = (() => {
  let students = [];
  let currentId = 1000;
  
  gradeConfigs.forEach(gradeConfig => {
    const gradeStudents = generateStudentsForGrade(gradeConfig, currentId);
    students = students.concat(gradeStudents);
    currentId += gradeConfig.total;
  });
  
  return students;
})();

// Grade statistics for Dashboard
export const mockGradeStats = gradeConfigs.map(config => ({
  grade: config.grade,
  total: config.total,
  present: config.present,
  entries: config.present, // All present students have entered
  exits: Math.floor(config.present * 0.7), // 70% have exited
  attendanceRate: Number(((config.present / config.total) * 100).toFixed(1))
}));

// Teacher schedule and group assignments
export const mockTeacherSchedule = {
  current_groups: ['6A', '6B', '5A', '5B'],
  schedule: {
    '6A': { subject: 'MATEMÁTICAS', location: 'Aula 601', exit: 'Salida Principal' },
    '6B': { subject: 'CIENCIAS NATURALES', location: 'Aula 602', exit: 'Salida Norte' },
    '5A': { subject: 'LENGUA ESPAÑOLA', location: 'Aula 501', exit: 'Salida Principal' },
    '5B': { subject: 'EDUCACIÓN FÍSICA', location: 'Patio Principal', exit: 'Salida Sur' }
  }
};

// Parent arrivals for pickup coordination
export const mockParentArrivals = [
  {
    id: 1,
    parent_name: "Maria Gonzalez",
    parent_phone: "+34 654 321 987",
    student_ids: [6002, 6003],
    student_names: ["Ana Gonzalez Rivera", "Carlos Gonzalez Rivera"],
    arrived_at: new Date(Date.now() - 15 * 60000).toISOString(),
    location: "Entrada principal",
    arrival_method: "driving"
  },
  {
    id: 2,
    parent_name: "Jose Rodriguez Morales",
    parent_phone: "+34 666 555 444",
    student_ids: [4001],
    student_names: ["Lucia Rodriguez Morales"],
    arrived_at: new Date(Date.now() - 8 * 60000).toISOString(),
    location: "Parking lateral",
    arrival_method: "walking"
  },
  {
    id: 3,
    parent_name: "Rosa Fernandez Lopez",
    parent_phone: "+34 654 321 987",
    student_ids: [7001],
    student_names: ["Pablo Martinez Fernandez"],
    arrived_at: new Date(Date.now() - 3 * 60000).toISOString(),
    location: "Entrada principal",
    arrival_method: "qr_scan"
  }
];

// Pickup queue for coordination page
export const mockPickupQueue = [
  {
    id: 1,
    student_id: 6002,
    student_name: "Ana Gonzalez Rivera",
    parent_id: 1,
    parent_name: "Maria Gonzalez",
    classroom: "5º A",
    requested_at: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "ready"
  },
  {
    id: 2,
    student_id: 4001,
    student_name: "Lucia Rodriguez Morales",
    parent_id: 2,
    parent_name: "Jose Rodriguez Morales",
    classroom: "3º A",
    requested_at: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "requested"
  }
];

// Completed pickups
export const mockCompletedPickups = [
  {
    id: 1,
    student_name: "Santiago Martinez Silva",
    parent_name: "Laura Martinez Vila",
    completed_at: new Date(Date.now() - 120 * 60000).toISOString(),
    pickup_time: "14:30"
  },
  {
    id: 2,
    student_name: "Antonella Garcia Herrera",
    parent_name: "David Garcia Moreno",
    completed_at: new Date(Date.now() - 90 * 60000).toISOString(),
    pickup_time: "14:45"
  },
  {
    id: 3,
    student_name: "Maximiliano Torres Gonzalez",
    parent_name: "Isabel Torres Alba",
    completed_at: new Date(Date.now() - 60 * 60000).toISOString(),
    pickup_time: "15:00"
  }
];

// Teacher pickup requests (filtered by group)
export const mockPickupRequests = [
  {
    id: 1,
    student_id: 7001,
    student_name: "Pablo Martinez Fernandez",
    student_photo: "/api/placeholder/60/60",
    group: "6A",
    parent_name: "Rosa Fernandez Lopez",
    parent_phone: "+34 654 321 987",
    requested_at: new Date(Date.now() - 10 * 60000).toISOString(),
    priority: "normal",
    status: "pending",
    activity: "MATEMÁTICAS",
    time: "2:56 p.m.",
    exit_assigned: null
  },
  {
    id: 2,
    student_id: 7002,
    student_name: "Emma Rodriguez Silva",
    student_photo: "/api/placeholder/60/60",
    group: "6B", 
    parent_name: "Carlos Silva Torres",
    parent_phone: "+34 666 555 444",
    requested_at: new Date(Date.now() - 5 * 60000).toISOString(),
    priority: "urgent",
    status: "in_transit",
    activity: "CIENCIAS NATURALES", 
    time: "2:54 p.m.",
    exit_assigned: "Salida Norte",
    vehicle_info: "Nissan, Marrón teja - WK4462B"
  },
  {
    id: 3,
    student_id: 7003,
    student_name: "Miguel Santos Garcia",
    student_photo: "/api/placeholder/60/60",
    group: "6A",
    parent_name: "Patricia Garcia Morales", 
    parent_phone: "+34 677 888 999",
    requested_at: new Date(Date.now() - 3 * 60000).toISOString(),
    priority: "normal",
    status: "in_transit",
    activity: "MATEMÁTICAS",
    time: "2:54 p.m.",
    exit_assigned: "Salida Principal",
    vehicle_info: "Honda, Gris suave - XA5362B"
  },
  {
    id: 4,
    student_id: 7004,
    student_name: "Daniela Moreno Ruiz",
    student_photo: "/api/placeholder/60/60", 
    group: "6B",
    parent_name: "Antonio Ruiz Delgado",
    parent_phone: "+34 688 777 555",
    requested_at: new Date(Date.now() - 2 * 60000).toISOString(),
    priority: "normal",
    status: "in_transit",
    activity: "CIENCIAS NATURALES",
    time: "2:55 p.m.",
    exit_assigned: "Salida Norte"
  },
  {
    id: 5,
    student_id: 7005,
    student_name: "Andrea Ruiz Morales", 
    student_photo: "/api/placeholder/60/60",
    group: "6B",
    parent_name: "Beatriz Morales Vega",
    parent_phone: "+34 699 888 444",
    requested_at: new Date(Date.now() - 1 * 60000).toISOString(),
    priority: "normal", 
    status: "in_transit",
    activity: "CIENCIAS NATURALES",
    time: "2:55 p.m.",
    exit_assigned: "Salida Norte"
  }
];

// Group statistics for teacher interface
export const mockGroupStats = {
  total_students: 41, // 6to Grado total
  pickup_requests: 1,
  in_transit: 4,
  completed: 0
};

// Invitation system mock data
export const mockInvitations = [
  {
    id: 1,
    email: "carmen.lopez@email.com",
    firstName: "Carmen",
    lastName: "Lopez Ruiz",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [1001],
    student_name: "Sofia Martinez Lopez",
    relationship: "madre",
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    email: "profesor.matematicas@colegio.edu",
    firstName: "Roberto",
    lastName: "Gutierrez Silva",
    invitation_type: "staff",
    user_type: "staff",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: "accepted",
    student_ids: [],
    position: "Profesor de Matemáticas",
    department: "academico",
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    email: "luis.hernandez@email.com",
    firstName: "Luis",
    lastName: "Hernandez Silva",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin", 
    invited_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [1002],
    student_name: "Diego Hernandez Garcia",
    relationship: "padre",
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    email: "ana.torres@email.com",
    firstName: "Ana",
    lastName: "Torres Mendez",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: "accepted",
    student_ids: [1003],
    student_name: "Valeria Rodriguez Torres",
    relationship: "madre",
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    email: "profesora.ciencias@colegio.edu",
    firstName: "Elena",
    lastName: "Romero Santos",
    invitation_type: "staff",
    user_type: "staff",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [],
    position: "Profesora de Ciencias",
    department: "academico",
    expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    email: "pedro.sanchez@email.com",
    firstName: "Pedro",
    lastName: "Sanchez Vega",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    status: "expired",
    student_ids: [1004],
    student_name: "Mateo Sanchez Morales",
    relationship: "padre",
    expires_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 7,
    email: "secretaria@colegio.edu",
    firstName: "Patricia",
    lastName: "Navarro Leon",
    invitation_type: "staff",
    user_type: "staff",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "accepted",
    student_ids: [],
    position: "Secretaria Académica",
    department: "administracion",
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8,
    email: "maria.castro@email.com",
    firstName: "Maria",
    lastName: "Castro Jimenez",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [1005],
    student_name: "Isabella Gonzalez Castro",
    relationship: "madre",
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 9,
    email: "director@colegio.edu",
    firstName: "Miguel",
    lastName: "Lopez Torres",
    invitation_type: "staff",
    user_type: "staff",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "accepted",
    student_ids: [],
    position: "Director Académico",
    department: "administracion",
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 10,
    email: "jose.ramirez@email.com",
    firstName: "Jose",
    lastName: "Ramirez Luna",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [2001],
    student_name: "Alejandro Ramirez Ortega",
    relationship: "padre",
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 11,
    email: "psicologa@colegio.edu",
    firstName: "Sandra",
    lastName: "Herrera Ramos",
    invitation_type: "staff",
    user_type: "staff",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "expired",
    student_ids: [],
    position: "Psicóloga Escolar",
    department: "psicologia",
    expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 12,
    email: "carlos.vargas@email.com",
    firstName: "Carlos",
    lastName: "Vargas Espinoza",
    invitation_type: "guardian",
    user_type: "parent",
    invited_by: "admin",
    invited_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    student_ids: [2003],
    student_name: "Sebastian Vargas Medina",
    relationship: "padre",
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Attendance history for specific students
export const mockAttendanceData = [
  {
    id: 1,
    student_id: 7001,
    student_name: "Pablo Martinez Fernandez",
    date: "2024-01-15",
    entry_time: "08:09",
    exit_time: "15:30",
    status: "present",
    notes: ""
  },
  {
    id: 2,
    student_id: 7001,
    student_name: "Pablo Martinez Fernandez", 
    date: "2024-01-14",
    entry_time: "08:15",
    exit_time: "15:25",
    status: "present",
    notes: "Llegada ligeramente tardía"
  },
  {
    id: 3,
    student_id: 6002,
    student_name: "Ana Gonzalez Rivera",
    date: "2024-01-15", 
    entry_time: "08:05",
    exit_time: null,
    status: "present",
    notes: ""
  }
];

// Helper functions to get filtered data
export const getStudentsByGrade = (grade) => allStudents.filter(s => s.grade === grade);
export const getStudentsByGroup = (group) => allStudents.filter(s => s.group === group);
export const getStudentsPresent = () => allStudents.filter(s => s.status === "present");
export const getStudentsAbsent = () => allStudents.filter(s => s.status === "absent");
export const getPickupRequestsByGroup = (group) => mockPickupRequests.filter(r => r.group === group);

// Calculate total statistics
export const getTotalStats = () => {
  const totalStudents = allStudents.length;
  const totalPresent = getStudentsPresent().length;
  const totalEntries = totalPresent; // All present students have entered
  const totalExits = Math.floor(totalPresent * 0.65); // 65% have exited (realistic for afternoon pickup time)
  const attendanceRate = Number(((totalPresent / totalStudents) * 100).toFixed(1));
  
  return {
    totalStudents,
    totalPresent,
    totalEntries,
    totalExits,
    attendanceRate,
    lateArrivals: Math.floor(totalPresent * 0.12), // 12% arrived late
    peakEntryTime: "08:15",
    peakExitTime: "15:30"
  };
}; 