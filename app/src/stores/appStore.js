import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import axiosClient from '../utils/axiosConfig';

// Centralized store to replace scattered useState declarations
const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // Core data state
    students: [],
    attendance: [],
    notifications: [],
    invitations: [],
    staff: [],
    
    // UI state
    isLoading: false,
    error: null,
    selectedDate: new Date().toISOString().split('T')[0],
    
    // Actions
    setStudents: (students) => set({ students }),
    setAttendance: (attendance) => set({ attendance }),
    setNotifications: (notifications) => set({ notifications }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // Student operations
    updateStudentStatus: (studentId, status) =>
      set((state) => ({
        students: state.students.map((student) =>
          student.id === studentId ? { ...student, status } : student
        ),
      })),
    
    // Optimized data fetching
    fetchStudents: async () => {
      set({ isLoading: true, error: null });
      try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
          axiosClient.get('/students/search', {
            params: { query: '', include_grade: true }
          }),
          axiosClient.get('/attendance/present-students', {
            params: { date: get().selectedDate }
          })
        ]);
        
        const presentStudentIds = attendanceResponse.data?.map(entry => entry.student_id) || [];
        
        const studentsWithStatus = studentsResponse.data.map(student => ({
          ...student,
          full_name: student.full_name || `${student.first_name} ${student.last_name}`,
          grade: student.grade_level?.name || student.classroom?.grade_level?.name || 'Sin grado',
          status: presentStudentIds.includes(student.id) ? 'present' : 'absent'
        }));
        
        set({ 
          students: studentsWithStatus,
          attendance: attendanceResponse.data,
          isLoading: false 
        });
        
        return studentsWithStatus;
      } catch (error) {
        set({ error, isLoading: false });
        throw error;
      }
    },
    
    // Notification operations
    addNotification: (notification) =>
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50) // Keep only latest 50
      })),
    
    markNotificationRead: (notificationId) =>
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      })),
    
    // Staff operations
    fetchStaff: async () => {
      try {
        const response = await axiosClient.get('/access/users');
        set({ staff: response.data });
        return response.data;
      } catch (error) {
        set({ error });
        throw error;
      }
    },
    
    // Invitations
    fetchInvitations: async () => {
      try {
        const response = await axiosClient.get('/invitations');
        set({ invitations: response.data });
        return response.data;
      } catch (error) {
        set({ error });
        throw error;
      }
    },
    
    // Real-time updates
    handleRealtimeUpdate: (event, data) => {
      switch (event) {
        case 'student_entry':
        case 'student_exit':
          get().updateStudentStatus(data.student_id, data.status);
          break;
        case 'notification':
          get().addNotification(data);
          break;
        default:
          console.log('Unhandled realtime event:', event);
      }
    }
  }))
);

// Selectors for computed data
export const useStudents = () => useAppStore((state) => state.students);
export const usePresentStudents = () => useAppStore((state) => 
  state.students.filter(student => student.status === 'present')
);
export const useAbsentStudents = () => useAppStore((state) => 
  state.students.filter(student => student.status === 'absent')
);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadNotifications = () => useAppStore((state) => 
  state.notifications.filter(notif => !notif.read)
);

export default useAppStore; 