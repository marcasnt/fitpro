/**
 * FITPRO COACH - Client Panel
 * Panel principal del asesorado
 */

const ClientPanel = {
  currentRoutine: null,
  currentExercise: null,
  sessionData: {
    startTime: null,
    exercises: [],
    completed: false
  },
  
  elements: {},
  
  /**
   * Inicializa el panel
   */
  async init() {
    // Proteger ruta
    if (!Auth.protectRoute('cliente')) return;
    
    this.cacheElements();
    this.bindEvents();
    
    // Mostrar loading
    Utils.showLoading('Cargando tu rutina...');
    
    // Cargar rutina del día
    await this.loadTodayRoutine();
    
    // Ocultar loading
    Utils.hideLoading();
    
    // Iniciar sesión
    this.startSession();
  },
  
  /**
   * Cachea elementos DOM
   */
  cacheElements() {
    this.elements.dayTitle = document.getElementById('dayTitle');
    this.elements.dayType = document.getElementById('dayType');
    this.elements.exercisesContainer = document.getElementById('exercisesContainer');
    this.elements.completeBtn = document.getElementById('completeSessionBtn');
    this.elements.progressBar = document.getElementById('progressBar');
    this.elements.userName = document.getElementById('userName');
  },
  
  /**
   * Vincula eventos
   */
  bindEvents() {
    // Cerrar sesión
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      Auth.logout();
    });
    
    // Completar sesión
    this.elements.completeBtn?.addEventListener('click', () => {
      this.completeSession();
    });
    
    // Chat
    document.getElementById('chatBtn')?.addEventListener('click', () => {
      Chat.open();
    });
  },
  
  /**
   * Carga rutina del día
   */
  async loadTodayRoutine() {
    const user = Auth.getCurrentUser();
    const today = Utils.getWeekday();
    
    // Actualizar nombre de usuario
    if (this.elements.userName) {
      this.elements.userName.textContent = user.nombre;
    }
    
    try {
      const result = await Utils.callAPI('getRoutineForDay', {
        clienteId: user.id,
        diaSemana: today
      });
      
      if (result.success && result.routine) {
        this.currentRoutine = result.routine;
        this.renderRoutine();
      } else {
        this.showRestDay();
      }
    } catch (error) {
      console.error('Error loading routine:', error);
      Utils.showToast('Error al cargar rutina', 'error');
      this.showRestDay();
    }
  },
  
  /**
   * Muestra día de descanso
   */
  showRestDay() {
    const today = Utils.getWeekday();
    const weekdayLabel = CONFIG.WEEKDAYS.find(d => d.id === today)?.label || today;
    
    if (this.elements.dayTitle) {
      this.elements.dayTitle.textContent = weekdayLabel;
    }
    
    if (this.elements.dayType) {
      this.elements.dayType.textContent = 'Día de Recuperación';
      this.elements.dayType.className = 'day-type';
      this.elements.dayType.style.background = '#666666';
    }
    
    if (this.elements.exercisesContainer) {
      this.elements.exercisesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💤</div>
          <h3 class="empty-title">Día de Descanso</h3>
          <p class="empty-text">Hoy es tu día de recuperación. Descansa y prepárate para tu próximo entrenamiento.</p>
        </div>
      `;
    }
    
    if (this.elements.completeBtn) {
      this.elements.completeBtn.style.display = 'none';
    }
  },
  
  /**
   * Renderiza la rutina
   */
  renderRoutine() {
    if (!this.currentRoutine) return;
    
    const routine = this.currentRoutine;
    const today = Utils.getWeekday();
    const weekdayLabel = CONFIG.WEEKDAYS.find(d => d.id === today)?.label || today;
    
    // Actualizar header
    if (this.elements.dayTitle) {
      this.elements.dayTitle.textContent = weekdayLabel;
    }
    
    if (this.elements.dayType) {
      const dayTypeConfig = CONFIG.DAY_TYPES.find(t => t.id === routine.tipo_dia);
      this.elements.dayType.textContent = dayTypeConfig?.label || 'Rutina';
    }
    
    // Parsear ejercicios
    let exercises = [];
    try {
      exercises = typeof routine.ejercicios_json === 'string' 
        ? JSON.parse(routine.ejercicios_json) 
        : routine.ejercicios_json || [];
    } catch (e) {
      console.error('Error parsing exercises:', e);
    }
    
    // Inicializar datos de sesión
    this.sessionData.exercises = exercises.map(ex => ({
      ...ex,
      series: ex.series.map(s => ({
        ...s,
        completada: false,
        peso_real: ''
      })),
      completado: false
    }));
    
    // Renderizar ejercicios
    if (this.elements.exercisesContainer) {
      this.elements.exercisesContainer.innerHTML = exercises.map((ex, index) => 
        this.renderExerciseCard(ex, index)
      ).join('');
    }
    
    // Bind events de ejercicios
    this.bindExerciseEvents();
    
    // Actualizar progreso
    this.updateProgress();
  },
  
  /**
   * Renderiza card de ejercicio
   */
  renderExerciseCard(exercise, index) {
    const seriesCount = exercise.series?.length || 0;
    const descanso = exercise.descanso_entre_series_seg || CONFIG.DEFAULT_REST_TIME;
    
    return `
      <div class="exercise-card" data-index="${index}">
        <div class="exercise-header" data-toggle="${index}">
          <div>
            <h4 class="exercise-name">${exercise.nombre}</h4>
            <span class="exercise-muscle">${exercise.grupo_muscular} • ${seriesCount} series • ${descanso}s descanso</span>
          </div>
          <div class="exercise-status">
            <span class="badge" id="exerciseBadge-${index}">Pendiente</span>
            <span style="color: #666; font-size: 1.25rem;">▼</span>
          </div>
        </div>
        <div class="exercise-body" id="exerciseBody-${index}" style="display: block;">
          <div class="exercise-media">
            ${exercise.gif_url 
              ? `<img src="${exercise.gif_url}" alt="${exercise.nombre}" loading="lazy">`
              : exercise.imagen_url
                ? `<img src="${exercise.imagen_url}" alt="${exercise.nombre}" loading="lazy">`
                : `<span style="color: #666;">📹 Demostración no disponible</span>`
            }
          </div>
          
          ${exercise.nota_coach ? `
            <div class="exercise-note">
              <p><strong>💡 Nota del Coach:</strong> ${exercise.nota_coach}</p>
            </div>
          ` : ''}
          
          <div class="series-table">
            <div class="series-row" style="font-weight: 600; color: #A0A0A0; font-size: 0.75rem; text-transform: uppercase;">
              <div>Serie</div>
              <div>Reps</div>
              <div>Peso Objetivo</div>
              <div>Peso Real</div>
              <div>✓</div>
            </div>
            ${exercise.series?.map((serie, sIndex) => `
              <div class="series-row" data-exercise="${index}" data-series="${sIndex}">
                <div class="series-number">${serie.serie}</div>
                <div class="series-field">
                  <input type="text" value="${serie.repeticiones}" disabled style="opacity: 0.7;">
                </div>
                <div class="series-field">
                  <input type="text" value="${serie.peso_objetivo}" disabled style="opacity: 0.7;">
                </div>
                <div class="series-field">
                  <input type="text" class="peso-real" placeholder="kg" value="">
                </div>
                <div class="series-checkbox" data-checkbox="${index}-${sIndex}"></div>
              </div>
            `).join('') || '<p style="color: #666;">No hay series definidas</p>'}
          </div>
          
          <div style="margin-top: 1rem; text-align: center;">
            <button class="btn btn-secondary btn-sm" onclick="ClientPanel.startRestTimer(${index}, ${descanso})">
              ⏱ Iniciar Descanso (${descanso}s)
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Vincula eventos de ejercicios
   */
  bindExerciseEvents() {
    // Toggle ejercicios
    document.querySelectorAll('[data-toggle]').forEach(header => {
      header.addEventListener('click', (e) => {
        const index = e.currentTarget.dataset.toggle;
        const body = document.getElementById(`exerciseBody-${index}`);
        if (body) {
          body.style.display = body.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
    
    // Checkboxes de series
    document.querySelectorAll('[data-checkbox]').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        const checkboxEl = e.currentTarget;
        const isChecked = checkboxEl.classList.contains('checked');
        
        if (!isChecked) {
          // Marcar como completada
          checkboxEl.classList.add('checked');
          
          // Actualizar datos
          const [exIndex, sIndex] = checkboxEl.dataset.checkbox.split('-').map(Number);
          this.sessionData.exercises[exIndex].series[sIndex].completada = true;
          
          // Iniciar timer automáticamente si no es la última serie
          const exercise = this.sessionData.exercises[exIndex];
          const isLastSeries = sIndex === exercise.series.length - 1;
          
          if (!isLastSeries) {
            this.startRestTimer(exIndex, exercise.descanso_entre_series_seg || CONFIG.DEFAULT_REST_TIME);
          } else {
            // Marcar ejercicio como completado
            exercise.completado = true;
            this.updateExerciseBadge(exIndex);
          }
        } else {
          // Desmarcar
          checkboxEl.classList.remove('checked');
          const [exIndex, sIndex] = checkboxEl.dataset.checkbox.split('-').map(Number);
          this.sessionData.exercises[exIndex].series[sIndex].completada = false;
          this.sessionData.exercises[exIndex].completado = false;
          this.updateExerciseBadge(exIndex);
        }
        
        this.updateProgress();
      });
    });
    
    // Inputs de peso real
    document.querySelectorAll('.peso-real').forEach(input => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('.series-row');
        const exIndex = parseInt(row.dataset.exercise);
        const sIndex = parseInt(row.dataset.series);
        
        this.sessionData.exercises[exIndex].series[sIndex].peso_real = e.target.value;
      });
    });
  },
  
  /**
   * Actualiza badge de ejercicio
   */
  updateExerciseBadge(exIndex) {
    const badge = document.getElementById(`exerciseBadge-${exIndex}`);
    const exercise = this.sessionData.exercises[exIndex];
    
    if (!badge) return;
    
    const completedSeries = exercise.series.filter(s => s.completada).length;
    const totalSeries = exercise.series.length;
    
    if (exercise.completado) {
      badge.className = 'badge badge-success';
      badge.textContent = '✓ Completado';
    } else if (completedSeries > 0) {
      badge.className = 'badge badge-warning';
      badge.textContent = `${completedSeries}/${totalSeries} series`;
    } else {
      badge.className = 'badge';
      badge.textContent = 'Pendiente';
      badge.style.background = '#333';
      badge.style.color = '#666';
    }
  },
  
  /**
   * Actualiza barra de progreso
   */
  updateProgress() {
    const totalExercises = this.sessionData.exercises.length;
    const completedExercises = this.sessionData.exercises.filter(ex => ex.completado).length;
    const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
    
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${progress}%`;
    }
    
    // Habilitar/deshabilitar botón de completar
    if (this.elements.completeBtn) {
      this.elements.completeBtn.disabled = progress < 100;
      this.elements.completeBtn.textContent = progress >= 100 
        ? '✓ Completar Sesión' 
        : `Progreso: ${Math.round(progress)}%`;
    }
  },
  
  /**
   * Inicia timer de descanso
   */
  startRestTimer(exIndex, seconds) {
    RestTimer.start(seconds, {
      onComplete: () => {
        // Auto-scroll a la siguiente serie
        const exerciseCard = document.querySelector(`[data-index="${exIndex}"]`);
        if (exerciseCard) {
          exerciseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      onSkip: () => {
        // Continuar sin timer
      }
    });
  },
  
  /**
   * Inicia sesión de entrenamiento
   */
  startSession() {
    this.sessionData.startTime = new Date();
    this.sessionData.completed = false;
  },
  
  /**
   * Completa la sesión
   */
  async completeSession() {
    if (!this.sessionData.exercises.every(ex => ex.completado)) {
      Utils.showModal(
        'Sesión Incompleta',
        '<p>No has completado todos los ejercicios. ¿Deseas guardar la sesión de todos modos?</p>',
        [
          { text: 'Cancelar', className: 'btn-ghost' },
          { 
            text: 'Sí, Guardar', 
            className: 'btn-primary',
            onClick: () => this.saveSession()
          }
        ]
      );
      return;
    }
    
    await this.saveSession();
  },
  
  /**
   * Guarda la sesión
   */
  async saveSession() {
    Utils.showLoading('Guardando sesión...');
    
    const user = Auth.getCurrentUser();
    const endTime = new Date();
    const duration = Math.round((endTime - this.sessionData.startTime) / 60000); // minutos
    
    const sessionPayload = {
      clienteId: user.id,
      fecha: endTime.toISOString(),
      diaSemana: Utils.getWeekday(),
      duracionMin: duration,
      ejerciciosJson: JSON.stringify(this.sessionData.exercises),
      seriesTotales: this.sessionData.exercises.reduce((sum, ex) => sum + ex.series.length, 0),
      seriesIncompletas: this.sessionData.exercises.reduce((sum, ex) => 
        sum + ex.series.filter(s => !s.completada).length, 0),
      ejerciciosCompletados: this.sessionData.exercises.filter(ex => ex.completado).length,
      ejerciciosIncompletos: this.sessionData.exercises.filter(ex => !ex.completado).length
    };
    
    try {
      const result = await Utils.callAPI('saveSession', sessionPayload);
      
      if (result.success) {
        Utils.showToast('¡Sesión completada! 💪', 'success');
        
        // Mostrar resumen
        this.showSessionSummary(sessionPayload);
        
        // Guardar último entreno
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.LAST_WORKOUT, {
          date: endTime.toISOString(),
          duration: duration
        });
      } else {
        throw new Error(result.message || 'Error al guardar sesión');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      Utils.showToast('Error al guardar sesión', 'error');
    } finally {
      Utils.hideLoading();
    }
  },
  
  /**
   * Muestra resumen de sesión
   */
  showSessionSummary(sessionData) {
    const totalSeries = sessionData.seriesTotales;
    const completedSeries = totalSeries - sessionData.seriesIncompletas;
    
    Utils.showModal(
      '¡Sesión Completada! 🎉',
      `
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💪</div>
          <h4 style="margin-bottom: 1rem;">¡Excelente trabajo!</h4>
          <div style="display: grid; gap: 0.5rem; text-align: left;">
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #252525; border-radius: 6px;">
              <span style="color: #A0A0A0;">Duración:</span>
              <span style="color: #00FF88; font-weight: 600;">${Utils.formatDuration(sessionData.duracionMin)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #252525; border-radius: 6px;">
              <span style="color: #A0A0A0;">Series completadas:</span>
              <span style="color: #00FF88; font-weight: 600;">${completedSeries}/${totalSeries}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #252525; border-radius: 6px;">
              <span style="color: #A0A0A0;">Ejercicios:</span>
              <span style="color: #00FF88; font-weight: 600;">${sessionData.ejerciciosCompletados}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 0.875rem; margin-top: 1rem;">
            Tu coach ha sido notificado por email.
          </p>
        </div>
      `,
      [{ text: 'Cerrar', className: 'btn-primary' }]
    );
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.client-panel')) {
    ClientPanel.init();
  }
});
