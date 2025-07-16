  // Wait for config.js to load, then initialize
  document.addEventListener('DOMContentLoaded', function() {
      // Give a small delay to ensure config.js is loaded
      setTimeout(initializeApp, 100);
  });

  function initializeApp() {
      // API Configuration - check if API_KEYS is loaded
      const API_CONFIG = {
          ALPHA_VANTAGE_KEY: (window.API_KEYS && window.API_KEYS.ALPHA_VANTAGE) || 'T6EA4GXQZIFCK94N',
          FMP_KEY: (window.API_KEYS && window.API_KEYS.FINANCIAL_MODELING_PREP) || 'QWVHaikQKLBPt65WYlOqf172b4TCpETB',
          ALPHA_VANTAGE_BASE: 'https://www.alphavantage.co/query',
          FMP_BASE: 'https://financialmodelingprep.com/api/v3',
          lastRequestTime: 0,
          minRequestInterval: 1000
      };

      // Global variables
      let currentStock = null;
      let stockData = {};
      let topStocks = [];

      // S&P 500 top 10 companies for demo
      const SP500_TOP_10 = [
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ'
      ];

      // Utility functions
      function formatNumber(num) {
          if (num === null || num === undefined || isNaN(num)) return '-';
          if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
          if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
          if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
          if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
          return parseFloat(num).toFixed(2);
      }

      function formatCurrency(num) {
          if (num === null || num === undefined || isNaN(num)) return '-';
          return '$' + formatNumber(num);
      }

      function formatPercentage(num) {
          if (num === null || num === undefined || isNaN(num)) return '-';
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
              console.log('Making API request to:', url);
              const response = await fetch(url);
              const data = await response.json();
              console.log('API response:', data);
              return data;
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

          console.log('Loading top stocks with API key:', API_CONFIG.ALPHA_VANTAGE_KEY);

          try {
              const stockPromises = SP500_TOP_10.map(async (symbol) => {
                  try {
                      const [quote, overview] = await Promise.all([
                          fetchStockQuote(symbol),
                          fetchCompanyOverview(symbol)
                      ]);

                      const globalQuote = quote?.['Global Quote'] || {};

                      return {
                          symbol,
                          name: overview?.Name || symbol,
                          price: parseFloat(globalQuote['05. price'] || 0),
                          change: parseFloat(globalQuote['09. change'] || 0),
                          changePercent: parseFloat(globalQuote['10. change percent']?.replace('%', '') || 0),
                          marketCap: parseFloat(overview?.MarketCapitalization || 0)
                      };
                  } catch (error) {
                      console.error(`Error loading ${symbol}:`, error);
                      return {
                          symbol,
                          name: symbol,
                          price: 0,
                          change: 0,
                          changePercent: 0,
                          marketCap: 0
                      };
                  }
              });

              topStocks = await Promise.all(stockPromises);
              topStocks = topStocks.filter(stock => stock.price > 0); // Filter out failed stocks
              topStocks.sort((a, b) => b.marketCap - a.marketCap);

              displayTopStocks();

          } catch (error) {
              console.error('Error loading top stocks:', error);
              topStocksContainer.innerHTML = '<div class="loading">Error loading stocks. Please check API keys.</div>';
          }
      }

      function displayTopStocks() {
          const container = document.getElementById('topStocks');
          container.innerHTML = '';

          if (topStocks.length === 0) {
              container.innerHTML = '<div class="loading">No stock data available</div>';
              return;
          }

          topStocks.forEach(stock => {
              const stockElement = document.createElement('div');
              stockElement.className = 'stock-item';
              stockElement.onclick = () => selectStock(stock.symbol);

              const changeClass = stock.change >= 0 ? 'positive' : 'negative';

              stockElement.innerHTML = `
                  <div class="stock-symbol">${stock.symbol}</div>
                  <div class="stock-company">${stock.name}</div>
                  <div class="stock-price">
                      ${formatCurrency(stock.price)}
                      <span class="price-change ${changeClass}">
                          ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                      </span>
                  </div>
              `;

              container.appendChild(stockElement);
          });
      }

      async function selectStock(symbol) {
          // Remove active class from all items
          document.querySelectorAll('.stock-item').forEach(item => item.classList.remove('active'));

          // Add active class to clicked item
          const clickedElement = event.target.closest('.stock-item');
          if (clickedElement) {
              clickedElement.classList.add('active');
          }

          showLoading();
          currentStock = symbol;

          try {
              console.log('Loading stock data for:', symbol);
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

          console.log('Updating display with:', globalQuote, overview);

          // Update stock header
          document.getElementById('stockName').textContent = `${overview?.Name || currentStock} (${currentStock})`;
          document.getElementById('currentPrice').textContent = formatCurrency(parseFloat(globalQuote['05. price'] || 0));

          const change = parseFloat(globalQuote['09. change'] || 0);
          const changePercent = parseFloat(globalQuote['10. change percent']?.replace('%', '') || 0);
          const changeElement = document.getElementById('priceChange');
          changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
          changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

          // Update metrics
          document.getElementById('marketCap').textContent = formatCurrency(parseFloat(overview?.MarketCapitalization || 0));
          document.getElementById('peRatio').textContent = formatNumber(parseFloat(overview?.PERatio || 0));
          document.getElementById('eps').textContent = formatNumber(parseFloat(overview?.EPS || 0));
          document.getElementById('dividendYield').textContent = formatPercentage(parseFloat(overview?.DividendYield || 0));

          // Update company info
          document.getElementById('companyDescription').textContent = overview?.Description || 'No description available';
          document.getElementById('sector').textContent = overview?.Sector || '-';
          document.getElementById('industry').textContent = overview?.Industry || '-';
          document.getElementById('employees').textContent = formatNumber(parseFloat(overview?.FullTimeEmployees || 0));

          // Update revenue and net profit (from overview if available)
          document.getElementById('revenue').textContent = formatCurrency(parseFloat(overview?.RevenueTTM || 0));
          document.getElementById('netProfit').textContent = formatCurrency(parseFloat(overview?.ProfitMargin || 0) * parseFloat(overview?.RevenueTTM || 0));
      }

      // UI Functions
      window.showTab = function(tabName) {
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

      window.searchStock = function() {
          const searchInput = document.getElementById('stockSearch');
          const symbol = searchInput.value.toUpperCase().trim();

          if (symbol) {
              selectStock(symbol);
              searchInput.value = '';
          }
      }

      // Event listeners
      document.getElementById('stockSearch').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              window.searchStock();
          }
      });

      // Initialize the app
      console.log('Initializing app with API keys:', API_CONFIG);
      loadTopStocks();
  }
