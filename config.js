// API Configuration File
     // Replace the demo keys with your actual API keys for full functionality

     const API_KEYS = {
         // Alpha Vantage API Key (Required)
         // Get your free key at: https://www.alphavantage.co/support/#api-key
         // Free: 5 requests/minute, 500/day
         ALPHA_VANTAGE: 'T6EA4GXQZIFCK94N',

         // Financial Modeling Prep API Key (Required)
         // Get your free key at: https://site.financialmodelingprep.com/developer/docs
         // Free: 250 calls/day - Choose "Basic (Free)" plan
         FINANCIAL_MODELING_PREP: 'QWVHaikQKLBPt65WYlOqf172b4TCpETB',

         // Alternative: IEX Cloud (Better free tier)
         // Get your free key at: https://iexcloud.io/
         // Free: 500,000 messages/month
         IEX_CLOUD: 'demo',

         // Alternative: Polygon.io (Optional)
         // Get your free key at: https://polygon.io/
         // Free: 5 requests/minute
         POLYGON: 'demo',

         // Finnhub API Key (Optional)
         // Get your free key at: https://finnhub.io/
         // Free: 60 requests/minute
         FINNHUB: 'demo'
     };

     // API Rate Limits (requests per minute)
     const RATE_LIMITS = {
         ALPHA_VANTAGE: 5,      // 5 requests per minute for free tier
         FINANCIAL_MODELING_PREP: 250,  // 250 requests per day for free tier
         POLYGON: 5,            // 5 requests per minute for free tier
         FINNHUB: 60            // 60 requests per minute for free tier
     };

     // Export configuration
     if (typeof module !== 'undefined' && module.exports) {
         module.exports = { API_KEYS, RATE_LIMITS };
     } else {
         window.API_KEYS = API_KEYS;
         window.RATE_LIMITS = RATE_LIMITS;
     }
