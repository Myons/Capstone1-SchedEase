// Role-based access control utility functions

export const getUserRole = (userRole) => {
  return userRole || 'teacher';
};

export const hasAdminPrivileges = (userRole) => {
  return userRole === 'admin';
};

export const canModifyData = (userRole) => {
  return userRole === 'admin';
}; 