// localStorage utility for persistent data storage
// This simulates database persistence for demo/development

const STORAGE_KEYS = {
  INVITATIONS: 'lymbus_invitations',
  PARENT_ARRIVALS: 'lymbus_parent_arrivals',
  PICKUP_QUEUE: 'lymbus_pickup_queue',
  COMPLETED_PICKUPS: 'lymbus_completed_pickups',
  PICKUP_REQUESTS: 'lymbus_pickup_requests',
  ATTENDANCE_DATA: 'lymbus_attendance_data',
  SCHOOL_SETTINGS: 'lymbus_school_settings',
  USER_PREFERENCES: 'lymbus_user_preferences'
};

class LocalStorage {
  // Generic methods
  static get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      return false;
    }
  }

  static remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }

  static clear() {
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Specific data methods
  static getInvitations() {
    return this.get(STORAGE_KEYS.INVITATIONS, []);
  }

  static setInvitations(invitations) {
    return this.set(STORAGE_KEYS.INVITATIONS, invitations);
  }

  static addInvitation(invitation) {
    const invitations = this.getInvitations();
    const newInvitation = {
      ...invitation,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    invitations.unshift(newInvitation);
    this.setInvitations(invitations);
    return newInvitation;
  }

  static updateInvitation(id, updates) {
    const invitations = this.getInvitations();
    const index = invitations.findIndex(inv => inv.id === id);
    if (index !== -1) {
      invitations[index] = {
        ...invitations[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.setInvitations(invitations);
      return invitations[index];
    }
    return null;
  }

  static deleteInvitation(id) {
    const invitations = this.getInvitations();
    const filtered = invitations.filter(inv => inv.id !== id);
    this.setInvitations(filtered);
    return filtered.length < invitations.length;
  }

  // Parent arrivals
  static getParentArrivals() {
    return this.get(STORAGE_KEYS.PARENT_ARRIVALS, []);
  }

  static addParentArrival(arrival) {
    const arrivals = this.getParentArrivals();
    const newArrival = {
      ...arrival,
      id: Date.now(),
      arrived_at: new Date().toISOString()
    };
    arrivals.unshift(newArrival);
    this.set(STORAGE_KEYS.PARENT_ARRIVALS, arrivals);
    return newArrival;
  }

  // Pickup queue
  static getPickupQueue() {
    return this.get(STORAGE_KEYS.PICKUP_QUEUE, []);
  }

  static addPickupRequest(request) {
    const queue = this.getPickupQueue();
    const newRequest = {
      ...request,
      id: Date.now(),
      requested_at: new Date().toISOString(),
      status: 'pending'
    };
    queue.push(newRequest);
    this.set(STORAGE_KEYS.PICKUP_QUEUE, queue);
    return newRequest;
  }

  static updatePickupRequest(id, updates) {
    const queue = this.getPickupQueue();
    const index = queue.findIndex(req => req.id === id);
    if (index !== -1) {
      queue[index] = {
        ...queue[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.set(STORAGE_KEYS.PICKUP_QUEUE, queue);
      return queue[index];
    }
    return null;
  }

  static removeFromPickupQueue(id) {
    const queue = this.getPickupQueue();
    const filtered = queue.filter(req => req.id !== id);
    this.set(STORAGE_KEYS.PICKUP_QUEUE, filtered);
    return filtered.length < queue.length;
  }

  // Completed pickups
  static getCompletedPickups() {
    return this.get(STORAGE_KEYS.COMPLETED_PICKUPS, []);
  }

  static addCompletedPickup(pickup) {
    const completed = this.getCompletedPickups();
    const newPickup = {
      ...pickup,
      id: Date.now(),
      completed_at: new Date().toISOString(),
      pickup_time: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    completed.unshift(newPickup);
    this.set(STORAGE_KEYS.COMPLETED_PICKUPS, completed);
    return newPickup;
  }

  // School settings
  static getSchoolSettings() {
    return this.get(STORAGE_KEYS.SCHOOL_SETTINGS, {
      startTime: '08:00',
      endTime: '15:30',
      timezone: 'Europe/Madrid',
      schoolName: 'Colegio Lymbus',
      address: '',
      phone: '',
      email: ''
    });
  }

  static updateSchoolSettings(settings) {
    const current = this.getSchoolSettings();
    const updated = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.SCHOOL_SETTINGS, updated);
    return updated;
  }

  // User preferences
  static getUserPreferences() {
    return this.get(STORAGE_KEYS.USER_PREFERENCES, {
      theme: 'system',
      language: 'es',
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30000
    });
  }

  static updateUserPreferences(preferences) {
    const current = this.getUserPreferences();
    const updated = {
      ...current,
      ...preferences,
      updated_at: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.USER_PREFERENCES, updated);
    return updated;
  }

  // Initialize with mock data if empty
  static initializeWithMockData(mockData) {
    if (this.getInvitations().length === 0) {
      this.setInvitations(mockData.invitations || []);
    }
    if (this.getParentArrivals().length === 0) {
      this.set(STORAGE_KEYS.PARENT_ARRIVALS, mockData.parentArrivals || []);
    }
    if (this.getPickupQueue().length === 0) {
      this.set(STORAGE_KEYS.PICKUP_QUEUE, mockData.pickupQueue || []);
    }
    if (this.getCompletedPickups().length === 0) {
      this.set(STORAGE_KEYS.COMPLETED_PICKUPS, mockData.completedPickups || []);
    }
  }

  // Export data for backup
  static exportData() {
    return {
      invitations: this.getInvitations(),
      parentArrivals: this.getParentArrivals(),
      pickupQueue: this.getPickupQueue(),
      completedPickups: this.getCompletedPickups(),
      schoolSettings: this.getSchoolSettings(),
      userPreferences: this.getUserPreferences(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from backup
  static importData(data) {
    try {
      if (data.invitations) this.setInvitations(data.invitations);
      if (data.parentArrivals) this.set(STORAGE_KEYS.PARENT_ARRIVALS, data.parentArrivals);
      if (data.pickupQueue) this.set(STORAGE_KEYS.PICKUP_QUEUE, data.pickupQueue);
      if (data.completedPickups) this.set(STORAGE_KEYS.COMPLETED_PICKUPS, data.completedPickups);
      if (data.schoolSettings) this.set(STORAGE_KEYS.SCHOOL_SETTINGS, data.schoolSettings);
      if (data.userPreferences) this.set(STORAGE_KEYS.USER_PREFERENCES, data.userPreferences);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export { LocalStorage, STORAGE_KEYS }; 