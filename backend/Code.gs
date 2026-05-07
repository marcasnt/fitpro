/**
 * FITPRO COACH - Google Apps Script Backend
 * API REST para integración con Google Sheets
 */

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  SHEET_NAME: 'FITPRO_COACH',
  SPREADSHEET_ID: '1T1oIZxhBu43SdgKDTVFosTku_h-H5PqKefxOJtat-Yc',
  COACH_EMAIL: 'marcasnt@gmail.com',
  DEFAULT_REST_TIME: 90,
  MAX_EXERCISES_PER_DAY: 6
};

// ============================================
// WEB APP ENTRY POINTS
// ============================================

/**
 * Maneja peticiones GET
 */
function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  var action = params.action;
  
  if (action === 'webapp') {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('FITPRO COACH')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  var output = ContentService.createTextOutput(JSON.stringify({ success: true, message: 'FITPRO COACH API v2.0' }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Maneja peticiones OPTIONS (CORS preflight)
 * Debe retornar 200 OK para el navegador continúe
 */
function doOptions(e) {
  e = e || {};
  var output = ContentService.createTextOutput('ok');
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

/**
 * Maneja peticiones POST
 */
function doPost(e) {
  e = e || {};
  try {
    var postData = e.postData;
    if (!postData || !postData.contents) {
      return jsonResponse({ success: false, error: 'No data received' });
    }
    var data = JSON.parse(postData.contents);
    var action = data.action;
    
    switch(action) {
      // Auth
      case 'login':
        return jsonResponse(login(data.email, data.password));
      case 'createUser':
        return jsonResponse(createUser(data));
      case 'updateUser':
        return jsonResponse(updateUser(data.userId, data));
      case 'changePassword':
        return jsonResponse(changePassword(data.userId, data.currentPassword, data.newPassword));
        
      // Clientes
      case 'getClients':
        return jsonResponse(getClients(data.coachId));
      case 'getClient':
        return jsonResponse(getClient(data.clientId));
      case 'updateClient':
        return jsonResponse(updateClient(data.clientId, data));
        
      // Rutinas
      case 'getRoutineForDay':
        return jsonResponse(getRoutineForDay(data.clienteId, data.diaSemana));
      case 'getAllRoutinesForClient':
        return jsonResponse(getAllRoutinesForClient(data.clienteId));
      case 'createRoutine':
        return jsonResponse(createRoutine(data));
      case 'updateRoutine':
        return jsonResponse(updateRoutine(data.routineId, data));
      case 'deleteRoutine':
        return jsonResponse(deleteRoutine(data.routineId));
        
      // Ejercicios
      case 'getEjerciciosBiblioteca':
        return jsonResponse(getEjerciciosBiblioteca());
      case 'getEjerciciosByGrupo':
        return jsonResponse(getEjerciciosByGrupo(data.grupo));
      case 'searchEjercicios':
        return jsonResponse(searchEjercicios(data.query));
        
      // Sesiones
      case 'saveSession':
        return jsonResponse(saveSession(data));
      case 'getSessionHistory':
        return jsonResponse(getSessionHistory(data.clienteId));
      case 'getRecentSessions':
        return jsonResponse(getRecentSessions(data.coachId, data.limit));
        
      // Mensajes
      case 'sendMessage':
        return jsonResponse(sendMessage(data));
      case 'getMessages':
        return jsonResponse(getMessages(data.userId, data.rol));
      case 'markMessagesAsRead':
        return jsonResponse(markMessagesAsRead(data.userId, data.rol));
      case 'getUnreadCount':
        return jsonResponse(getUnreadCount(data.userId, data.rol));
        
      // Stats
      case 'getCoachStats':
        return jsonResponse(getCoachStats(data.coachId));
        
      // Health check
      case 'ping':
        return jsonResponse({ success: true, timestamp: new Date().toISOString() });
        
      default:
        return jsonResponse({ success: false, error: 'Acción no válida' });
    }
    
  } catch (error) {
    console.error('Error en doPost:', error);
    return jsonResponse({ success: false, error: error.message });
  }
}

// ============================================
// UTILIDADES
// ============================================

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet no encontrado. Vincula el script al spreadsheet.');
  }
  return ss;
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Inicializar con headers
    initializeSheet(sheet, name);
  }
  
  return sheet;
}

function initializeSheet(sheet, name) {
  const headers = {
    'Clientes': ['id', 'nombre', 'email', 'contrasena_hash', 'telefono', 'fecha_alta', 'activo', 'ultimo_entreno', 'dias_inactivo', 'rol'],
    'Rutinas': ['id', 'cliente_id', 'dia_semana', 'tipo_dia', 'ejercicios_json', 'ejercicios_resumen', 'fecha_creacion', 'fecha_actualizacion'],
    'Ejercicios_Biblioteca': ['id', 'nombre', 'grupo_muscular', 'imagen_url', 'gif_url', 'descripcion', 'dificultad', 'instrucciones'],
    'Sesiones_Historial': ['id', 'cliente_id', 'fecha', 'dia_semana', 'duracion_min', 'ejercicios_json', 'series_totales', 'series_incompletas', 'ejercicios_completados', 'ejercicios_incompletos', 'observaciones'],
    'Mensajes': ['id', 'cliente_id', 'coach_id', 'emisor', 'mensaje', 'fecha', 'leido_cliente', 'leido_coach'],
    'Config': ['clave', 'valor'],
    'Log_Sesiones': ['id', 'cliente_id', 'accion', 'detalle', 'fecha']
  };
  
  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
  }
}

