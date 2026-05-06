# ESTRUCTURA GOOGLE SHEETS - FITPRO COACH

## Configuración Inicial

1. Crear un nuevo Google Spreadsheet llamado: **FITPRO_COACH**
2. En el menú Extensiones → Apps Script
3. Copiar el código de `CODE_GOOGLE_APPS_SCRIPT.md`
4. En el menú Extensiones → Apps Script → Triggers → Add Trigger
   - Select function: `sendCompletionEmail`
   - Event source: From spreadsheet
   - Events: On form submit

---

## HOJA 1: Clientes

### Nombre de pestaña: `Clientes`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | nombre | STRING | Nombre completo |
| C | email | STRING | Email único |
| D | contrasena_hash | STRING | Hash SHA-256 |
| E | telefono | STRING | Teléfono con código país |
| F | fecha_alta | DATE | Fecha de registro |
| G | activo | BOOLEAN | true/false |
| H | ultimo_entreno | DATE | Última sesión |
| I | dias_inactivo | NUMBER | Días sin entrenar |

### Ejemplo de datos:
```
id | nombre | email | contrasena_hash | telefono | fecha_alta | activo | ultimo_entreno | dias_inactivo
uuid-1 | Marco Santana | marcasnt@gmail.com | hash... | +58 412 123 4567 | 2026-01-01 | TRUE | 2026-05-06 | 0
uuid-2 | Carlos Mendoza | carlos@test.com | hash... | +58 414 987 6543 | 2026-02-15 | TRUE | 2026-05-05 | 1
uuid-3 | Ana García | ana@test.com | hash... | +58 426 555 1234 | 2026-03-20 | FALSE | 2026-04-28 | 8
```

---

## HOJA 2: Rutinas

### Nombre de pestaña: `Rutinas`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | cliente_id | STRING | FK a Clientes |
| C | dia_semana | STRING | lunes/martes/miércoles/jueves/viernes/sábado/domingo |
| D | tipo_dia | STRING | rutina/descanso_pasivo/descanso_activo |
| E | ejercicios_json | TEXT | JSON con ejercicios (ver estructura abajo) |
| F | ejercicios_resumen | STRING | Resumen corto para mostrar |
| G | fecha_creacion | DATE | Fecha de creación |
| H | fecha_actualizacion | DATE | Última modificación |

### Estructura ejercicios_json:
```json
[
  {
    "ejercicio_id": "uuid",
    "nombre": "Press de Banca con Barra",
    "grupo_muscular": "Pecho",
    "series": [
      {"serie": 1, "repeticiones": 15, "peso_objetivo": "50kg"},
      {"serie": 2, "repeticiones": 12, "peso_objetivo": "55kg"},
      {"serie": 3, "repeticiones": 12, "peso_objetivo": "60kg"},
      {"serie": 4, "repeticiones": 10, "peso_objetivo": "60kg"}
    ],
    "descanso_entre_series_seg": 90,
    "nota_coach": "Mantén core apretado"
  }
]
```

### Para día de descanso activo (ejercicio cardio):
```json
[
  {
    "ejercicio_id": "cardio-1",
    "nombre": "Cardio HIIT",
    "grupo_muscular": "Cardio",
    "series": [
      {"serie": 1, "repeticiones": 15, "peso_objetivo": "minutos"},
      {"serie": 2, "repeticiones": 15, "peso_objetivo": "minutos"},
      {"serie": 3, "repeticiones": 15, "peso_objetivo": "minutos"}
    ],
    "descanso_entre_series_seg": 30,
    "nota_coach": "30 seg sprint / 30 seg walk"
  }
]
```

---

## HOJA 3: Ejercicios_Biblioteca

### Nombre de pestaña: `Ejercicios_Biblioteca`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | nombre | STRING | Nombre del ejercicio |
| C | grupo_muscular | STRING | Grupo muscular principal |
| D | imagen_url | STRING | URL de imagen estática |
| E | gif_url | STRING | URL de GIF animado |
| F | descripcion | STRING | Breve descripción |
| G | dificultad | STRING | baja/media/alta/muy alta |
| H | instrucciones | TEXT | Instrucciones paso a paso |

### URL de imagen de Google Drive:
```
https://drive.google.com/uc?export=view&id=ARCHIVO_ID
```

---

## HOJA 4: Sesiones_Historial

### Nombre de pestaña: `Sesiones_Historial`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | cliente_id | STRING | FK a Clientes |
| C | fecha | DATE | Fecha de la sesión |
| D | dia_semana | STRING | Día de la semana |
| E | duracion_min | NUMBER | Duración en minutos |
| F | ejercicios_json | TEXT | JSON con ejercicios completados + peso real |
| G | series_totales | NUMBER | Total series completadas |
| H | series_incompletas | NUMBER | Series no completadas |
| I | ejercicios_completados | NUMBER | Ejercicios 100% completados |
| J | ejercicios_incompletos | NUMBER | Ejercicios parciales |
| K | observaciones | TEXT | Notas de la sesión |

