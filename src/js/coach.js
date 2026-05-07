/**
 * FITPRO COACH - Coach Dashboard
 * Dashboard principal del coach
 */

const CoachDashboard = {
  clients: [],
  exercises: [],
  selectedClient: null,
  currentView: 'dashboard',
  
  elements: {},
  
  /**
   * Inicializa el dashboard
   */
  async init() {
    // Proteger ruta
    if (!Auth.protectRoute('coach')) return;
    
    this.cacheElements();
    this.bindEvents();
    this.bindNavigation();
    
    // Cargar datos iniciales
    Utils.showLoading('Cargando dashboard...');
    await this.loadDashboardData();
    Utils.hideLoading();
    
    // Mostrar vista por defecto
    this.showView('dashboard');
  },
  
  /**
   * Cachea elementos DOM
   */
  cacheElements() {
    this.elements.userName = document.getElementById('coachName');
    this.elements.navItems = document.querySelectorAll('.nav-link');
    this.elements.views = document.querySelectorAll('.view-section');
    
    // Stats
    this.elements.statTotalClients = document.getElementById('statTotalClients');
    this.elements.statActiveToday = document.getElementById('statActiveToday');
    this.elements.statSessionsWeek = document.getElementById('statSessionsWeek');
    this.elements.statPendingMessages = document.getElementById('statPendingMessages');
  },
  
  /**
   * Vincula eventos
   */
  bindEvents() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      Auth.logout();
    });
    
    // Crear cliente
    document.getElementById('createClientBtn')?.addEventListener('click', () => {
      this.showCreateClientModal();
    });
    
    // Crear cliente (botón secundario)
    document.getElementById('createClientBtn2')?.addEventListener('click', () => {
      this.showCreateClientModal();
    });
    
    // Crear rutina
    document.getElementById('createRoutineBtn')?.addEventListener('click', () => {
      this.showCreateRoutineModal();
    });
    
    // Chat
    document.getElementById('chatBtn')?.addEventListener('click', () => {
      Chat.open();
    });
  },
  
  /**
   * Vincula navegación
   */
  bindNavigation() {
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.currentTarget.dataset.view;
        this.showView(view);
      });
    });
  },
  
  /**
   * Muestra una vista
   */
  showView(viewName) {
    this.currentView = viewName;
    
    // Actualizar navegación
    this.elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });
    
    // Mostrar/ocultar vistas
    this.elements.views.forEach(view => {
      view.style.display = view.id === `${viewName}View` ? 'block' : 'none';
    });
    
    // Cargar datos específicos de la vista
    switch(viewName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'clients':
        this.loadClients();
        break;
      case 'routines':
        this.loadRoutines();
        break;
      case 'exercises':
        this.loadExercises();
        break;
      case 'history':
        this.loadHistory();
        break;
    }
  },
  
  /**
   * Carga datos del dashboard
   */
  async loadDashboardData() {
    const user = Auth.getCurrentUser();
    
    if (this.elements.userName) {
      this.elements.userName.textContent = user.nombre;
    }
    
    try {
      // Cargar estadísticas
      const statsResult = await Utils.callAPI('getCoachStats', { coachId: user.id });
      
      if (statsResult.success) {
        this.updateStats(statsResult.stats);
      }
      
      // Cargar clientes recientes
      const clientsResult = await Utils.callAPI('getClients', { coachId: user.id });
      
      if (clientsResult.success) {
        this.clients = clientsResult.clients || [];
        this.renderRecentClients();
      }
      
      // Cargar sesiones recientes
      const sessionsResult = await Utils.callAPI('getRecentSessions', { coachId: user.id, limit: 10 });
      
      if (sessionsResult.success) {
        this.renderRecentSessions(sessionsResult.sessions || []);
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Utils.showToast('Error al cargar datos', 'error');
    }
  },
  
  /**
   * Actualiza estadísticas
   */
  updateStats(stats) {
    if (this.elements.statTotalClients) {
      this.elements.statTotalClients.textContent = stats.totalClients || 0;
    }
    if (this.elements.statActiveToday) {
      this.elements.statActiveToday.textContent = stats.activeToday || 0;
    }
    if (this.elements.statSessionsWeek) {
      this.elements.statSessionsWeek.textContent = stats.sessionsThisWeek || 0;
    }
    if (this.elements.statPendingMessages) {
      this.elements.statPendingMessages.textContent = stats.pendingMessages || 0;
    }
  },
  
  /**
   * Renderiza clientes recientes
   */
  renderRecentClients() {
    const container = document.getElementById('recentClientsList');
    if (!container) return;
    
    const recentClients = this.clients.slice(0, 5);
    
    if (recentClients.length === 0) {
      container.innerHTML = '<p style="color: #666;">No hay clientes registrados</p>';
      return;
    }
    
    container.innerHTML = recentClients.map(client => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #252525; border-radius: 8px; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00FF88 0%, #00CCFF 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #0D0D0D;">
            ${client.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 600;">${client.nombre}</div>
            <div style="font-size: 0.75rem; color: #666;">${client.email}</div>
          </div>
        </div>
        <span class="badge ${client.activo ? 'badge-success' : 'badge-danger'}">
          ${client.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    `).join('');
  },
  
  /**
   * Renderiza sesiones recientes
   */
  renderRecentSessions(sessions) {
    const container = document.getElementById('recentSessionsList');
    if (!container) return;
    
    if (sessions.length === 0) {
      container.innerHTML = '<p style="color: #666;">No hay sesiones recientes</p>';
      return;
    }
    
    container.innerHTML = sessions.map(session => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #252525; border-radius: 8px; margin-bottom: 0.5rem;">
        <div>
          <div style="font-weight: 600;">${session.cliente_nombre}</div>
          <div style="font-size: 0.75rem; color: #666;">
            ${Utils.formatShortDate(session.fecha)} • ${session.dia_semana} • ${Utils.formatDuration(session.duracion_min)}
          </div>
        </div>
        <span class="badge badge-success">Completada</span>
      </div>
    `).join('');
  },
  
  /**
   * Carga lista de clientes
   */
  async loadClients() {
    const container = document.getElementById('clientsTableBody');
    
    // Fetch clients from API if not loaded
    if (this.clients.length === 0) {
      const user = Auth.getCurrentUser();
      try {
        const result = await Utils.callAPI('getClients', { coachId: user.id });
        if (result.success) {
          this.clients = result.clients || [];
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    }
    
    if (!container || this.clients.length === 0) {
      if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No hay clientes</td></tr>';
      return;
    }
    
    container.innerHTML = this.clients.map(client => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #00FF88 0%, #00CCFF 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #0D0D0D; font-size: 0.875rem;">
              ${client.nombre.charAt(0).toUpperCase()}
            </div>
            <span style="font-weight: 500;">${client.nombre}</span>
          </div>
        </td>
        <td>${client.email}</td>
        <td>${client.telefono || '-'}</td>
        <td>
          <span class="badge ${client.activo ? 'badge-success' : 'badge-danger'}">
            ${client.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="CoachDashboard.editClient('${client.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="CoachDashboard.viewClientRoutines('${client.id}')">📋</button>
        </td>
      </tr>
    `).join('');
  },
  
  /**
   * Muestra modal para crear cliente
   */
  showCreateClientModal() {
    Utils.showModal(
      'Nuevo Cliente',
      `
        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input type="text" class="form-input" id="newClientName" placeholder="Ej: Carlos Mendoza">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="newClientEmail" placeholder="ejemplo@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Nombre de usuario</label>
          <input type="text" class="form-input" id="newClientPhone" placeholder="Ej: carlosm">
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña temporal</label>
          <input type="password" class="form-input" id="newClientPassword" placeholder="Mínimo 6 caracteres">
        </div>
      `,
      [
        { text: 'Cancelar', className: 'btn-ghost' },
        { 
          text: 'Crear Cliente', 
          className: 'btn-primary',
          onClick: () => window.CoachDashboard?.createClient()
        }
      ]
    );
  },
  
  /**
   * Crea nuevo cliente
   */
  async createClient() {
    console.log('createClient called');
    
    const name = document.getElementById('newClientName')?.value.trim();
    const email = document.getElementById('newClientEmail')?.value.trim();
    const phone = document.getElementById('newClientPhone')?.value.trim();
    const password = document.getElementById('newClientPassword')?.value;
    
    console.log('Fields:', { name, email, phone, password });
    
    if (!name || !email || !password) {
      Utils.showToast('Por favor completa todos los campos', 'error');
      return;
    }
    
    if (!Utils.isValidEmail(email)) {
      Utils.showToast('Por favor ingresa un email válido', 'error');
      return;
    }
    
    if (password.length < 6) {
      Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    Utils.showLoading('Creando cliente...');
    
    try {
      console.log('Calling Auth.createClient...');
      const result = await Auth.createClient({
        nombre: name,
        email: email,
        telefono: phone,
        password: password
      });
      
      console.log('Result:', result);
      
      if (result.success) {
        Utils.showToast('Cliente creado exitosamente', 'success');
        this.loadClients();
      } else {
        throw new Error(result.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      Utils.showToast(error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },
  
  /**
   * Muestra modal para crear rutina
   */
  async showCreateRoutineModal() {
    // Load clients if not loaded
    if (this.clients.length === 0) {
      const user = Auth.getCurrentUser();
      try {
        const result = await Utils.callAPI('getClients', { coachId: user.id });
        if (result.success) {
          this.clients = result.clients || [];
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    }
    
    if (this.clients.length === 0) {
      Utils.showToast('No hay clientes disponibles', 'error');
      return;
    }
    
    const clientOptions = this.clients.map(c => 
      `<option value="${c.id}">${c.nombre}</option>`
    ).join('');
    
    const weekdayOptions = CONFIG.WEEKDAYS.map(d => 
      `<option value="${d.id}">${d.label}</option>`
    ).join('');
    
    const dayTypeOptions = CONFIG.DAY_TYPES.map(t => 
      `<option value="${t.id}">${t.label}</option>`
    ).join('');
    
    Utils.showModal(
      'Nueva Rutina',
      `
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <select class="form-input" id="routineClient">
            <option value="">Seleccionar cliente...</option>
            ${clientOptions}
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Día de la semana</label>
            <select class="form-input" id="routineDay">
              ${weekdayOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de día</label>
            <select class="form-input" id="routineType">
              ${dayTypeOptions}
            </select>
          </div>
        </div>
        <div id="exercisesSection" style="margin-top: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label class="form-label" style="margin: 0;">Ejercicios</label>
            <button class="btn btn-secondary btn-sm" onclick="CoachDashboard.addExerciseRow()">+ Agregar</button>
          </div>
          <div id="exerciseRows">
            <!-- Filas de ejercicios se agregan dinámicamente -->
          </div>
        </div>
      `,
      [
        { text: 'Cancelar', className: 'btn-ghost' },
        { 
          text: 'Guardar Rutina', 
          className: 'btn-primary',
          onClick: () => window.CoachDashboard?.createRoutine()
        }
      ]
    );
    
    // Agregar primera fila de ejercicio
    setTimeout(() => this.addExerciseRow(), 100);
  },
  
  /**
   * Agrega fila de ejercicio
   */
  addExerciseRow() {
    const container = document.getElementById('exerciseRows');
    if (!container) return;
    
    const rowCount = container.children.length;
    
    const row = Utils.createElement('div', {
      className: 'exercise-row',
      style: 'background: #252525; padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;'
    }, [
      Utils.createElement('div', { style: 'display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;' }, [
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Nombre del ejercicio',
          style: 'font-size: 0.875rem;'
        }),
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Grupo muscular',
          style: 'font-size: 0.875rem;'
        }),
        Utils.createElement('input', {
          type: 'number',
          className: 'form-input',
          placeholder: 'Descanso (s)',
          value: '90',
          style: 'font-size: 0.875rem;'
        })
      ]),
      Utils.createElement('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' }, [
        Utils.createElement('span', { style: 'color: #666; font-size: 0.75rem; padding-top: 0.5rem;' }, ['Series:']),
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Reps',
          style: 'width: 60px; font-size: 0.875rem;'
        }),
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Peso',
          style: 'width: 80px; font-size: 0.875rem;'
        }),
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Reps',
          style: 'width: 60px; font-size: 0.875rem;'
        }),
        Utils.createElement('input', {
          type: 'text',
          className: 'form-input',
          placeholder: 'Peso',
          style: 'width: 80px; font-size: 0.875rem;'
        }),
        Utils.createElement('button', {
          className: 'btn btn-danger btn-sm',
          style: 'margin-left: auto;',
          innerHTML: '✕',
          onclick: (e) => e.target.closest('.exercise-row').remove()
        })
      ])
    ]);
    
    container.appendChild(row);
  },
  
  /**
   * Crea rutina
   */
  async createRoutine() {
    alert('createRoutine clicked!');
    console.log('createRoutine called');
    
    const clientIdEl = document.getElementById('routineClient');
    const dayEl = document.getElementById('routineDay');
    const typeEl = document.getElementById('routineType');
    
    if (!clientIdEl || !dayEl || !typeEl) {
      Utils.showToast('Error: Elementos del formulario no encontrados', 'error');
      console.log('Elements not found');
      return;
    }
    
    const clientId = clientIdEl.value;
    const day = dayEl.value;
    const type = typeEl.value;
    
    console.log('Fields:', { clientId, day, type });
    
    if (!clientId || !day || !type) {
      Utils.showToast('Por favor completa todos los campos', 'error');
      return;
    }
    
    Utils.showLoading('Guardando rutina...');
    
    try {
      const result = await Utils.callAPI('createRoutine', {
        clienteId: clientId,
        diaSemana: day,
        tipoDia: type,
        ejercicios: []
      });
      
      console.log('Result:', result);
      
      if (result.success) {
        Utils.showToast('Rutina creada exitosamente', 'success');
        this.showView('routines');
      } else {
        throw new Error(result.error || 'Error al crear rutina');
      }
    } catch (error) {
      console.error('Error creating routine:', error);
      Utils.showToast(error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },
  
  /**
   * Carga rutinas
   */
  async loadRoutines() {
    // TODO: Implementar carga de rutinas
  },
  
  /**
   * Carga biblioteca de ejercicios
   */
  async loadExercises() {
    try {
      const result = await Utils.callAPI('getEjerciciosBiblioteca');
      
      if (result.success) {
        this.exercises = result.exercises || [];
        this.renderExercises();
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  },
  
  /**
   * Renderiza ejercicios
   */
  renderExercises() {
    const container = document.getElementById('exercisesGrid');
    if (!container) return;
    
    if (this.exercises.length === 0) {
      container.innerHTML = '<p style="color: #666;">No hay ejercicios en la biblioteca</p>';
      return;
    }
    
    container.innerHTML = this.exercises.map(ex => `
      <div style="background: #1A1A1A; border: 1px solid #333; border-radius: 12px; overflow: hidden;">
        <div style="aspect-ratio: 16/9; background: #252525; display: flex; align-items: center; justify-content: center;">
          ${ex.imagen_url 
            ? `<img src="${ex.imagen_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${ex.nombre}">`
            : '<span style="color: #666; font-size: 2rem;">🏋️</span>'
          }
        </div>
        <div style="padding: 1rem;">
          <h4 style="margin-bottom: 0.25rem;">${ex.nombre}</h4>
          <p style="color: #666; font-size: 0.875rem; margin: 0;">${ex.grupo_muscular}</p>
        </div>
      </div>
    `).join('');
  },
  
  /**
   * Carga historial
   */
  async loadHistory() {
    // TODO: Implementar carga de historial
  },
  
  /**
   * Edita cliente
   */
  editClient(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    Utils.showModal(
      'Editar Cliente',
      `
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" id="editClientName" value="${client.nombre}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="editClientEmail" value="${client.email}" disabled style="opacity: 0.7;">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="tel" class="form-input" id="editClientPhone" value="${client.telefono || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="editClientActive" ${client.activo ? 'checked' : ''}> Cliente Activo
          </label>
        </div>
      `,
      [
        { text: 'Cancelar', className: 'btn-ghost' },
        { 
          text: 'Guardar Cambios', 
          className: 'btn-primary',
          onClick: () => this.saveClientEdit(clientId)
        }
      ]
    );
  },
  
  /**
   * Guarda edición de cliente
   */
  async saveClientEdit(clientId) {
    const name = document.getElementById('editClientName')?.value.trim();
    const phone = document.getElementById('editClientPhone')?.value.trim();
    const active = document.getElementById('editClientActive')?.checked;
    
    Utils.showLoading('Guardando cambios...');
    
    try {
      const result = await Utils.callAPI('updateClient', {
        clientId,
        nombre: name,
        telefono: phone,
        activo: active
      });
      
      if (result.success) {
        Utils.showToast('Cambios guardados', 'success');
        this.loadClients();
      } else {
        throw new Error(result.message || 'Error al guardar cambios');
      }
    } catch (error) {
      Utils.showToast(error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },
  
  /**
   * Ver rutinas de cliente
   */
  viewClientRoutines(clientId) {
    this.selectedClient = this.clients.find(c => c.id === clientId);
    if (!this.selectedClient) return;
    
    Utils.showModal(
      `Rutinas de ${this.selectedClient.nombre}`,
      `
        <div id="clientRoutinesList">
          <p style="color: #666;">Cargando rutinas...</p>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn btn-secondary btn-block" onclick="CoachDashboard.showCreateRoutineModalForClient('${clientId}')">
            + Crear Nueva Rutina
          </button>
        </div>
      `,
      [{ text: 'Cerrar', className: 'btn-ghost' }]
    );
    
    this.loadClientRoutines(clientId);
  },
  
  /**
   * Carga rutinas de cliente
   */
  async loadClientRoutines(clientId) {
    try {
      const result = await Utils.callAPI('getAllRoutinesForClient', { clienteId: clientId });
      
      const container = document.getElementById('clientRoutinesList');
      if (!container) return;
      
      if (!result.success || !result.routines || result.routines.length === 0) {
        container.innerHTML = '<p style="color: #666;">Este cliente no tiene rutinas asignadas</p>';
        return;
      }
      
      container.innerHTML = result.routines.map(r => {
        const dayLabel = CONFIG.WEEKDAYS.find(d => d.id === r.dia_semana)?.label || r.dia_semana;
        const typeLabel = CONFIG.DAY_TYPES.find(t => t.id === r.tipo_dia)?.label || r.tipo_dia;
        
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #252525; border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
              <div style="font-weight: 600;">${dayLabel}</div>
              <div style="font-size: 0.75rem; color: #666;">${typeLabel}</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="CoachDashboard.editRoutine('${r.id}')">✏️</button>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error loading client routines:', error);
    }
  },
  
  /**
   * Muestra modal de rutina para cliente específico
   */
  showCreateRoutineModalForClient(clientId) {
    closeModal();
    this.selectedClient = this.clients.find(c => c.id === clientId);
    setTimeout(() => this.showCreateRoutineModal(), 300);
  },
  
  /**
   * Edita rutina
   */
  editRoutine(routineId) {
    // TODO: Implementar edición de rutina
    Utils.showToast('Edición de rutina - Próximamente', 'info');
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.dashboard')) {
    CoachDashboard.init();
  }
});
