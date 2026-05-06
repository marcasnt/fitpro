# FITPRO COACH - Sistema de Gestión de Rutinas

Plataforma web SaaS para coaches de gimnasio que permite crear rutinas personalizadas, seguimiento de entrenamientos en tiempo real, comunicación directa y análisis de progreso.

![Version](https://img.shields.io/badge/version-2.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Características

- **Gestión de Clientes**: Alta, baja y modificación de asesorados
- **Diseño de Rutinas**: Biblioteca de 100+ ejercicios con imágenes/GIFs
- **Timer de Descanso**: Cuenta regresiva entre series con sonido
- **Chat en Tiempo Real**: Comunicación directa coach-cliente
- **Seguimiento de Progreso**: Historial completo de sesiones
- **Notificaciones por Email**: Alertas automáticas al coach
- **Interfaz Premium**: Dark theme moderno con acentos neón

## Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| Frontend | HTML5, CSS3, JavaScript Vanilla |
| Backend | Google Apps Script |
| Base de Datos | Google Sheets |
| Almacenamiento | Google Drive (imágenes) |
| Notificaciones | Gmail + Apps Script Triggers |
| Hosting | GitHub Pages / Netlify |

## Arquitectura del Proyecto

```
fitpro-app/
├── index.html                 # Login principal
├── README.md                  # Este archivo
├── src/
│   ├── css/
│   │   └── styles.css         # Estilos premium dark theme
│   ├── js/
│   │   ├── config.js          # Configuración global
│   │   ├── utils.js           # Utilidades y helpers
│   │   ├── auth.js            # Sistema de autenticación
│   │   ├── timer.js           # Timer de descanso
│   │   ├── chat.js            # Sistema de mensajería
│   │   ├── cliente.js         # Panel del asesorado
│   │   └── coach.js           # Dashboard del coach
│   └── pages/
│       ├── panel-cliente.html # App del cliente
│       └── dashboard-coach.html # App del coach
├── backend/
│   └── Code.gs                # Google Apps Script
└── docs/
    ├── DOCUMENTO_MAESTRO.md   # Especificaciones
    ├── ESTRUCTURA_SHEETS.md   # Estructura de datos
    └── LISTA_EJERCICIOS.md    # 100 ejercicios
```

## Guía de Despliegue

### Paso 1: Crear Google Spreadsheet

1. Ve a [Google Sheets](https://sheets.new) y crea una hoja llamada `FITPRO_COACH`
2. Crea las siguientes pestañas (hojas):
   - `Clientes`
   - `Rutinas`
   - `Ejercicios_Biblioteca`
   - `Sesiones_Historial`
   - `Mensajes`
   - `Config`

### Paso 2: Configurar Google Apps Script

1. En tu Spreadsheet, ve a **Extensiones > Apps Script**
2. Borra el código por defecto y pega el contenido de `backend/Code.gs`
3. Guarda el proyecto con nombre `FITPRO_COACH_BACKEND`
4. Haz clic en **Implementar > Implementar como aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquiera** (o restringir según necesidad)
5. Copia la URL de la aplicación web

### Paso 3: Configurar el Frontend

1. Abre `src/js/config.js`
2. Reemplaza `TU_SCRIPT_ID` en la URL de Apps Script:
   ```javascript
   GAS_URL: 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec'
   ```
3. Configura tu folder de Google Drive:
   ```javascript
   DRIVE_FOLDER_ID: '1e2lNu9n33WqPnaOtJj-N2YUVb1jZzfck'
   ```

### Paso 4: Crear Cuenta del Coach

Ejecuta esta función en el editor de Apps Script:

```javascript
function createCoachAccount() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
  sheet.appendRow([
    Utilities.getUuid(),           // id
    'MARVIN CASCANTE',               // nombre
    'marcasnt@gmail.com',          // email
    'mamcyj11jm',         // contrasena_hash
    '+505 84508617',            // telefono
    new Date(),                    // fecha_alta
    true,                          // activo
    '',                            // ultimo_entreno
    0,                             // dias_inactivo
    'coach'                        // rol
  ]);
  Logger.log('Coach account created');
}
```

### Paso 5: Configurar Triggers

En el editor de Apps Script:
1. Haz clic en el icono de **Reloj** (Triggers)
2. **Agregar trigger**
3. Selecciona función: `checkInactiveClients`
4. Evento: `Basado en tiempo`
5. Diario, hora: `9:00 am`

### Paso 6: Subir Imágenes a Google Drive

1. Crea una carpeta pública en Google Drive
2. Sube las imágenes/GIFs de los ejercicios
3. Cambia permisos a "Cualquiera con el enlace puede ver"
4. Copia los IDs de archivo para la biblioteca de ejercicios

### Paso 7: Desplegar Web App

**Opción A: GitHub Pages (Gratuito)**
1. Crea un repositorio en GitHub
2. Sube todos los archivos
3. Ve a **Settings > Pages**
4. Selecciona rama `main` y carpeta `/root`
5. Tu app estará en `https://tu-usuario.github.io/fitpro-app`

**Opción B: Netlify (Gratuito)**
1. Ve a [Netlify](https://netlify.com)
2. Arrastra tu carpeta del proyecto
3. Obtén URL instantánea con HTTPS

**Opción C: Vercel (Gratuito)**
1. Ve a [Vercel](https://vercel.com)
2. Importa tu repo de GitHub
3. Despliegue automático en cada push

## Flujo de Uso

### Para el Coach:

1. **Login** con credenciales de coach
2. **Dashboard** con estadísticas en tiempo real
3. **Crear cliente**: Nombre, email, teléfono, contraseña temporal
4. **Diseñar rutinas**: Seleccionar día, agregar ejercicios, configurar series
5. **Ver progreso**: Historial de sesiones, mensajes, alertas de inactividad

### Para el Cliente:

1. **Login** con email y contraseña asignada
2. **Ver rutina del día**: Ejercicios, series, pesos objetivo
3. **Ver demostración**: GIF/Imagen del ejercicio
4. **Completar serie**: Marcar checkbox, ajustar peso real
5. **Timer de descanso**: Cuenta regresiva automática
6. **Chat**: Comunicación directa con el coach
7. **Completar sesión**: Envío automático de email al coach

## API Endpoints (Apps Script)

### Autenticación
- `POST login` - Iniciar sesión
- `POST createUser` - Crear usuario
- `POST updateUser` - Actualizar perfil
- `POST changePassword` - Cambiar contraseña

### Clientes
- `GET getClients` - Listar clientes
- `GET getClient` - Obtener cliente
- `POST updateClient` - Actualizar cliente

### Rutinas
- `GET getRoutineForDay` - Rutina del día
- `GET getAllRoutinesForClient` - Todas las rutinas
- `POST createRoutine` - Crear rutina
- `POST updateRoutine` - Actualizar rutina
- `POST deleteRoutine` - Eliminar rutina

### Ejercicios
- `GET getEjerciciosBiblioteca` - Biblioteca completa
- `GET getEjerciciosByGrupo` - Filtrar por grupo
- `GET searchEjercicios` - Búsqueda

### Sesiones
- `POST saveSession` - Guardar sesión
- `GET getSessionHistory` - Historial del cliente
- `GET getRecentSessions` - Sesiones recientes (coach)

### Mensajes
- `POST sendMessage` - Enviar mensaje
- `GET getMessages` - Obtener mensajes
- `POST markMessagesAsRead` - Marcar como leído
- `GET getUnreadCount` - Contar no leídos

### Stats
- `GET getCoachStats` - Estadísticas del coach

## Personalización

### Cambiar Colores

Edita `src/css/styles.css`:

```css
:root {
  --accent-primary: #00FF88;      /* Cambia este valor */
  --accent-danger: #FF3366;       /* Rojo */
  --accent-warning: #FFB800;      /* Amarillo */
  --accent-info: #00CCFF;       /* Azul */
}
```

### Cambiar Tipografía

Modifica el link de Google Fonts en los HTML y actualiza:

```css
:root {
  --font-heading: 'Montserrat', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### Cambiar Tiempo de Descanso

En `src/js/config.js`:

```javascript
DEFAULT_REST_TIME: 120, // segundos (default: 90)
```

## Troubleshooting

### Error: "No se puede cargar la rutina"
- Verifica que la URL de Apps Script esté correcta en `config.js`
- Revisa que el Spreadsheet tenga datos en la hoja `Rutinas`
- Asegúrate de que el cliente tenga una rutina asignada para hoy

### Error: "Credenciales incorrectas"
- Verifica que el email esté en minúsculas
- Comprueba que el hash SHA-256 se calcule correctamente
- Revisa que el usuario esté activo en la hoja `Clientes`

### No llegan los emails
- Verifica que `COACH_EMAIL` en `Code.gs` sea correcto
- Revisa la cuota de envío de Gmail (100 emails/día gratis)
- Consulta el log de Apps Script: **Ver > Registros**

### Las imágenes no cargan
- Asegúrate de que los archivos en Drive sean públicos
- Usa el formato de URL correcto:
  ```
  https://drive.google.com/uc?export=view&id=ARCHIVO_ID
  ```

## Seguridad

- Todas las contraseñas se hashean con SHA-256
- Autenticación por token
- Validación de roles (coach/cliente)
- CORS habilitado solo para dominios permitidos
- No almacenar contraseñas en texto plano

## Roadmap

- [x] Sistema de autenticación
- [x] Dashboard del coach
- [x] Panel del cliente
- [x] Timer de descanso
- [x] Chat en tiempo real
- [x] Notificaciones por email
- [ ] App móvil (PWA)
- [ ] Gráficos de progreso
- [ ] Sistema de pagos
- [ ] Notificaciones push
- [ ] Integración con wearables

## Licencia

MIT License - Libre para uso personal y comercial.

## Soporte

Para soporte o consultas:
- Email: marcasnt@gmail.com
- GitHub Issues: Crear un issue en el repositorio

---

**Desarrollado con 💪 por Marco Santana**