function generateUUID() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

function getToday() {
  return new Date();
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ============================================
// AUTENTICACIÓN
// ============================================

function login(email, password) {
  Logger.log('=== LOGIN DEBUG ===');
  Logger.log('Email received: ' + email);
  Logger.log('Password received: ' + password);
  Logger.log('Password hashed: ' + hashPassword(password));
  
  var sheet = getSheet('Clientes');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  Logger.log('Headers found: ' + headers.join(', '));
  Logger.log('Total rows: ' + (data.length - 1));
  
  var foundEmail = false;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowData = {};
    headers.forEach(function(h, idx) { rowData[h] = row[idx]; });
    
    if (rowData.email === email) {
      foundEmail = true;
      Logger.log('Email FOUND in row ' + i);
      Logger.log('Stored hash: ' + rowData.contrasena_hash);
      Logger.log('Password hashed to compare: ' + hashPassword(password));
      Logger.log('Match (hashed): ' + (rowData.contrasena_hash === hashPassword(password)));
      Logger.log('Match (plain): ' + (rowData.contrasena_hash === password));
      
      if (rowData.contrasena_hash === hashPassword(password) || rowData.contrasena_hash === password) {
        if (!rowData.activo) {
          return { success: false, error: 'Cuenta desactivada' };
        }
        
        var token = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 
          email + Date.now()).map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
        
        return {
          success: true,
          user: {
            id: rowData.id,
            nombre: rowData.nombre,
            email: rowData.email,
            telefono: rowData.telefono,
            rol: rowData.rol || 'cliente',
            activo: rowData.activo
          },
          token: token
        };
      }
    }
  }
  
  Logger.log('Final: foundEmail=' + foundEmail);
  Logger.log('=== END LOGIN DEBUG ===');
  return { success: false, error: 'Credenciales incorrectas' };
}

function createUser(data) {
  const sheet = getSheet('Clientes');
  
  // Verificar email único
  const existing = sheet.createTextFinder(data.email).findNext();
  if (existing) {
    return { success: false, error: 'El email ya está registrado' };
  }
  
  const id = generateUUID();
  const fechaAlta = new Date();
  
  sheet.appendRow([
    id,
    data.nombre,
    data.email,
    hashPassword(data.password),
    data.telefono || '',
    fechaAlta,
    true,
    '',
    0,
    data.rol || 'cliente'
  ]);
  
  return {
    success: true,
    user: {
      id: id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol || 'cliente'
    }
  };
}

function updateUser(userId, data) {
  const sheet = getSheet('Clientes');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === userId) {
      // Actualizar campos permitidos
      if (data.nombre) sheet.getRange(i + 1, 2).setValue(data.nombre);
      if (data.telefono) sheet.getRange(i + 1, 5).setValue(data.telefono);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Usuario no encontrado' };
}

