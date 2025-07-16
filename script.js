  // S&P 500 Stock Analysis Dashboard - Top 50 Stocks
  document.addEventListener('DOMContentLoaded', function() {
      console.log('Page loaded, initializing...');
      setTimeout(function() {
          initializeApp();
      }, 500);
  });

  function initializeApp() {
      console.log('Initializing app...');

      // API Configuration
      const API_CONFIG = {
          ALPHA_VANTAGE_KEY: 'T6EA4GXQZIFCK94N',
          ALPHA_VANTAGE_BASE: 'https://www.alphavantage.co/query',
          lastRequestTime: 0,
          minRequestInterval: 1200 // Slower for 50 stocks
      };

      // Global variables
      let currentStock = null;
      let topStocks = [];

      // Top 50 S&P 500 companies by market cap
      const SP500_TOP_50 = [
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
          'V', 'PG', 'JPM', 'HD', 'MA', 'PFE', 'BAC', 'ABBV', 'KO', 'PEP',
          'COST', 'AVGO', 'WMT', 'DIS', 'ADBE', 'CSCO', 'ACN', 'NFLX', 'CRM', 'VZ',
          'INTC', 'ABT', 'CMCSA', 'TMO', 'ORCL', 'CVX', 'AMD', 'QCOM', 'MRK', 'DHR',
          'TXN', 'AMGN', 'HON', 'UPS', 'LIN', 'SPGI', 'LOW', 'MDT', 'NEE', 'IBM'
      ];

      // Utility functions
      function formatCurrency(num) {
          if (!num || isNaN(num)) return '-';
          const value = parseFloat(num);
          if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
          if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
          if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
          if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
          return '$' + value.toFixed(2);
      }

      function formatNumber(num) {
          if (!num || isNaN(num)) return '-';
          return parseFloat(num).toFixed(2);
      }

      // Rate limiting for API calls
      async function makeAPICall(url) {
          const now = Date.now();
          const timeSinceLastRequest = now - API_CONFIG.lastRequestTime;

          if (timeSinceLastRequest < API_CONFIG.minRequestInterval) {
              await new Promise(resolve => setTimeout(resolve, API_CONFIG.minRequestInterval -
  timeSinceLastRequest));
          }

          API_CONFIG.lastRequestTime = Date.now();

          try {
              console.log('API call to:', url);
              const response = await fetch(url);
              const data = await response.json();
              return data;
          } catch (error) {
              console.error('API call failed:', error);
              return null;
          }
      }

      // Get stock quote
      async function getStockQuote(symbol) {
          const url = `${API_CONFIG.ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AP
  I_CONFIG.ALPHA_VANTAGE_KEY}`;
          return await makeAPICall(url);
      }

      // Get company overview
      async function getCompanyInfo(symbol) {
          const url = `${API_CONFIG.ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${symbol}&apikey=${API_CO
  NFIG.ALPHA_VANTAGE_KEY}`;
          return await makeAPICall(url);
      }

      // Load all 50 stocks
      async function loadTopStocks() {
          console.log('Loading top 50 S&P 500 stocks...');
          const container = document.getElementById('topStocks');
          container.innerHTML = '<div class="loading">Loading top 50 stocks... This may take a few
  minutes.</div>';

          const stockData = [];
          let loadedCount = 0;

          // Load stocks in batches to avoid overwhelming the API
          for (let i = 0; i < SP500_TOP_50.length; i++) {
              const symbol = SP500_TOP_50[i];

              try {
                  console.log(`Loading ${symbol} (${i + 1}/50)...`);

                  // Update progress
                  container.innerHTML = `<div class="loading">Loading ${symbol}... (${i + 1}/50)</div>`;

                  const quote = await getStockQuote(symbol);

                  if (quote && quote['Global Quote']) {
                      const globalQuote = quote['Global Quote'];
                      const stockInfo = {
                          symbol: symbol,
                          name: symbol, // We'll get full name when user clicks
                          price: parseFloat(globalQuote['05. price'] || 0),
                          change: parseFloat(globalQuote['09. change'] || 0),
                          changePercent: parseFloat(globalQuote['10. change percent']?.replace('%', '') ||
   0),
                          marketCap: 0 // We'll calculate this later if needed
                      };

                      stockData.push(stockInfo);
                      loadedCount++;

                      // Update display periodically
                      if (loadedCount % 10 === 0) {
                          displayTopStocks(stockData);
                      }
                  }
              } catch (error) {
                  console.error(`Error loading ${symbol}:`, error);
              }
          }

          topStocks = stockData;
          displayTopStocks(stockData);
          console.log(`Loaded ${stockData.length} stocks successfully`);
      }

      // Display stocks
      function displayTopStocks(stocks = topStocks) {
          const container = document.getElementById('topStocks');

          if (stocks.length === 0) {
              container.innerHTML = '<div class="loading">No stock data available</div>';
              return;
          }

          container.innerHTML = '';

          stocks.forEach(stock => {
              const div = document.createElement('div');
              div.className = 'stock-item';
              div.onclick = function() { selectStock(stock.symbol); };

              const changeClass = stock.change >= 0 ? 'positive' : 'negative';
              const changeSign = stock.change >= 0 ? '+' : '';

              div.innerHTML = `
                  <div class="stock-symbol">${stock.symbol}</div>
                  <div class="stock-company">${stock.name}</div>
                  <div class="stock-price">
                      ${formatCurrency(stock.price)}
                      <span class="price-change ${changeClass}">
                          ${changeSign}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                      </span>
                  </div>
              `;

              container.appendChild(div);
          });
      }

      // Select and analyze stock
      async function selectStock(symbol) {
          console.log('Analyzing stock:', symbol);
          currentStock = symbol;

          // Update UI
          document.querySelectorAll('.stock-item').forEach(item => item.classList.remove('active'));
          if (event && event.target) {
              event.target.closest('.stock-item').classList.add('active');
          }

          // Show loading
          document.getElementById('stockName').textContent = 'Loading detailed analysis...';
          document.getElementById('currentPrice').textContent = '$0.00';

          try {
              const [quote, info] = await Promise.all([
                  getStockQuote(symbol),
                  getCompanyInfo(symbol)
              ]);

              updateStockDisplay(quote, info);
          } catch (error) {
              console.error('Error analyzing stock:', error);
              document.getElementById('stockName').textContent = 'Error loading analysis';
          }
      }

      // Update detailed stock display
      function updateStockDisplay(quote, info) {
          if (!quote || !quote['Global Quote']) return;

          const globalQuote = quote['Global Quote'];

          // Update header
          document.getElementById('stockName').textContent = `${info?.Name || currentStock}
  (${currentStock})`;
          document.getElementById('currentPrice').textContent = formatCurrency(globalQuote['05. price']);

          const change = parseFloat(globalQuote['09. change'] || 0);
          const changePercent = parseFloat(globalQuote['10. change percent']?.replace('%', '') || 0);
          const changeElement = document.getElementById('priceChange');
          const changeSign = change >= 0 ? '+' : '';

          changeElement.textContent = `${changeSign}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
          changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

          // Update metrics
          document.getElementById('marketCap').textContent = formatCurrency(info?.MarketCapitalization ||
  0);
          document.getElementById('peRatio').textContent = formatNumber(info?.PERatio || 0);
          document.getElementById('eps').textContent = formatNumber(info?.EPS || 0);
          document.getElementById('revenue').textContent = formatCurrency(info?.RevenueTTM || 0);
          document.getElementById('dividendYield').textContent = formatNumber(info?.DividendYield || 0);

          // Update company info
          document.getElementById('companyDescription').textContent = info?.Description || 'No description
   available';
          document.getElementById('sector').textContent = info?.Sector || '-';
          document.getElementById('industry').textContent = info?.Industry || '-';
          document.getElementById('employees').textContent = formatNumber(info?.FullTimeEmployees || 0);
      }

      // Search function
      window.searchStock = function() {
          const input = document.getElementById('stockSearch');
          const symbol = input.value.toUpperCase().trim();

          if (symbol) {
              selectStock(symbol);
              input.value = '';
          }
      };

      // Tab function
      window.showTab = function(tabName) {
          document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
          document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

          document.getElementById(tabName).classList.add('active');
          event.target.classList.add('active');
      };

      // Event listeners
      document.getElementById('stockSearch').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              window.searchStock();
          }
      });

      // Start loading all 50 stocks
      console.log('Starting to load top 50 S&P 500 stocks...');
      loadTopStocks();
  }
