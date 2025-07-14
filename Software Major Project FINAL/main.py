import sqlite3
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import yfinance as yf


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a real secret in production

# Helper function to connect to the database
def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def home():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', username=session['username'])

@app.route('/stock', methods=['POST'])
def get_stock():
    ticker = request.json.get('ticker')
    stock = yf.Ticker(ticker)
    hist = stock.history(period='7d')

    latest_price = hist['Close'].iloc[-1]
    prev_price = hist['Close'].iloc[-2]
    change_percent = ((latest_price - prev_price) / prev_price) * 100

    return jsonify({
        'ticker': ticker.upper(),
        'price': round(latest_price, 2),
        'change_percent': round(change_percent, 2),
        'history': hist['Close'].tolist()
    })


# Registration route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db_connection()
        existing_user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if existing_user:
            conn.close()
            return 'User already exists'
        hashed_password = generate_password_hash(password)
        conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        conn.commit()
        conn.close()
        return redirect(url_for('login'))
    return render_template('register.html')


# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        if user and check_password_hash(user['password'], password):
            session['username'] = username
            return redirect(url_for('home'))
        return 'Invalid credentials'
    return render_template('login.html')


# Logout route
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('home'))


# Route to view watchlist
@app.route('/watchlist')
def watchlist():
    if 'username' not in session:
        return redirect(url_for('login'))
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (session['username'],)).fetchone()
    tickers = conn.execute('SELECT ticker FROM watchlist WHERE user_id = ?', (user['id'],)).fetchall()
    conn.close()
    return render_template('watchlist.html', tickers=[t['ticker'] for t in tickers])

# Route to add a ticker to watchlist
@app.route('/add_to_watchlist', methods=['POST'])
def add_to_watchlist():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    ticker = request.json.get('ticker')
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (session['username'],)).fetchone()
    exists = conn.execute('SELECT * FROM watchlist WHERE user_id = ? AND ticker = ?', (user['id'], ticker)).fetchone()
    if not exists:
        conn.execute('INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)', (user['id'], ticker))
        conn.commit()
    conn.close()
    return jsonify({'message': 'Added to watchlist'})

# Route to remove a ticker from watchlist
@app.route('/remove_from_watchlist', methods=['POST'])
def remove_from_watchlist():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    ticker = request.json.get('ticker')
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (session['username'],)).fetchone()
    conn.execute('DELETE FROM watchlist WHERE user_id = ? AND ticker = ?', (user['id'], ticker))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Removed from watchlist'})

if __name__ == '__main__':
    app.run(debug=True)
