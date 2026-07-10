document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    loginBtn.innerHTML = 'Checking...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('saln_logged_in', 'true');
            localStorage.setItem('saln_role', result.role); 
            window.location.href = result.role === 'admin' ? 'admin.html' : 'index.html';
        } else {
            errorMsg.textContent = result.error;
            errorMsg.classList.remove('d-none');
        }
    } catch (error) {
        errorMsg.textContent = "Cannot connect to server.";
        errorMsg.classList.remove('d-none');
    }
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
});