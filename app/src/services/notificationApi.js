import axiosClient from '../utils/axiosConfig';

class NotificationApi {
  constructor() {
    this.basePath = '/notifications';
  }

  // Get all notifications for the current user
  async getNotifications(limit = 50, offset = 0, unreadOnly = false) {
    try {
      const response = await axiosClient.get(this.basePath, {
        params: { limit, offset, unread_only: unreadOnly },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await axiosClient.get(`${this.basePath}/unread/count`);
      return response.data.unread_count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark a specific notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axiosClient.patch(
        `${this.basePath}/${notificationId}/read`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await axiosClient.patch(
        `${this.basePath}/mark-all-read`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a specific notification
  async deleteNotification(notificationId) {
    try {
      const response = await axiosClient.delete(`${this.basePath}/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get a specific notification
  async getNotification(notificationId) {
    try {
      const response = await axiosClient.get(`${this.basePath}/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  // Helper method to format time ago (instance method)
  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} sem`;
    
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: diffInDays > 365 ? 'numeric' : undefined
    });
  }
}

export default new NotificationApi(); 