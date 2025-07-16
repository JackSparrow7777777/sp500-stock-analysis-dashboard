  // API Configuration File
  const API_KEYS = {
      ALPHA_VANTAGE: 'T6EA4GXQZIFCK94N',
      FINANCIAL_MODELING_PREP: 'QWVHaikQKLBPt65WYlOqf172b4TCpETB',
      IEX_CLOUD: 'demo',
      POLYGON: 'demo',
      FINNHUB: 'demo'
  };

  // Make sure it's available globally
  window.API_KEYS = API_KEYS;

  // Export for Node.js if needed
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = { API_KEYS };
  }