function changePassword(userId, currentPassword, newPassword) {
  const sheet = getSheet('Clientes');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === userId) {
      if (dataRange[i][3] !== currentPassword) {
        return { success: false, error: 'Contraseña actual incorrecta' };
      }
      sheet.getRange(i + 1, 4).setValue(newPassword);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Usuario no encontrado' };
}

// ============================================
// CLIENTES
// ============================================

function getClients(coachId) {
  const sheet = getSheet('Clientes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const clients = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    headers.forEach((h, idx) => rowData[h] = row[idx]);
    
    if (rowData.rol === 'cliente') {
      clients.push({
        id: rowData.id,
        nombre: rowData.nombre,
        email: rowData.email,
        telefono: rowData.telefono,
        activo: rowData.activo,
        fecha_alta: rowData.fecha_alta,
        ultimo_entreno: rowData.ultimo_entreno
      });
    }
  }
  
  return { success: true, clients: clients };
}

function getClient(clientId) {
  const sheet = getSheet('Clientes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === clientId) {
      const rowData = {};
      headers.forEach((h, idx) => rowData[h] = data[i][idx]);
      
      return {
        success: true,
        client: {
          id: rowData.id,
          nombre: rowData.nombre,
          email: rowData.email,
          telefono: rowData.telefono,
          activo: rowData.activo
        }
      };
    }
  }
  
  return { success: false, error: 'Cliente no encontrado' };
}

function updateClient(clientId, data) {
  const sheet = getSheet('Clientes');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === clientId) {
      if (data.nombre) sheet.getRange(i + 1, 2).setValue(data.nombre);
      if (data.telefono) sheet.getRange(i + 1, 5).setValue(data.telefono);
      if (typeof data.activo !== 'undefined') sheet.getRange(i + 1, 7).setValue(data.activo);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Cliente no encontrado' };
}

// ============================================
// RUTINAS
// ============================================

function getRoutineForDay(clienteId, diaSemana) {
  const sheet = getSheet('Rutinas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === clienteId && row[2] === diaSemana) {
      const rowData = {};
      headers.forEach((h, idx) => rowData[h] = row[idx]);
      
      return {
        success: true,
        routine: {
          id: rowData.id,
          cliente_id: rowData.cliente_id,
          dia_semana: rowData.dia_semana,
          tipo_dia: rowData.tipo_dia,
          ejercicios_json: rowData.ejercicios_json,
          ejercicios_resumen: rowData.ejercicios_resumen
        }
      };
    }
  }
  
  return { success: false, error: 'No hay rutina para este día' };
}

function getAllRoutinesForClient(clienteId) {
  const sheet = getSheet('Rutinas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const routines = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === clienteId) {
      const rowData = {};
      headers.forEach((h, idx) => rowData[h] = row[idx]);
      
      routines.push({
        id: rowData.id,
        dia_semana: rowData.dia_semana,
        tipo_dia: rowData.tipo_dia,
        ejercicios_resumen: rowData.ejercicios_resumen
      });
    }
  }
  
  return { success: true, routines: routines };
}

function createRoutine(data) {
  const sheet = getSheet('Rutinas');
  
  const id = generateUUID();
  const fechaCreacion = new Date();
  const ejerciciosJson = JSON.stringify(data.ejercicios || []);
  const resumen = generateRoutineSummary(data.ejercicios || []);
  
  sheet.appendRow([
    id,
    data.clienteId,
    data.diaSemana,
    data.tipoDia,
    ejerciciosJson,
    resumen,
    fechaCreacion,
    fechaCreacion
  ]);
  
  return { success: true, routineId: id };
}

function updateRoutine(routineId, data) {
  const sheet = getSheet('Rutinas');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === routineId) {
      if (data.ejercicios) {
        const ejerciciosJson = JSON.stringify(data.ejercicios);
        sheet.getRange(i + 1, 5).setValue(ejerciciosJson);
        sheet.getRange(i + 1, 6).setValue(generateRoutineSummary(data.ejercicios));
      }
      if (data.tipoDia) sheet.getRange(i + 1, 4).setValue(data.tipoDia);
      sheet.getRange(i + 1, 8).setValue(new Date());
      return { success: true };
    }
  }
  
  return { success: false, error: 'Rutina no encontrada' };
}

