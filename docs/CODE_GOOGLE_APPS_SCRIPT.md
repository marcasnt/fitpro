// ==========================================
// FITPRO COACH - GOOGLE APPS SCRIPT
// Backend completo para gestión de rutinas
// Versión: 1.0 - 06 Mayo 2026
// ==========================================

// ==========================================
// CONSTANTES Y CONFIGURACIÓN
// ==========================================
const SPREADSHEET_NAME = 'FITPRO_COACH';
const SHEET_CLIENTES = 'Clientes';
const SHEET_RUTINAS = 'Rutinas';
const SHEET_EJERCICIOS = 'Ejercicios_Biblioteca';
const SHEET_SESIONES = 'Sesiones_Historial';
const SHEET_MENSAJES = 'Mensajes';
const SHEET_CONFIG = 'Config';
const SHEET_LOG = 'Log_Sesiones';

// ==========================================
// HELPERS - UTILIDADES
// ==========================================

function getSpreadsheet() {
  return SpreadsheetApp.openByName(SPREADSHEET_NAME);
}

function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

function generateUUID() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hash = digest.map(function(byte) {
    return ('0' + (byte < 0 ? byte + 256 : byte).toString(16)).slice(-2);
  }).join('');
  return hash;
}

function formatDate(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatDateTime(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function getToday() {
  return formatDate(new Date());
}

function getDiaSemana() {
  var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return dias[new Date().getDay()];
}

// ==========================================
// DOGET - SERVE HTML
// ==========================================

function doGet(e) {
  var page = e.parameter.page || 'login';

  if (page === 'coach') {
    return HtmlService.createHtmlOutputFromFile('dashboard-coach')
      .setTitle('FitPro Coach - Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (page === 'cliente') {
    return HtmlService.createHtmlOutputFromFile('panel-cliente')
      .setTitle('FitPro - Mi Rutina')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('login')
    .setTitle('FitPro Coach - Login')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

function login(email, password) {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var emailCol = headers.indexOf('email');
  var passwordCol = headers.indexOf('contrasena_hash');
  var idCol = headers.indexOf('id');
  var nombreCol = headers.indexOf('nombre');
  var rolCol = headers.indexOf('rol');
  var activoCol = headers.indexOf('activo');

  var hash = hashPassword(password);

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email && data[i][passwordCol] === hash) {
      if (data[i][activoCol] === true || data[i][activoCol] === 'TRUE') {
        return {
          success: true,
          user: {
            id: data[i][idCol],
            nombre: data[i][nombreCol],
            email: data[i][emailCol],
            rol: data[i][rolCol] || 'cliente'
          }
        };
      } else {
        return { success: false, error: 'Usuario inactivo' };
      }
    }
  }

  return { success: false, error: 'Email o contraseña incorrectos' };
}

function createUser(name, email, password, phone, rol) {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var emailCol = headers.indexOf('email');

  // Verificar email único
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      return { success: false, error: 'El email ya está registrado' };
    }
  }

  var id = generateUUID();
  var hash = hashPassword(password);
  var today = getToday();

  sheet.appendRow([id, name, email, hash, phone, today, true, null, 0, rol || 'cliente']);

  logAction(null, 'create_user', { id: id, name: name, email: email });

  return { success: true, user: { id: id, nombre: name, email: email, rol: rol || 'cliente' } };
}

function getCurrentUser(sessionToken) {
  // En una implementación real, usarías un token de sesión
  // Por ahora retornamos el usuario del storage del cliente
  return JSON.parse(Session.getTemporaryValue('currentUser') || '{}');
}

// ==========================================
// CLIENTES
// ==========================================

function getAllClients() {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var clients = [];
  var idCol = headers.indexOf('id');
  var nombreCol = headers.indexOf('nombre');
  var emailCol = headers.indexOf('email');
  var telefonoCol = headers.indexOf('telefono');
  var fechaAltaCol = headers.indexOf('fecha_alta');
  var activoCol = headers.indexOf('activo');
  var ultimoEntrenoCol = headers.indexOf('ultimo_entreno');
  var diasInactivoCol = headers.indexOf('dias_inactivo');

  for (var i = 1; i < data.length; i++) {
    if (data[i][rol] !== 'coach') { // No mostrar coach
      clients.push({
        id: data[i][idCol],
        nombre: data[i][nombreCol],
        email: data[i][emailCol],
        telefono: data[i][telefonoCol],
        fecha_alta: data[i][fechaAltaCol],
        activo: data[i][activoCol] === true || data[i][activoCol] === 'TRUE',
        ultimo_entreno: data[i][ultimoEntrenoCol],
        dias_inactivo: data[i][diasInactivoCol]
      });
    }
  }

  return clients;
}

function getClientById(id) {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var nombreCol = headers.indexOf('nombre');
  var emailCol = headers.indexOf('email');
  var telefonoCol = headers.indexOf('telefono');
  var rolCol = headers.indexOf('rol');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      return {
        id: data[i][idCol],
        nombre: data[i][nombreCol],
        email: data[i][emailCol],
        telefono: data[i][telefonoCol],
        rol: data[i][rolCol] || 'cliente'
      };
    }
  }

  return null;
}

