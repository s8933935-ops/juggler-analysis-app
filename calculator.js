// Bayesian Setting Estimator for Juggler Slots
// Numerically stable using log-likelihoods and the log-sum-exp trick

window.calculateBayesianSettings = function(modelKey, spins, bigCount, regCount, grapeCount, useGrape, grapeSpins = null) {
  const model = window.JugglerModels[modelKey];
  if (!model) return null;
  
  const logLikelihoods = [];
  
  // Calculate relative log-likelihood for each setting (1 to 6)
  for (let s = 1; s <= 6; s++) {
    const settingSpec = model.settings[s];
    
    // Probabilities for this setting
    const pBig = 1 / settingSpec.bigProb;
    const pReg = 1 / settingSpec.regProb;
    
    // Log-likelihood of BIG count: log(pBig^B * (1-pBig)^(G-B))
    // We ignore the binomial coefficient combination factor since it is identical for all settings.
    let logL = 0;
    if (pBig > 0) {
      logL += bigCount * Math.log(pBig) + (spins - bigCount) * Math.log(1 - pBig);
    }
    
    // Log-likelihood of REG count
    if (pReg > 0) {
      logL += regCount * Math.log(pReg) + (spins - regCount) * Math.log(1 - pReg);
    }
    
    // Log-likelihood of Grape count (if enabled)
    if (useGrape && grapeCount !== null) {
      const pGrape = window.getGrapeProbability(modelKey, s);
      if (pGrape > 0) {
        const gSpins = (grapeSpins !== null && grapeSpins !== undefined) ? grapeSpins : spins;
        logL += grapeCount * Math.log(pGrape) + (gSpins - grapeCount) * Math.log(1 - gSpins);
      }
    }
    
    logLikelihoods[s - 1] = logL;
  }
  
  // Log-sum-exp trick for stable probability conversion:
  // Find max log-likelihood to offset values (prevents overflow/underflow)
  const maxLogL = Math.max(...logLikelihoods);
  
  // Calculate unnormalized exponentials
  const unnormalizedProbs = logLikelihoods.map(logL => Math.exp(logL - maxLogL));
  
  // Sum for normalization
  const sumUnnormalized = unnormalizedProbs.reduce((sum, val) => sum + val, 0);
  
  // Normalized posterior probabilities
  const posteriors = unnormalizedProbs.map(u => (u / sumUnnormalized) * 100);
  
  return posteriors;
};

// Calculate slump probability table values
// returns probability of single slump, and probability of experiencing at least one slump in 8000G
window.calculateSlumpData = function(jackpotProb, slumpG) {
  // Probability of not hitting in one game
  const pMiss = 1 - jackpotProb;
  
  // Probability of N consecutive misses (slump of size slumpG)
  const pSlumpSingle = Math.pow(pMiss, slumpG);
  
  // Probability of experiencing at least one slump of size slumpG in 8,000G
  // Using formula: P(at least one slump) ≈ 1 - (1 - pSlumpSingle)^trials
  // A simple approximation for consecutive trials is: 1 - exp(- (G_total - G_slump) * p_jackpot * (1-p_jackpot)^G_slump)
  // Let's use the standard Poisson-approximation for cluster arrivals:
  const trials = 8000;
  // Expected number of slump occurrences (arrivals of slump of size slumpG)
  // The probability of starting a slump at any spin is P_jackpot * (1-P_jackpot)^slumpG
  const lambda = Math.max(0, trials - slumpG) * jackpotProb * Math.pow(pMiss, slumpG);
  const pSlumpInDay = 1 - Math.exp(-lambda);
  
  return {
    singleProb: pSlumpSingle * 100,
    dayProb: Math.min(pSlumpInDay * 100, 99.99) // cap at 99.99%
  };
};
