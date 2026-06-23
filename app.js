// Juggler Web Application Orchestrator

document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements ---
  const tabLinks = document.querySelectorAll(".nav-link");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const specCardsContainer = document.getElementById("spec-cards-container");
  const specDetailBody = document.getElementById("spec-detail-body");
  
  // Estimator Elements (Upgraded)
  const calcModelSelect = document.getElementById("calc-model");
  const calcSpinsInput = document.getElementById("calc-spins");
  const calcCurrentGInput = document.getElementById("calc-current-g");
  const calcBigInput = document.getElementById("calc-big");
  const calcRegInput = document.getElementById("calc-reg");
  const calcUseGrapeCheckbox = document.getElementById("calc-use-grape");
  const calcGrapeWrapper = document.getElementById("calc-grape-wrapper");
  const calcGrapeInput = document.getElementById("calc-grape");
  const btnCalculate = document.getElementById("btn-calculate");
  const probabilityBars = document.getElementById("probability-bars");
  const highSettingsTotalLabel = document.getElementById("high-settings-total");
  const grapeRateDisplay = document.getElementById("grape-rate-display");
  
  // Decoupled Counter Elements
  const calcStartMiddleCheckbox = document.getElementById("calc-start-middle");
  const calcStartSpinsWrapper = document.getElementById("calc-start-spins-wrapper");
  const calcStartSpinsInput = document.getElementById("calc-start-spins");
  const playerSpinsWrapper = document.getElementById("player-spins-wrapper");
  const playerSpinsDisplay = document.getElementById("player-spins-display");
  
  // Upgraded Session UI Elements
  const btnAddSessionToggle = document.getElementById("btn-add-session-toggle");
  const addSessionForm = document.getElementById("add-session-form");
  const newSessionNameInput = document.getElementById("new-session-name");
  const newSessionModelSelect = document.getElementById("new-session-model");
  const btnCreateSession = document.getElementById("btn-create-session");
  const sessionPillsContainer = document.getElementById("session-pills");
  const activeSessionNameDisplay = document.getElementById("active-session-name-display");
  const btnRenameSession = document.getElementById("btn-rename-session");
  const btnDeleteSession = document.getElementById("btn-delete-session");
  const liveEstSessionName = document.getElementById("live-est-session-name");
  
  // Checkpoint History UI Elements
  const btnSaveCheckpoint = document.getElementById("btn-save-checkpoint");
  const btnClearHistory = document.getElementById("btn-clear-history");
  const checkpointHistoryRows = document.getElementById("checkpoint-history-rows");
  
  // Slump elements
  const slumpModelSelect = document.getElementById("slump-target-model");
  const slumpSettingSelect = document.getElementById("slump-target-setting");
  const slumpModelProbLabel = document.getElementById("slump-model-prob-label");
  const slumpProbabilityRows = document.getElementById("slump-probability-rows");
  
  // Simulator elements
  const simPresetSelect = document.getElementById("sim-preset");
  const simModelSelect = document.getElementById("sim-model");
  const btnStartSim = document.getElementById("btn-start-sim");
  const simProgressWrapper = document.getElementById("sim-progress");
  const simProgressText = document.getElementById("sim-progress-text");
  const simProgressFill = document.getElementById("sim-progress-fill");
  const islandGrid = document.getElementById("island-grid");
  const statPeak1000 = document.getElementById("stat-peak-1000");
  const statAtLeastOneProb = document.getElementById("stat-at-least-one-prob");
  const statMaxOutput = document.getElementById("stat-max-output");
  const statIslandAverage = document.getElementById("stat-island-average");
  
  // Guide elements
  const guideContainer = document.getElementById("guide-patterns-container");
  
  // Interactive lamp element
  const interactiveGogoLamp = document.getElementById("interactive-gogo-lamp");
  
  // --- State Variables ---
  let selectedModelKey = "my_juggler_v";
  let islandSettings = [];
  let isSimulating = false;
  
  // Upgraded Estimator Multi-Session State
  let sessions = [];
  let currentSessionId = "";
  
  // Web Audio Context for synthesizer
  let audioCtx = null;

  // --- Initialize Dropdowns & Components ---
  function initDropdowns() {
    Object.keys(window.JugglerModels).forEach(key => {
      const model = window.JugglerModels[key];
      
      // Calculator dropdown
      const opt1 = document.createElement("option");
      opt1.value = key;
      opt1.textContent = model.name;
      calcModelSelect.appendChild(opt1);
      
      // New Session dropdown
      const optNew = document.createElement("option");
      optNew.value = key;
      optNew.textContent = model.name;
      newSessionModelSelect.appendChild(optNew);
      
      // Slump model dropdown
      const opt2 = document.createElement("option");
      opt2.value = key;
      opt2.textContent = model.name;
      slumpModelSelect.appendChild(opt2);
      
      // Simulator dropdown
      const opt3 = document.createElement("option");
      opt3.value = key;
      opt3.textContent = model.name;
      simModelSelect.appendChild(opt3);
    });
  }

  // --- Render Model Specification Cards & Table ---
  function renderSpecCards() {
    specCardsContainer.innerHTML = "";
    Object.keys(window.JugglerModels).forEach(key => {
      const model = window.JugglerModels[key];
      const card = document.createElement("div");
      card.className = `spec-card ${key === selectedModelKey ? 'selected' : ''}`;
      card.dataset.key = key;
      
      // Get specs for Setting 1 and 6 for a quick overview on card
      const s1 = model.settings[1];
      const s6 = model.settings[6];
      
      card.innerHTML = `
        <div class="spec-card-title">
          <span>${model.name}</span>
          <span class="spec-card-badge">${model.badge}</span>
        </div>
        <div class="spec-card-specs">
          <div class="spec-row-item">
            <span class="spec-row-label">合成確率 (S1〜S6)</span>
            <span class="spec-row-value">1/${(1/(1/s1.bigProb + 1/s1.regProb)).toFixed(1)} 〜 1/${(1/(1/s6.bigProb + 1/s6.regProb)).toFixed(1)}</span>
          </div>
          <div class="spec-row-item">
            <span class="spec-row-label">機械割 (S1〜S6)</span>
            <span class="spec-row-value">${(s1.returnRate*100).toFixed(1)}% 〜 ${(s6.returnRate*100).toFixed(1)}%</span>
          </div>
        </div>
      `;
      
      card.addEventListener("click", () => {
        selectedModelKey = key;
        document.querySelectorAll(".spec-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        renderSpecDetailTable();
      });
      
      specCardsContainer.appendChild(card);
    });
    
    renderSpecDetailTable();
  }

  function renderSpecDetailTable() {
    specDetailBody.innerHTML = "";
    const model = window.JugglerModels[selectedModelKey];
    
    for (let s = 1; s <= 6; s++) {
      const spec = model.settings[s];
      const combProb = 1 / (1/spec.bigProb + 1/spec.regProb);
      const approxGrape = 1 / window.getGrapeProbability(selectedModelKey, s);
      const isHighSetting = s >= 4;
      
      const tr = document.createElement("tr");
      if (isHighSetting) {
        tr.className = "highlight-row";
      }
      
      tr.innerHTML = `
        <td style="font-weight: 700;">設定 ${s}</td>
        <td>1/${spec.bigProb.toFixed(1)}</td>
        <td>1/${spec.regProb.toFixed(1)}</td>
        <td style="font-weight: 600;">1/${combProb.toFixed(1)}</td>
        <td>1/${approxGrape.toFixed(2)}</td>
        <td style="font-weight: 700; color: ${isHighSetting ? 'var(--color-pink-light)' : 'inherit'};">
          ${(spec.returnRate * 100).toFixed(1)}%
        </td>
      `;
      
      specDetailBody.appendChild(tr);
    }
  }

  // --- Render Bayesian Estimation Probability Bars ---
  function renderProbabilityBars(probabilities = null) {
    probabilityBars.innerHTML = "";
    
    for (let s = 1; s <= 6; s++) {
      const val = probabilities ? probabilities[s - 1] : (100 / 6); // default 1/6 flat
      const isHigh = s >= 4;
      
      const barContainer = document.createElement("div");
      barContainer.className = "prob-bar-container";
      
      barContainer.innerHTML = `
        <div class="prob-bar-header">
          <span class="setting-num-label ${s === 6 ? 's6' : ''}">
            ${s === 6 ? '<i class="fa-solid fa-crown"></i>' : ''} 設定 ${s}
          </span>
          <span class="prob-val-label">${val.toFixed(2)}%</span>
        </div>
        <div class="prob-bar-bg">
          <div class="prob-bar-fill ${isHigh ? 'high-setting' : ''}" style="width: ${val}%"></div>
        </div>
      `;
      
      probabilityBars.appendChild(barContainer);
    }
    
    // Sum high settings (S4, S5, S6)
    if (probabilities) {
      const highSum = probabilities[3] + probabilities[4] + probabilities[5];
      highSettingsTotalLabel.textContent = `${highSum.toFixed(2)}%`;
    } else {
      highSettingsTotalLabel.textContent = "50.00%";
    }
  }

  // --- Multi-Session & Counter Controller Upgrades ---
  
  function initSessions() {
    // Load from local storage
    const stored = localStorage.getItem("juggler_estimator_sessions");
    const activeId = localStorage.getItem("juggler_current_session_id");
    
    if (stored) {
      try {
        sessions = JSON.parse(stored);
      } catch (e) {
        sessions = [];
      }
    }
    
    if (!sessions || sessions.length === 0) {
      // Default initial session
      sessions = [
        {
          id: "session_" + Date.now(),
          name: "マイジャグV 501番台",
          modelKey: "my_juggler_v",
          spins: 1000,
          currentG: 0,
          startSpins: 0,
          isStartMiddle: false,
          big: 3,
          reg: 4,
          grape: 160,
          useGrape: true,
          checkpoints: []
        }
      ];
      currentSessionId = sessions[0].id;
    } else {
      currentSessionId = activeId && sessions.find(s => s.id === activeId) 
        ? activeId 
        : sessions[0].id;
    }
    
    // Support retro-compatibility for older saved sessions
    sessions.forEach(s => {
      if (s.startSpins === undefined) s.startSpins = 0;
      if (s.isStartMiddle === undefined) s.isStartMiddle = false;
      if (s.currentG === undefined) s.currentG = 0;
    });
    
    saveStateToStorage();
    renderSessionPills();
    loadActiveSessionToForm();
  }
  
  function saveStateToStorage() {
    localStorage.setItem("juggler_estimator_sessions", JSON.stringify(sessions));
    localStorage.setItem("juggler_current_session_id", currentSessionId);
  }
  
  function renderSessionPills() {
    sessionPillsContainer.innerHTML = "";
    sessions.forEach(s => {
      const pill = document.createElement("div");
      pill.className = `session-pill ${s.id === currentSessionId ? 'active' : ''}`;
      pill.textContent = s.name;
      pill.addEventListener("click", () => {
        // Switch session
        currentSessionId = s.id;
        saveStateToStorage();
        renderSessionPills();
        loadActiveSessionToForm();
      });
      sessionPillsContainer.appendChild(pill);
    });
  }
  
  function loadActiveSessionToForm() {
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    calcModelSelect.value = active.modelKey;
    calcSpinsInput.value = active.spins;
    calcCurrentGInput.value = active.currentG;
    calcBigInput.value = active.big;
    calcRegInput.value = active.reg;
    calcUseGrapeCheckbox.checked = active.useGrape;
    calcGrapeInput.value = active.grape;
    
    // Decoupled Counter values
    calcStartMiddleCheckbox.checked = active.isStartMiddle;
    calcStartSpinsInput.value = active.startSpins;
    calcStartSpinsWrapper.style.display = active.isStartMiddle ? "block" : "none";
    playerSpinsWrapper.style.display = active.isStartMiddle ? "inline" : "none";
    
    calcGrapeWrapper.style.display = active.useGrape ? "block" : "none";
    activeSessionNameDisplay.textContent = active.name;
    liveEstSessionName.textContent = `[${active.name}]`;
    
    updatePlayerSpinsDisplay();
    updateGrapeRateDisplay();
    renderCheckpointsList(active.checkpoints);
    
    // Automatically trigger calculation on load
    runCalculation();
  }
  
  function updatePlayerSpinsDisplay() {
    const spins = parseInt(calcSpinsInput.value, 10) || 0;
    const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    const isStartMiddle = calcStartMiddleCheckbox.checked;
    
    const playerSpins = isStartMiddle ? Math.max(0, spins - startSpins) : spins;
    playerSpinsDisplay.textContent = playerSpins;
  }
  
  function updateGrapeRateDisplay() {
    if (!grapeRateDisplay) return;
    
    const spins = parseInt(calcSpinsInput.value, 10) || 0;
    const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    const isStartMiddle = calcStartMiddleCheckbox.checked;
    const playerSpins = isStartMiddle ? Math.max(0, spins - startSpins) : spins;
    
    const grapeCount = parseInt(calcGrapeInput.value, 10) || 0;
    
    if (playerSpins > 0 && grapeCount > 0) {
      const denominator = playerSpins / grapeCount;
      const rate = (grapeCount / playerSpins) * 100;
      grapeRateDisplay.textContent = `1/${denominator.toFixed(2)} (${rate.toFixed(1)}%)`;
    } else {
      grapeRateDisplay.textContent = "1/--";
    }

    // Update grape theoretical probability comparison grid (if elements exist)
    const grapeCompareGrid = document.getElementById("grape-compare-grid");
    const grapeCompareModelName = document.getElementById("grape-compare-model-name");
    
    const modelKey = calcModelSelect.value;
    const model = window.JugglerModels[modelKey];
    
    if (model) {
      if (grapeCompareModelName) {
        grapeCompareModelName.textContent = model.name;
      }
      
      if (grapeCompareGrid) {
        let gridHtml = "";
        const playerDenominator = (playerSpins > 0 && grapeCount > 0) ? (playerSpins / grapeCount) : null;
        
        // Find closest setting index if user rate is calculated
        let closestSetting = null;
        let minDiff = Infinity;
        if (playerDenominator !== null) {
          for (let s = 1; s <= 6; s++) {
            const grapeProb = model.settings[s].grapeProb;
            const diffVal = Math.abs(playerDenominator - grapeProb);
            if (diffVal < minDiff) {
              minDiff = diffVal;
              closestSetting = s;
            }
          }
        }
        
        for (let s = 1; s <= 6; s++) {
          const grapeProb = model.settings[s].grapeProb;
          const isHighSetting = s >= 4;
          
          let diffText = "--";
          let diffStyle = "color: var(--text-muted);";
          
          if (playerDenominator !== null) {
            const diff = playerDenominator - grapeProb;
            const diffSign = diff >= 0 ? "+" : "";
            diffText = `${diffSign}${diff.toFixed(2)}`;
            if (diff > 0.005) {
              // worse / heavier (larger denominator means fewer grapes)
              diffStyle = "color: var(--color-pink-light);";
            } else if (diff < -0.005) {
              // better / lighter (smaller denominator means more grapes)
              diffStyle = "color: #00ff7f; font-weight: 600;";
            } else {
              diffStyle = "color: var(--text-primary);";
            }
          }
          
          const isClosest = (s === closestSetting);
          
          // Style highlights for the closest setting card
          let itemStyle = "background: rgba(8, 4, 15, 0.6); padding: 0.4rem; border-radius: 6px; text-align: center; border: 1px solid rgba(157, 78, 221, 0.15); transition: all 0.3s ease; position: relative;";
          if (isClosest) {
            if (isHighSetting) {
              itemStyle = "background: linear-gradient(135deg, rgba(25, 17, 43, 0.9) 0%, rgba(255, 0, 127, 0.15) 100%); padding: 0.4rem; border-radius: 6px; text-align: center; border: 1px solid var(--color-pink-glow); box-shadow: 0 0 10px rgba(255, 0, 127, 0.25); position: relative;";
            } else {
              itemStyle = "background: linear-gradient(135deg, rgba(25, 17, 43, 0.9) 0%, rgba(157, 78, 221, 0.25) 100%); padding: 0.4rem; border-radius: 6px; text-align: center; border: 1px solid var(--color-violet-glow); box-shadow: 0 0 10px rgba(157, 78, 221, 0.25); position: relative;";
            }
          }
          
          const badgeHtml = isClosest 
            ? `<span style="position: absolute; top: -5px; right: -5px; background: ${isHighSetting ? 'var(--color-pink-glow)' : 'var(--color-violet-glow)'}; color: #fff; font-size: 0.55rem; padding: 1px 4px; border-radius: 4px; font-weight: 800; transform: scale(0.9);">近い</span>` 
            : "";
          
          gridHtml += `
            <div class="grape-compare-item" data-setting="${s}" style="${itemStyle}">
              ${badgeHtml}
              <div style="font-size: 0.65rem; color: ${isClosest ? '#fff' : 'var(--text-muted)'}; font-weight: bold;">設定 ${s}</div>
              <div class="grape-compare-val" style="font-size: 0.8rem; font-family: 'Outfit'; font-weight: 700; color: ${isClosest ? '#fff' : 'var(--text-secondary)'};">1/${grapeProb.toFixed(2)}</div>
              <div class="grape-compare-diff" style="font-size: 0.65rem; font-family: 'Outfit'; ${diffStyle} margin-top: 0.1rem;">${diffText}</div>
            </div>
          `;
        }
        grapeCompareGrid.innerHTML = gridHtml;
      }
    }
  }
  
  function runCalculation() {
    const modelKey = calcModelSelect.value;
    const spins = parseInt(calcSpinsInput.value, 10) || 0;
    const big = parseInt(calcBigInput.value, 10) || 0;
    const reg = parseInt(calcRegInput.value, 10) || 0;
    const useGrape = calcUseGrapeCheckbox.checked;
    const grape = useGrape ? (parseInt(calcGrapeInput.value, 10) || 0) : null;
    
    const isStartMiddle = calcStartMiddleCheckbox.checked;
    const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    const playerSpins = isStartMiddle ? Math.max(0, spins - startSpins) : spins;
    
    if (spins <= 0) {
      renderProbabilityBars(null);
      return;
    }
    
    // Pass playerSpins as the grapeSpins parameter
    const posteriors = window.calculateBayesianSettings(modelKey, spins, big, reg, grape, useGrape, playerSpins);
    renderProbabilityBars(posteriors);
  }
  
  function updateActiveSessionStateFromForm() {
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    active.modelKey = calcModelSelect.value;
    active.spins = parseInt(calcSpinsInput.value, 10) || 0;
    active.currentG = parseInt(calcCurrentGInput.value, 10) || 0;
    active.big = parseInt(calcBigInput.value, 10) || 0;
    active.reg = parseInt(calcRegInput.value, 10) || 0;
    active.useGrape = calcUseGrapeCheckbox.checked;
    active.grape = parseInt(calcGrapeInput.value, 10) || 0;
    
    // Decoupled state
    active.isStartMiddle = calcStartMiddleCheckbox.checked;
    active.startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    
    saveStateToStorage();
  }
  
  // Bind inputs to save state
  [
    calcModelSelect, calcSpinsInput, calcCurrentGInput, calcBigInput, calcRegInput, 
    calcUseGrapeCheckbox, calcGrapeInput, calcStartMiddleCheckbox, calcStartSpinsInput
  ].forEach(elem => {
    elem.addEventListener("input", () => {
      updateActiveSessionStateFromForm();
      updatePlayerSpinsDisplay();
      updateGrapeRateDisplay();
      runCalculation();
    });
    elem.addEventListener("change", () => {
      updateActiveSessionStateFromForm();
      updatePlayerSpinsDisplay();
      updateGrapeRateDisplay();
      runCalculation();
    });
  });

  // Calculate Button Click
  btnCalculate.addEventListener("click", () => {
    const spins = parseInt(calcSpinsInput.value, 10);
    const big = parseInt(calcBigInput.value, 10);
    const reg = parseInt(calcRegInput.value, 10);
    const useGrape = calcUseGrapeCheckbox.checked;
    const grape = useGrape ? parseInt(calcGrapeInput.value, 10) : null;
    
    // Input validation
    if (isNaN(spins) || spins <= 0) {
      alert("総ゲーム数を正しく入力してください。");
      return;
    }
    if (isNaN(big) || big < 0 || isNaN(reg) || reg < 0) {
      alert("ボーナス回数を正しく入力してください。");
      return;
    }
    if (useGrape && (isNaN(grape) || grape < 0)) {
      alert("ぶどう回数を正しく入力してください。");
      return;
    }
    
    const isStartMiddle = calcStartMiddleCheckbox.checked;
    const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    const playerSpins = isStartMiddle ? Math.max(0, spins - startSpins) : spins;
    
    if (big + reg > spins || (useGrape && grape > playerSpins)) {
      alert("入力された役の回数がゲーム数を超えています。");
      return;
    }
    
    runCalculation();
  });

  calcUseGrapeCheckbox.addEventListener("change", (e) => {
    calcGrapeWrapper.style.display = e.target.checked ? "block" : "none";
  });
  
  calcStartMiddleCheckbox.addEventListener("change", (e) => {
    calcStartSpinsWrapper.style.display = e.target.checked ? "block" : "none";
    playerSpinsWrapper.style.display = e.target.checked ? "inline" : "none";
    
    // Adjust total spins if start G is set
    if (e.target.checked) {
      const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
      const currentSpins = parseInt(calcSpinsInput.value, 10) || 0;
      if (currentSpins < startSpins) {
        calcSpinsInput.value = startSpins;
      }
    }
    
    updateActiveSessionStateFromForm();
    updatePlayerSpinsDisplay();
    updateGrapeRateDisplay();
    runCalculation();
  });
  
  // Quick Counter Tap Handlers
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target && (target.classList.contains("btn-counter") || target.classList.contains("btn-counter-large"))) {
      const targetId = target.getAttribute("data-target");
      const valToAdd = parseInt(target.getAttribute("data-val"), 10);
      const inputElem = document.getElementById(targetId);
      
      if (inputElem) {
        if (targetId === "calc-current-g") {
          // LINKED G COUNTER LOGIC
          let currentVal = parseInt(inputElem.value, 10) || 0;
          let newVal = currentVal + valToAdd;
          if (newVal < 0) newVal = 0;
          
          const diff = newVal - currentVal;
          inputElem.value = newVal;
          
          // Propagate difference to Total G (calc-spins)
          let currentSpins = parseInt(calcSpinsInput.value, 10) || 0;
          let newSpins = currentSpins + diff;
          
          // Floor check on total spins
          if (calcStartMiddleCheckbox.checked) {
            const startG = parseInt(calcStartSpinsInput.value, 10) || 0;
            if (newSpins < startG) newSpins = startG;
          } else {
            if (newSpins < 1) newSpins = 1;
          }
          calcSpinsInput.value = newSpins;
          
        } else {
          // BIG, REG, Grape counter buttons
          let currentVal = parseInt(inputElem.value, 10) || 0;
          let newVal = currentVal + valToAdd;
          if (newVal < 0) newVal = 0;
          
          inputElem.value = newVal;
          
          // AUTO RESET LOGIC:
          // When hitting a bonus (+1 BIG or +1 REG), reset Hamari G (calc-current-g) to 0!
          if (valToAdd > 0 && (targetId === "calc-big" || targetId === "calc-reg")) {
            calcCurrentGInput.value = 0;
          }
        }
        
        // Update state, calculate, and save
        updateActiveSessionStateFromForm();
        updatePlayerSpinsDisplay();
        updateGrapeRateDisplay();
        runCalculation();
      }
    }
  });

  // Session Manager Actions
  btnAddSessionToggle.addEventListener("click", () => {
    const isHidden = addSessionForm.style.display === "none";
    addSessionForm.style.display = isHidden ? "flex" : "none";
    if (isHidden) {
      newSessionNameInput.value = `台 ${sessions.length + 1}`;
      newSessionNameInput.focus();
    }
  });
  
  btnCreateSession.addEventListener("click", () => {
    const name = newSessionNameInput.value.trim() || `台 ${sessions.length + 1}`;
    const modelKey = newSessionModelSelect.value;
    
    const newSession = {
      id: "session_" + Date.now(),
      name: name,
      modelKey: modelKey,
      spins: 1000,
      currentG: 0,
      startSpins: 0,
      isStartMiddle: false,
      big: 3,
      reg: 4,
      grape: 160,
      useGrape: true,
      checkpoints: []
    };
    
    sessions.push(newSession);
    currentSessionId = newSession.id;
    
    saveStateToStorage();
    renderSessionPills();
    loadActiveSessionToForm();
    
    addSessionForm.style.display = "none";
  });
  
  btnRenameSession.addEventListener("click", () => {
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    const newName = prompt("台の新しい名前を入力してください:", active.name);
    if (newName && newName.trim()) {
      active.name = newName.trim();
      saveStateToStorage();
      renderSessionPills();
      loadActiveSessionToForm();
    }
  });
  
  btnDeleteSession.addEventListener("click", () => {
    if (sessions.length <= 1) {
      alert("最後の1台を削除することはできません。");
      return;
    }
    
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    if (confirm(`本当に「${active.name}」のデータを削除しますか？`)) {
      sessions = sessions.filter(s => s.id !== currentSessionId);
      currentSessionId = sessions[0].id;
      
      saveStateToStorage();
      renderSessionPills();
      loadActiveSessionToForm();
    }
  });
  
  // Checkpoint Logs
  btnSaveCheckpoint.addEventListener("click", () => {
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    const spins = parseInt(calcSpinsInput.value, 10) || 0;
    const currentG = parseInt(calcCurrentGInput.value, 10) || 0;
    const big = parseInt(calcBigInput.value, 10) || 0;
    const reg = parseInt(calcRegInput.value, 10) || 0;
    const useGrape = calcUseGrapeCheckbox.checked;
    const grape = useGrape ? (parseInt(calcGrapeInput.value, 10) || 0) : 0;
    
    const isStartMiddle = calcStartMiddleCheckbox.checked;
    const startSpins = parseInt(calcStartSpinsInput.value, 10) || 0;
    const playerSpins = isStartMiddle ? Math.max(0, spins - startSpins) : spins;
    
    if (spins <= 0) {
      alert("記録するデータがありません。ゲーム数を入力して計算してください。");
      return;
    }
    
    // Check constraints
    if (big + reg > spins || (useGrape && grape > playerSpins)) {
      alert("ボーナスやぶどうの回数がゲーム数を超えています。確認してください。");
      return;
    }
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const highSettingsProb = highSettingsTotalLabel.textContent;
    
    // Format displays Spins (e.g. 3000G (My: 1000G) [Hamari: 120G])
    const spinsDisplayString = isStartMiddle 
      ? `${spins}G (自:${playerSpins}G) [はまり:${currentG}G]` 
      : `${spins}G [はまり:${currentG}G]`;
    
    const checkpoint = {
      time: timeStr,
      spins: spinsDisplayString,
      br: `${big} / ${reg}`,
      grape: useGrape ? grape : "-",
      highProb: highSettingsProb
    };
    
    if (!active.checkpoints) active.checkpoints = [];
    active.checkpoints.push(checkpoint);
    
    saveStateToStorage();
    renderCheckpointsList(active.checkpoints);
  });
  
  btnClearHistory.addEventListener("click", () => {
    const active = sessions.find(s => s.id === currentSessionId);
    if (!active) return;
    
    if (confirm("この台のセーブ履歴をすべて消去しますか？（現在のゲームカウントはリセットされません）")) {
      active.checkpoints = [];
      saveStateToStorage();
      renderCheckpointsList(active.checkpoints);
    }
  });
  
  function renderCheckpointsList(checkpoints = []) {
    checkpointHistoryRows.innerHTML = "";
    
    if (!checkpoints || checkpoints.length === 0) {
      checkpointHistoryRows.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">記録されたデータはありません</td>
        </tr>
      `;
      return;
    }
    
    // Render in reverse chronological order (newest first)
    const reversed = [...checkpoints].reverse();
    reversed.forEach(cp => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: Outfit; font-weight: 500;">${cp.time}</td>
        <td style="font-family: Outfit; font-weight: 600;">${cp.spins}</td>
        <td style="font-family: Outfit;">${cp.br}</td>
        <td style="font-family: Outfit;">${cp.grape}</td>
        <td style="font-weight: 700; color: var(--color-pink-light);">${cp.highProb}</td>
      `;
      checkpointHistoryRows.appendChild(tr);
    });
  }

  // --- Update Slump Probability Tables ---
  function updateSlumpTable() {
    const modelKey = slumpModelSelect.value;
    const settingNum = parseInt(slumpSettingSelect.value, 10);
    const model = window.JugglerModels[modelKey];
    const spec = model.settings[settingNum];
    
    const combinedProb = 1 / (1/spec.bigProb + 1/spec.regProb);
    slumpModelProbLabel.textContent = `1/${combinedProb.toFixed(1)} (${model.name}・設定${settingNum}目安)`;
    
    // Slump depth marks
    const depths = [100, 300, 500, 800, 1000, 1500];
    slumpProbabilityRows.innerHTML = "";
    
    depths.forEach(g => {
      const data = window.calculateSlumpData(1 / combinedProb, g);
      const tr = document.createElement("tr");
      
      let frequencyText = "";
      if (data.singleProb > 0.0001) {
        frequencyText = `約 ${Math.round(100 / data.singleProb)} 回に1回`;
      } else {
        frequencyText = "極めて稀";
      }
      
      const badgeClass = g >= 800 ? "slump-danger-badge" : "slump-badge";
      
      tr.innerHTML = `
        <td style="font-weight: 700;"><span class="${badgeClass}">${g} G</span></td>
        <td style="font-family: Outfit; font-weight: 600;">${data.singleProb.toFixed(3)}%</td>
        <td>${frequencyText}</td>
      `;
      
      slumpProbabilityRows.appendChild(tr);
    });
  }

  slumpModelSelect.addEventListener("change", updateSlumpTable);
  slumpSettingSelect.addEventListener("change", updateSlumpTable);

  // --- 20-Cabinet Island Setup ---
  function drawCabinets() {
    islandGrid.innerHTML = "";
    const modelKey = simModelSelect.value;
    
    machinesListSetup();
    
    islandSettings.forEach((setting, idx) => {
      const cabinet = document.createElement("div");
      cabinet.className = "machine-cabinet";
      cabinet.id = `cabinet-${idx}`;
      cabinet.dataset.idx = idx;
      
      cabinet.innerHTML = `
        <span class="machine-num">台番号: ${501 + idx}</span>
        <span class="machine-setting-badge" id="cab-setting-lbl-${idx}">設定 ${setting}</span>
        <div class="machine-gogo-lamp" id="cab-lamp-${idx}">GOGO!</div>
        <div class="machine-output-samai" id="cab-samai-${idx}">0 枚</div>
        <div class="machine-stats" id="cab-stats-${idx}">0G | 0/0</div>
      `;
      
      // Let the user cycle settings of individual machines by clicking on them!
      cabinet.addEventListener("click", () => {
        if (isSimulating) return; // ignore during live runs
        
        // Cycle setting 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 1
        let currentS = islandSettings[idx];
        let nextS = currentS === 6 ? 1 : currentS + 1;
        islandSettings[idx] = nextS;
        
        // Update label
        document.getElementById(`cab-setting-lbl-${idx}`).textContent = `設定 ${nextS}`;
        simPresetSelect.value = "custom"; // change preset selection to custom
        
        updateIslandTheoreticalProb();
      });
      
      islandGrid.appendChild(cabinet);
    });
    
    updateIslandTheoreticalProb();
  }

  // Generate settings list based on selection preset
  function machinesListSetup() {
    const preset = simPresetSelect.value;
    switch(preset) {
      case "all-1":
        islandSettings = Array(20).fill(1);
        break;
      case "mixed-low":
        islandSettings = [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1];
        break;
      case "mixed-mid":
        islandSettings = [3, 4, 3, 2, 4, 3, 4, 2, 3, 3, 4, 3, 2, 4, 3, 4, 2, 3, 4, 3];
        break;
      case "all-6":
        islandSettings = Array(20).fill(6);
        break;
      case "custom":
        // Preserve current, or build mixed if empty
        if (islandSettings.length !== 20) {
          islandSettings = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
        }
        break;
    }
  }

  function updateIslandTheoreticalProb() {
    const modelKey = simModelSelect.value;
    
    // P(at least one machine finishes >= 1000) = 1 - Product(1 - p_i)
    // where p_i is probability of machine i finishing >= 1000
    let productNot1000 = 1;
    
    islandSettings.forEach(s => {
      const p1000 = window.calculateTheoretical1000MedalProb(modelKey, s);
      productNot1000 *= (1 - p1000);
    });
    
    const overallProb = (1 - productNot1000) * 100;
    statAtLeastOneProb.textContent = `${overallProb.toFixed(1)}%`;
  }

  // --- Run Visual Island Simulation ---
  btnStartSim.addEventListener("click", () => {
    if (isSimulating) return;
    
    isSimulating = true;
    btnStartSim.disabled = true;
    simPresetSelect.disabled = true;
    simModelSelect.disabled = true;
    
    const modelKey = simModelSelect.value;
    
    // Play GOGO start sound if audio exists
    playSynthGogoSound(true);
    
    // UI clean slate
    simProgressWrapper.style.display = "block";
    simProgressFill.style.width = "0%";
    statPeak1000.textContent = "0";
    statMaxOutput.textContent = "--";
    statIslandAverage.textContent = "--";
    
    // Reset visual lamps
    for(let i = 0; i < 20; i++) {
      const cab = document.getElementById(`cabinet-${i}`);
      cab.className = "machine-cabinet running";
      document.getElementById(`cab-lamp-${i}`).textContent = "GOGO!";
      document.getElementById(`cab-samai-${i}`).textContent = "0 枚";
      document.getElementById(`cab-samai-${i}`).className = "machine-output-samai";
    }
    
    // Trigger loop
    window.runVisualIslandSimulation(
      modelKey,
      islandSettings,
      // onStep callback
      (machines, spins, maxSpins) => {
        // Update visual progress
        const percent = (spins / maxSpins) * 100;
        simProgressFill.style.width = `${percent}%`;
        simProgressText.textContent = `${spins} / ${maxSpins} G`;
        
        // Update machines on grid
        machines.forEach((m, idx) => {
          const samaiLabel = document.getElementById(`cab-samai-${idx}`);
          const statsLabel = document.getElementById(`cab-stats-${idx}`);
          const lamp = document.getElementById(`cab-lamp-${idx}`);
          const cabinet = document.getElementById(`cabinet-${idx}`);
          
          samaiLabel.textContent = `${m.samai > 0 ? '+' : ''}${m.samai} 枚`;
          samaiLabel.className = `machine-output-samai ${m.samai >= 0 ? 'plus' : 'minus'}`;
          statsLabel.textContent = `${m.totalSpins}G | B${m.bigCount} R${m.regCount}`;
          
          // Light lamp visually if >= 1000
          if (m.samai >= 1000) {
            cabinet.classList.add("hit-1000");
          } else {
            cabinet.classList.remove("hit-1000");
          }
        });
      },
      // onComplete callback
      (machines, stats) => {
        // Final updates
        machines.forEach((m, idx) => {
          const cabinet = document.getElementById(`cabinet-${idx}`);
          cabinet.className = `machine-cabinet ${m.samai >= 1000 ? 'hit-1000' : ''}`;
        });
        
        statPeak1000.textContent = stats.peak1000Count;
        statMaxOutput.textContent = `${stats.maxSamai > 0 ? '+' : ''}${stats.maxSamai}`;
        statIslandAverage.textContent = `${stats.avgSamai > 0 ? '+' : ''}${stats.avgSamai}`;
        
        // Play final chime if any cabinet succeeded
        if (stats.peak1000Count > 0) {
          playSynthGogoSound(false);
        }
        
        // Restore controls
        isSimulating = false;
        btnStartSim.disabled = false;
        simPresetSelect.disabled = false;
        simModelSelect.disabled = false;
      }
    );
  });

  simPresetSelect.addEventListener("change", drawCabinets);
  simModelSelect.addEventListener("change", drawCabinets);

  // --- Sound Synthesizer via Web Audio API ---
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playSynthGogoSound(isStartNotification = false) {
    try {
      initAudio();
      
      const now = audioCtx.currentTime;
      
      if (isStartNotification) {
        // A nice start chime: low-to-high transition
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        // High pitch "PEEN!" sound (GOGO! light up sound)
        const osc = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator(); // double oscillator for fatness
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sawtooth";
        osc2.type = "square";
        
        // Retro pitch ramp
        osc.frequency.setValueAtTime(1200, now);
        osc2.frequency.setValueAtTime(1205, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.4);
        osc2.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Web Audio API not supported or context blocked by browser policies.");
    }
  }

  // --- Interactive GOGO Lamp click easter egg ---
  interactiveGogoLamp.addEventListener("click", () => {
    initAudio();
    
    // Check if it's already lit
    const isLit = interactiveGogoLamp.classList.contains("lit");
    
    if (isLit) {
      // turn off
      interactiveGogoLamp.classList.remove("lit");
    } else {
      // 1/8 chance of "先光り" (pre-light) where light lights up immediately, then plays sound after 0.5s
      const isPreLight = Math.random() < 0.125;
      
      if (isPreLight) {
        interactiveGogoLamp.classList.add("lit");
        setTimeout(() => {
          playSynthGogoSound(false);
        }, 400);
      } else {
        // Normal light up: Sound + Light together
        playSynthGogoSound(false);
        interactiveGogoLamp.classList.add("lit");
      }
    }
  });

  // --- Render Strategy Guide ---
  function renderGuide() {
    guideContainer.innerHTML = "";
    
    window.GuideContent.forEach(g => {
      const guideBox = document.createElement("div");
      guideBox.className = "guide-pattern-box";
      
      const tagElements = g.tags.map(t => `<span class="guide-tag">${t}</span>`).join("");
      
      guideBox.innerHTML = `
        <h4 class="guide-pattern-title">
          <i class="${g.icon}"></i> ${g.title}
        </h4>
        <div class="guide-tag-container">${tagElements}</div>
        <p class="guide-desc">${g.desc}</p>
      `;
      
      guideContainer.appendChild(guideBox);
    });
  }

  // --- Tab Navigation coordinator ---
  tabLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      const targetTabId = link.getAttribute("data-tab");
      
      tabLinks.forEach(l => l.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      
      link.classList.add("active");
      document.getElementById(targetTabId).classList.add("active");
      
      // Auto-trigger computations or redraws
      if (targetTabId === "tab-estimator") {
        renderProbabilityBars();
      } else if (targetTabId === "tab-slump") {
        updateSlumpTable();
      } else if (targetTabId === "tab-row-sim") {
        drawCabinets();
      }
    });
  });

  // --- Initialize Everything ---
  initDropdowns();
  renderSpecCards();
  renderGuide();
  initSessions(); // Upgraded Session Init
  
  // Set default calculator values
  slumpModelSelect.value = "my_juggler_v";
  simModelSelect.value = "my_juggler_v";
  simPresetSelect.value = "all-1";
});