function deleteRoutine(routineId) {
  const sheet = getSheet('Rutinas');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === routineId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Rutina no encontrada' };
}

function generateRoutineSummary(ejercicios) {
  if (!ejercicios || ejercicios.length === 0) return 'Sin ejercicios';
  return ejercicios.map(e => e.nombre).join(', ');
}

// ============================================
// EJERCICIOS
// ============================================

function getEjerciciosBiblioteca() {
  const sheet = getSheet('Ejercicios_Biblioteca');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const exercises = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    headers.forEach((h, idx) => rowData[h] = row[idx]);
    
    exercises.push({
      id: rowData.id,
      nombre: rowData.nombre,
      grupo_muscular: rowData.grupo_muscular,
      imagen_url: rowData.imagen_url,
      gif_url: rowData.gif_url,
      descripcion: rowData.descripcion,
      dificultad: rowData.dificultad
    });
  }
  
  return { success: true, exercises: exercises };
}

function getEjerciciosByGrupo(grupo) {
  const result = getEjerciciosBiblioteca();
  if (!result.success) return result;
  
  const filtered = result.exercises.filter(e => 
    e.grupo_muscular.toLowerCase() === grupo.toLowerCase()
  );
  
  return { success: true, exercises: filtered };
}

function searchEjercicios(query) {
  const result = getEjerciciosBiblioteca();
  if (!result.success) return result;
  
  const searchTerm = query.toLowerCase();
  const filtered = result.exercises.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm) ||
    e.grupo_muscular.toLowerCase().includes(searchTerm)
  );
  
  return { success: true, exercises: filtered };
}

// ============================================
// SESIONES
// ============================================

function saveSession(data) {
  const sheet = getSheet('Sesiones_Historial');
  
  const id = generateUUID();
  
  sheet.appendRow([
    id,
    data.clienteId,
    new Date(data.fecha),
    data.diaSemana,
    data.duracionMin,
    data.ejerciciosJson,
    data.seriesTotales || 0,
    data.seriesIncompletas || 0,
    data.ejerciciosCompletados || 0,
    data.ejerciciosIncompletos || 0,
    data.observaciones || ''
  ]);
  
  // Actualizar último entreno del cliente
  updateClientLastWorkout(data.clienteId);
  
  // Enviar email al coach
  sendSessionEmail(data);
  
  return { success: true, sessionId: id };
}

function updateClientLastWorkout(clienteId) {
  const sheet = getSheet('Clientes');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === clienteId) {
      sheet.getRange(i + 1, 8).setValue(new Date());
      sheet.getRange(i + 1, 9).setValue(0);
      return;
    }
  }
}

function getSessionHistory(clienteId) {
  const sheet = getSheet('Sesiones_Historial');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const sessions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === clienteId) {
      const rowData = {};
      headers.forEach((h, idx) => rowData[h] = row[idx]);
      
      sessions.push({
        id: rowData.id,
        fecha: rowData.fecha,
        dia_semana: rowData.dia_semana,
        duracion_min: rowData.duracion_min,
        ejercicios_completados: rowData.ejercicios_completados,
        series_totales: rowData.series_totales
      });
    }
  }
  
  // Ordenar por fecha descendente
  sessions.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  return { success: true, sessions: sessions };
}

function getRecentSessions(coachId, limit = 10) {
  const sheet = getSheet('Sesiones_Historial');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Obtener nombres de clientes
  const clientsSheet = getSheet('Clientes');
  const clientsData = clientsSheet.getDataRange().getValues();
  const clientNames = {};
  for (let i = 1; i < clientsData.length; i++) {
    clientNames[clientsData[i][0]] = clientsData[i][1];
  }
  
  const sessions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    headers.forEach((h, idx) => rowData[h] = row[idx]);
    
    sessions.push({
      id: rowData.id,
      cliente_id: rowData.cliente_id,
      cliente_nombre: clientNames[rowData.cliente_id] || 'Desconocido',
      fecha: rowData.fecha,
      dia_semana: rowData.dia_semana,
      duracion_min: rowData.duracion_min
    });
  }
  
  // Ordenar por fecha descendente y limitar
  sessions.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  return { success: true, sessions: sessions.slice(0, limit) };
}