### Estructura ejercicios_json (sesión completada):
```json
[
  {
    "ejercicio_id": "uuid",
    "nombre": "Press de Banca con Barra",
    "series": [
      {"serie": 1, "repeticiones": 15, "peso_objetivo": "50kg", "peso_real": "50kg", "completada": true},
      {"serie": 2, "repeticiones": 12, "peso_objetivo": "55kg", "peso_real": "55kg", "completada": true},
      {"serie": 3, "repeticiones": 12, "peso_objetivo": "60kg", "peso_real": "62.5kg", "completada": true, "excedio": true},
      {"serie": 4, "repeticiones": 10, "peso_objetivo": "60kg", "peso_real": "60kg", "completada": true}
    ],
    "completado": true
  }
]
```

---

## HOJA 5: Mensajes

### Nombre de pestaña: `Mensajes`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | cliente_id | STRING | FK a Clientes |
| C | coach_id | STRING | FK a Clientes (coach) |
| D | emisor | STRING | "coach" o "cliente" |
| E | mensaje | TEXT | Contenido del mensaje |
| F | fecha | DATETIME | Fecha y hora |
| G | leido_cliente | BOOLEAN | Leído por cliente |
| H | leido_coach | BOOLEAN | Leído por coach |

---

## HOJA 6: Config

### Nombre de pestaña: `Config`

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | clave | STRING | Nombre del setting |
| B | valor | STRING | Valor del setting |

### Configuraciones por defecto:
```
clave | valor
email_coach | marcasnt@gmail.com
nombre_coach | Marco Santana
tiempo_descanso_default | 90
app_url | https://tu-app.web.app
google_drive_folder | https://drive.google.com/drive/folders/TU_FOLDER_ID
```

---

## HOJA 7: Log_Sesiones

### Nombre de pestaña: `Log_Sesiones`

Control de cambios y auditoría.

| Columna | Nombre | Tipo | Descripción |
|---|---|---|---|
| A | id | STRING | UUID único |
| B | cliente_id | STRING | FK a Clientes |
| C | accion | STRING | tipo de acción |
| D | detalle | TEXT | Detalle JSON |
| E | fecha | DATETIME | Fecha y hora |

---

## FUNCIONES DE APPS SCRIPT NECESARIAS

### Autenticación
- `doGet()` - Serve HTML
- `login(email, password)` - Autenticar usuario
- `createUser(name, email, password, phone)` - Crear cliente (solo coach)
- `getCurrentUser()` - Obtener usuario actual

### Rutinas
- `getRoutineForDay(cliente_id, dia_semana)` - Obtener rutina del día
- `createRoutine(cliente_id, dia_semana, tipo_dia, ejercicios)` - Crear rutina
- `updateRoutine(rutina_id, ejercicios)` - Actualizar rutina
- `getAllRoutinesForClient(cliente_id)` - Todas las rutinas del cliente

### Ejercicios
- `getEjerciciosBiblioteca()` - Lista completa
- `getEjerciciosByGrupo(grupo)` - Filtrar por grupo muscular
- `searchEjercicios(query)` - Búsqueda

### Sesiones
- `saveSession(cliente_id, fecha, ejercicios_json, duracion)` - Guardar sesión
- `getSessionHistory(cliente_id)` - Historial del cliente
- `getSessionByDate(cliente_id, fecha)` - Sesión específica

### Mensajes
- `sendMessage(cliente_id, mensaje)` - Enviar mensaje
- `getMessages(cliente_id)` - Obtener mensajes
- `markAsRead(mensaje_id, receptor)` - Marcar como leído

### Utilidades
- `hashPassword(password)` - Hash SHA-256
- `generateUUID()` - Generar UUID
- `sendEmailCoach(cliente_id, sesion_data)` - Enviar email al coach

---

## TRIGGERS (Automaciones)

### Trigger 1: On Form Submit (cuando se guarda sesión)
```javascript
function setupTriggers() {
  ScriptApp.newTrigger('onSessionSaved')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}
```

### Trigger 2: Daily Check (verificar clientes inactivos)
```javascript
function setupDailyTrigger() {
  ScriptApp.newTrigger('checkInactiveClients')
    .timeBased()
    .everyDays(1)
    .create();
}
```

---

## PERMISOS NECESARIOS

En Apps Script:
- `SpreadsheetApp` - Leer/escribir hojas
- `ScriptApp` - Crear triggers
- `GmailApp` - Enviar emails
- `Utilities` - Hash, UUID

---

*Estructura creada: 06 Mayo 2026*
*Versión: 1.0*