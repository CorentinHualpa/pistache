// UploadBlueprintToMake.js – v1.0
// Extension Voiceflow pour uploader un blueprint Make.com
// © Corentin & Mélissa – Pistache 🐢
// Permet d'uploader un fichier .json ou .txt avec nom et description

export const UploadBlueprintToMake = {
  name: 'UploadBlueprintToMake',
  type: 'response',
  
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = s => /(^ext_)?UploadBlueprintToMake$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[UploadBlueprintToMake.match] error:', e);
      return false;
    }
  },
  
  render({ trace, element }) {
    if (!element) {
      console.error('[UploadBlueprintToMake] Élément parent introuvable');
      return;
    }
    
    // ============ FONCTIONS POUR DÉSACTIVER LE CHAT ============
    const findChatContainer = () => {
      let container = document.querySelector('#voiceflow-chat-container');
      if (container?.shadowRoot) return container;
      
      container = document.querySelector('#voiceflow-chat');
      if (container?.shadowRoot) return container;
      
      const allWithShadow = document.querySelectorAll('*');
      for (const el of allWithShadow) {
        if (el.shadowRoot?.querySelector('[class*="vfrc"]')) return el;
      }
      return null;
    };
    
    const disableChatInput = () => {
      const container = findChatContainer();
      if (!container?.shadowRoot) return null;
      
      const shadowRoot = container.shadowRoot;
      const textarea = 
        shadowRoot.querySelector('textarea.vfrc-chat-input') ||
        shadowRoot.querySelector('textarea[id^="vf-chat-input"]') ||
        shadowRoot.querySelector('textarea');
      
      const sendBtn = 
        shadowRoot.querySelector('#vfrc-send-message') ||
        shadowRoot.querySelector('button.vfrc-chat-input__send') ||
        shadowRoot.querySelector('button[type="submit"]');
      
      if (textarea) {
        const originalPlaceholder = textarea.placeholder;
        textarea.disabled = true;
        textarea.style.opacity = '0.5';
        textarea.style.cursor = 'not-allowed';
        textarea.placeholder = '🐢 Remplis le formulaire ci-dessus...';
        
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.style.opacity = '0.5';
          sendBtn.style.cursor = 'not-allowed';
        }
        
        return { container, textarea, sendBtn, originalPlaceholder };
      }
      return null;
    };
    
    const enableChatInput = (chatRefs) => {
      if (!chatRefs?.container?.shadowRoot) return false;
      
      const { textarea, sendBtn, originalPlaceholder } = chatRefs;
      
      if (textarea) {
        textarea.disabled = false;
        textarea.style.opacity = '1';
        textarea.style.cursor = 'text';
        textarea.placeholder = originalPlaceholder || 'Message...';
      }
      
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
        sendBtn.style.cursor = 'pointer';
      }
      
      if (textarea) {
        setTimeout(() => { textarea.focus(); textarea.blur(); }, 100);
      }
      
      return true;
    };
    
    // Désactiver le chat immédiatement
    const chatRefs = disableChatInput();
    
    // ============ CONFIG ============
    const p = trace?.payload || {};
    
    // Branding Pistache 🐢
    const primaryColor   = p.primaryColor   || '#1E3A3A';
    const secondaryColor = p.secondaryColor || '#2D5A5A';
    const accentColor    = p.accentColor    || '#E91E8C';
    const highlightColor = p.highlightColor || '#4ECDC4';
    
    // GIF Pistache qui danse
    const pistacheGif = p.pistacheGif || 'https://i.imgur.com/cnV2pB1.gif';
    
    // Messages personnalisables
    const title           = p.title           || '📦 Importer un Blueprint';
    const subtitle        = p.subtitle        || 'Ajoute ton blueprint Make.com à la bibliothèque Pistache';
    const uploadDesc      = p.uploadDesc      || 'Glisse ton fichier .json ou .txt ici';
    const loadingTitle    = p.loadingTitle    || '🐢 Pistache importe ton blueprint...';
    const loadingMessage  = p.loadingMessage  || 'Je range ça bien au chaud dans ma carapace !';
    const successTitle    = p.successTitle    || '🎉 Blueprint importé avec succès !';
    const errorTitle      = p.errorTitle      || '😅 Oups, petit bug...';
    
    // Fichiers acceptés
    const accept       = p.accept       || '.json,.txt';
    const maxFileSizeMB = p.maxFileSizeMB || 10;
    
    // Webhook config
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url || 'https://hook.eu2.make.com/dehj5bls1ippwl4kma12utsati3jva2i';
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || {};
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 120000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const extra            = webhook.extra || {};
    
    // Paths Voiceflow
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError   = p.pathError   || 'Fail';
    const pathBack    = p.pathBack    || 'Back';
    
    // Contexte Voiceflow
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };
    
    // Loader config
    const loaderCfg = p.loader || {};
    const estimatedSeconds = Number(loaderCfg.estimatedSeconds) > 0 ? Number(loaderCfg.estimatedSeconds) : 15;
    
    // Phases d'animation
    const defaultPhases = [
      { progress: 0,   text: '🐢 Pistache reçoit ton blueprint...' },
      { progress: 20,  text: '📋 Lecture du fichier...' },
      { progress: 45,  text: '🔍 Validation du format...' },
      { progress: 70,  text: '💾 Enregistrement...' },
      { progress: 90,  text: '✨ Finalisation...' },
      { progress: 100, text: '✅ C\'est importé !' }
    ];
    const phases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : defaultPhases;
    
    console.log('[UploadBlueprintToMake] ⚙️ Config:', {
      webhookUrl: webhookUrl?.substring(0, 50) + '...',
      timeoutMs: webhookTimeoutMs
    });
    
    // ============ STYLES ============
    const styles = `
      @keyframes pistacheDance {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        25% { transform: translateY(-8px) rotate(2deg); }
        50% { transform: translateY(0) rotate(-2deg); }
        75% { transform: translateY(-4px) rotate(1deg); }
      }
      @keyframes progressPulse {
        0%, 100% { box-shadow: 0 0 0 0 ${accentColor}40; }
        50% { box-shadow: 0 0 20px 4px ${accentColor}60; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      @keyframes uploadPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      
      .blueprint-upload-wrap {
        width: 100%;
        max-width: 100%;
        animation: slideUp 0.4s ease-out;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      
      .blueprint-upload-card {
        background: linear-gradient(145deg, #FFFFFF, #F8FAFC);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 
          0 10px 40px rgba(0,0,0,0.08),
          0 0 0 3px ${accentColor}40;
        position: relative;
        overflow: hidden;
      }
      
      .blueprint-upload-header {
        text-align: center;
        margin-bottom: 24px;
      }
      
      .blueprint-upload-title {
        font-size: 22px;
        font-weight: 800;
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0 0 8px 0;
      }
      
      .blueprint-upload-subtitle {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
      
      /* Zone d'upload */
      .blueprint-upload-zone {
        border: 3px dashed transparent;
        background: linear-gradient(#fff, #fff) padding-box,
                    linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40) border-box;
        border-radius: 16px;
        padding: 32px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        margin-bottom: 20px;
      }
      
      .blueprint-upload-zone:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px ${primaryColor}30;
        background: linear-gradient(#fff, #fff) padding-box,
                    linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) border-box;
      }
      
      .blueprint-upload-zone.dragging {
        background: linear-gradient(#fff, #fff) padding-box,
                    linear-gradient(135deg, ${accentColor}, ${highlightColor}) border-box;
        transform: scale(1.02);
      }
      
      .blueprint-upload-zone.has-file {
        background: linear-gradient(135deg, ${highlightColor}20, ${highlightColor}30) padding-box,
                    linear-gradient(135deg, ${highlightColor}, ${accentColor}) border-box;
      }
      
      .blueprint-upload-icon {
        font-size: 48px;
        margin-bottom: 12px;
        display: inline-block;
        filter: drop-shadow(0 4px 8px ${primaryColor}40);
      }
      
      .blueprint-upload-zone:hover .blueprint-upload-icon {
        animation: uploadPulse 1.5s infinite;
      }
      
      .blueprint-upload-desc {
        font-size: 15px;
        color: #475569;
        font-weight: 600;
      }
      
      .blueprint-upload-formats {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 8px;
      }
      
      /* Fichier sélectionné */
      .blueprint-file-selected {
        display: none;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: linear-gradient(135deg, ${highlightColor}15, ${highlightColor}25);
        border-radius: 12px;
        border-left: 4px solid ${highlightColor};
        margin-bottom: 20px;
        animation: fadeIn 0.3s ease-out;
      }
      
      .blueprint-file-selected.active {
        display: flex;
      }
      
      .blueprint-file-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .blueprint-file-name {
        font-weight: 700;
        color: #1e293b;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .blueprint-file-size {
        font-size: 12px;
        color: #64748b;
      }
      
      .blueprint-file-remove {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.2s;
      }
      
      .blueprint-file-remove:hover {
        background: linear-gradient(135deg, #fecaca, #fca5a5);
        transform: scale(1.1);
      }
      
      /* Champs de formulaire */
      .blueprint-form-group {
        margin-bottom: 16px;
      }
      
      .blueprint-form-label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 8px;
      }
      
      .blueprint-form-label .required {
        color: ${accentColor};
        margin-left: 4px;
      }
      
      .blueprint-form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      
      .blueprint-form-input:focus {
        outline: none;
        border-color: ${accentColor};
        box-shadow: 0 0 0 3px ${accentColor}20;
      }
      
      .blueprint-form-input::placeholder {
        color: #94a3b8;
      }
      
      .blueprint-form-input.error {
        border-color: #f87171;
        background: #fef2f2;
      }
      
      .blueprint-form-textarea {
        min-height: 80px;
        resize: vertical;
      }
      
      .blueprint-form-hint {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 6px;
      }
      
      .blueprint-form-error {
        font-size: 12px;
        color: #ef4444;
        margin-top: 6px;
        display: none;
      }
      
      .blueprint-form-error.visible {
        display: block;
      }
      
      /* Boutons d'action */
      .blueprint-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .blueprint-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        border: none;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .blueprint-btn-back {
        background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
        color: #475569;
      }
      
      .blueprint-btn-back:hover {
        background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
        transform: translateY(-2px);
      }
      
      .blueprint-btn-send {
        background: linear-gradient(135deg, ${accentColor}, #FF69B4);
        color: white;
        box-shadow: 0 4px 12px ${accentColor}40;
      }
      
      .blueprint-btn-send:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px ${accentColor}50;
      }
      
      .blueprint-btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      /* Status */
      .blueprint-status {
        margin-top: 16px;
        padding: 12px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        display: none;
      }
      
      .blueprint-status.error {
        display: block;
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        border: 1px solid #fca5a5;
      }
      
      .blueprint-status.success {
        display: block;
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        border: 1px solid #6ee7b7;
      }
      
      /* ====== LOADER ====== */
      .blueprint-loader {
        display: none;
        background: linear-gradient(145deg, ${primaryColor}, ${secondaryColor});
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.3),
          0 0 0 3px ${accentColor};
        position: relative;
        overflow: hidden;
      }
      
      .blueprint-loader.active {
        display: block;
        animation: slideUp 0.4s ease-out;
      }
      
      .blueprint-loader::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 200%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,0.05),
          transparent
        );
        animation: shimmer 3s infinite;
      }
      
      .blueprint-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        position: relative;
        z-index: 2;
      }
      
      .blueprint-loader-gif {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        animation: pistacheDance 1.5s ease-in-out infinite;
        filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
      }
      
      .blueprint-loader-title {
        color: #FFFFFF;
        font-weight: 800;
        font-size: 18px;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      
      .blueprint-loader-message {
        color: ${highlightColor};
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        font-style: italic;
      }
      
      .blueprint-progress-container {
        width: 100%;
        max-width: 280px;
      }
      
      .blueprint-progress-bar-bg {
        width: 100%;
        height: 10px;
        background: rgba(255,255,255,0.15);
        border-radius: 20px;
        overflow: hidden;
      }
      
      .blueprint-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, ${accentColor}, ${highlightColor}, ${accentColor});
        background-size: 200% 100%;
        border-radius: 20px;
        transition: width 0.5s ease-out;
        animation: shimmer 2s infinite, progressPulse 2s infinite;
        width: 0%;
      }
      
      .blueprint-progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
      }
      
      .blueprint-progress-step {
        color: #FFFFFF;
        font-size: 12px;
        font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }
      
      .blueprint-progress-percent {
        color: ${highlightColor};
        font-size: 14px;
        font-weight: 800;
      }
      
      /* ====== SUCCESS CARD ====== */
      .blueprint-success-card {
        display: none;
        background: linear-gradient(145deg, #FFFFFF, #F8FAFC);
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.15),
          0 0 0 3px ${highlightColor};
        text-align: center;
      }
      
      .blueprint-success-card.active {
        display: block;
        animation: slideUp 0.5s ease-out;
      }
      
      .blueprint-success-icon {
        font-size: 56px;
        margin-bottom: 16px;
      }
      
      .blueprint-success-title {
        font-size: 22px;
        font-weight: 800;
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 12px;
      }
      
      .blueprint-success-message {
        color: #64748b;
        font-size: 14px;
        margin-bottom: 24px;
        line-height: 1.6;
      }
      
      .blueprint-success-details {
        background: linear-gradient(135deg, ${highlightColor}15, ${highlightColor}25);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      }
      
      .blueprint-success-detail-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 13px;
      }
      
      .blueprint-success-detail-item:last-child {
        margin-bottom: 0;
      }
      
      .blueprint-success-detail-label {
        font-weight: 700;
        color: ${primaryColor};
        min-width: 80px;
      }
      
      .blueprint-success-detail-value {
        color: #475569;
        word-break: break-word;
      }
      
      .blueprint-success-actions {
        display: flex;
        gap: 12px;
      }
      
      .blueprint-success-btn {
        flex: 1;
        padding: 12px 20px;
        border-radius: 12px;
        border: 2px solid ${primaryColor}30;
        background: white;
        color: ${primaryColor};
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .blueprint-success-btn:hover:not(:disabled) {
        background: ${primaryColor};
        color: white;
        border-color: ${primaryColor};
      }
      
      .blueprint-success-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      .blueprint-success-btn.selected {
        background: ${accentColor};
        color: white;
        border-color: ${accentColor};
      }
      
      /* ====== ERROR CARD ====== */
      .blueprint-error-card {
        display: none;
        background: linear-gradient(145deg, #FEF2F2, #FEE2E2);
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        border: 2px solid #FCA5A5;
        text-align: center;
      }
      
      .blueprint-error-card.active {
        display: block;
        animation: slideUp 0.4s ease-out;
      }
      
      .blueprint-error-icon {
        font-size: 56px;
        margin-bottom: 16px;
      }
      
      .blueprint-error-title {
        font-size: 20px;
        font-weight: 700;
        color: #991B1B;
        margin-bottom: 12px;
      }
      
      .blueprint-error-message {
        color: #B91C1C;
        font-size: 14px;
        margin-bottom: 24px;
        line-height: 1.5;
      }
      
      .blueprint-error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .blueprint-retry-btn {
        padding: 14px 28px;
        background: linear-gradient(135deg, #EF4444, #DC2626);
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .blueprint-retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
      
      .blueprint-back-btn {
        padding: 14px 28px;
        background: #e5e7eb;
        color: #374151;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .blueprint-back-btn:hover {
        background: #d1d5db;
        transform: translateY(-2px);
      }
    `;
    
    // ============ UI STRUCTURE ============
    const root = document.createElement('div');
    root.className = 'blueprint-upload-wrap';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    root.innerHTML += `
      <!-- FORMULAIRE -->
      <div class="blueprint-upload-card" id="blueprint-form-card">
        <div class="blueprint-upload-header">
          <h2 class="blueprint-upload-title">${title}</h2>
          <p class="blueprint-upload-subtitle">${subtitle}</p>
        </div>
        
        <!-- Zone d'upload -->
        <div class="blueprint-upload-zone" id="blueprint-upload-zone">
          <div class="blueprint-upload-icon">📁</div>
          <div class="blueprint-upload-desc">${uploadDesc}</div>
          <div class="blueprint-upload-formats">Formats acceptés : ${accept}</div>
          <input type="file" accept="${accept}" style="display:none" id="blueprint-file-input" />
        </div>
        
        <!-- Fichier sélectionné -->
        <div class="blueprint-file-selected" id="blueprint-file-selected">
          <div class="blueprint-file-info">
            <div class="blueprint-file-name">
              <span>📄</span>
              <span id="blueprint-file-name-text">fichier.json</span>
            </div>
            <div class="blueprint-file-size" id="blueprint-file-size-text">0 KB</div>
          </div>
          <button class="blueprint-file-remove" id="blueprint-file-remove">×</button>
        </div>
        
        <!-- Champ Nom -->
        <div class="blueprint-form-group">
          <label class="blueprint-form-label">
            Nom du blueprint<span class="required">*</span>
          </label>
          <input 
            type="text" 
            class="blueprint-form-input" 
            id="blueprint-name-input"
            placeholder="Ex: Automatisation emails clients"
            maxlength="100"
          />
          <div class="blueprint-form-hint">Donne un nom clair et descriptif</div>
          <div class="blueprint-form-error" id="blueprint-name-error">Ce champ est obligatoire</div>
        </div>
        
        <!-- Champ Description -->
        <div class="blueprint-form-group">
          <label class="blueprint-form-label">
            Description<span class="required">*</span>
          </label>
          <textarea 
            class="blueprint-form-input blueprint-form-textarea" 
            id="blueprint-desc-input"
            placeholder="Décris brièvement ce que fait ce blueprint..."
            maxlength="500"
          ></textarea>
          <div class="blueprint-form-hint">Max 500 caractères</div>
          <div class="blueprint-form-error" id="blueprint-desc-error">Ce champ est obligatoire</div>
        </div>
        
        <!-- Boutons -->
        <div class="blueprint-actions">
          <button class="blueprint-btn blueprint-btn-back" id="blueprint-btn-back">
            ← Retour
          </button>
          <button class="blueprint-btn blueprint-btn-send" id="blueprint-btn-send" disabled>
            🚀 Envoyer
          </button>
        </div>
        
        <div class="blueprint-status" id="blueprint-status"></div>
      </div>
      
      <!-- LOADER -->
      <div class="blueprint-loader" id="blueprint-loader">
        <div class="blueprint-loader-content">
          <img src="${pistacheGif}" alt="Pistache" class="blueprint-loader-gif" />
          <div class="blueprint-loader-title">${loadingTitle}</div>
          <div class="blueprint-loader-message">${loadingMessage}</div>
          <div class="blueprint-progress-container">
            <div class="blueprint-progress-bar-bg">
              <div class="blueprint-progress-bar" id="blueprint-progress-bar"></div>
            </div>
            <div class="blueprint-progress-text">
              <span class="blueprint-progress-step" id="blueprint-progress-step">${phases[0]?.text || 'Démarrage...'}</span>
              <span class="blueprint-progress-percent" id="blueprint-progress-percent">0%</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- SUCCESS -->
      <div class="blueprint-success-card" id="blueprint-success-card">
        <div class="blueprint-success-icon">🐢</div>
        <h2 class="blueprint-success-title">${successTitle}</h2>
        <div class="blueprint-success-message">Ton blueprint a été ajouté à la bibliothèque Pistache !</div>
        <div class="blueprint-success-details" id="blueprint-success-details"></div>
        <div class="blueprint-success-actions">
          <button class="blueprint-success-btn" id="blueprint-success-another">📦 Ajouter un autre</button>
          <button class="blueprint-success-btn" id="blueprint-success-done">✅ Terminé</button>
        </div>
      </div>
      
      <!-- ERROR -->
      <div class="blueprint-error-card" id="blueprint-error-card">
        <div class="blueprint-error-icon">😅</div>
        <h2 class="blueprint-error-title">${errorTitle}</h2>
        <p class="blueprint-error-message" id="blueprint-error-message">Une erreur est survenue</p>
        <div class="blueprint-error-actions">
          <button class="blueprint-back-btn" id="blueprint-error-back">← Retour</button>
          <button class="blueprint-retry-btn" id="blueprint-error-retry">🔄 Réessayer</button>
        </div>
      </div>
    `;
    
    element.appendChild(root);
    
    // ============ DOM REFS ============
    const formCard      = root.querySelector('#blueprint-form-card');
    const uploadZone    = root.querySelector('#blueprint-upload-zone');
    const fileInput     = root.querySelector('#blueprint-file-input');
    const fileSelected  = root.querySelector('#blueprint-file-selected');
    const fileNameText  = root.querySelector('#blueprint-file-name-text');
    const fileSizeText  = root.querySelector('#blueprint-file-size-text');
    const fileRemoveBtn = root.querySelector('#blueprint-file-remove');
    const nameInput     = root.querySelector('#blueprint-name-input');
    const nameError     = root.querySelector('#blueprint-name-error');
    const descInput     = root.querySelector('#blueprint-desc-input');
    const descError     = root.querySelector('#blueprint-desc-error');
    const btnBack       = root.querySelector('#blueprint-btn-back');
    const btnSend       = root.querySelector('#blueprint-btn-send');
    const statusDiv     = root.querySelector('#blueprint-status');
    
    const loaderCard    = root.querySelector('#blueprint-loader');
    const progressBar   = root.querySelector('#blueprint-progress-bar');
    const progressStep  = root.querySelector('#blueprint-progress-step');
    const progressPct   = root.querySelector('#blueprint-progress-percent');
    
    const successCard   = root.querySelector('#blueprint-success-card');
    const successDetails = root.querySelector('#blueprint-success-details');
    const successAnother = root.querySelector('#blueprint-success-another');
    const successDone   = root.querySelector('#blueprint-success-done');
    
    const errorCard     = root.querySelector('#blueprint-error-card');
    const errorMessage  = root.querySelector('#blueprint-error-message');
    const errorBack     = root.querySelector('#blueprint-error-back');
    const errorRetry    = root.querySelector('#blueprint-error-retry');
    
    // ============ STATE ============
    let selectedFile = null;
    let animationTimer = null;
    
    // ============ HELPERS ============
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    function validateForm() {
      const hasFile = selectedFile !== null;
      const hasName = nameInput.value.trim().length > 0;
      const hasDesc = descInput.value.trim().length > 0;
      
      btnSend.disabled = !(hasFile && hasName && hasDesc);
      return hasFile && hasName && hasDesc;
    }
    
    function showFormError(field, show) {
      if (field === 'name') {
        nameError.classList.toggle('visible', show);
        nameInput.classList.toggle('error', show);
      } else if (field === 'desc') {
        descError.classList.toggle('visible', show);
        descInput.classList.toggle('error', show);
      }
    }
    
    function setFile(file) {
      if (!file) {
        selectedFile = null;
        fileSelected.classList.remove('active');
        uploadZone.classList.remove('has-file');
        uploadZone.style.display = 'block';
        validateForm();
        return;
      }
      
      // Validation taille
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        statusDiv.textContent = `⚠️ Fichier trop volumineux (max ${maxFileSizeMB} MB)`;
        statusDiv.className = 'blueprint-status error';
        return;
      }
      
      selectedFile = file;
      fileNameText.textContent = file.name;
      fileSizeText.textContent = formatSize(file.size);
      fileSelected.classList.add('active');
      uploadZone.classList.add('has-file');
      uploadZone.style.display = 'none';
      statusDiv.style.display = 'none';
      
      validateForm();
    }
    
    // ============ PROGRESS ANIMATION ============
    let currentProgress = 0;
    
    function updateProgress(percent, step) {
      currentProgress = Math.min(100, Math.max(0, percent));
      progressBar.style.width = `${currentProgress}%`;
      progressPct.textContent = `${Math.round(currentProgress)}%`;
      if (step) progressStep.textContent = step;
    }
    
    function startProgressAnimation() {
      const totalMs = estimatedSeconds * 1000;
      const startTime = Date.now();
      let phaseIndex = 0;
      
      animationTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = (elapsed / totalMs) * 100;
        const cappedProgress = Math.min(rawProgress, 95);
        
        while (phaseIndex < phases.length - 1 && phases[phaseIndex + 1].progress <= cappedProgress) {
          phaseIndex++;
        }
        
        updateProgress(cappedProgress, phases[phaseIndex]?.text);
        
        if (cappedProgress >= 95) {
          clearInterval(animationTimer);
          animationTimer = null;
        }
      }, 100);
    }
    
    function stopProgressAnimation() {
      if (animationTimer) {
        clearInterval(animationTimer);
        animationTimer = null;
      }
    }
    
    // ============ UI STATE TRANSITIONS ============
    function showLoader() {
      formCard.style.display = 'none';
      successCard.classList.remove('active');
      errorCard.classList.remove('active');
      loaderCard.classList.add('active');
      startProgressAnimation();
    }
    
    function showSuccess(data) {
      stopProgressAnimation();
      updateProgress(100, '✅ C\'est importé !');
      
      setTimeout(() => {
        loaderCard.classList.remove('active');
        
        // Afficher les détails
        successDetails.innerHTML = `
          <div class="blueprint-success-detail-item">
            <span class="blueprint-success-detail-label">📄 Fichier :</span>
            <span class="blueprint-success-detail-value">${selectedFile?.name || 'N/A'}</span>
          </div>
          <div class="blueprint-success-detail-item">
            <span class="blueprint-success-detail-label">📝 Nom :</span>
            <span class="blueprint-success-detail-value">${nameInput.value.trim()}</span>
          </div>
          <div class="blueprint-success-detail-item">
            <span class="blueprint-success-detail-label">📋 Description :</span>
            <span class="blueprint-success-detail-value">${descInput.value.trim()}</span>
          </div>
        `;
        
        successCard.classList.add('active');
      }, 800);
    }
    
    function showError(message) {
      stopProgressAnimation();
      loaderCard.classList.remove('active');
      formCard.style.display = 'none';
      errorMessage.textContent = message || 'Une erreur est survenue. Vérifie ta connexion et réessaie !';
      errorCard.classList.add('active');
    }
    
    function resetForm() {
      selectedFile = null;
      nameInput.value = '';
      descInput.value = '';
      fileSelected.classList.remove('active');
      uploadZone.classList.remove('has-file');
      uploadZone.style.display = 'block';
      statusDiv.style.display = 'none';
      showFormError('name', false);
      showFormError('desc', false);
      validateForm();
    }
    
    // ============ EVENTS ============
    
    // Upload zone
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('dragging');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragging');
    });
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragging');
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) setFile(files[0]);
    });
    
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      if (files.length > 0) setFile(files[0]);
      fileInput.value = '';
    });
    
    fileRemoveBtn.addEventListener('click', () => setFile(null));
    
    // Form inputs
    nameInput.addEventListener('input', () => {
      showFormError('name', false);
      validateForm();
    });
    
    descInput.addEventListener('input', () => {
      showFormError('desc', false);
      validateForm();
    });
    
    // Bouton Retour
    btnBack.addEventListener('click', () => {
      console.log('[UploadBlueprintToMake] ⬅️ Bouton Retour cliqué');
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: {
            webhookSuccess: false,
            action: 'back',
            buttonPath: 'back'
          }
        });
      } catch (e) {
        console.error('[UploadBlueprintToMake] Erreur interact:', e);
      }
    });
    
    // Bouton Envoyer
    btnSend.addEventListener('click', async () => {
      // Validation
      let isValid = true;
      
      if (!selectedFile) {
        statusDiv.textContent = '⚠️ Veuillez sélectionner un fichier';
        statusDiv.className = 'blueprint-status error';
        isValid = false;
      }
      
      if (!nameInput.value.trim()) {
        showFormError('name', true);
        isValid = false;
      }
      
      if (!descInput.value.trim()) {
        showFormError('desc', true);
        isValid = false;
      }
      
      if (!isValid) return;
      
      console.log('[UploadBlueprintToMake] 🚀 Envoi du blueprint...');
      showLoader();
      
      try {
        // Lire le contenu du fichier
        const fileContent = await readFileContent(selectedFile);
        
        // Préparer le body
        const body = {
          blueprintName: nameInput.value.trim(),
          blueprintDescription: descInput.value.trim(),
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || 'application/octet-stream',
          fileContent: fileContent,
          timestamp: new Date().toISOString(),
          ...extra
        };
        
        // Ajouter contexte Voiceflow si disponible
        if (vfContext.conversation_id) body.conversation_id = vfContext.conversation_id;
        if (vfContext.user_id) body.user_id = vfContext.user_id;
        if (vfContext.locale) body.locale = vfContext.locale;
        
        console.log('[UploadBlueprintToMake] 📦 Body préparé:', {
          blueprintName: body.blueprintName,
          fileName: body.fileName,
          fileSize: body.fileSize,
          contentLength: body.fileContent?.length
        });
        
        // Envoyer au webhook
        const response = await sendToWebhook(body);
        
        console.log('[UploadBlueprintToMake] ✅ Réponse reçue');
        showSuccess(response);
        
      } catch (error) {
        console.error('[UploadBlueprintToMake] ❌ Erreur:', error);
        showError(error.message);
      }
    });
    
    // Success buttons
    successAnother.addEventListener('click', () => {
      console.log('[UploadBlueprintToMake] 📦 Ajouter un autre blueprint');
      
      successAnother.classList.add('selected');
      successAnother.disabled = true;
      successDone.disabled = true;
      
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: {
            webhookSuccess: true,
            action: 'another',
            buttonPath: 'another',
            blueprintData: {
              name: nameInput.value.trim(),
              description: descInput.value.trim(),
              fileName: selectedFile?.name
            }
          }
        });
      } catch (e) {
        console.error('[UploadBlueprintToMake] Erreur interact:', e);
      }
    });
    
    successDone.addEventListener('click', () => {
      console.log('[UploadBlueprintToMake] ✅ Terminé');
      
      successDone.classList.add('selected');
      successDone.disabled = true;
      successAnother.disabled = true;
      
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: {
            webhookSuccess: true,
            action: 'done',
            buttonPath: 'success',
            blueprintData: {
              name: nameInput.value.trim(),
              description: descInput.value.trim(),
              fileName: selectedFile?.name
            }
          }
        });
      } catch (e) {
        console.error('[UploadBlueprintToMake] Erreur interact:', e);
      }
    });
    
    // Error buttons
    errorBack.addEventListener('click', () => {
      console.log('[UploadBlueprintToMake] ⬅️ Retour depuis erreur');
      enableChatInput(chatRefs);
      
      try {
        window?.voiceflow?.chat?.interact?.({
          type: 'complete',
          payload: {
            webhookSuccess: false,
            action: 'back',
            buttonPath: 'back'
          }
        });
      } catch (e) {
        console.error('[UploadBlueprintToMake] Erreur interact:', e);
      }
    });
    
    errorRetry.addEventListener('click', () => {
      console.log('[UploadBlueprintToMake] 🔄 Retry');
      errorCard.classList.remove('active');
      formCard.style.display = 'block';
    });
    
    // ============ HELPER FUNCTIONS ============
    
    async function readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsText(file);
      });
    }
    
    async function sendToWebhook(body) {
      let lastError;
      
      for (let attempt = 0; attempt <= webhookRetries; attempt++) {
        try {
          console.log(`[UploadBlueprintToMake] 📡 Tentative ${attempt + 1}/${webhookRetries + 1}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), webhookTimeoutMs);
          
          const response = await fetch(webhookUrl, {
            method: webhookMethod,
            headers: {
              'Content-Type': 'application/json',
              ...webhookHeaders
            },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Erreur ${response.status}: ${text.slice(0, 200) || response.statusText}`);
          }
          
          const data = await response.json().catch(() => ({}));
          return data;
          
        } catch (error) {
          lastError = error;
          console.error(`[UploadBlueprintToMake] ❌ Tentative ${attempt + 1} échouée:`, error.message);
          
          if (attempt < webhookRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      throw lastError || new Error('Échec de l\'envoi');
    }
    
    // ============ CLEANUP ============
    return () => {
      stopProgressAnimation();
      if (chatRefs) {
        enableChatInput(chatRefs);
      }
    };
  }
};

// Export global
try { 
  window.UploadBlueprintToMake = UploadBlueprintToMake; 
} catch (e) {
  console.error('[UploadBlueprintToMake] Erreur export:', e);
}
