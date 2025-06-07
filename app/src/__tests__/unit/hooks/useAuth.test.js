import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth, AuthProvider } from '../../../hooks/useAuth';
import { NotificationProvider } from '../../../components/NotificationSystem';
import axiosClient from '../../../utils/axiosConfig';

// Mock modules
jest.mock('../../../utils/axiosConfig');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockedAxiosClient = axiosClient;

// Test wrapper component
const createWrapper = () => {
  return ({ children }) => (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <NotificationProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with null user and not loading state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@lymbus.com',
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true,
      };

      // Mock successful login
      mockedAxiosClient.post.mockResolvedValueOnce({
        data: { access_token: 'fake-token', token_type: 'bearer' }
      });

      // Mock successful user data fetch
      mockedAxiosClient.get.mockResolvedValueOnce({
        data: mockUser
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@lymbus.com', 'admin123');
      });

      expect(loginResult.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('lymbus_token', 'fake-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure with invalid credentials', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { detail: 'Correo electrónico o contraseña incorrectos' }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('wrong@email.com', 'wrongpass');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('Correo electrónico o contraseña incorrectos');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network errors during login', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@lymbus.com', 'admin123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.message).toBe('Error al iniciar sesión');
    });
  });

  describe('Session Management', () => {
    it('should restore session from stored token', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@lymbus.com',
        first_name: 'Admin',
        last_name: 'User',
      };

      localStorageMock.getItem.mockReturnValue('stored-token');
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle session expiration', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');
      mockedAxiosClient.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('lymbus_token');
    });

    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('lymbus_token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token Validation', () => {
    it('should validate token successfully', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ 
        data: { 
          id: 1, 
          email: 'admin@lymbus.com' 
        } 
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('admin@lymbus.com', 'admin123');
      });

      expect(mockedAxiosClient.get).toHaveBeenCalledWith('/auth/users/me');
    });

    it('should handle token validation failure', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      mockedAxiosClient.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('lymbus_token');
    });
  });
}); 