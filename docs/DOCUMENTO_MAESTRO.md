# FITPRO COACH - Sistema de Gestión de Rutinas de Gym

## DOCUMENTO MAESTRO v2.0

**Coach:** Marco Santana  
**Email:** marcasnt@gmail.com  
**Fecha:** 06 Mayo 2026  
**Versión:** 2.0

---

## 1. VISIÓN GENERAL

Plataforma web SaaS para coach de gym que permite crear rutinas personalizadas para asesorados, con seguimiento en tiempo real, comunicación directa y análisis de progreso.

### Roles
- **Coach (admin):** Crea cuentas, diseña rutinas, configura descansos, recibe notificaciones
- **Cliente (asesorado):** Ve su rutina, marca series, ajusta pesos, recibe mensajes

---

## 2. ARQUITECTURA TÉCNICA

| Componente | Tecnología |
|---|---|
| Frontend | Web App (HTML/CSS/JS Vanilla) |
| Backend | Google Apps Script |
| Base de datos | Google Sheets |
| Almacenamiento imágenes | Google Drive personal |
| Notificaciones | Gmail + Apps Script Triggers |

---

## 3. ESTRUCTURA DE DATOS (Google Sheets)

### HOJA: Clientes
```
id | nombre | email | contrasena_hash | telefono | fecha_alta | activo
```

### HOJA: Rutinas
```
id | cliente_id | dia_semana | tipo_dia | ejercicios_json
```

### HOJA: Ejercicios_Biblioteca
```
id | nombre | grupo_muscular | imagen_url | gif_url | descripcion | dificultad
```

### HOJA: Sesiones_Historial
```
id | cliente_id | fecha | dia_semana | duracion_min | ejercicios_json
```

### HOJA: Mensajes
```
id | cliente_id | coach_id | mensaje | fecha | leido_cliente | leido_coach
```

---

## 4. ESTRUCTURA DE EJERCICIO EN RUTINA

```json
{
  "nombre": "Press de banca",
  "grupo_muscular": "Pecho",
  "series": [
    { "serie": 1, "repeticiones": 15, "peso_objetivo": "50kg" },
    { "serie": 2, "repeticiones": 12, "peso_objetivo": "55kg" },
    { "serie": 3, "repeticiones": 12, "peso_objetivo": "60kg" },
    { "serie": 4, "repeticiones": 10, "peso_objetivo": "60kg" }
  ],
  "descanso_entre_series_seg": 90,
  "nota_coach": "Mantén core apretado"
}
```

** Descanso configurable por ejercicio (no por serie individual)
** Peso modificable por el cliente si excedió el objetivo
** Tiempo máximo por día: 6 ejercicios

---

## 5. FLUJO DEL CLIENTE (DURANTE ENTRENO)

1. Cliente inicia sesión
2. Ve día actual + ejercicios pautados
3. Selecciona ejercicio → ve GIF/imagen animado
4. Inicia serie → completa reps
5. Marca SERIE FINALIZADA → timer descanso inicia
6. Timer configurable (1:30 default) corre con cuenta regresiva
7. Cliente puede ajustar peso real usado
8. Timer llega a 0 o cliente salta → siguiente serie
9. Al completar todas las series → siguiente ejercicio
10. Al finalizar último ejercicio → SESIÓN COMPLETADA
11. Apps Script envía email al coach
12. Datos guardados en Sesiones_Historial

---

## 6. DÍAS DE RECUPERACIÓN

| Tipo | Descripción |
|---|---|
| Pasivo | Solo se muestra "Día de recuperación - Sin actividad" |
| Activo | Se muestra rutina (Cardio HIIT, Caminata 30min, Correr 5km, etc.) |

---

## 7. EMAIL AL COACH (al completar sesión)

**Para:** marcasnt@gmail.com
**Asunto:** ✅ [Cliente] completó rutina de [Día] - [Fecha]

Incluye:
- Nombre del cliente
- Día y fecha
- Lista de ejercicios con series completadas
- Peso real usado por serie (resaltado si excedió objetivo)

---

## 8. DISEÑO UI/UX

### Paleta de Colores
```
Background:     #0D0D0D (negro profundo)
Surface:        #1A1A1A (card background)
Surface-2:      #252525 (elementos elevados)
Border:         #333333 (separadores)
Acento Primary: #00FF88 (verde lima energy)
Acento Danger:  #FF3366 (rojo intenso)
Acento Warning: #FFB800 (amarillo alerta)
Text Primary:   #FFFFFF
Text Secondary: #A0A0A0
Text Muted:     #666666
```

### Tipografía
- **Headings:** Montserrat Bold (700) / Black (900)
- **Body:** Inter Regular (400) / Medium (500)

### Especificaciones UI
- **Botones Primarios:** bg: #00FF88, text: #0D0D0D, radius: 8px
- **Botones Secundarios:** bg: transparent, border: #00FF88, text: #00FF88
- **Cards:** bg: #1A1A1A, border: #333333, radius: 12px
- **Timer:** Montserrat Black, 72px, color: #00FF88
- **Barra de progreso:** bg: #252525, fill: #00FF88

---

## 9. MÓDULOS IMPLEMENTADOS

| Módulo | Archivo | Estado |
|---|---|---|
| Estructura Google Sheets | ESTRUCTURA_SHEETS.md | ✅ |
| Código Apps Script | CODE_GOOGLE_APPS_SCRIPT.md | ✅ |
| Dashboard Coach | dashboard-coach.html | ✅ |
| Panel Cliente | panel-cliente.html | ✅ |
| Lista de 100 ejercicios | LISTA_EJERCICIOS.md | ✅ |
| Instrucciones | INSTRUCCIONES_IMPLEMENTACION.md | ✅ |

---

## 10. LISTA DE 100 EJERCICIOS

Ver archivo `LISTA_EJERCICIOS.md`

**Nota:** Las imágenes/GIFs se hospedarán en Google Drive personal del coach.

---

## 11. PRÓXIMOS PASOS

1. [x] Crear estructura Google Sheets (preparar las 5 hojas)
2. [x] Crear código Google Apps Script (backend)
3. [x] Crear Dashboard Coach
4. [x] Crear Panel Cliente
5. [ ] Subir 100 imágenes/GIFs a Google Drive
6. [ ] Configurar triggers de Apps Script
7. [ ] Testing con datos reales
8. [ ] Desplegar y entregar al coach

---

## 12. CONTACTOS DE PRUEBA

| Nombre | Email | Rol |
|---|---|---|
| Marco Santana | marcasnt@gmail.com | Coach |
| Carlos Mendoza | carlos@test.com | Cliente |
| Ana García | ana@test.com | Cliente |

---

*Documento creado: 06 Mayo 2026*
*Última actualización: 06 Mayo 2026*