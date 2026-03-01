// =====================================================
// CONFIGURATION SUPABASE CENTRALISÉE
// =====================================================

// Configuration Supabase
const SUPABASE_URL = 'https://gkvtwxnddpgoyrpedhua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnR3eG5kZHBnb3lycGVkaHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODA0MzAsImV4cCI6MjA4NzU1NjQzMH0.iTSfiOGCFky2fk6JXubFRBK8A0sVGfqMqALzD0og1KM';

// Initialiser Supabase GLOBALEMENT
const { createClient } = window.supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase initialisé avec succès');

// =====================================================
// FONCTIONS UTILITAIRES GLOBALES
// =====================================================

/**
 * Déconnexion de l'utilisateur
 */
window.logout = async function() {
    try {
        await window.supabase.auth.signOut();
        localStorage.removeItem('user_display');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
};

/**
 * Vérifier l'utilisateur courant
 */
window.getCurrentUser = async function() {
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session) {
            return { user: null, session: null };
        }
        
        const { data: userData, error: userError } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (userError) {
            return { user: null, session };
        }
        
        return { user: userData, session };
    } catch (error) {
        console.error('Erreur getCurrentUser:', error);
        return { user: null, session: null };
    }
};

/**
 * Afficher une notification toast
 */
window.showToast = function(message, type = 'info', duration = 3000) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
        
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.color = 'white';
        toast.style.zIndex = '3000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
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
};

/**
 * Formater une date
 */
window.formatDate = function(dateString, options = {}) {
    const defaultOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
};

/**
 * Tronquer un texte
 */
window.truncateText = function(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Obtenir le libellé d'une catégorie
 */
window.getCategoryLabel = function(category) {
    const labels = {
        'environnement': 'Environnement',
        'social': 'Social',
        'culture': 'Culture',
        'education': 'Éducation',
        'general': 'Général'
    };
    return labels[category] || 'Général';
};