function sendSessionEmail(sessionData) {
  try {
    // Obtener info del cliente
    const clientResult = getClient(sessionData.clienteId);
    const clientName = clientResult.success ? clientResult.client.nombre : 'Cliente';
    
    const subject = `✅ ${clientName} completó rutina de ${sessionData.diaSemana} - ${formatDate(new Date())}`;
    
    let body = `Hola Coach,\n\n`;
    body += `${clientName} acaba de completar su entrenamiento de ${sessionData.diaSemana}.\n\n`;
    body += `Duración: ${sessionData.duracionMin} minutos\n`;
    body += `Ejercicios completados: ${sessionData.ejerciciosCompletados}\n`;
    body += `Series totales: ${sessionData.seriesTotales}\n\n`;
    
    // Parsear ejercicios para detalle
    try {
      const ejercicios = JSON.parse(sessionData.ejerciciosJson);
      body += `Detalle de ejercicios:\n`;
      ejercicios.forEach(ex => {
        const completedSeries = ex.series.filter(s => s.completada).length;
        body += `- ${ex.nombre}: ${completedSeries}/${ex.series.length} series\n`;
        
        ex.series.forEach((serie, idx) => {
          if (serie.completada) {
            const pesoReal = serie.peso_real || serie.peso_objetivo;
            const excedio = parseFloat(pesoReal) > parseFloat(serie.peso_objetivo);
            body += `  Serie ${serie.serie}: ${serie.repeticiones} reps @ ${pesoReal}${excedio ? ' 🔥 SUPERÓ OBJETIVO' : ''}\n`;
          }
        });
      });
    } catch (e) {
      console.error('Error parsing exercises:', e);
    }
    
    body += `\nSaludos,\nFITPRO COACH`;
    
    GmailApp.sendEmail(CONFIG.COACH_EMAIL, subject, body);
    
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// ============================================
// MENSAJES
// ============================================

function sendMessage(data) {
  const sheet = getSheet('Mensajes');
  
  const id = generateUUID();
  const coachId = getCoachId();
  
  sheet.appendRow([
    id,
    data.userId,
    coachId,
    data.rol,
    data.mensaje,
    new Date(),
    data.rol === 'cliente',
    data.rol === 'coach'
  ]);
  
  return { success: true, messageId: id };
}

function getMessages(userId, rol) {
  const sheet = getSheet('Mensajes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const coachId = getCoachId();
  
  const messages = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    headers.forEach((h, idx) => rowData[h] = row[idx]);
    
    // Si es cliente, mostrar solo sus mensajes con el coach
    // Si es coach, mostrar mensajes con este cliente específico
    const isRelevant = rol === 'cliente' 
      ? (rowData.cliente_id === userId)
      : (rowData.cliente_id === userId);
    
    if (isRelevant) {
      messages.push({
        id: rowData.id,
        emisor: rowData.emisor,
        mensaje: rowData.mensaje,
        fecha: rowData.fecha,
        leido_cliente: rowData.leido_cliente,
        leido_coach: rowData.leido_coach
      });
    }
  }
  
  // Ordenar por fecha
  messages.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  
  return { success: true, messages: messages };
}

function markMessagesAsRead(userId, rol) {
  const sheet = getSheet('Mensajes');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    const row = dataRange[i];
    if (row[1] === userId) {
      if (rol === 'cliente' && !row[6]) {
        sheet.getRange(i + 1, 7).setValue(true);
      } else if (rol === 'coach' && !row[7]) {
        sheet.getRange(i + 1, 8).setValue(true);
      }
    }
  }
  
  return { success: true };
}

function getUnreadCount(userId, rol) {
  const sheet = getSheet('Mensajes');
  const data = sheet.getDataRange().getValues();
  
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === userId) {
      if (rol === 'cliente' && !row[6] && row[3] === 'coach') {
        count++;
      } else if (rol === 'coach' && !row[7] && row[3] === 'cliente') {
        count++;
      }
    }
  }
  
  return { success: true, count: count };
}

