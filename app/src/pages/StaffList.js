import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../utils/axiosConfig';
import { useNotification } from '../components/NotificationSystem';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { FiUsers, FiRefreshCw, FiFilter, FiPlusCircle, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

const StaffList = () => {
  const { success, error, info } = useNotification();
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // Example filter

  const fetchStaffMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Adjust the endpoint and params as needed by your backend
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterRole !== 'all') params.role = filterRole;
      
      // Assuming an endpoint like /users or /staff that can be filtered
      // For now, let's assume /users can take a role filter, or we have /staff
      const response = await axiosClient.get('/users', { params: { ...params, type: 'staff' } }); 
      setStaffMembers(response.data || []);
    } catch (err) {
      console.error("Error fetching staff members:", err);
      error(err.response?.data?.detail || 'Error al cargar la lista de personal.');
      setStaffMembers([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [error, searchTerm, filterRole]); // Dependencies for re-fetching

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  const handleRefresh = () => {
    fetchStaffMembers();
  };

  // Placeholder for future actions
  const handleViewDetails = (staffId) => {
    info(`Ver detalles para staff ID: ${staffId} (funcionalidad no implementada)`);
    // navigate(`/app/staff/${staffId}`);
  };

  const handleEditStaff = (staffId) => {
    info(`Editar staff ID: ${staffId} (funcionalidad no implementada)`);
    // navigate(`/app/staff/${staffId}/edit`);
  };

  const handleDeleteStaff = async (staffId) => {
    // TODO: Implement actual delete functionality with confirmation
    // try {
    //   await axiosClient.delete(`/users/${staffId}`); // Or /staff/${staffId}
    //   success('Miembro del personal eliminado.');
    //   fetchStaffMembers(); // Refresh list
    // } catch (err) {
    //   error(err.response?.data?.detail || 'Error al eliminar miembro del personal.');
    // }
    error(`Eliminar staff ID: ${staffId} - ¡Confirmación y lógica de borrado NO implementada!`);
  };
  
  const filteredStaffMembers = staffMembers; // Already filtered by API ideally, or client-side if needed

  if (isLoading && staffMembers.length === 0) { // Show initial loader only if list is empty
    return <PageLoader text="Cargando personal..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Personal"
        subtitle="Administra los miembros del personal del colegio."
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => info('Funcionalidad "Añadir Personal" no implementada. Usar página de Invitaciones.')} // Or navigate to InviteUsers with staff type preselected
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlusCircle className="h-5 w-5" />
            <span>Añadir Personal</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary p-2 rounded-lg"
            title="Actualizar lista"
          >
            <FiRefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </PageHeader>

      {/* Filters - Example */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="searchStaff" className="sr-only">Buscar Personal</label>
            <input
              type="text"
              id="searchStaff"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email..."
              className="glass-input w-full"
              onKeyDown={(e) => e.key === 'Enter' && fetchStaffMembers()}
            />
          </div>
          <div>
            <label htmlFor="filterRoleStaff" className="sr-only">Filtrar por Rol</label>
            <select
              id="filterRoleStaff"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="glass-input w-full"
            >
              <option value="all">Todos los Roles</option>
              {/* TODO: Populate roles from an API or constants */}
              <option value="teacher">Profesor</option>
              <option value="admin">Administrador</option>
              <option value="support">Soporte</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && staffMembers.length > 0 && (
        <div className="text-center py-4"><PageLoader text="Actualizando lista..." /></div>
      )}

      <div className="glass-card overflow-hidden">
        {staffMembers.length === 0 && !isLoading ? (
          <div className="text-center p-12">
            <FiUsers className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">No se encontró personal</h3>
            <p className="text-secondary">
              No hay miembros del personal que coincidan con los filtros actuales, o no hay personal registrado.
            </p>
          </div>
        ) : (
          <div className="modern-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Nombre</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Rol/Posición</th>
                  <th className="text-left">Fecha Ingreso</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffMembers.map((staff) => (
                  <tr key={staff.id} className="table-row-hover">
                    <td className="py-3 px-4">
                      <div className="font-medium text-primary">
                        {staff.first_name} {staff.last_name}
                      </div>
                      {staff.username && <div className="text-xs text-muted">@{staff.username}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary">{staff.email}</td>
                    <td className="py-3 px-4 text-sm text-secondary">
                      {staff.role || staff.position || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary">
                      {staff.date_joined ? new Date(staff.date_joined).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleViewDetails(staff.id)} 
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" 
                          title="Ver Detalles"
                        >
                          <FiEye className="h-4 w-4 text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleEditStaff(staff.id)} 
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" 
                          title="Editar"
                        >
                          <FiEdit className="h-4 w-4 text-green-500" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(staff.id)} 
                          className="p-2 hover:bg-red-200 dark:hover:bg-red-700 rounded-full transition-colors" 
                          title="Eliminar"
                        >
                          <FiTrash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList; 