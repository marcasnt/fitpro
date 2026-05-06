/**
 * FITPRO COACH - Rest Timer
 * Timer de descanso entre series con UI premium
 */

const RestTimer = {
  timeRemaining: 0,
  initialTime: 90,
  isRunning: false,
  intervalId: null,
  onComplete: null,
  onSkip: null,
  
  // Elementos DOM
  elements: {},
  
  /**
   * Inicializa el timer
   */
  init() {
    this.createOverlay();
    this.cacheElements();
    this.bindEvents();
  },
  
  /**
   * Crea el HTML del overlay
   */
  createOverlay() {
    if (document.querySelector('.timer-overlay')) return;
    
    const overlay = Utils.createElement('div', { className: 'timer-overlay' }, [
      Utils.createElement('div', { className: 'timer-label', textContent: 'DESCANSO' }),
      Utils.createElement('div', { className: 'timer-display', id: 'timerDisplay' }, ['01:30']),
      Utils.createElement('div', { className: 'timer-controls' }, [
        Utils.createElement('button', {
          className: 'timer-btn',
          id: 'timerPlayPause',
          title: 'Play/Pause',
          innerHTML: '❚❚'
        }),
        Utils.createElement('button', {
          className: 'timer-btn',
          id: 'timerReset',
          title: 'Reiniciar',
          innerHTML: '↻'
        }),
        Utils.createElement('button', {
          className: 'timer-btn',
          id: 'timerSkip',
          title: 'Saltar',
          innerHTML: '⏭'
        })
      ]),
      Utils.createElement('div', { className: 'timer-adjust' }, [
        Utils.createElement('button', {
          className: 'btn btn-ghost btn-sm',
          id: 'timerMinus15',
          textContent: '-15s'
        }),
        Utils.createElement('span', { textContent: 'Ajustar tiempo' }),
        Utils.createElement('button', {
          className: 'btn btn-ghost btn-sm',
          id: 'timerPlus15',
          textContent: '+15s'
        })
      ]),
      Utils.createElement('button', {
        className: 'btn btn-primary',
        id: 'timerClose',
        style: 'margin-top: 2rem;',
        textContent: 'LISTO - SIGUIENTE SERIE'
      })
    ]);
    
    document.body.appendChild(overlay);
  },
  
  /**
   * Cachea elementos DOM
   */
  cacheElements() {
    this.elements.overlay = document.querySelector('.timer-overlay');
    this.elements.display = document.getElementById('timerDisplay');
    this.elements.playPause = document.getElementById('timerPlayPause');
    this.elements.reset = document.getElementById('timerReset');
    this.elements.skip = document.getElementById('timerSkip');
    this.elements.close = document.getElementById('timerClose');
    this.elements.minus15 = document.getElementById('timerMinus15');
    this.elements.plus15 = document.getElementById('timerPlus15');
  },
  
  /**
   * Vincula eventos
   */
  bindEvents() {
    if (!this.elements.overlay) return;
    
    this.elements.playPause?.addEventListener('click', () => this.toggle());
    this.elements.reset?.addEventListener('click', () => this.reset());
    this.elements.skip?.addEventListener('click', () => this.skip());
    this.elements.close?.addEventListener('click', () => this.complete());
    this.elements.minus15?.addEventListener('click', () => this.adjustTime(-15));
    this.elements.plus15?.addEventListener('click', () => this.adjustTime(15));
    
    // Teclas de acceso rápido
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning && !this.elements.overlay?.classList.contains('active')) return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          this.toggle();
          break;
        case 'Escape':
          this.skip();
          break;
        case 'Enter':
          this.complete();
          break;
      }
    });
  },
  
  /**
   * Inicia el timer
   */
  start(seconds = 90, options = {}) {
    this.initialTime = seconds;
    this.timeRemaining = seconds;
    this.onComplete = options.onComplete || null;
    this.onSkip = options.onSkip || null;
    
    this.show();
    this.updateDisplay();
    this.run();
    
    // Notificación
    Utils.showToast(`Descanso: ${Utils.formatTime(seconds)}`, 'info');
  },
  
  /**
   * Muestra el overlay
   */
  show() {
    this.elements.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * Oculta el overlay
   */
  hide() {
    this.elements.overlay?.classList.remove('active');
    document.body.style.overflow = '';
    this.stop();
  },
  
  /**
   * Ejecuta el timer
   */
  run() {
    this.isRunning = true;
    this.elements.playPause.innerHTML = '❚❚';
    
    this.intervalId = setInterval(() => {
      this.timeRemaining--;
      this.updateDisplay();
      
      // Efectos visuales según tiempo restante
      if (this.timeRemaining <= 10) {
        this.elements.display.classList.add('danger');
        this.elements.display.classList.remove('warning');
      } else if (this.timeRemaining <= 30) {
        this.elements.display.classList.add('warning');
        this.elements.display.classList.remove('danger');
      } else {
        this.elements.display.classList.remove('warning', 'danger');
      }
      
      // Completar automáticamente
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateDisplay();
        this.onTimeUp();
      }
    }, 1000);
  },
  
  /**
   * Pausa/reanuda el timer
   */
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.resume();
    }
  },
  
  /**
   * Pausa el timer
   */
  pause() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.elements.playPause.innerHTML = '▶';
  },
  
  /**
   * Reanuda el timer
   */
  resume() {
    if (this.timeRemaining > 0) {
      this.run();
    }
  },
  
  /**
   * Detiene el timer
   */
  stop() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.elements.display.classList.remove('warning', 'danger');
  },
  
  /**
   * Reinicia el timer
   */
  reset() {
    this.stop();
    this.timeRemaining = this.initialTime;
    this.updateDisplay();
    this.run();
  },
  
  /**
   * Ajusta el tiempo
   */
  adjustTime(seconds) {
    this.timeRemaining = Math.max(0, this.timeRemaining + seconds);
    this.updateDisplay();
  },
  
  /**
   * Actualiza la visualización
   */
  updateDisplay() {
    if (this.elements.display) {
      this.elements.display.textContent = Utils.formatTime(this.timeRemaining);
    }
  },
  
  /**
   * Se acabó el tiempo
   */
  onTimeUp() {
    this.stop();
    
    // Sonar beep (si el usuario ha interactuado)
    this.playBeep();
    
    // Mostrar notificación
    Utils.showToast('¡Descanso completado!', 'success');
  },
  
  /**
   * Reproduce sonido de beep
   */
  playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  },
  
  /**
   * Salta el timer
   */
  skip() {
    this.hide();
    if (typeof this.onSkip === 'function') {
      this.onSkip();
    }
  },
  
  /**
   * Completa el timer
   */
  complete() {
    this.hide();
    if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  },
  
  /**
   * Obtiene tiempo transcurrido
   */
  getElapsedTime() {
    return this.initialTime - this.timeRemaining;
  },
  
  /**
   * Verifica si está activo
   */
  isActive() {
    return this.elements.overlay?.classList.contains('active') || false;
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  RestTimer.init();
});
