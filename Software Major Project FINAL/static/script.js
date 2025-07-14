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
    });
  }
};

function fetchStock() {
  const ticker = document.getElementById('tickerInput').value.trim();
  if (!ticker) return;

  fetch('/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ticker })
  })
  .then(res => res.json())
  .then(data => {
    // Show price & chart (assuming you have logic here already)
    document.getElementById('result').innerHTML = `
      <h4>${data.ticker}: $${data.price} (${data.change_percent}%)</h4>
    `;
    drawChart(data.history);

    // Show Add button
    document.getElementById('addToWatchlistBtn').style.display = 'inline-block';
    document.getElementById('addToWatchlistBtn').setAttribute('data-ticker', data.ticker);
  });
}

function addToWatchlist() {
  const ticker = document.getElementById('addToWatchlistBtn').getAttribute('data-ticker');
  fetch('/add_to_watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ticker })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message); // Or make this a popup/toast instead
  });
}

let stockChart;

function drawChart(historyData) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  if (stockChart) stockChart.destroy();

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historyData.map((_, i) => `Day ${i + 1}`),
      datasets: [{
        label: 'Stock Price',
        data: historyData,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.body).color
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Price: $${context.parsed.y.toFixed(2)}`;
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'ctrl'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: getComputedStyle(document.body).color }
        },
        y: {
          ticks: { color: getComputedStyle(document.body).color }
        }
      }
    }
  });
}
