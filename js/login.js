/**
 * LOGIN.JS - Gestionnaire de la page de connexion
 * Ngozistes du Royaume
 */

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    initLoginPage();
});

/**
 * Initialisation de la page de connexion
 */
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const alertDiv = document.getElementById('login-alert');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const rememberCheckbox = document.getElementById('remember');

    // Vérifier si déjà connecté
    checkCurrentUser();

    // Gestion de la soumission du formulaire
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Gestion de l'affichage du mot de passe
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Gestion du mot de passe oublié
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }

    // Remplir automatiquement l'email si "Se souvenir de moi" était coché
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // Ajouter l'animation shake
    addShakeAnimation();
}

/**
 * Vérifie si un utilisateur est déjà connecté
 */
async function checkCurrentUser() {
    try {
        // Vérifier si window.supabaseClient existe
        if (typeof window.supabaseClient === 'undefined') {
            console.warn('supabaseClient non initialisé');
            return;
        }

        const userResult = await window.supabaseClient.getCurrentUser();
        if (userResult.user) {
            showAlert('Vous êtes déjà connecté. Redirection...', 'info');
            setTimeout(() => redirectBasedOnRole(userResult.user.role), 2000);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    }
}

/**
 * Gère la soumission du formulaire de connexion
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const rememberCheckbox = document.getElementById('remember');
    const alertDiv = document.getElementById('login-alert');
    
    // Validation basique
    if (!email || !password) {
        showAlert('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Validation de l'email
    if (!validateEmail(email)) {
        showAlert('Veuillez entrer une adresse email valide', 'error');
        return;
    }
    
    // Réinitialiser l'alerte
    if (alertDiv) {
        alertDiv.style.display = 'none';
        alertDiv.className = 'alert';
    }
    
    // Désactiver le bouton pendant la requête
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading-spinner"></span> Connexion...';
    }
    
    try {
        console.log('Tentative de connexion pour:', email);
        
        // Vérifier que supabaseClient est disponible
        if (typeof window.supabaseClient === 'undefined') {
            throw new Error('Service de connexion indisponible');
        }
        
        const result = await window.supabaseClient.login(email, password);
        
        if (result.success) {
            // Gérer "Se souvenir de moi"
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            showAlert('Connexion réussie ! Redirection...', 'success');
            
            // Rediriger selon le rôle
            setTimeout(() => {
                if (result.data && result.data.user) {
                    redirectBasedOnRole(result.data.user.role);
                } else {
                    redirectBasedOnRole('member');
                }
            }, 1500);
        } else {
            showAlert(result.message || 'Email ou mot de passe incorrect', 'error');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            }
            
            // Secouer le formulaire pour indiquer l'erreur
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.classList.add('shake');
                setTimeout(() => {
                    loginContainer.classList.remove('shake');
                }, 500);
            }
        }
    } catch (error) {
        console.error('Erreur détaillée:', error);
        showAlert('Une erreur est survenue. Veuillez réessayer.', 'error');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        }
    }
}

/**
 * Affiche/masque le mot de passe
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

/**
 * Gère le mot de passe oublié
 */
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Entrez votre adresse email pour réinitialiser votre mot de passe :');
    
    if (email) {
        if (!validateEmail(email)) {
            showAlert('Veuillez entrer une adresse email valide', 'error');
            return;
        }
        
        try {
            showAlert('Fonctionnalité de réinitialisation en cours de développement...', 'info');
            
            // TODO: Implémenter la réinitialisation avec Supabase Auth
            // const { error } = await supabase.auth.resetPasswordForEmail(email);
            
        } catch (error) {
            showAlert('Erreur : ' + error.message, 'error');
        }
    }
}

/**
 * Redirige l'utilisateur selon son rôle
 */
function redirectBasedOnRole(role) {
    if (role === 'admin') {
        window.location.href = 'admin/dashboard.html';
    } else if (role === 'member') {
        window.location.href = 'member/dashboard.html';
    } else {
        window.location.href = 'index.html';
    }
}

/**
 * Affiche une alerte
 */
function showAlert(message, type) {
    const alertDiv = document.getElementById('login-alert');
    if (!alertDiv) return;
    
    alertDiv.textContent = message;
    alertDiv.className = `alert ${type}`;
    alertDiv.style.display = 'block';
    
    // Auto-cacher après 5 secondes pour les succès, 10 pour les erreurs
    const timeout = type === 'error' ? 10000 : 5000;
    setTimeout(() => {
        if (alertDiv.style.display === 'block') {
            alertDiv.style.display = 'none';
        }
    }, timeout);
}

/**
 * Valide une adresse email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Ajoute l'animation shake au CSS
 */
function addShakeAnimation() {
    // Vérifier si le style existe déjà
    if (document.querySelector('#shake-animation')) return;
    
    const style = document.createElement('style');
    style.id = 'shake-animation';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

// Exporter les fonctions pour utilisation globale
window.loginHelpers = {
    validateEmail,
    showAlert,
    redirectBasedOnRole
};