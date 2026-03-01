// Fichier: js/hash.js
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (error) {
        console.error('Erreur hashage:', error);
        return password; // Fallback en cas d'erreur
    }
}