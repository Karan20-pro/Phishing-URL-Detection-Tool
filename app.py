from flask import Flask, request, jsonify, render_template_string
from feature_extraction import PhishingDetector
import os

app = Flask(__name__)

# Initialize the detector
# Ensure the model exists before starting the app
if not os.path.exists('models/phishing_model.pkl'):
    print("Model not found. Training a new model...")
    import model_training
    model_training.train_model()

detector = PhishingDetector()

# Simple HTML template for the UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phishing URL Detector (Flask)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.5; padding: 2rem; max-width: 900px; margin: 0 auto; }
        .container { background-color: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { text-align: center; color: #0f172a; margin-bottom: 0.5rem; }
        .subtitle { text-align: center; color: #64748b; margin-bottom: 2rem; }
        textarea { width: 100%; padding: 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 1rem; margin-bottom: 1rem; min-height: 120px; font-family: monospace; box-sizing: border-box; }
        textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        button { background-color: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s; display: block; width: 100%; }
        button:hover { background-color: #1d4ed8; }
        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: #f1f5f9; padding: 0.25rem; border-radius: 0.5rem; }
        .tab { flex: 1; text-align: center; padding: 0.5rem; cursor: pointer; border-radius: 0.375rem; font-weight: 500; color: #64748b; }
        .tab.active { background: white; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .result-card { margin-top: 1.5rem; padding: 1.5rem; border-radius: 0.75rem; border: 2px solid #e2e8f0; position: relative; overflow: hidden; }
        .result-card.safe { background-color: #f0fdf4; border-color: #bbf7d0; }
        
        /* Danger Styles */
        .result-card.phishing { 
            background: linear-gradient(to bottom right, #fef2f2, #fee2e2); 
            border-color: #ef4444; 
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
            animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        .result-card.phishing::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 4px;
            background-color: #dc2626;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-2px, 0, 0); }
            20%, 80% { transform: translate3d(4px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
            40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem; }
        .url-title { font-weight: bold; font-size: 1.1rem; word-break: break-all; }
        
        .phishing .url-title { color: #7f1d1d; font-weight: 900; }
        
        .stats-box { display: flex; gap: 1.5rem; background: white; padding: 0.75rem 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .phishing .stats-box { background-color: #fef2f2; border: 1px solid #fecaca; }
        
        .stat-item { text-align: center; }
        .stat-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 600; }
        .phishing .stat-label { color: #b91c1c; }
        
        .stat-value { font-size: 1.5rem; font-weight: 900; }
        .phishing .stat-value { color: #b91c1c; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        
        .stars { color: #fbbf24; font-size: 1.25rem; letter-spacing: 2px; }
        .phishing .stars { color: #dc2626; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; }
        .feature-card { background-color: rgba(255, 255, 255, 0.6); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid rgba(0, 0, 0, 0.05); }
        
        .phishing .feature-card { background-color: #fee2e2; border-color: #fca5a5; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
        
        .feature-label { font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; font-weight: bold; }
        .phishing .feature-label { color: #991b1b; }
        
        .feature-value { font-size: 1.1rem; font-weight: 900; }
        .phishing .feature-value { color: #7f1d1d; }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            body { background-color: #020617; color: #f8fafc; }
            .container { background-color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
            h1 { color: #f8fafc; }
            .subtitle { color: #94a3b8; }
            textarea { background-color: #020617; color: #f8fafc; border-color: #1e293b; }
            textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); }
            .tabs { background: #1e293b; }
            .tab { color: #94a3b8; }
            .tab.active { background: #334155; color: #60a5fa; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
            
            .result-card { border-color: #1e293b; }
            .result-card.safe { background-color: rgba(5, 150, 105, 0.1); border-color: rgba(5, 150, 105, 0.2); }
            .result-card.phishing { 
                background: linear-gradient(to bottom right, rgba(153, 27, 27, 0.2), rgba(127, 29, 29, 0.1)); 
                border-color: #b91c1c; 
            }
            
            .header-row { border-bottom-color: rgba(255,255,255,0.05); }
            .phishing .url-title { color: #fca5a5; }
            
            .stats-box { background: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .phishing .stats-box { background-color: rgba(127, 29, 29, 0.3); border-color: rgba(153, 27, 27, 0.5); }
            
            .stat-label { color: #94a3b8; }
            .phishing .stat-label { color: #fca5a5; }
            
            .stat-value { color: #f8fafc; }
            .phishing .stat-value { color: #f87171; }
            
            .feature-card { background-color: rgba(30, 41, 59, 0.6); border-color: rgba(255, 255, 255, 0.05); }
            .phishing .feature-card { background-color: rgba(127, 29, 29, 0.2); border-color: rgba(153, 27, 27, 0.3); }
            
            .feature-label { color: #94a3b8; }
            .phishing .feature-label { color: #fca5a5; }
            
            .feature-value { color: #f8fafc; }
            .phishing .feature-value { color: #fecaca; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Phishing URL Detector</h1>
        <p class="subtitle">Analyze links for potential threats. Supports bulk scanning.</p>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('scan')">Scanner</div>
            <div class="tab" onclick="switchTab('history')">History (<span id="history-count">0</span>)</div>
        </div>

        <div id="scan-view">
            <form id="analyze-form">
                <textarea id="url-input" placeholder="Enter URLs to scan (one per line)...&#10;https://example.com&#10;http://suspicious-link.com" required></textarea>
                <button type="submit" id="submit-btn">Scan URLs</button>
            </form>
            <div id="current-results"></div>
        </div>

        <div id="history-view" style="display: none;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                <button onclick="clearHistory()" style="width: auto; background: #ef4444; padding: 0.5rem 1rem; font-size: 0.875rem;">Clear History</button>
            </div>
            <div id="history-results"></div>
        </div>
    </div>

    <script>
        let history = JSON.parse(localStorage.getItem('phishing_history') || '[]');
        updateHistoryCount();

        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('scan-view').style.display = tab === 'scan' ? 'block' : 'none';
            document.getElementById('history-view').style.display = tab === 'history' ? 'block' : 'none';
            if (tab === 'history') renderHistory();
        }

        function updateHistoryCount() {
            document.getElementById('history-count').textContent = history.length;
        }

        function clearHistory() {
            history = [];
            localStorage.removeItem('phishing_history');
            updateHistoryCount();
            renderHistory();
        }

        function renderStars(count, isPhishing) {
            let html = '';
            for(let i=1; i<=5; i++) {
                if (i <= count) {
                    html += '★';
                } else {
                    html += `<span style="color: ${isPhishing ? '#fecaca' : '#e2e8f0'}">★</span>`;
                }
            }
            return html;
        }

        function createResultCard(data) {
            const isPhishing = data.is_phishing;
            const card = document.createElement('div');
            card.className = `result-card ${isPhishing ? 'phishing' : 'safe'}`;
            
            const featureLabels = {
                domain_age_days: 'Domain Age', owner_hidden: 'WHOIS Owner', missing_dns: 'DNS Records',
                length: 'Length', at_count: "'@' Symbol", hyphen_count: 'Hyphens',
                double_slash_count: 'Redirects (//)', dot_count: 'Subdomains', has_https: 'HTTPS'
            };

            let featuresHtml = '';
            for (const [key, value] of Object.entries(data.features)) {
                let displayValue = value;
                if (key === 'has_https') displayValue = value ? 'Yes' : 'No';
                else if (key === 'owner_hidden') displayValue = value ? 'Hidden' : 'Public';
                else if (key === 'missing_dns') displayValue = value ? 'Missing' : 'Valid';
                else if (key === 'domain_age_days') {
                    if (value < 30) displayValue = '< 1 Month';
                    else if (value < 365) displayValue = '< 1 Year';
                    else displayValue = `${Math.floor(value / 365)} Years`;
                }

                featuresHtml += `
                    <div class="feature-card">
                        <div class="feature-label">${featureLabels[key] || key}</div>
                        <div class="feature-value">${displayValue}</div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="header-row">
                    <div>
                        <div class="url-title" style="color: ${isPhishing ? '#7f1d1d' : '#065f46'}">${data.url}</div>
                        <div style="font-size: 0.875rem; margin-top: 0.25rem; font-weight: bold; color: ${isPhishing ? '#dc2626' : '#059669'}">
                            ${isPhishing ? '⚠️ CRITICAL PHISHING THREAT' : '✅ Safe URL'}
                        </div>
                    </div>
                    <div class="stats-box">
                        <div class="stat-item">
                            <div class="stat-label">Risk Score</div>
                            <div class="stat-value" style="color: ${isPhishing ? '#b91c1c' : '#059669'}">${data.risk_score}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Rating</div>
                            <div class="stars">${renderStars(data.stars, isPhishing)}</div>
                        </div>
                    </div>
                </div>
                <div class="features">${featuresHtml}</div>
            `;
            return card;
        }

        function renderHistory() {
            const container = document.getElementById('history-results');
            container.innerHTML = '';
            if (history.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#64748b; padding: 2rem;">No scan history yet.</p>';
                return;
            }
            history.forEach(item => container.appendChild(createResultCard(item)));
        }

        document.getElementById('analyze-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('url-input').value;
            const urls = urlInput.split(/[\\n,]+/).map(u => u.trim()).filter(u => u);
            if (!urls.length) return;

            const submitBtn = document.getElementById('submit-btn');
            const currentResults = document.getElementById('current-results');
            
            submitBtn.textContent = 'Analyzing...';
            submitBtn.disabled = true;
            currentResults.innerHTML = '';

            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls: urls }),
                });

                const data = await response.json();

                if (data.error) {
                    alert(data.error);
                    return;
                }

                data.results.forEach(result => {
                    currentResults.appendChild(createResultCard(result));
                    history.unshift(result);
                });
                
                // Keep last 50
                if (history.length > 50) history = history.slice(0, 50);
                
                localStorage.setItem('phishing_history', JSON.stringify(history));
                updateHistoryCount();

            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while analyzing the URLs.');
            } finally {
                submitBtn.textContent = 'Scan URLs';
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serves the main UI."""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """API endpoint to analyze URLs."""
    data = request.get_json()
    urls = data.get('urls', [])
    
    # Fallback for single URL
    if 'url' in data and not urls:
        urls = [data['url']]
        
    if not urls:
        return jsonify({"error": "No URLs provided"}), 400
        
    results = detector.predict_batch(urls)
    return jsonify({"results": results})

if __name__ == '__main__':
    # Run the Flask app
    print("Starting Flask server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
