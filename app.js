// Juggler Web Application Orchestrator

document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements ---
  const tabLinks = document.querySelectorAll(".nav-link");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const specCardsContainer = document.getElementById("spec-cards-container");
  const specDetailBody = document.getElementById("spec-detail-body");
  
  // Estimator elements
  const calcModelSelect = document.getElementById("calc-model");
  const calcSpinsInput = document.getElementById("calc-spins");
  const calcBigInput = document.getElementById("calc-big");
  const calcRegInput = document.getElementById("calc-reg");
  const calcUseGrapeCheckbox = document.getElementById("calc-use-grape");
  const calcGrapeWrapper = document.getElementById("calc-grape-wrapper");
  const calcGrapeInput = document.getElementById("calc-grape");
  const btnCalculate = document.getElementById("btn-calculate");
  const probabilityBars = document.getElementById("probability-bars");
  const highSettingsTotalLabel = document.getElementById("high-settings-total");
  
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

  // --- Calculate Bayesian Settings Click Handler ---
  btnCalculate.addEventListener("click", () => {
    const modelKey = calcModelSelect.value;
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
    if (big + reg > spins || (useGrape && grape > spins)) {
      alert("入力された役の回数が総ゲーム数を超えています。");
      return;
    }
    
    const posteriors = window.calculateBayesianSettings(modelKey, spins, big, reg, grape, useGrape);
    renderProbabilityBars(posteriors);
  });

  calcUseGrapeCheckbox.addEventListener("change", (e) => {
    calcGrapeWrapper.style.display = e.target.checked ? "block" : "none";
  });

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
          
          // Flashes lamp momentarily on individual jackpot hits during steps
          // Or just light GOGO permanently if S1000 is met
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
  
  // Set default calculator values
  calcModelSelect.value = "my_juggler_v";
  slumpModelSelect.value = "my_juggler_v";
  simModelSelect.value = "my_juggler_v";
  simPresetSelect.value = "all-1";
});