function updateClientStatus(id, activo) {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var activoCol = headers.indexOf('activo');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, activoCol + 1).setValue(activo);
      logAction(id, 'update_status', { activo: activo });
      return { success: true };
    }
  }

  return { success: false, error: 'Cliente no encontrado' };
}

function updateClientLastTrain(id) {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var ultimoEntrenoCol = headers.indexOf('ultimo_entreno');
  var diasInactivoCol = headers.indexOf('dias_inactivo');

  var today = new Date();

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, ultimoEntrenoCol + 1).setValue(today);
      sheet.getRange(i + 1, diasInactivoCol + 1).setValue(0);
      return { success: true };
    }
  }

  return { success: false };
}

// ==========================================
// EJERCICIOS BIBLIOTECA
// ==========================================

function getEjerciciosBiblioteca() {
  var sheet = getSheet(SHEET_EJERCICIOS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var ejercicios = [];
  var idCol = headers.indexOf('id');
  var nombreCol = headers.indexOf('nombre');
  var grupoCol = headers.indexOf('grupo_muscular');
  var imagenCol = headers.indexOf('imagen_url');
  var gifCol = headers.indexOf('gif_url');
  var descCol = headers.indexOf('descripcion');
  var difCol = headers.indexOf('dificultad');
  var instrCol = headers.indexOf('instrucciones');

  for (var i = 1; i < data.length; i++) {
    ejercicios.push({
      id: data[i][idCol],
      nombre: data[i][nombreCol],
      grupo_muscular: data[i][grupoCol],
      imagen_url: data[i][imagenCol],
      gif_url: data[i][gifCol],
      descripcion: data[i][descCol],
      dificultad: data[i][difCol],
      instrucciones: data[i][instrCol]
    });
  }

  return ejercicios;
}

function getEjerciciosByGrupo(grupo) {
  var todos = getEjerciciosBiblioteca();
  return todos.filter(function(e) {
    return e.grupo_muscular.toLowerCase() === grupo.toLowerCase();
  });
}

function searchEjercicios(query) {
  var todos = getEjerciciosBiblioteca();
  var q = query.toLowerCase();

  return todos.filter(function(e) {
    return e.nombre.toLowerCase().includes(q) ||
           e.grupo_muscular.toLowerCase().includes(q) ||
           (e.descripcion && e.descripcion.toLowerCase().includes(q));
  });
}

function getGruposMusculares() {
  return ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas', 'Core', 'Cardio'];
}

// ==========================================
// RUTINAS
// ==========================================

function getRoutineForDay(cliente_id, dia_semana) {
  var sheet = getSheet(SHEET_RUTINAS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var clienteIdCol = headers.indexOf('cliente_id');
  var diaSemanaCol = headers.indexOf('dia_semana');
  var idCol = headers.indexOf('id');
  var tipoDiaCol = headers.indexOf('tipo_dia');
  var ejerciciosCol = headers.indexOf('ejercicios_json');
  var ejerciciosResumenCol = headers.indexOf('ejercicios_resumen');

  for (var i = 1; i < data.length; i++) {
    if (data[i][clienteIdCol] === cliente_id && data[i][diaSemanaCol].toLowerCase() === dia_semana.toLowerCase()) {
      var ejercicios = [];
      try {
        ejercicios = JSON.parse(data[i][ejerciciosCol] || '[]');
      } catch (e) {
        ejercicios = [];
      }

      return {
        id: data[i][idCol],
        cliente_id: data[i][clienteIdCol],
        dia_semana: data[i][diaSemanaCol],
        tipo_dia: data[i][tipoDiaCol],
        ejercicios: ejercicios,
        ejercicios_resumen: data[i][ejerciciosResumenCol]
      };
    }
  }

  return null;
}

function getTodaysRoutine(cliente_id) {
  var dia = getDiaSemana();
  return getRoutineForDay(cliente_id, dia);
}

function createRoutine(cliente_id, dia_semana, tipo_dia, ejercicios, ejercicios_resumen) {
  var sheet = getSheet(SHEET_RUTINAS);

  // Verificar si ya existe rutina para ese día
  var existing = getRoutineForDay(cliente_id, dia_semana);
  if (existing) {
    return updateRoutine(existing.id, tipo_dia, ejercicios, ejercicios_resumen);
  }

  var id = generateUUID();
  var today = getToday();
  var ejerciciosJson = JSON.stringify(ejercicios);

  sheet.appendRow([id, cliente_id, dia_semana.toLowerCase(), tipo_dia, ejerciciosJson, ejercicios_resumen, today, today]);

  logAction(cliente_id, 'create_routine', { dia: dia_semana, ejercicios: ejercicios.length });

  return { success: true, id: id };
}

function updateRoutine(rutina_id, tipo_dia, ejercicios, ejercicios_resumen) {
  var sheet = getSheet(SHEET_RUTINAS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var tipoDiaCol = headers.indexOf('tipo_dia');
  var ejerciciosCol = headers.indexOf('ejercicios_json');
  var ejerciciosResumenCol = headers.indexOf('ejercicios_resumen');
  var fechaActualizacionCol = headers.indexOf('fecha_actualizacion');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === rutina_id) {
      var today = new Date();
      sheet.getRange(i + 1, tipoDiaCol + 1).setValue(tipo_dia);
      sheet.getRange(i + 1, ejerciciosCol + 1).setValue(JSON.stringify(ejercicios));
      sheet.getRange(i + 1, ejerciciosResumenCol + 1).setValue(ejercicios_resumen);
      sheet.getRange(i + 1, fechaActualizacionCol + 1).setValue(today);

      logAction(null, 'update_routine', { rutina_id: rutina_id });

      return { success: true };
    }
  }

  return { success: false, error: 'Rutina no encontrada' };
}

function getAllRoutinesForClient(cliente_id) {
  var sheet = getSheet(SHEET_RUTINAS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var rutinas = [];
  var clienteIdCol = headers.indexOf('cliente_id');
  var idCol = headers.indexOf('id');
  var diaSemanaCol = headers.indexOf('dia_semana');
  var tipoDiaCol = headers.indexOf('tipo_dia');
  var ejerciciosResumenCol = headers.indexOf('ejercicios_resumen');

  for (var i = 1; i < data.length; i++) {
    if (data[i][clienteIdCol] === cliente_id) {
      rutinas.push({
        id: data[i][idCol],
        dia_semana: data[i][diaSemanaCol],
        tipo_dia: data[i][tipoDiaCol],
        ejercicios_resumen: data[i][ejerciciosResumenCol]
      });
    }
  }

  return rutinas;
}

function deleteRoutine(rutina_id) {
  var sheet = getSheet(SHEET_RUTINAS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === rutina_id) {
      sheet.deleteRow(i + 1);
      logAction(null, 'delete_routine', { rutina_id: rutina_id });
      return { success: true };
    }
  }

  return { success: false, error: 'Rutina no encontrada' };
}

// ==========================================
// SESIONES (HISTORIAL)
// ==========================================

function saveSession(cliente_id, fecha, dia_semana, ejercicios_json, duracion_min, observaciones) {
  var sheet = getSheet(SHEET_SESIONES);

  var id = generateUUID();

  // Calcular estadísticas
  var totalSeries = 0;
  var seriesIncompletas = 0;
  var ejerciciosCompletados = 0;
  var ejerciciosIncompletos = 0;

  ejercicios_json.forEach(function(ej) {
    var ejercicioCompletado = true;
    ej.series.forEach(function(s) {
      totalSeries++;
      if (!s.completada) {
        seriesIncompletas++;
        ejercicioCompletado = false;
      }
    });
    if (ejercicioCompletado) {
      ejerciciosCompletados++;
    } else {
      ejerciciosIncompletos++;
    }
  });

  sheet.appendRow([
    id,
    cliente_id,
    fecha,
    dia_semana,
    duracion_min,
    JSON.stringify(ejercicios_json),
    totalSeries,
    seriesIncompletas,
    ejerciciosCompletados,
    ejerciciosIncompletos,
    observaciones || ''
  ]);

  // Actualizar último entrenamiento del cliente
  updateClientLastTrain(cliente_id);

  // Enviar email al coach
  sendCompletionEmail(cliente_id, fecha, dia_semana, ejercicios_json, duracion_min);

  logAction(cliente_id, 'save_session', { fecha: fecha, duracion: duracion_min });

  return { success: true, id: id };
}

function getSessionHistory(cliente_id, limit) {
  var sheet = getSheet(SHEET_SESIONES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var sesiones = [];
  var clienteIdCol = headers.indexOf('cliente_id');
  var idCol = headers.indexOf('id');
  var fechaCol = headers.indexOf('fecha');
  var diaSemanaCol = headers.indexOf('dia_semana');
  var duracionCol = headers.indexOf('duracion_min');
  var ejerciciosCol = headers.indexOf('ejercicios_json');
  var seriesTotalesCol = headers.indexOf('series_totales');
  var seriesIncompletasCol = headers.indexOf('series_incompletas');
  var ejerciciosCompletadosCol = headers.indexOf('ejercicios_completados');
  var ejerciciosIncompletosCol = headers.indexOf('ejercicios_incompletos');

  limit = limit || 30;

  for (var i = data.length - 1; i >= 1 && sesiones.length < limit; i--) {
    if (data[i][clienteIdCol] === cliente_id) {
      var ejercicios = [];
      try {
        ejercicios = JSON.parse(data[i][ejerciciosCol] || '[]');
      } catch (e) {}

      sesiones.push({
        id: data[i][idCol],
        fecha: data[i][fechaCol],
        dia_semana: data[i][diaSemanaCol],
        duracion_min: data[i][duracionCol],
        ejercicios: ejercicios,
        series_totales: data[i][seriesTotalesCol],
        series_incompletas: data[i][seriesIncompletasCol],
        ejercicios_completados: data[i][ejerciciosCompletadosCol],
        ejercicios_incompletos: data[i][ejercpletosIncompletosCol]
      });
    }
  }

  return sesiones;
}

function getSessionByDate(cliente_id, fecha) {
  var history = getSessionHistory(cliente_id, 100);

  for (var i = 0; i < history.length; i++) {
    if (formatDate(history[i].fecha) === fecha) {
      return history[i];
    }
  }

  return null;
}

function getStatsForClient(cliente_id) {
  var history = getSessionHistory(cliente_id, 100);

  var totalSesiones = history.length;
  var totalMinutos = 0;
  var totalSeries = 0;
  var seriesIncompletas = 0;

  history.forEach(function(s) {
    totalMinutos += s.duracion_min || 0;
    totalSeries += s.series_totales || 0;
    seriesIncompletas += s.series_incompletas || 0;
  });

  return {
    total_sesiones: totalSesiones,
    total_minutos: totalMinutos,
    total_horas: Math.round(totalMinutos / 60 * 10) / 10,
    total_series: totalSeries,
    series_incompletas: seriesIncompletas,
    porcentaje_completitud: totalSeries > 0 ? Math.round((totalSeries - seriesIncompletas) / totalSeries * 100) : 100
  };
}

// ==========================================
// MENSAJES
// ==========================================

function sendMessage(cliente_id, mensaje, emisor) {
  var sheet = getSheet(SHEET_MENSAJES);

  var id = generateUUID();
  var now = new Date();

  var leido_cliente = emisor === 'cliente' ? true : false;
  var leido_coach = emisor === 'coach' ? true : false;

  sheet.appendRow([id, cliente_id, 'coach', emisor, mensaje, now, leido_cliente, leido_coach]);

  logAction(cliente_id, 'send_message', { emisor: emisor, preview: mensaje.substring(0, 50) });

  return { success: true, id: id };
}

function getMessages(cliente_id, limit) {
  var sheet = getSheet(SHEET_MENSAJES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var mensajes = [];
  var clienteIdCol = headers.indexOf('cliente_id');
  var idCol = headers.indexOf('id');
  var emisorCol = headers.indexOf('emisor');
  var mensajeCol = headers.indexOf('mensaje');
  var fechaCol = headers.indexOf('fecha');
  var leidoClienteCol = headers.indexOf('leido_cliente');
  var leidoCoachCol = headers.indexOf('leido_coach');

  limit = limit || 50;

  for (var i = data.length - 1; i >= 0 && mensajes.length < limit; i--) {
    if (data[i][clienteIdCol] === cliente_id) {
      mensajes.push({
        id: data[i][idCol],
        emisor: data[i][emisorCol],
        mensaje: data[i][mensajeCol],
        fecha: data[i][fechaCol],
        leido_cliente: data[i][leidoClienteCol],
        leido_coach: data[i][leidoCoachCol]
      });
    }
  }

  return mensajes;
}

function getUnreadMessagesCount(cliente_id) {
  var mensajes = getMessages(cliente_id, 100);
  return mensajes.filter(function(m) {
    return m.emisor === 'coach' && !m.leido_cliente;
  }).length;
}

function markMessageAsRead(mensaje_id, receptor) {
  var sheet = getSheet(SHEET_MENSAJES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var leidoClienteCol = headers.indexOf('leido_cliente');
  var leidoCoachCol = headers.indexOf('leido_coach');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === mensaje_id) {
      if (receptor === 'cliente') {
        sheet.getRange(i + 1, leidoClienteCol + 1).setValue(true);
      } else if (receptor === 'coach') {
        sheet.getRange(i + 1, leidoCoachCol + 1).setValue(true);
      }
      return { success: true };
    }
  }

  return { success: false };
}

function getConversationsForCoach() {
  var sheet = getSheet(SHEET_MENSAJES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var clienteIdCol = headers.indexOf('cliente_id');
  var idCol = headers.indexOf('id');
  var emisorCol = headers.indexOf('emisor');
  var mensajeCol = headers.indexOf('mensaje');
  var fechaCol = headers.indexOf('fecha');
  var leidoCoachCol = headers.indexOf('leido_coach');

  var conversations = {};

  for (var i = 1; i < data.length; i++) {
    var cliente_id = data[i][clienteIdCol];
    if (!conversations[cliente_id]) {
      var cliente = getClientById(cliente_id);
      conversations[cliente_id] = {
        cliente: cliente,
        ultimos_mensajes: [],
        mensajes_no_leidos: 0
      };
    }

    var esNoLeido = data[i][emisorCol] === 'cliente' && data[i][leidoCoachCol] !== true;
    if (esNoLeido) {
      conversations[cliente_id].mensajes_no_leidos++;
    }

    if (conversations[cliente_id].ultimos_mensajes.length < 3) {
      conversations[cliente_id].ultimos_mensajes.push({
        id: data[i][idCol],
        emisor: data[i][emisorCol],
        mensaje: data[i][mensajeCol],
        fecha: data[i][fechaCol]
      });
    }
  }

  return Object.values(conversations);
}

// ==========================================
// EMAIL AL COACH
// ==========================================

function sendCompletionEmail(cliente_id, fecha, dia_semana, ejercicios, duracion_min) {
  var cliente = getClientById(cliente_id);
  var config = getConfig();

  if (!cliente || !config.email_coach) return;

  var subject = '✅ ' + cliente.nombre + ' completó rutina de ' + capitalize(dia_semana) + ' - ' + formatDate(fecha);

  var body = 'Rutina completada por: ' + cliente.nombre + '\n';
  body += 'Día: ' + capitalize(dia_semana) + '\n';
  body += 'Fecha: ' + formatDate(fecha) + '\n';
  body += 'Hora: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm') + '\n';
  body += 'Duración: ' + duracion_min + ' minutos\n\n';
  body += 'RESUMEN:\n';
  body += '═══════════════════════════════════\n\n';

  ejercicios.forEach(function(ej) {
    var seriesCompletadas = ej.series.filter(function(s) { return s.completada; }).length;
    var seriesTotales = ej.series.length;

    body += '📍 ' + ej.nombre + ' - ' + seriesCompletadas + '/' + seriesTotales + ' series completadas\n';

    ej.series.forEach(function(s) {
      var excedio = s.peso_real && parseFloat(s.peso_real) > parseFloat(s.peso_objetivo);
      var pesoReal = s.peso_real || s.peso_objetivo;
      var marker = excedio ? ' ⚡' : '';
      body += '   • Serie ' + s.serie + ': ' + s.repeticiones + ' reps @ ' + pesoReal + marker + '\n';
    });

    body += '\n';
  });

  body += '───────────────────────────────\n';
  body += 'Ver historial completo en Google Sheets:\n';
  body += 'https://docs.google.com/spreadsheets/d/' + getSpreadsheet().getId() + '\n';

  try {
    GmailApp.sendEmail(config.email_coach, subject, body);
    logAction(cliente_id, 'send_email', { fecha: fecha });
    return { success: true };
  } catch (e) {
    logAction(cliente_id, 'email_error', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

function getConfig() {
  var sheet = getSheet(SHEET_CONFIG);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var config = {};
  var claveCol = headers.indexOf('clave');
  var valorCol = headers.indexOf('valor');

  for (var i = 1; i < data.length; i++) {
    config[data[i][claveCol]] = data[i][valorCol];
  }

  return config;
}

function updateConfig(clave, valor) {
  var sheet = getSheet(SHEET_CONFIG);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var claveCol = headers.indexOf('clave');

  for (var i = 1; i < data.length; i++) {
    if (data[i][claveCol] === clave) {
      sheet.getRange(i + 1, 2).setValue(valor);
      return { success: true };
    }
  }

  return { success: false, error: 'Config not found' };
}

// ==========================================
// LOG
// ==========================================

function logAction(cliente_id, accion, detalle) {
  var sheet = getSheet(SHEET_LOG);

  var id = generateUUID();
  var now = new Date();

  sheet.appendRow([id, cliente_id, accion, JSON.stringify(detalle), now]);

  // Mantener solo los últimos 1000 registros
  var totalRows = sheet.getLastRow();
  if (totalRows > 1001) {
    sheet.deleteRows(2, totalRows - 1001);
  }
}

// ==========================================
// TRIGGERS
// ==========================================

function onSessionSaved(e) {
  // Se dispara cuando se guarda una sesión
  // Ya está manejado en saveSession()
}

function checkInactiveClients() {
  var sheet = getSheet(SHEET_CLIENTES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idCol = headers.indexOf('id');
  var activoCol = headers.indexOf('activo');
  var ultimoEntrenoCol = headers.indexOf('ultimo_entreno');
  var diasInactivoCol = headers.indexOf('dias_inactivo');

  var today = new Date();

  for (var i = 1; i < data.length; i++) {
    var ultimoEntreno = data[i][ultimoEntrenoCol];
    if (ultimoEntreno) {
      var diffDays = Math.floor((today - new Date(ultimoEntreno)) / (1000 * 60 * 60 * 24));
      sheet.getRange(i + 1, diasInactivoCol + 1).setValue(diffDays);

      // Marcar como inactivo si han pasado más de 14 días
      if (diffDays > 14 && data[i][activoCol] === true) {
        sheet.getRange(i + 1, activoCol + 1).setValue(false);
        logAction(data[i][idCol], 'auto_inactive', { dias: diffDays });
      }
    }
  }
}

function setupTriggers() {
  // Trigger para verificar clientes inactivos (cada día)
  ScriptApp.newTrigger('checkInactiveClients')
    .timeBased()
    .everyDays(1)
    .create();

  Logger.log('Triggers configurados correctamente');
}

// ==========================================
// TESTING
// ==========================================

function testConnection() {
  return {
    success: true,
    spreadsheet: getSpreadsheet().getName(),
    timestamp: new Date()
  };
}

function testCreateUser() {
  return createUser('Test User', 'test@test.com', '123456', '+58 412 000 0000', 'cliente');
}

function testSendEmail() {
  var cliente = { nombre: 'Carlos Mendoza' };
  var ejercicios = [
    {
      nombre: 'Press de Banca',
      series: [
        { serie: 1, repeticiones: 15, peso_objetivo: '50kg', peso_real: '50kg', completada: true },
        { serie: 2, repeticiones: 12, peso_objetivo: '55kg', peso_real: '55kg', completada: true },
        { serie: 3, repeticiones: 12, peso_objetivo: '60kg', peso_real: '62.5kg', completada: true, excedio: true },
        { serie: 4, repeticiones: 10, peso_objetivo: '60kg', peso_real: '60kg', completada: true }
      ]
    }
  ];

  return sendCompletionEmail('test-id', new Date(), 'lunes', ejercicios, 65);
}