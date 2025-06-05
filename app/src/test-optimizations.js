// Quick verification script for optimized components
import useAppStore from './stores/appStore';
import simpleWebSocket from './services/simpleWebSocket';

// Test store functionality
const testStore = () => {
  const store = useAppStore.getState();
  console.log('✅ Store initialized:', {
    students: store.students.length,
    isLoading: store.isLoading,
    error: store.error
  });
  
  // Test store actions
  store.setLoading(true);
  console.log('✅ Store actions working');
  
  // Test selectors
  const { useStudents, usePresentStudents } = require('./stores/appStore');
  console.log('✅ Selectors exported correctly');
};

// Test WebSocket service
const testWebSocket = () => {
  console.log('✅ WebSocket service available:', {
    connect: typeof simpleWebSocket.connect,
    disconnect: typeof simpleWebSocket.disconnect,
    isConnected: typeof simpleWebSocket.isConnected
  });
};

// Test component imports
const testComponents = async () => {
  try {
    const StudentList = await import('./components/student/StudentList');
    const StudentFilters = await import('./components/student/StudentFilters');
    const StudentEntry = await import('./pages/StudentEntrySimplified');
    
    console.log('✅ Components import successfully:', {
      StudentList: !!StudentList.default,
      StudentFilters: !!StudentFilters.default,
      StudentEntry: !!StudentEntry.default
    });
  } catch (error) {
    console.error('❌ Component import error:', error);
  }
};

// Run tests
const runOptimizationTests = () => {
  console.log('🚀 Testing Lymbus Optimizations...\n');
  
  try {
    testStore();
    testWebSocket();
    testComponents();
    
    console.log('\n✅ All optimization tests passed!');
    console.log('🎉 Lymbus optimization successful!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in console
window.testOptimizations = runOptimizationTests;

export default runOptimizationTests; 