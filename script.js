  // API Configuration
  const API_CONFIG = {
      ALPHA_VANTAGE_KEY: window.API_KEYS?.ALPHA_VANTAGE || 'demo',
      FMP_KEY: window.API_KEYS?.FINANCIAL_MODELING_PREP || 'demo',
      ALPHA_VANTAGE_BASE: 'https://www.alphavantage.co/query',
      FMP_BASE: 'https://financialmodelingprep.com/api/v3',
      lastRequestTime: 0,
      minRequestInterval: 1000
  };

  // Global variables
  let currentStock = null;
  let stockData = {};
  let topStocks = [];
  let charts = {};

  // S&P 500 top 50 companies
  const SP500_TOP_50 = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
      'V', 'PG', 'JPM', 'HD', 'MA', 'PFE', 'BAC', 'ABBV', 'KO', 'PEP',
      'COST', 'AVGO', 'WMT', 'DIS', 'ADBE', 'CSCO', 'ACN', 'NFLX', 'CRM', 'VZ',
      'INTC', 'ABT', 'CMCSA', 'TMO', 'ORCL', 'CVX', 'AMD', 'QCOM', 'MRK', 'DHR',
      'TXN', 'AMGN', 'HON', 'UPS', 'LIN', 'SPGI', 'LOW', 'MDT', 'NEE', 'IBM'
  ];

  // Utility functions
  function formatNumber(num) {
      if (num === null || num === undefined) return '-';
      if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
      if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return num.toFixed(2);
  }

  function formatCurrency(num) {
      if (num === null || num === undefined) return '-';
      return '$' + formatNumber(num);
  }

  function formatPercentage(num) {
      if (num === null || num === undefined) return '-';
      return (num * 100).toFixed(2) + '%';
  }

  // Rate limiting
  async function rateLimitedRequest(url) {
      const now = Date.now();
      const timeSinceLastRequest = now - API_CONFIG.lastRequestTime;

      if (timeSinceLastRequest < API_CONFIG.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.minRequestInterval - timeSinceLastRequest));
      }

      API_CONFIG.lastRequestTime = Date.now();

      try {
          const response = await fetch(url);
          return await response.json();
      } catch (error) {
          console.error('API request failed:', error);
          return null;
      }
  }

  // API Functions
  async function fetchStockQuote(symbol) {
      const url = `${API_CONFIG.ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_VANTAGE_KEY}`;
      return await rateLimitedRequest(url);
  }

  async function fetchCompanyOverview(symbol) {
      const url = `${API_CONFIG.ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_VANTAGE_KEY}`;
      return await rateLimitedRequest(url);
  }

  // Load top stocks
  async function loadTopStocks() {
      const topStocksContainer = document.getElementById('topStocks');
      topStocksContainer.innerHTML = '<div class="loading">Loading top stocks...</div>';

      try {
          const stockPromises = SP500_TOP_50.slice(0, 10).map(async (symbol) => {
              const quote = await fetchStockQuote(symbol);
              const overview = await fetchCompanyOverview(symbol);

              return {
                  symbol,
                  name: overview?.Name || symbol,
                  price: parseFloat(quote?.['Global Quote']?.['05. price'] || 0),
                  change: parseFloat(quote?.['Global Quote']?.['09. change'] || 0),
                  changePercent: parseFloat(quote?.['Global Quote']?.['10. change percent']?.replace('%', '') || 0),
                  marketCap: parseFloat(overview?.MarketCapitalization || 0)
              };
          });

          topStocks = await Promise.all(stockPromises);
          topStocks.sort((a, b) => b.marketCap - a.marketCap);
          displayTopStocks();
      } catch (error) {
          console.error('Error loading top stocks:', error);
          topStocksContainer.innerHTML = '<div class="loading">Error loading stocks. Using demo data...</div>';
          loadDemoData();
      }
  }

  function displayTopStocks() {
      const container = document.getElementById('topStocks');
      container.innerHTML = '';

      topStocks.forEach(stock => {
          const stockElement = document.createElement('div');
          stockElement.className = 'stock-item';
          stockElement.onclick = () => selectStock(stock.symbol);

          const changeClass = stock.change >= 0 ? 'positive' : 'negative';

          stockElement.innerHTML = `
              <div class="stock-symbol">${stock.symbol}</div>
              <div class="stock-company">${stock.name}</div>
              <div class="stock-price">
                  $${stock.price.toFixed(2)}
                  <span class="price-change ${changeClass}">
                      ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                  </span>
              </div>
          `;

          container.appendChild(stockElement);
      });
  }

  async function selectStock(symbol) {
      document.querySelectorAll('.stock-item').forEach(item => item.classList.remove('active'));
      event.target.closest('.stock-item')?.classList.add('active');

      showLoading();
      currentStock = symbol;

      try {
          const [quote, overview] = await Promise.all([
              fetchStockQuote(symbol),
              fetchCompanyOverview(symbol)
          ]);

          updateStockDisplay(quote, overview);
      } catch (error) {
          console.error('Error loading stock data:', error);
          showError('Failed to load stock data');
      }
  }

  function updateStockDisplay(quote, overview) {
      const globalQuote = quote?.['Global Quote'] || {};

      document.getElementById('stockName').textContent = `${overview?.Name || currentStock} (${currentStock})`;
      document.getElementById('currentPrice').textContent = formatCurrency(parseFloat(globalQuote['05. price'] || 0));

      const change = parseFloat(globalQuote['09. change'] || 0);
      const changePercent = parseFloat(globalQuote['10. change percent']?.replace('%', '') || 0);
      const changeElement = document.getElementById('priceChange');
      changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
      changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

      // Update metrics
      document.getElementById('marketCap').textContent = formatCurrency(parseFloat(overview?.MarketCapitalization || 0));
      document.getElementById('peRatio').textContent = parseFloat(overview?.PERatio || 0).toFixed(2);
      document.getElementById('eps').textContent = parseFloat(overview?.EPS || 0).toFixed(2);
      document.getElementById('dividendYield').textContent = formatPercentage(parseFloat(overview?.DividendYield || 0));

      // Update company info
      document.getElementById('companyDescription').textContent = overview?.Description || 'No description available';
      document.getElementById('sector').textContent = overview?.Sector || '-';
      document.getElementById('industry').textContent = overview?.Industry || '-';
  }

  // UI Functions
  function showTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');
  }

  function showLoading() {
      document.getElementById('stockName').textContent = 'Loading...';
      document.getElementById('currentPrice').textContent = '$0.00';
      document.getElementById('priceChange').textContent = '+0.00 (0.00%)';
  }

  function showError(message) {
      document.getElementById('stockName').textContent = 'Error loading data';
      console.error(message);
  }

  function searchStock() {
      const searchInput = document.getElementById('stockSearch');
      const symbol = searchInput.value.toUpperCase().trim();

      if (symbol) {
          selectStock(symbol);
          searchInput.value = '';
      }
  }

  // Load demo data if APIs fail
  function loadDemoData() {
      const demoStocks = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 150.00, change: 2.50, changePercent: 1.69, marketCap: 2400000000000 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: 380.00, change: -1.20, changePercent: -0.31, marketCap: 2800000000000 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.00, change: 15.30, changePercent: 0.55, marketCap: 1700000000000 }
      ];

      topStocks = demoStocks;
      displayTopStocks();
  }

  // Event listeners
  document.getElementById('stockSearch').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          searchStock();
      }
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
      loadTopStocks();

      if (API_CONFIG.ALPHA_VANTAGE_KEY === 'demo') {
          console.warn('Using demo API keys. Replace with your own keys for full functionality.');
      }
  });
