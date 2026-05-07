/**
 * FITPRO COACH - Utilities
 * Helper functions and utilities
 */

// ==================== FORMATTING ====================

/**
 * Formatea segundos a formato MM:SS
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formatea fecha a string local
 */
function formatDate(date, options = {}) {
  const d = new Date(date);
  const defaultOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return d.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
}

/**
 * Formatea fecha corta (DD/MM/YYYY)
 */
function formatShortDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Obtiene el día de la semana en español
 */
function getWeekday(date = new Date()) {
  const weekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return weekdays[date.getDay()];
}

/**
 * Capitaliza primera letra
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ==================== STORAGE ====================

/**
 * Guarda datos en localStorage
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving to storage:', e);
    return false;
  }
}

/**
 * Obtiene datos de localStorage
 */
function getFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Error reading from storage:', e);
    return defaultValue;
  }
}

/**
 * Elimina datos de localStorage
 */
function removeFromStorage(key) {
  localStorage.removeItem(key);
}

/**
 * Limpia todos los datos de sesión
 */
function clearSession() {
  Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ==================== VALIDATION ====================

/**
 * Valida email
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida que string no esté vacío
 */
function isNotEmpty(value) {
  return value && value.trim().length > 0;
}

/**
 * Valida número positivo
 */
function isPositiveNumber(value) {
  return !isNaN(value) && parseFloat(value) > 0;
}

// ==================== CRYPTO ====================

/**
 * Genera hash SHA-256 de un string
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== DOM UTILITIES ====================

/**
 * Crea elemento con atributos
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'onclick') {
      element.addEventListener('click', value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Muestra/oculta elemento
 */
function toggleElement(element, show) {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  if (element) {
    element.style.display = show ? '' : 'none';
  }
}

/**
 * Añade clase a elemento
 */
function addClass(element, className) {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  if (element) {
    element.classList.add(className);
  }
}

/**
 * Remueve clase de elemento
 */
function removeClass(element, className) {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  if (element) {
    element.classList.remove(className);
  }
}

// ==================== TOAST NOTIFICATIONS ====================

/**
 * Muestra toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
  // Crear contenedor si no existe
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = createElement('div', { className: 'toast-container' });
    document.body.appendChild(container);
  }
  
  // Crear toast
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = createElement('div', {
    className: `toast ${type}`,
    innerHTML: `<span>${icons[type] || icons.info}</span><span>${message}</span>`
  });
  
  container.appendChild(toast);
  
  // Remover después de la duración
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== MODAL ====================

/**
 * Muestra modal
 */
function showModal(title, content, buttons = []) {
  // Remover modal existente
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) existingModal.remove();
  
  // Crear modal
  const modal = createElement('div', { className: 'modal-overlay' }, [
    createElement('div', { className: 'modal' }, [
      createElement('div', { className: 'modal-header' }, [
        createElement('h3', { className: 'modal-title', textContent: title }),
        createElement('button', {
          className: 'modal-close',
          innerHTML: '&times;',
          onclick: () => closeModal()
        })
      ]),
      createElement('div', { className: 'modal-body', innerHTML: content }),
      buttons.length > 0 ? createElement('div', { className: 'modal-footer' }, 
        buttons.map(btn => createElement('button', {
          className: `btn ${btn.className || 'btn-secondary'}`,
          textContent: btn.text,
          onclick: () => {
            if (btn.onClick) btn.onClick();
            if (btn.close !== false) closeModal();
          }
        }))
      ) : null
    ])
  ]);
  
  document.body.appendChild(modal);
  
  // Animar entrada
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
  
  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/**
 * Cierra modal
 */
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// ==================== LOADING ====================

/**
 * Muestra estado de carga en botón
 */
function setButtonLoading(button, loading = true) {
  if (typeof button === 'string') {
    button = document.querySelector(button);
  }
  if (!button) return;
  
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.classList.add('btn-loading');
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('btn-loading');
    button.disabled = false;
  }
}

/**
 * Muestra overlay de carga
 */
function showLoading(message = 'Cargando...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = createElement('div', {
      className: 'loading-overlay',
      style: 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(13,13,13,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;'
    }, [
      createElement('div', {
        style: 'width:48px;height:48px;border:4px solid #00FF88;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;'
      }),
      createElement('p', {
        style: 'color:#A0A0A0;margin-top:16px;font-size:14px;',
        textContent: message
      })
    ]);
    document.body.appendChild(overlay);
  }
}

/**
 * Oculta overlay de carga
 */
function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

// ==================== API HELPERS ====================

/**
 * Realiza petición a Google Apps Script
 */
async function callAPI(action, data = {}) {
  try {
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Verifica conexión con backend
 */
async function checkBackendConnection() {
  try {
    const result = await callAPI('ping');
    return result.success === true;
  } catch (e) {
    return false;
  }
}

// ==================== DATE UTILS ====================

/**
 * Obtiene inicio de semana (lunes)
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Obtiene fin de semana (domingo)
 */
function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  return new Date(start.setDate(start.getDate() + 6));
}

/**
 * Calcula días entre dos fechas
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round(Math.abs((d1 - d2) / oneDay));
}

/**
 * Formatea duración en minutos a texto legible
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ==================== EXPORT ====================

// Exponer funciones globalmente
window.Utils = {
  formatTime,
  formatDate,
  formatShortDate,
  getWeekday,
  capitalize,
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  clearSession,
  isValidEmail,
  isNotEmpty,
  isPositiveNumber,
  hashPassword,
  generateUUID,
  createElement,
  toggleElement,
  addClass,
  removeClass,
  showToast,
  showModal,
  closeModal,
  setButtonLoading,
  showLoading,
  hideLoading,
  callAPI,
  checkBackendConnection,
  getWeekStart,
  getWeekEnd,
  daysBetween,
  formatDuration
};
