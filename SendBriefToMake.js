// SendBriefToMake.js – v1.0
// Extension Voiceflow pour envoyer un brief vers Make et recevoir un blueprint
// © Corentin & Mélissa – Pistache 🐢

export const SendBriefToMake = {
  name: 'SendBriefToMake',
  type: 'response',
  
  match(context) {
    try {
      const t = context?.trace || {};
      const type = t.type || '';
      const pname = t.payload?.name || '';
      const isMe = s => /(^ext_)?SendBriefToMake$/i.test(s || '');
      return isMe(type) || (type === 'extension' && isMe(pname)) || (/^ext_/i.test(type) && isMe(pname));
    } catch (e) {
      console.error('[SendBriefToMake.match] error:', e);
      return false;
    }
  },
  
  render({ trace, element }) {
    if (!element) {
      console.error('[SendBriefToMake] Élément parent introuvable');
      return;
    }
    
    // ============ CONFIG ============
    const p = trace?.payload || {};
    
    // Contenu du brief à envoyer
    const briefContent = p.brief || '';
    
    // Branding Pistache 🐢
    const primaryColor   = p.primaryColor   || '#1E3A3A';  // Vert foncé (corps)
    const secondaryColor = p.secondaryColor || '#2D5A5A';  // Vert turquoise
    const accentColor    = p.accentColor    || '#E91E8C';  // Rose magenta (carapace)
    const highlightColor = p.highlightColor || '#4ECDC4';  // Turquoise clair (reflets)
    
    // GIF Pistache qui danse
    const pistacheGif = p.pistacheGif || 'https://i.imgur.com/cnV2pB1.gif';
    
    // Messages personnalisables
    const loadingTitle   = p.loadingTitle   || '🐢 Pistache prépare ton blueprint...';
    const loadingMessage = p.loadingMessage || 'Ma carapace calcule à toute vitesse !';
    const successTitle   = p.successTitle   || '🎉 Ton blueprint est prêt !';
    const errorTitle     = p.errorTitle     || '😅 Oups, petit bug...';
    
    // Webhook config
    const webhook          = p.webhook || {};
    const webhookUrl       = webhook.url;
    const webhookMethod    = (webhook.method || 'POST').toUpperCase();
    const webhookHeaders   = webhook.headers || { 'Content-Type': 'application/json' };
    const webhookTimeoutMs = Number.isFinite(webhook.timeoutMs) ? webhook.timeoutMs : 120000;
    const webhookRetries   = Number.isFinite(webhook.retries) ? webhook.retries : 1;
    const extra            = webhook.extra || {};
    
    // Paths Voiceflow
    const pathSuccess = p.pathSuccess || 'Default';
    const pathError   = p.pathError   || 'Fail';
    
    // Contexte Voiceflow
    const vfContext = {
      conversation_id: p.conversation_id || null,
      user_id: p.user_id || null,
      locale: p.locale || null,
    };
    
    // Loader config
    const loaderCfg = p.loader || {};
    const estimatedSeconds = Number(loaderCfg.estimatedSeconds) > 0 ? Number(loaderCfg.estimatedSeconds) : 30;
    const autoCloseDelayMs = Number(loaderCfg.autoCloseDelayMs) > 0 ? Number(loaderCfg.autoCloseDelayMs) : 2000;
    
    // Phases d'animation
    const defaultPhases = [
      { progress: 0,   text: '🐢 Pistache reçoit ton brief...' },
      { progress: 15,  text: '📋 Analyse des besoins...' },
      { progress: 35,  text: '🧠 Conception du workflow...' },
      { progress: 55,  text: '🔧 Assemblage des modules Make...' },
      { progress: 75,  text: '✨ Optimisation du scénario...' },
      { progress: 90,  text: '📦 Génération du blueprint JSON...' },
      { progress: 100, text: '✅ C\'est prêt !' }
    ];
    const phases = Array.isArray(loaderCfg.phases) ? loaderCfg.phases : defaultPhases;
    
    // ============ VALIDATION ============
    if (!webhookUrl) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#fee2e2,#fecaca);border:1px solid #fca5a5;color:#991b1b;font-weight:500">
        ⚠️ Erreur de configuration : <b>webhook.url</b> manquant.
      </div>`;
      element.appendChild(div);
      return;
    }
    
    if (!briefContent || briefContent.trim() === '') {
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b;color:#92400e;font-weight:500">
        ⚠️ Aucun brief à envoyer. Retourne à la prise de besoin !
      </div>`;
      element.appendChild(div);
      return;
    }
    
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
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      .pistache-loader-wrap {
        width: 100%;
        max-width: 100%;
        animation: slideUp 0.4s ease-out;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      
      .pistache-loader-card {
        background: linear-gradient(145deg, ${primaryColor}, ${secondaryColor});
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.3),
          0 0 0 3px ${accentColor},
          inset 0 1px 0 rgba(255,255,255,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .pistache-loader-card::before {
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
      
      .pistache-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        position: relative;
        z-index: 2;
      }
      
      .pistache-gif-container {
        position: relative;
      }
      
      .pistache-gif {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        object-fit: cover;
        animation: pistacheDance 1.5s ease-in-out infinite;
        filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
      }
      
      .pistache-loader-title {
        color: #FFFFFF;
        font-weight: 800;
        font-size: 20px;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        margin: 0;
      }
      
      .pistache-loader-message {
        color: ${highlightColor};
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        font-style: italic;
      }
      
      .pistache-progress-container {
        width: 100%;
        max-width: 300px;
      }
      
      .pistache-progress-bar-bg {
        width: 100%;
        height: 12px;
        background: rgba(255,255,255,0.15);
        border-radius: 20px;
        overflow: hidden;
        position: relative;
      }
      
      .pistache-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, ${accentColor}, ${highlightColor}, ${accentColor});
        background-size: 200% 100%;
        border-radius: 20px;
        transition: width 0.5s ease-out;
        animation: shimmer 2s infinite, progressPulse 2s infinite;
        width: 0%;
      }
      
      .pistache-progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
      }
      
      .pistache-progress-step {
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }
      
      .pistache-progress-percent {
        color: ${highlightColor};
        font-size: 16px;
        font-weight: 800;
      }
      
      /* ====== RESULT CARD ====== */
      .pistache-result-card {
        background: linear-gradient(145deg, #FFFFFF, #F8FAFC);
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.15),
          0 0 0 3px ${accentColor};
        animation: slideUp 0.5s ease-out;
      }
      
      .pistache-result-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .pistache-result-icon {
        font-size: 48px;
      }
      
      .pistache-result-title {
        font-size: 22px;
        font-weight: 800;
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
      }
      
      .pistache-result-description {
        background: linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        border-left: 4px solid ${accentColor};
      }
      
      .pistache-result-description-title {
        font-weight: 700;
        color: ${primaryColor};
        font-size: 14px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pistache-result-description-content {
        color: #475569;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      
      .pistache-download-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, ${accentColor}, #FF69B4);
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px ${accentColor}50;
        text-decoration: none;
      }
      
      .pistache-download-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px ${accentColor}60;
      }
      
      .pistache-download-btn-icon {
        font-size: 20px;
      }
      
      .pistache-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      
      .pistache-action-btn {
        flex: 1;
        min-width: 120px;
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
      
      .pistache-action-btn:hover {
        background: ${primaryColor};
        color: white;
        border-color: ${primaryColor};
      }
      
      /* ====== ERROR STATE ====== */
      .pistache-error-card {
        background: linear-gradient(145deg, #FEF2F2, #FEE2E2);
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        border: 2px solid #FCA5A5;
        text-align: center;
        animation: slideUp 0.4s ease-out;
      }
      
      .pistache-error-icon {
        font-size: 56px;
        margin-bottom: 16px;
      }
      
      .pistache-error-title {
        font-size: 20px;
        font-weight: 700;
        color: #991B1B;
        margin-bottom: 12px;
      }
      
      .pistache-error-message {
        color: #B91C1C;
        font-size: 14px;
        margin-bottom: 24px;
        line-height: 1.5;
      }
      
      .pistache-retry-btn {
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
      
      .pistache-retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
    `;
    
    // ============ UI STRUCTURE ============
    const root = document.createElement('div');
    root.className = 'pistache-loader-wrap';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    root.appendChild(styleTag);
    
    // Loader card (visible au départ)
    root.innerHTML += `
      <div class="pistache-loader-card" id="pistache-loader">
        <div class="pistache-loader-content">
          <div class="pistache-gif-container">
            <img src="${pistacheGif}" alt="Pistache danse" class="pistache-gif" />
          </div>
          <h2 class="pistache-loader-title">${loadingTitle}</h2>
          <p class="pistache-loader-message">${loadingMessage}</p>
          <div class="pistache-progress-container">
            <div class="pistache-progress-bar-bg">
              <div class="pistache-progress-bar" id="pistache-progress"></div>
            </div>
            <div class="pistache-progress-text">
              <span class="pistache-progress-step" id="pistache-step">${phases[0]?.text || 'Démarrage...'}</span>
              <span class="pistache-progress-percent" id="pistache-percent">0%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pistache-result-card" id="pistache-result" style="display: none;">
        <!-- Rempli dynamiquement -->
      </div>
      
      <div class="pistache-error-card" id="pistache-error" style="display: none;">
        <!-- Rempli dynamiquement -->
      </div>
    `;
    
    element.appendChild(root);
    
    // ============ DOM REFS ============
    const loaderCard  = root.querySelector('#pistache-loader');
    const resultCard  = root.querySelector('#pistache-result');
    const errorCard   = root.querySelector('#pistache-error');
    const progressBar = root.querySelector('#pistache-progress');
    const stepText    = root.querySelector('#pistache-step');
    const percentText = root.querySelector('#pistache-percent');
    
    // ============ PROGRESS ANIMATION ============
    let currentProgress = 0;
    let animationTimer = null;
    
    function updateProgress(percent, stepLabel) {
      currentProgress = Math.min(100, Math.max(0, percent));
      progressBar.style.width = `${currentProgress}%`;
      percentText.textContent = `${Math.round(currentProgress)}%`;
      if (stepLabel) {
        stepText.textContent = stepLabel;
      }
    }
    
    function startProgressAnimation() {
      const totalMs = estimatedSeconds * 1000;
      const startTime = Date.now();
      let phaseIndex = 0;
      
      animationTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = (elapsed / totalMs) * 100;
        
        // Ne pas dépasser 95% avant la vraie réponse
        const cappedProgress = Math.min(rawProgress, 95);
        
        // Trouver la phase actuelle
        while (phaseIndex < phases.length - 1 && phases[phaseIndex + 1].progress <= cappedProgress) {
          phaseIndex++;
        }
        
        const currentPhase = phases[phaseIndex];
        updateProgress(cappedProgress, currentPhase?.text);
        
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
    
    // ============ DISPLAY RESULT ============
    function showResult(data) {
      stopProgressAnimation();
      updateProgress(100, '✅ C\'est prêt !');
      
      setTimeout(() => {
        loaderCard.style.display = 'none';
        
        const blueprintUrl = data?.blueprintUrl || data?.url || '';
        const userManualLink = data?.userManualLink || '';
        const description = data?.description || 'Blueprint généré avec succès !';
        
        // Construire les boutons de téléchargement
        let downloadButtons = '';
        
        if (blueprintUrl) {
          downloadButtons += `
            <a href="${blueprintUrl}" download class="pistache-download-btn" target="_blank">
              <span class="pistache-download-btn-icon">⬇️</span>
              Télécharger le Blueprint JSON
            </a>
          `;
        }
        
        if (userManualLink) {
          downloadButtons += `
            <a href="${userManualLink}" class="pistache-download-btn pistache-download-btn-secondary" target="_blank" style="background: linear-gradient(135deg, ${highlightColor}, #38B2AC); margin-top: 12px;">
              <span class="pistache-download-btn-icon">📖</span>
              Voir le Guide d'utilisation
            </a>
          `;
        }
        
        resultCard.innerHTML = `
          <div class="pistache-result-header">
            <span class="pistache-result-icon">🐢</span>
            <h2 class="pistache-result-title">${successTitle}</h2>
          </div>
          <div class="pistache-result-description">
            <div class="pistache-result-description-title">
              📋 Description du workflow
            </div>
            <div class="pistache-result-description-content">${description}</div>
          </div>
          ${downloadButtons}
          <div class="pistache-actions">
            <button class="pistache-action-btn" id="pistache-question-btn">💬 Une question ?</button>
            <button class="pistache-action-btn" id="pistache-new-btn">🔧 Nouveau blueprint</button>
          </div>
        `;
        
        resultCard.style.display = 'block';
        
        // Event listeners sur les boutons UNIQUEMENT
        resultCard.querySelector('#pistache-question-btn')?.addEventListener('click', () => {
          try {
            window?.voiceflow?.chat?.interact?.({
              type: 'complete',
              payload: {
                webhookSuccess: true,
                action: 'question',
                blueprintData: {
                  blueprintUrl: blueprintUrl,
                  userManualLink: userManualLink,
                  description: description
                },
                buttonPath: 'question'
              }
            });
          } catch (e) {
            console.error('Erreur interact:', e);
          }
        });
        
        resultCard.querySelector('#pistache-new-btn')?.addEventListener('click', () => {
          try {
            window?.voiceflow?.chat?.interact?.({
              type: 'complete',
              payload: {
                webhookSuccess: true,
                action: 'new_blueprint',
                buttonPath: 'new'
              }
            });
          } catch (e) {
            console.error('Erreur interact:', e);
          }
        });
        
        // PAS d'auto-complete : on attend que l'user clique sur un bouton
        
      }, 800);
    }
    
    // ============ DISPLAY ERROR ============
    function showError(errorMessage) {
      stopProgressAnimation();
      
      loaderCard.style.display = 'none';
      
      errorCard.innerHTML = `
        <div class="pistache-error-icon">😅</div>
        <h2 class="pistache-error-title">${errorTitle}</h2>
        <p class="pistache-error-message">${errorMessage}</p>
        <button class="pistache-retry-btn" id="pistache-retry-btn">🔄 Réessayer</button>
      `;
      
      errorCard.style.display = 'block';
      
      errorCard.querySelector('#pistache-retry-btn')?.addEventListener('click', () => {
        try {
          window?.voiceflow?.chat?.interact?.({
            type: 'complete',
            payload: {
              webhookSuccess: false,
              action: 'retry',
              buttonPath: pathError
            }
          });
        } catch (e) {
          console.error('Erreur interact:', e);
        }
      });
    }
    
    // ============ SEND BRIEF TO MAKE ============
    async function sendBriefToMake() {
      console.log('[SendBriefToMake] 🚀 Début envoi vers Make...');
      startProgressAnimation();
      
      // Body de base avec le brief (obligatoire)
      const body = {
        brief: briefContent,
        ...extra,
        timestamp: new Date().toISOString()
      };
      
      // Ajouter les champs optionnels seulement s'ils existent
      if (vfContext.conversation_id) body.conversation_id = vfContext.conversation_id;
      if (vfContext.user_id) body.user_id = vfContext.user_id;
      if (vfContext.locale) body.locale = vfContext.locale;
      
      console.log('[SendBriefToMake] 📦 Body préparé:', JSON.stringify(body).substring(0, 200) + '...');
      
      let lastError;
      
      for (let attempt = 0; attempt <= webhookRetries; attempt++) {
        try {
          console.log(`[SendBriefToMake] 📡 Tentative ${attempt + 1}/${webhookRetries + 1}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('[SendBriefToMake] ⏰ Timeout atteint, abort...');
            controller.abort();
          }, webhookTimeoutMs);
          
          console.log('[SendBriefToMake] ⏳ Envoi fetch et attente réponse Make...');
          const startTime = Date.now();
          
          const response = await fetch(webhookUrl, {
            method: webhookMethod,
            headers: webhookHeaders,
            body: JSON.stringify(body),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          const elapsed = Date.now() - startTime;
          console.log(`[SendBriefToMake] ✅ Réponse reçue en ${elapsed}ms, status: ${response.status}`);
          
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Erreur ${response.status} : ${text.slice(0, 200) || response.statusText}`);
          }
          
          // Attendre et parser la réponse JSON
          const responseText = await response.text();
          console.log('[SendBriefToMake] 📄 Réponse brute:', responseText.substring(0, 300) + '...');
          
          let data = {};
          try {
            data = JSON.parse(responseText);
            console.log('[SendBriefToMake] 📦 Réponse parsée:', Object.keys(data));
          } catch (parseError) {
            console.warn('[SendBriefToMake] ⚠️ Réponse non-JSON:', responseText.substring(0, 100));
          }
          
          // Vérifier qu'on a bien les données attendues
          if (!data.blueprintUrl && !data.description) {
            console.warn('[SendBriefToMake] ⚠️ Réponse incomplète, données manquantes');
          }
          
          // Succès !
          console.log('[SendBriefToMake] 🎉 Succès, affichage résultat...');
          showResult(data);
          return;
          
        } catch (error) {
          lastError = error;
          console.error(`[SendBriefToMake] ❌ Tentative ${attempt + 1} échouée:`, error.message);
          
          if (attempt < webhookRetries) {
            console.log('[SendBriefToMake] 🔄 Retry dans 1s...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Toutes les tentatives ont échoué
      console.error('[SendBriefToMake] ❌ Toutes les tentatives ont échoué');
      showError(lastError?.message || 'Une erreur est survenue. Vérifie ta connexion et réessaie !');
    }
    
    // ============ LAUNCH ============
    sendBriefToMake();
    
    // Cleanup
    return () => {
      stopProgressAnimation();
    };
  }
};

// Export global
try { 
  window.SendBriefToMake = SendBriefToMake; 
} catch (e) {
  console.error('[SendBriefToMake] Erreur export:', e);
}