function getCoachId() {
  const sheet = getSheet('Clientes');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][9] === 'coach') {
      return data[i][0];
    }
  }
  
  return null;
}

// ============================================
// STATS
// ============================================

function getCoachStats(coachId) {
  const clientsSheet = getSheet('Clientes');
  const sessionsSheet = getSheet('Sesiones_Historial');
  const messagesSheet = getSheet('Mensajes');
  
  const clientsData = clientsSheet.getDataRange().getValues();
  const sessionsData = sessionsSheet.getDataRange().getValues();
  const messagesData = messagesSheet.getDataRange().getValues();
  
  // Contar clientes totales
  let totalClients = 0;
  let activeToday = 0;
  const today = formatDate(new Date());
  
  for (let i = 1; i < clientsData.length; i++) {
    if (clientsData[i][9] === 'cliente') {
      totalClients++;
      
      // Verificar si entrenó hoy
      const lastWorkout = clientsData[i][7];
      if (lastWorkout && formatDate(lastWorkout) === today) {
        activeToday++;
      }
    }
  }
  
  // Contar sesiones esta semana
  const weekStart = getWeekStart();
  let sessionsThisWeek = 0;
  
  for (let i = 1; i < sessionsData.length; i++) {
    const sessionDate = sessionsData[i][2];
    if (sessionDate >= weekStart) {
      sessionsThisWeek++;
    }
  }
  
  // Contar mensajes pendientes
  let pendingMessages = 0;
  for (let i = 1; i < messagesData.length; i++) {
    if (messagesData[i][3] === 'cliente' && !messagesData[i][7]) {
      pendingMessages++;
    }
  }
  
  return {
    success: true,
    stats: {
      totalClients: totalClients,
      activeToday: activeToday,
      sessionsThisWeek: sessionsThisWeek,
      pendingMessages: pendingMessages
    }
  };
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ============================================
// TRIGGERS
// ============================================

/**
 * Configura triggers automáticos
 */
function setupTriggers() {
  // Trigger diario para verificar clientes inactivos
  ScriptApp.newTrigger('checkInactiveClients')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  console.log('Triggers configurados correctamente');
}

/**
 * Verifica clientes inactivos y envía alertas
 */
function checkInactiveClients() {
  const sheet = getSheet('Clientes');
  const data = sheet.getDataRange().getValues();
  
  const today = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][9] !== 'cliente' || !data[i][6]) continue;
    
    const lastWorkout = data[i][7];
    const diasInactivo = data[i][8] || 0;
    
    if (lastWorkout) {
      const diffDays = Math.floor((today - new Date(lastWorkout)) / (1000 * 60 * 60 * 24));
      
      if (diffDays !== diasInactivo) {
        sheet.getRange(i + 1, 9).setValue(diffDays);
      }
      
      // Alertar si lleva más de 7 días sin entrenar
      if (diffDays >= 7 && diffDays % 7 === 0) {
        const clientName = data[i][1];
        const subject = `⚠️ ${clientName} lleva ${diffDays} días sin entrenar`;
        const body = `Hola Coach,\n\n${clientName} no ha registrado ninguna sesión en los últimos ${diffDays} días.\n\nPodrías contactarlo para motivarlo.\n\nFITPRO COACH`;
        
        GmailApp.sendEmail(CONFIG.COACH_EMAIL, subject, body);
      }
    }
  }
}

function createCoachAccount() {
  var sheet = getSheet('Clientes');
  var existing = sheet.createTextFinder('marcasnt@gmail.com').findNext();
  if (existing) {
    return { success: false, error: 'El coach ya existe' };
  }
  var id = generateUUID();
  sheet.appendRow([
    id,
    'MARVIN CASCANTE',
    'marcasnt@gmail.com',
    hashPassword('mamcyj11jm'),
    '+505 84508617',
    new Date(),
    true,
    '',
    0,
    'coach'
  ]);
  return { success: true, message: 'Coach creado correctamente' };
}
