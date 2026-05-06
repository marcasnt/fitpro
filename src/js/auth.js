/**
 * FITPRO COACH - Authentication System
 * Maneja login, logout y estado de sesión
 */

const Auth = {
  currentUser: null,
  
  /**
   * Inicializa el sistema de autenticación
   */
  init() {
    // Verificar si hay sesión guardada
    const user = Utils.getFromStorage(CONFIG.STORAGE_KEYS.USER);
    const token = Utils.getFromStorage(CONFIG.STORAGE_KEYS.TOKEN);
    
    if (user && token) {
      this.currentUser = user;
      this.redirectByRole(user.rol);
    }
  },
  
  /**
   * Realiza login de usuario
   */
  async login(email, password) {
    try {
      // Validar inputs
      if (!Utils.isValidEmail(email)) {
        throw new Error('Por favor ingresa un email válido');
      }
      if (!Utils.isNotEmpty(password)) {
        throw new Error('Por favor ingresa tu contraseña');
      }
      
      // Hashear contraseña
      const hashedPassword = await Utils.hashPassword(password);
      
      // Llamar a API
      const result = await Utils.callAPI('login', {
        email: email.toLowerCase().trim(),
        password: hashedPassword
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Credenciales incorrectas');
      }
      
      // Guardar sesión
      this.currentUser = result.user;
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USER, result.user);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.TOKEN, result.token);
      
      // Redirigir según rol
      this.redirectByRole(result.user.rol);
      
      return { success: true, user: result.user };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Cierra sesión
   */
  logout() {
    this.currentUser = null;
    Utils.clearSession();
    window.location.href = '/index.html';
  },
  
  /**
   * Verifica si hay sesión activa
   */
  isAuthenticated() {
    return !!this.currentUser;
  },
  
  /**
   * Obtiene usuario actual
   */
  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = Utils.getFromStorage(CONFIG.STORAGE_KEYS.USER);
    }
    return this.currentUser;
  },
  
  /**
   * Verifica si es coach
   */
  isCoach() {
    const user = this.getCurrentUser();
    return user && user.rol === 'coach';
  },
  
  /**
   * Verifica si es cliente
   */
  isClient() {
    const user = this.getCurrentUser();
    return user && user.rol === 'cliente';
  },
  
  /**
   * Redirige según rol
   */
  redirectByRole(rol) {
    const currentPage = window.location.pathname;
    
    if (rol === 'coach') {
      if (!currentPage.includes('dashboard-coach')) {
        window.location.href = '/src/pages/dashboard-coach.html';
      }
    } else if (rol === 'cliente') {
      if (!currentPage.includes('panel-cliente')) {
        window.location.href = '/src/pages/panel-cliente.html';
      }
    }
  },
  
  /**
   * Protege ruta - verifica autenticación
   */
  protectRoute(requiredRole = null) {
    const user = this.getCurrentUser();
    
    if (!user) {
      window.location.href = '/index.html';
      return false;
    }
    
    if (requiredRole && user.rol !== requiredRole) {
      Utils.showToast('No tienes permiso para acceder a esta página', 'error');
      this.redirectByRole(user.rol);
      return false;
    }
    
    return true;
  },
  
  /**
   * Crea nuevo cliente (solo coach)
   */
  async createClient(userData) {
    if (!this.isCoach()) {
      throw new Error('Solo el coach puede crear clientes');
    }
    
    try {
      const hashedPassword = await Utils.hashPassword(userData.password);
      
      const result = await Utils.callAPI('createUser', {
        nombre: userData.nombre,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        telefono: userData.telefono,
        rol: 'cliente'
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Error al crear cliente');
      }
      
      return { success: true, user: result.user };
      
    } catch (error) {
      console.error('Create client error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Actualiza perfil de usuario
   */
  async updateProfile(updates) {
    try {
      const user = this.getCurrentUser();
      
      const result = await Utils.callAPI('updateUser', {
        userId: user.id,
        ...updates
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar perfil');
      }
      
      // Actualizar datos locales
      this.currentUser = { ...user, ...updates };
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USER, this.currentUser);
      
      return { success: true };
      
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Cambia contraseña
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const user = this.getCurrentUser();
      const currentHashed = await Utils.hashPassword(currentPassword);
      const newHashed = await Utils.hashPassword(newPassword);
      
      const result = await Utils.callAPI('changePassword', {
        userId: user.id,
        currentPassword: currentHashed,
        newPassword: newHashed
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Error al cambiar contraseña');
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
