// =====================================================
// CONFIGURATION CENTRALISÉE - Ngozistes du Royaume
// =====================================================

// Configuration Supabase
const SUPABASE_CONFIG = {
    url: 'https://gkvtwxnddpgoyrpedhua.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnR3eG5kZHBnb3lycGVkaHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODA0MzAsImV4cCI6MjA4NzU1NjQzMH0.iTSfiOGCFky2fk6JXubFRBK8A0sVGfqMqALzD0og1KM'
};

// Initialisation Supabase
let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase initialisé');
    }
    return supabaseClient;
}

// Fonctions utilitaires globales
const Utils = {
    // Tronquer le texte
    truncateText: function(text, maxLength = 100) {
        if (!text || typeof text !== 'string') return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    // Formater une date
    formatDate: function(dateString, options = {}) {
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {...defaultOptions, ...options});
        } catch {
            return dateString;
        }
    },

    // Formater une date courte
    formatShortDate: function(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch {
            return dateString;
        }
    },

    // Obtenir le libellé d'une catégorie
    getCategoryLabel: function(category) {
        const labels = {
            'environnement': '🌱 Environnement',
            'social': '🤝 Social',
            'culture': '🎭 Culture',
            'education': '📚 Éducation',
            'general': '📌 Général'
        };
        return labels[category] || '📌 Général';
    },

    // Obtenir le libellé d'un rôle
    getRoleLabel: function(role) {
        const labels = {
            'super_admin': '👑 Super Admin',
            'admin': '⚡ Admin',
            'member': '👤 Membre',
            'pending': '⏳ En attente'
        };
        return labels[role] || role;
    },

    // Obtenir le libellé d'un statut
    getStatusLabel: function(status) {
        const labels = {
            'active': '✅ Actif',
            'inactive': '❌ Inactif',
            'pending': '⏳ En attente',
            'rejected': '🚫 Rejeté'
        };
        return labels[status] || status;
    },

    // Afficher une notification toast
    showToast: function(message, type = 'info', duration = 3000) {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 24px;
                border-radius: 8px;
                color: white;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                max-width: 350px;
            `;
            document.body.appendChild(toast);
        }
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, duration);
    },

    // Afficher une alerte
    showAlert: function(message, type = 'info', containerId = null) {
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="alert ${type}">${message}</div>`;
                container.style.display = 'block';
                setTimeout(() => {
                    container.style.display = 'none';
                }, 5000);
                return;
            }
        }
        alert(message);
    },

    // Valider un email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Générer un ID unique
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Charger une image en base64
    fileToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Débouncer une fonction
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Vérifier si l'utilisateur est admin
    isAdmin: function(user) {
        return user && (user.role === 'admin' || user.role === 'super_admin');
    },

    // Vérifier si l'utilisateur est super admin
    isSuperAdmin: function(user) {
        return user && user.role === 'super_admin';
    }
};

// Exporter pour utilisation globale
window.SupabaseConfig = SUPABASE_CONFIG;
window.Supabase = {
    client: null,
    init: function() {
        if (!this.client) {
            this.client = initSupabase();
        }
        return this.client;
    },
    getClient: function() {
        return this.client || this.init();
    }
};
window.Utils = Utils;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.Supabase.init();
});