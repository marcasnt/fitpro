/**
 * FITPRO COACH - Configuration
 * Google Apps Script Backend Integration
 */

const CONFIG = {
  // Google Apps Script Web App URL - usa proxy local en Vercel
  GAS_URL: '/api/proxy',
  
  // Google Drive folder ID para imágenes de ejercicios
  DRIVE_FOLDER_ID: '1e2lNu9n33WqPnaOtJj-N2YUVb1jZzfck',
  
  // App Settings
  APP_NAME: 'FITPRO COACH',
  APP_VERSION: '2.0',
  COACH_EMAIL: 'marcasnt@gmail.com',
  COACH_NAME: 'MARVIN CASCANTE',
  
  // Default values
  DEFAULT_REST_TIME: 90, // segundos
  MAX_EXERCISES_PER_DAY: 6,
  
  // Storage keys
  STORAGE_KEYS: {
    USER: 'fitpro_user',
    TOKEN: 'fitpro_token',
    SESSION: 'fitpro_session',
    LAST_WORKOUT: 'fitpro_last_workout'
  },
  
  // Días de la semana
  WEEKDAYS: [
    { id: 'lunes', label: 'Lunes', short: 'Lun' },
    { id: 'martes', label: 'Martes', short: 'Mar' },
    { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
    { id: 'jueves', label: 'Jueves', short: 'Jue' },
    { id: 'viernes', label: 'Viernes', short: 'Vie' },
    { id: 'sabado', label: 'Sábado', short: 'Sáb' },
    { id: 'domingo', label: 'Domingo', short: 'Dom' }
  ],
  
  // Grupos musculares
  MUSCLE_GROUPS: [
    'Pecho',
    'Espalda',
    'Hombros',
    'Bíceps',
    'Tríceps',
    'Piernas',
    'Core',
    'Cardio',
    'Full Body'
  ],
  
  // Tipos de día
  DAY_TYPES: [
    { id: 'rutina', label: 'Rutina de Entrenamiento', color: '#00FF88' },
    { id: 'descanso_pasivo', label: 'Descanso Pasivo', color: '#666666' },
    { id: 'descanso_activo', label: 'Descanso Activo', color: '#FFB800' }
  ]
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
