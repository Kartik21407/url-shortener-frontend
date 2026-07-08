const BACKEND_URL = 'https://url-shortener-backend-6p26.onrender.com/api';

// ==========================================
// 1. AUTH PAGE LOGIC (index.html)
// ==========================================
if (document.getElementById('login-card')) {
    
    // Toggle UI
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('register-card').classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-card').classList.add('hidden');
        document.getElementById('login-card').classList.remove('hidden');
    });

    // Register API
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            const res = await fetch(`${BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                alert('Registration Successful! Please Sign In.');
                document.getElementById('show-login').click();
            } else alert('Registration Failed!');
        } catch (err) { alert('Server Error!'); }
    });

    // Login API
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('register-password') ? (document.getElementById('login-password').value) : document.getElementById('login-password').value;
        try {
            const res = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', email);
                window.location.href = 'dashboard.html'; // Redirect!
            } else alert('Invalid Credentials!');
        } catch (err) { alert('Server Error!'); }
    });
}

// ==========================================
// 2. DASHBOARD PAGE LOGIC (dashboard.html)
// ==========================================
if (document.getElementById('shorten-form')) {
    const token = localStorage.getItem('token');
    // Base URL for redirects (without /api)
    const BASE_REDIRECT_URL = 'https://url-shortener-backend-6p26.onrender.com';

    // API 1: Fetch and show all links in table
    async function fetchMyLinks() {
        try {
            const response = await fetch(`${BACKEND_URL}/my-links`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const links = await response.json();
                const tbody = document.getElementById('links-table-body');
                
                if (links.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No links generated yet. Create your first link above!</td></tr>';
                    return;
                }

                tbody.innerHTML = ''; 
                
                links.forEach(link => {
                    const shortUrl = `${BASE_REDIRECT_URL}/${link.shortAlias}`;
                    const date = new Date(link.createdAt).toLocaleDateString();
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${link.originalUrl}">${link.originalUrl}</td>
                        <td><a href="${shortUrl}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 500;">${link.shortAlias}</a></td>
                        <td>
                            <button onclick="checkClicks('${link.shortAlias}')" style="background: rgba(56, 189, 248, 0.1); border: 1px solid var(--accent); color: var(--accent); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.2s;">View Clicks</button>
                        </td>
                        <td style="color: var(--text-muted);">${date}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error("Error fetching links", error);
        }
    }

    // API 2: Create New Short Link
    document.getElementById('shorten-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const longUrl = document.getElementById('long-url').value;
        
        try {
            const response = await fetch(`${BACKEND_URL}/shorten`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ longUrl: longUrl })
            });

            if (response.ok) {
                const data = await response.json();
                
                document.getElementById('result-box').classList.remove('hidden');
                
                let alias = "";
                if (typeof data === 'string') {
                    alias = data;
                } else {
                    alias = data.shortAlias || data.shortUrl || data.url || data.alias;
                }
                
                document.getElementById('shortened-url-output').value = `${BASE_REDIRECT_URL}/${alias}`;
                document.getElementById('long-url').value = ''; 
                
                fetchMyLinks(); 
            } else {
                alert('Failed to shorten URL');
            }
        } catch (error) {
            alert('Server connection error');
        }
    });

    // Feature: Copy to Clipboard
    document.getElementById('copy-btn').addEventListener('click', () => {
        const copyText = document.getElementById('shortened-url-output');
        copyText.select();
        navigator.clipboard.writeText(copyText.value);
        
        const btn = document.getElementById('copy-btn');
        btn.innerText = 'Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerText = 'Copy';
            btn.style.background = 'var(--success)';
        }, 2000);
    });

    // API 3: Get Click Analytics
    window.checkClicks = async function(shortAlias) {
        try {
            const res = await fetch(`${BACKEND_URL}/analytics/${shortAlias}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(`📊 Analytics for /${shortAlias}\nTotal Clicks: ${data.clickCount}`);
            }
        } catch (err) {
            alert("Could not fetch analytics.");
        }
    }

    fetchMyLinks();
}