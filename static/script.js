window.onload = () => {
  const toggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (toggle) toggle.checked = true;
  }

  if (toggle) {
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
      // Update chart colors to match the new theme
      if (typeof stockChart !== 'undefined' && stockChart) {
        const newColor = getComputedStyle(document.body).color;
        if (stockChart.options.plugins?.legend?.labels) {
          stockChart.options.plugins.legend.labels.color = newColor;
        }
        if (stockChart.options.scales?.x?.ticks) {
          stockChart.options.scales.x.ticks.color = newColor;
        }
        if (stockChart.options.scales?.y?.ticks) {
          stockChart.options.scales.y.ticks.color = newColor;
        }
        stockChart.update();
      }
    });
  }
};

// Grab elements and hide the chart/summary wrapper by default
const searchContainer = document.getElementById('searchContainer');
const wrapper = document.getElementById('chartSummaryWrapper');
// hide the chart/summary wrapper by default
wrapper.style.display = 'none';

// hide the chart/summary wrapper by default
const chartContainer = document.getElementById('chartContainer');
const canvasEl = document.getElementById('stockChart');
const loader = document.getElementById('chartLoader');

searchContainer.style.marginTop = '120px';
searchContainer.style.transition = 'all 0.4s ease';
wrapper.style.transition = 'margin-left 0.4s ease, justify-content 0.4s ease, width 0.4s ease';
chartContainer.style.transition = 'all 0.4s ease';
canvasEl.style.transition = 'all 0.4s ease';

async function fetchStock() {
  // show the chart/summary wrapper when fetching stock
  wrapper.style.setProperty('display', 'flex', 'important');
  const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
  if (!ticker) return;

  // Hide welcome header
  const welcomeHeader = document.getElementById('welcomeHeader');
  if (welcomeHeader) welcomeHeader.style.display = 'none';

  // Move price under search bar
  const result = document.getElementById('result');
  result.style.textAlign = 'left';
  result.style.marginLeft = '20px';

  // Show and shift wrapper
  Object.assign(wrapper.style, {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: '20px',
    width: '100%'
  });

  // Push wrapper down to avoid overlap with search bar
  wrapper.style.marginTop = '140px';

  // Re-apply chart dimensions
  Object.assign(chartContainer.style, {
    width: '50%',
    height: '500px'
  });

  // Fill canvas
  Object.assign(canvasEl.style, {
    width: '100%',
    height: '100%'
  });

  Object.assign(searchContainer.style, {
    position: 'absolute',
    top: '80px',       // push it further down beneath the navbar
    left: '20px',
    transform: 'none',
    marginTop: '0',
    zIndex: '1000'      // ensure it stays above other elements
});

  // Show loading spinner
  if (loader) loader.style.display = 'block';

  try {
    const res = await fetch('/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker })
    });
    const data = await res.json();

    // Display price
    result.innerHTML = `<h4>${data.ticker}: $${data.price} (${data.change_percent}%)</h4>`;

    chartContainer.style.setProperty('display', 'block', 'important');

    // Draw the chart
    drawChart(data.history);

    // Hide spinner
    if (loader) loader.style.display = 'none';

    // Show Add to Watchlist button
    const watchBtn = document.getElementById('addToWatchlistBtn');
    watchBtn.style.display = 'inline-block';
    watchBtn.setAttribute('data-ticker', data.ticker);

    // Populate metrics
    const box = document.getElementById('metricsBox');
    let html = '<h5>Financial Metrics</h5><ul class="list-unstyled">';
    for (const [key, val] of Object.entries(data.metrics)) {
      html += `<li><strong>${key}:</strong> ${val ?? 'N/A'}</li>`;
    }
    html += '</ul>';
    box.innerHTML = html;

  } catch (error) {
    console.error('Fetch stock error:', error);
    if (loader) loader.style.display = 'none';
  }
}

let stockChart;
const ctx = canvasEl.getContext('2d');

function drawChart(historyData) {
  const dataToPlot = historyData.length > 100
    ? historyData.slice(-100)
    : historyData;

  if (stockChart) stockChart.destroy();

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataToPlot.map((_, i) => `Day ${i + 1}`),
      datasets: [{
        label: 'Stock Price',
        data: dataToPlot,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        decimation: { enabled: true, algorithm: 'lttb', samples: 100 },
        legend: { labels: { color: getComputedStyle(document.body).color } },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: { label: (ctx) => `Price: $${ctx.parsed.y.toFixed(2)}` }
        },
        zoom: {
          pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Day' },
          ticks: { color: getComputedStyle(document.body).color }
        },
        y: {
          title: { display: true, text: 'Price (USD)' },
          ticks: { color: getComputedStyle(document.body).color }
        }
      }
    }
  });
}

async function fetchAISummary() {
  const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
  if (!ticker) return;

  const box = document.getElementById('aiSummaryBox');
  box.style.display = 'block';

  try {
    const res = await fetch('/stock_summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker })
    });
    const data = await res.json();
    const text = data.summary || data.error || 'No summary available.';
    box.textContent = '';

    const words = text.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) box.textContent += words[i++] + ' ';
      else clearInterval(interval);
    }, 40);
  } catch (err) {
    box.textContent = 'Error loading summary.';
    console.error(err);
  }
}

function addToWatchlist() {
  const ticker = document.getElementById('addToWatchlistBtn').getAttribute('data-ticker');
  fetch('/add_to_watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker })
  })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(err => console.error(err));
}
