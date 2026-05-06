/**
 * FITPRO COACH - Chat System
 * Sistema de mensajería coach-cliente
 */

const Chat = {
  messages: [],
  isOpen: false,
  isLoading: false,
  pollingInterval: null,
  
  elements: {},
  
  /**
   * Inicializa el chat
   */
  init() {
    // Solo inicializar en páginas de app (no login)
    if (document.querySelector('.login-page')) return;
    
    this.createChatWidget();
    this.cacheElements();
    this.bindEvents();
    
    // Verificar si hay mensajes no leídos
    this.checkUnreadMessages();
    
    // Iniciar polling de mensajes
    this.startPolling();
  },
  
  /**
   * Crea el widget de chat
   */
  createChatWidget() {
    if (document.querySelector('.chat-container')) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const isCoach = user.rol === 'coach';
    const chatTitle = isCoach ? 'Mensajes con Cliente' : 'Mensajes con Coach';
    
    const chatWidget = Utils.createElement('div', { className: 'chat-container collapsed' }, [
      Utils.createElement('div', { className: 'chat-header', id: 'chatHeader' }, [
        Utils.createElement('span', { className: 'chat-title', textContent: chatTitle }),
        Utils.createElement('button', { className: 'chat-toggle', id: 'chatToggle', innerHTML: '▼' }),
        Utils.createElement('span', {
          className: 'badge badge-danger',
          id: 'chatUnreadBadge',
          style: 'display:none;',
          textContent: '0'
        })
      ]),
      Utils.createElement('div', { className: 'chat-body' }, [
        Utils.createElement('div', { className: 'chat-messages', id: 'chatMessages' })
      ]),
      Utils.createElement('div', { className: 'chat-footer' }, [
        Utils.createElement('input', {
          type: 'text',
          className: 'chat-input',
          id: 'chatInput',
          placeholder: 'Escribe un mensaje...'
        }),
        Utils.createElement('button', { className: 'chat-send', id: 'chatSend', innerHTML: '➤' })
      ])
    ]);
    
    document.body.appendChild(chatWidget);
  },
  
  /**
   * Cachea elementos DOM
   */
  cacheElements() {
    this.elements.container = document.querySelector('.chat-container');
    this.elements.header = document.getElementById('chatHeader');
    this.elements.toggle = document.getElementById('chatToggle');
    this.elements.messages = document.getElementById('chatMessages');
    this.elements.input = document.getElementById('chatInput');
    this.elements.send = document.getElementById('chatSend');
    this.elements.unreadBadge = document.getElementById('chatUnreadBadge');
  },
  
  /**
   * Vincula eventos
   */
  bindEvents() {
    // Toggle chat
    this.elements.header?.addEventListener('click', (e) => {
      if (e.target.closest('.chat-toggle')) {
        e.stopPropagation();
      }
      this.toggle();
    });
    
    this.elements.toggle?.addEventListener('click', () => this.toggle());
    
    // Enviar mensaje
    this.elements.send?.addEventListener('click', () => this.sendMessage());
    this.elements.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  },
  
  /**
   * Alterna visibilidad del chat
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.elements.container?.classList.toggle('collapsed', !this.isOpen);
    
    if (this.isOpen) {
      this.loadMessages();
      this.elements.input?.focus();
      this.markAsRead();
    }
  },
  
  /**
   * Abre el chat
   */
  open() {
    if (!this.isOpen) {
      this.toggle();
    }
  },
  
  /**
   * Cierra el chat
   */
  close() {
    if (this.isOpen) {
      this.toggle();
    }
  },
  
  /**
   * Carga mensajes
   */
  async loadMessages() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    const user = Auth.getCurrentUser();
    
    try {
      const result = await Utils.callAPI('getMessages', {
        userId: user.id,
        rol: user.rol
      });
      
      if (result.success) {
        this.messages = result.messages || [];
        this.renderMessages();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      this.isLoading = false;
    }
  },
  
  /**
   * Renderiza mensajes
   */
  renderMessages() {
    if (!this.elements.messages) return;
    
    const user = Auth.getCurrentUser();
    
    if (this.messages.length === 0) {
      this.elements.messages.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p style="color: #666; font-size: 0.875rem;">No hay mensajes aún.<br>¡Inicia la conversación!</p>
        </div>
      `;
      return;
    }
    
    this.elements.messages.innerHTML = this.messages.map(msg => {
      const isOwn = msg.emisor === user.rol;
      const time = new Date(msg.fecha).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div class="message ${isOwn ? 'message-sent' : 'message-received'}">
          <div>${msg.mensaje}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    }).join('');
  },
  
  /**
   * Envía mensaje
   */
  async sendMessage() {
    const text = this.elements.input?.value.trim();
    if (!text) return;
    
    const user = Auth.getCurrentUser();
    
    // Limpiar input
    this.elements.input.value = '';
    
    // Agregar mensaje localmente (optimistic UI)
    const localMessage = {
      id: 'temp-' + Date.now(),
      emisor: user.rol,
      mensaje: text,
      fecha: new Date().toISOString(),
      pending: true
    };
    
    this.messages.push(localMessage);
    this.renderMessages();
    this.scrollToBottom();
    
    try {
      const result = await Utils.callAPI('sendMessage', {
        userId: user.id,
        rol: user.rol,
        mensaje: text
      });
      
      if (result.success) {
        // Actualizar mensaje local
        localMessage.pending = false;
        localMessage.id = result.messageId;
      } else {
        Utils.showToast('Error al enviar mensaje', 'error');
        localMessage.error = true;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Utils.showToast('Error al enviar mensaje', 'error');
      localMessage.error = true;
    }
    
    this.renderMessages();
  },
  
  /**
   * Marca mensajes como leídos
   */
  async markAsRead() {
    const user = Auth.getCurrentUser();
    
    try {
      await Utils.callAPI('markMessagesAsRead', {
        userId: user.id,
        rol: user.rol
      });
      
      this.updateUnreadBadge(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },
  
  /**
   * Verifica mensajes no leídos
   */
  async checkUnreadMessages() {
    const user = Auth.getCurrentUser();
    
    try {
      const result = await Utils.callAPI('getUnreadCount', {
        userId: user.id,
        rol: user.rol
      });
      
      if (result.success) {
        this.updateUnreadBadge(result.count);
        
        if (result.count > 0 && !this.isOpen) {
          Utils.showToast(`Tienes ${result.count} mensaje${result.count > 1 ? 's' : ''} nuevo${result.count > 1 ? 's' : ''}`, 'info');
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  },
  
  /**
   * Actualiza badge de no leídos
   */
  updateUnreadBadge(count) {
    if (this.elements.unreadBadge) {
      this.elements.unreadBadge.textContent = count;
      this.elements.unreadBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  },
  
  /**
   * Scroll al final
   */
  scrollToBottom() {
    if (this.elements.messages) {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
  },
  
  /**
   * Inicia polling de mensajes
   */
  startPolling() {
    // Verificar mensajes cada 30 segundos
    this.pollingInterval = setInterval(() => {
      if (!this.isOpen) {
        this.checkUnreadMessages();
      } else {
        this.loadMessages();
      }
    }, 30000);
  },
  
  /**
   * Detiene polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  },
  
  /**
   * Agrega mensaje del sistema
   */
  addSystemMessage(text) {
    const systemMsg = {
      id: 'system-' + Date.now(),
      emisor: 'sistema',
      mensaje: text,
      fecha: new Date().toISOString()
    };
    
    this.messages.push(systemMsg);
    this.renderMessages();
    this.scrollToBottom();
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  Chat.init();
});
