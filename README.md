# 📈 HSC Software Major Project: Stock Analyser

The **Stock Analyser** is a Flask-powered web application designed as part of the HSC Software Design and Development course. It empowers users to search for stock tickers, view interactive charts, get AI-generated stock summaries, and manage a personalised watchlist — all through a clean interface with dark mode support.

---

## 🔧 Features

### 🔍 Stock Search & Analysis
- Enter any stock ticker (e.g. `AAPL`, `TSLA`) to fetch the latest price
- Interactive candlestick chart with zoom and pan (Chart.js)
- Financial metrics like Open, High, Low, Volume

### 🤖 AI-Powered Summary
- Uses OpenAI API to generate a short natural-language summary based on recent stock data
- Typing animation and loading effect for smooth UX

### 🕶️ Light/Dark Mode
- Toggleable theme using localStorage to remember user preference
- All components styled accordingly

### 🧾 Watchlist System
- Add tickers to your personal watchlist
- View and remove items via the `watchlist.html` page
- Simple `SQLite`-based database integration

### 🔐 User Registration & Login
- Secure login and registration system
- Passwords hashed and salted using Werkzeug security

---

## 🛠 Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **Backend:** Flask (Python)
- **Database:** SQLite
- **Stock Data:** yahoo Finance
- **AI Summary:** OpenAI GPT
- **Charting:** Chart.js

---

## How to Run

```bash
pip install flask yfinance openai

Paste OpenAI API Key

