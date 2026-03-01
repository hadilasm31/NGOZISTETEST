/**
 * MAIN.JS - Script principal pour toutes les pages
 * Version complète avec toutes les fonctionnalités
 */

// ==================== INITIALISATION SUPABASE ====================
const supabaseUrl = 'https://gkvtwxnddpgoyrpedhua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnR3eG5kZHBnb3lycGVkaHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODA0MzAsImV4cCI6MjA4NzU1NjQzMH0.iTSfiOGCFky2fk6JXubFRBK8A0sVGfqMqALzD0og1KM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==================== VARIABLES GLOBALES ====================
let currentUser = null;

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    initMobileMenu();
    await checkCurrentUser();
    initVideoControls();
    initScrollAnimations();
    initLightbox();
    initGalleryFilters();
    initImageFallbacks();
    initPasswordToggles();
    initStorageSync();
    
    // Charger les données spécifiques à chaque page
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        await loadHomePageData();
    } else if (path.includes('apropos.html')) {
        await loadAboutPageData();
    } else if (path.includes('activites.html')) {
        await loadActivitiesPageData();
    } else if (path.includes('evenements.html')) {
        await loadEventsPageData();
    }
});

// ==================== GESTION MENU MOBILE ====================
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (navMenu?.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburger?.contains(e.target)) {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// ==================== GESTION AUTHENTIFICATION ====================
async function checkCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            updateAuthMenu(null);
            return;
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) throw userError;

        currentUser = { ...user, ...userData };
        updateAuthMenu(currentUser);
        
        // Sauvegarder dans localStorage pour synchro entre onglets
        try {
            localStorage.setItem('user_display', JSON.stringify({
                photo: currentUser.photo || 'images/default-avatar.png',
                name: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
                role: currentUser.role === 'super_admin' ? 'Super Admin' : (currentUser.role === 'admin' ? 'Admin' : 'Membre'),
                dashboard: currentUser.role === 'admin' || currentUser.role === 'super_admin' ? 'admin' : 'member'
            }));
        } catch (e) {
            console.warn('Impossible de sauvegarder user_display');
        }
        
    } catch (error) {
        console.error('Erreur auth:', error);
        updateAuthMenu(null);
    }
}

function updateAuthMenu(user) {
    const authMenu = document.getElementById('auth-menu');
    if (!authMenu) return;

    if (user) {
        const photo = user.photo || 'images/default-avatar.png';
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';
        
        authMenu.innerHTML = `
            <div class="user-profile" onclick="window.toggleUserDropdown(event)">
                <img src="${photo}" alt="Profil" class="nav-avatar" id="nav-avatar" onerror="this.src='images/default-avatar.png'">
                <span class="user-name">${fullName.split(' ')[0]}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        `;
    } else {
        authMenu.innerHTML = `
            <a href="login.html" class="btn-login">
                <i class="fas fa-user"></i> Connexion
            </a>
        `;
    }
}

window.toggleUserDropdown = function(event) {
    event.stopPropagation();
    
    let dropdown = document.getElementById('user-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'user-dropdown';
        dropdown.className = 'user-dropdown';
        document.body.appendChild(dropdown);
    }

    if (!currentUser) return;

    const dashboardPath = currentUser.role === 'admin' || currentUser.role === 'super_admin' ? 'admin' : 'member';
    
    dropdown.innerHTML = `
        <div class="user-dropdown-header">
            <img src="${currentUser.photo || 'images/default-avatar.png'}" alt="Avatar" onerror="this.src='images/default-avatar.png'">
            <div class="user-dropdown-info">
                <span>${currentUser.prenom || ''} ${currentUser.nom || ''}</span>
                <small>${currentUser.role === 'super_admin' ? 'Super Admin' : (currentUser.role === 'admin' ? 'Admin' : 'Membre')}</small>
            </div>
        </div>
        <div class="user-dropdown-menu">
            <a href="#" onclick="window.location.href='${dashboardPath}/dashboard.html'">
                <i class="fas fa-tachometer-alt"></i> Tableau de bord
            </a>
            <a href="#" onclick="window.location.href='${dashboardPath}/dashboard.html?panel=profile'">
                <i class="fas fa-user"></i> Mon profil
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Déconnexion
            </a>
        </div>
    `;

    const rect = event.target.closest('.user-profile')?.getBoundingClientRect();
    if (rect) {
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 10) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.classList.add('show');
    }

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !event.target.closest('.user-profile')) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
};

window.logout = async function() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        try {
            localStorage.removeItem('user_display');
        } catch (e) {}
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
};

// ==================== SYNCHRONISATION ENTRE ONGLETS ====================
function initStorageSync() {
    window.addEventListener('storage', function(e) {
        if (e.key === 'user_display' && e.newValue) {
            try {
                const userData = JSON.parse(e.newValue);
                const navAvatar = document.getElementById('nav-avatar');
                const dropdown = document.getElementById('user-dropdown');
                
                if (navAvatar) navAvatar.src = userData.photo || 'images/default-avatar.png';
                
                if (dropdown && dropdown.style.display === 'block') {
                    const headerImg = dropdown.querySelector('.user-dropdown-header img');
                    const nameSpan = dropdown.querySelector('.user-dropdown-info span');
                    const roleSmall = dropdown.querySelector('.user-dropdown-info small');
                    
                    if (headerImg) headerImg.src = userData.photo || 'images/default-avatar.png';
                    if (nameSpan) nameSpan.textContent = userData.name || 'Utilisateur';
                    if (roleSmall) roleSmall.textContent = userData.role || 'Membre';
                }
            } catch (error) {
                console.error('Erreur synchro:', error);
            }
        }
    });
}

// ==================== GESTION VIDÉO ====================
function initVideoControls() {
    const video = document.querySelector('.hero-video video');
    const videoControl = document.querySelector('.video-control');

    if (video && videoControl) {
        video.muted = true;
        video.playsInline = true;
        
        video.play().catch(() => {
            videoControl.innerHTML = '<i class="fas fa-play"></i>';
            videoControl.style.opacity = '1';
        });

        videoControl.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                videoControl.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                videoControl.innerHTML = '<i class="fas fa-play"></i>';
            }
        });

        video.addEventListener('ended', () => {
            videoControl.innerHTML = '<i class="fas fa-play"></i>';
        });
    }
}

// ==================== ANIMATIONS AU SCROLL ====================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.card, .event-card, .timeline-item, .stat-item, .activity-card, .value-card, .team-member');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
    });

    const animateOnScroll = () => {
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight - 100 && rect.bottom > 0) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    animateOnScroll();
}

// ==================== GESTION DE LA LIGHTBOX ====================
function initLightbox() {
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-content');
    const closeLightbox = document.querySelector('.close-lightbox');

    if (lightbox && lightboxImg && closeLightbox) {
        document.querySelectorAll('.gallery-item, .activity-image, .event-image, .report-gallery img').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img') || item;
                if (img.src) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

window.openLightbox = function(src) {
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-content');
    
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

// ==================== GESTION DES FILTRES ====================
function initGalleryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const filter = this.dataset.filter;
                
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
}

// ==================== GESTION DES ERREURS D'IMAGES ====================
function initImageFallbacks() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            if (!this.src.includes('default')) {
                this.src = 'images/default-image.png';
            }
        });
    });
}

// ==================== GESTION DES TOGGLES DE MOT DE PASSE ====================
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.removeEventListener('click', togglePasswordHandler);
        toggle.addEventListener('click', togglePasswordHandler);
    });
}

function togglePasswordHandler(e) {
    e.preventDefault();
    const toggle = e.currentTarget;
    const input = toggle.closest('.password-input-wrapper')?.querySelector('input') || 
                  toggle.previousElementSibling;
    
    if (!input) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    const icon = toggle.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
}

window.togglePasswordVisibility = function(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = fieldId === 'password' 
        ? document.getElementById('togglePasswordIcon')
        : document.getElementById('toggleConfirmPasswordIcon');
    
    if (passwordInput && toggleIcon) {
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
};

// ==================== ANIMATION DES STATISTIQUES ====================
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target') || stat.textContent);
        const duration = 2000;
        let current = 0;
        const startTime = Date.now();

        const updateCount = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                current = Math.floor(target * progress);
                stat.textContent = current;
                requestAnimationFrame(updateCount);
            } else {
                stat.textContent = target;
            }
        };

        updateCount();
    });
}

// ==================== CHARGEMENT DES DONNÉES PAGE ACCUEIL ====================
async function loadHomePageData() {
    await loadTimeline();
    await loadValues();
    await loadPastEvents();
    await loadGallery();
    await loadUpcomingEvents();
    await loadStatistics();
}

async function loadTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('content')
            .eq('page', 'apropos')
            .eq('section', 'timeline')
            .maybeSingle();

        if (error) throw error;

        let timeline = [];
        if (data && data.content) {
            try {
                timeline = JSON.parse(data.content);
            } catch (e) {
                console.warn('Erreur parsing timeline');
            }
        }

        if (timeline.length === 0) {
            timeline = [
                { year: "2020", title: "Fondation", description: "Création des Ngozistes du Royaume par un groupe d'amis passionnés" },
                { year: "2021", title: "Premières actions", description: "Organisation des premières actions solidaires dans la communauté" },
                { year: "2022", title: "Expansion", description: "Extension du réseau et création de nouvelles activités" },
                { year: "2023", title: "Reconnaissance", description: "L'association est reconnue pour son impact social positif" }
            ];
        }

        container.innerHTML = timeline.map((item, index) => `
            <div class="timeline-item">
                <div class="timeline-date">${item.year}</div>
                <div class="timeline-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur timeline:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadValues() {
    const container = document.getElementById('values-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('content')
            .eq('page', 'apropos')
            .eq('section', 'values')
            .maybeSingle();

        if (error) throw error;

        let values = [];
        if (data && data.content) {
            try {
                values = JSON.parse(data.content);
            } catch (e) {
                console.warn('Erreur parsing values');
            }
        }

        if (values.length === 0) {
            values = [
                { icon: "fa-hand-holding-heart", title: "Solidarité", description: "Nous croyons en l'entraide et le soutien mutuel entre tous les membres" },
                { icon: "fa-users", title: "Unité", description: "Rassembler les forces vives de notre communauté pour agir ensemble" },
                { icon: "fa-handshake", title: "Entraide", description: "Partager nos compétences, nos ressources et nos expériences" },
                { icon: "fa-chart-line", title: "Développement", description: "Construire ensemble un avenir meilleur pour tous" }
            ];
        }

        container.innerHTML = values.map(value => `
            <div class="card">
                <i class="fas ${value.icon || 'fa-star'}"></i>
                <h3>${value.title}</h3>
                <p>${value.description}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur valeurs:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadPastEvents() {
    const container = document.getElementById('past-events-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .lt('date', new Date().toISOString())
            .eq('status', 'published')
            .order('date', { ascending: false })
            .limit(3);

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(event => {
                const eventDate = new Date(event.date);
                const eventImage = event.image || 'images/events/default.jpg';
                return `
                    <div class="event-card">
                        <img src="${eventImage}" alt="${event.title}" onerror="this.src='images/events/default.jpg'">
                        <div class="event-info">
                            <h3>${event.title}</h3>
                            <p class="event-date"><i class="fas fa-calendar"></i> ${eventDate.toLocaleDateString('fr-FR')}</p>
                            <p class="event-summary">${truncateText(event.description || 'Description à venir', 100)}...</p>
                            <a href="evenements.html?id=${event.id}" class="btn-more">Voir plus</a>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucun événement passé</p>';
        }
    } catch (error) {
        console.error('Erreur événements passés:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(item => `
                <div class="gallery-item" data-category="${item.category || 'general'}">
                    <img src="${item.image}" alt="${item.title || 'Photo'}" onerror="this.src='images/gallery/default.jpg'">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucune image dans la galerie</p>';
        }
    } catch (error) {
        console.error('Erreur galerie:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .eq('status', 'published')
            .order('date', { ascending: true })
            .limit(3);

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(event => {
                const eventDate = new Date(event.date);
                const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                
                return `
                    <div class="upcoming-item">
                        <div class="event-date-badge">
                            <span class="day">${eventDate.getDate()}</span>
                            <span class="month">${monthNames[eventDate.getMonth()]}</span>
                        </div>
                        <div class="event-details">
                            <h3>${event.title}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${event.location || 'Lieu à définir'}</p>
                            <a href="evenements.html?id=${event.id}" class="btn-detail">Détails</a>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucun événement à venir</p>';
        }
    } catch (error) {
        console.error('Erreur événements à venir:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadStatistics() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    try {
        const promises = [
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('activities').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('ville', { count: 'exact', head: true }).not('ville', 'is', null)
        ];

        const [members, events, activities, cities] = await Promise.all(promises);

        const stats = {
            members: members.count || 0,
            events: events.count || 0,
            activities: activities.count || 0,
            cities: cities.count || 0
        };

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-number" data-target="${stats.members}">${stats.members}</span>
                <span class="stat-label">Membres</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" data-target="${stats.events}">${stats.events}</span>
                <span class="stat-label">Événements</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" data-target="${stats.activities}">${stats.activities}</span>
                <span class="stat-label">Activités</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" data-target="${stats.cities}">${stats.cities}</span>
                <span class="stat-label">Villes</span>
            </div>
        `;

        animateStats();
    } catch (error) {
        console.error('Erreur stats:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

// ==================== CHARGEMENT DES DONNÉES PAGE À PROPOS ====================
async function loadAboutPageData() {
    await loadHistory();
    await loadOrganization();
    await loadDetailedTimeline();
    await loadValues();
    await loadTeam();
}

async function loadHistory() {
    const container = document.getElementById('history-text');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('content')
            .eq('page', 'apropos')
            .eq('section', 'history')
            .maybeSingle();

        if (error) throw error;

        if (data && data.content) {
            container.innerHTML = `<p>${data.content}</p>`;
        } else {
            container.innerHTML = '<p>Les Ngozistes du Royaume sont nés d\'une vision commune : rassembler les forces vives de la communauté pour construire un avenir meilleur. Depuis notre création, nous n\'avons cessé de grandir et d\'étendre notre impact.</p>';
        }
    } catch (error) {
        console.error('Erreur histoire:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadOrganization() {
    const container = document.getElementById('organization-text');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('content')
            .eq('page', 'apropos')
            .eq('section', 'organization')
            .maybeSingle();

        if (error) throw error;

        if (data && data.content) {
            container.innerHTML = `<p>${data.content}</p>`;
        } else {
            container.innerHTML = '<p>Notre organisation repose sur une structure participative où chaque membre a voix au chapitre. Nous fonctionnons avec une équipe de coordination élue démocratiquement et des groupes de travail thématiques.</p>';
        }
    } catch (error) {
        console.error('Erreur organisation:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadDetailedTimeline() {
    const container = document.getElementById('detailed-timeline');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('content')
            .eq('page', 'apropos')
            .eq('section', 'timeline')
            .maybeSingle();

        if (error) throw error;

        let timeline = [];
        if (data && data.content) {
            try {
                timeline = JSON.parse(data.content);
            } catch (e) {
                console.warn('Erreur parsing timeline');
            }
        }

        if (timeline.length === 0) {
            timeline = [
                { year: "2020", title: "Fondation", description: "Création des Ngozistes du Royaume par un groupe d'amis passionnés" },
                { year: "2021", title: "Premières actions", description: "Organisation des premières actions solidaires dans la communauté" },
                { year: "2022", title: "Expansion", description: "Extension du réseau et création de nouvelles activités" },
                { year: "2023", title: "Reconnaissance", description: "L'association est reconnue pour son impact social positif" }
            ];
        }

        container.innerHTML = timeline.map(item => `
            <div class="timeline-item-detailed">
                <div class="timeline-year">${item.year}</div>
                <div class="timeline-text">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur timeline:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadTeam() {
    const container = document.getElementById('team-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('team')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(member => {
                const photo = member.photo || 'images/team/default.jpg';
                const socialLinks = member.social_links || {};
                
                return `
                    <div class="team-member">
                        <div class="member-image">
                            <img src="${photo}" alt="${member.prenom} ${member.nom}" onerror="this.src='images/team/default.jpg'">
                        </div>
                        <div class="member-info">
                            <h3>${member.prenom} ${member.nom}</h3>
                            <p class="member-role">${member.role}</p>
                            <p>${member.bio || ''}</p>
                            <div class="member-social">
                                ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" target="_blank" rel="noopener"><i class="fab fa-facebook"></i></a>` : ''}
                                ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i></a>` : ''}
                                ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucun membre de l\'équipe disponible</p>';
        }
    } catch (error) {
        console.error('Erreur équipe:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

// ==================== CHARGEMENT DES DONNÉES PAGE ACTIVITÉS ====================
async function loadActivitiesPageData() {
    await loadActivities('all');
    await loadReports();
}

async function loadActivities(category) {
    const container = document.getElementById('activities-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Chargement des activités...</div>';
    
    try {
        let query = supabase.from('activities').select('*');
        
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }
        
        query = query.order('date', { ascending: false });
        
        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(activity => {
                const activityImage = activity.image || 'images/activities/default.jpg';
                const activityDate = new Date(activity.date);
                
                return `
                    <div class="activity-card">
                        <div class="activity-image">
                            <img src="${activityImage}" alt="${activity.title}" onclick="openLightbox('${activityImage}')" onerror="this.src='images/activities/default.jpg'">
                            <span class="activity-category">${activity.category || 'Général'}</span>
                        </div>
                        <div class="activity-content">
                            <div class="activity-date">
                                <i class="fas fa-calendar"></i> ${activityDate.toLocaleDateString('fr-FR')}
                            </div>
                            <h3 class="activity-title">${activity.title}</h3>
                            <p class="activity-description">${truncateText(activity.description || 'Description à venir', 150)}</p>
                            <div class="activity-meta">
                                ${activity.location ? `
                                    <div class="activity-meta-item">
                                        <i class="fas fa-map-marker-alt"></i> ${activity.location}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="activity-footer">
                                <span class="participants">
                                    <i class="fas fa-users"></i> Organisé par l'équipe
                                </span>
                                <button class="btn-activity" onclick="showActivityDetails('${activity.id}')">Voir plus</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucune activité trouvée</p>';
        }
    } catch (error) {
        console.error('Erreur activités:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

async function loadReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('activity_reports')
            .select(`
                *,
                activity:activities(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(report => {
                const reportDate = report.date ? new Date(report.date) : new Date(report.created_at);
                
                return `
                    <div class="report-card">
                        <div class="report-header">
                            <h3 class="report-title">${report.title}</h3>
                            <span class="report-date">${reportDate.toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="report-content">
                            <div class="report-text">
                                <p>${report.content.replace(/\n/g, '</p><p>')}</p>
                                ${report.pdf_url ? `
                                    <a href="${report.pdf_url}" class="download-report" target="_blank">
                                        <i class="fas fa-file-pdf"></i> Télécharger le PDF
                                    </a>
                                ` : ''}
                            </div>
                            ${report.images && report.images.length > 0 ? `
                                <div class="report-gallery">
                                    ${report.images.map(img => `
                                        <img src="${img}" alt="Photo du compte rendu" onclick="openLightbox('${img}')">
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        ${report.activity ? `
                            <div style="margin-top: 20px; font-style: italic;">
                                <i class="fas fa-link"></i> Activité associée: ${report.activity.title}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-data">Aucun compte rendu disponible pour le moment</p>';
        }
    } catch (error) {
        console.error('Erreur rapports:', error);
        container.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

window.showActivityDetails = async function(activityId) {
    try {
        const { data: activity, error } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();

        if (error) throw error;

        if (activity) {
            const { data: reports } = await supabase
                .from('activity_reports')
                .select('*')
                .eq('activity_id', activityId);

            let message = `📋 ${activity.title}\n\n`;
            message += `📅 Date: ${new Date(activity.date).toLocaleDateString('fr-FR')}\n`;
            if (activity.location) message += `📍 Lieu: ${activity.location}\n`;
            message += `🏷️ Catégorie: ${activity.category || 'Général'}\n\n`;
            message += `📝 Description:\n${activity.description || 'Description à venir'}\n\n`;
            
            if (reports && reports.length > 0) {
                message += `📊 Comptes rendus disponibles: ${reports.length}\n`;
            }
            
            alert(message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des détails');
    }
};

// ==================== CHARGEMENT DES DONNÉES PAGE ÉVÉNEMENTS ====================
async function loadEventsPageData() {
    await loadEvents('upcoming');
    generatePremiumCalendar();
}

async function loadEvents(type) {
    const upcomingContainer = document.getElementById('upcoming-events');
    const pastContainer = document.getElementById('past-events');
    
    if (!upcomingContainer && !pastContainer) return;
    
    try {
        let query = supabase.from('events').select('*').eq('status', 'published');
        const now = new Date().toISOString();
        
        if (type === 'upcoming') {
            query = query.gte('date', now);
        } else if (type === 'past') {
            query = query.lt('date', now);
        }
        
        query = query.order('date', { ascending: type === 'upcoming' });
        
        const { data, error } = await query;

        if (error) throw error;

        window.currentEvents = data || [];
        const nowDate = new Date();
        
        const upcomingEvents = window.currentEvents.filter(e => new Date(e.date) > nowDate);
        const pastEvents = window.currentEvents.filter(e => new Date(e.date) <= nowDate);
        
        if (upcomingContainer) {
            upcomingContainer.innerHTML = upcomingEvents.length ? 
                upcomingEvents.map(e => createEventCard(e, false)).join('') : 
                '<p class="no-data">Aucun événement à venir</p>';
        }
        
        if (pastContainer) {
            pastContainer.innerHTML = pastEvents.length ? 
                pastEvents.map(e => createEventCard(e, true)).join('') : 
                '<p class="no-data">Aucun événement passé</p>';
        }
        
        if (typeof generatePremiumCalendar === 'function') {
            generatePremiumCalendar();
        }
    } catch (error) {
        console.error('Erreur:', error);
        if (upcomingContainer) upcomingContainer.innerHTML = '<p class="error">Erreur de chargement</p>';
        if (pastContainer) pastContainer.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

function createEventCard(event, isPast = false) {
    const eventDate = new Date(event.date);
    const eventImage = event.image || 'images/events/default.jpg';
    
    return `
        <div class="event-card">
            <div class="event-image">
                <img src="${eventImage}" alt="${event.title}" onclick="openLightbox('${eventImage}')" onerror="this.src='images/events/default.jpg'">
                <span class="event-badge ${isPast ? 'past' : ''}">${isPast ? 'Passé' : 'À venir'}</span>
            </div>
            <div class="event-content">
                <div class="event-date">
                    <i class="fas fa-calendar"></i> ${eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${truncateText(event.description || 'Description à venir', 100)}...</p>
                <div class="event-details">
                    <div class="event-detail-item">
                        <i class="fas fa-clock"></i> ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div class="event-detail-item">
                        <i class="fas fa-map-marker-alt"></i> ${event.location || 'Lieu à définir'}
                    </div>
                </div>
                <div class="event-footer">
                    <span class="event-participants">
                        <i class="fas fa-users"></i> ${event.current_participants || 0} participant(s)
                    </span>
                    <button class="btn-event" onclick="showEventDetails('${event.id}')">Voir détails</button>
                </div>
            </div>
        </div>
    `;
}

window.showEvents = function(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('upcoming-events').style.display = type === 'upcoming' || type === 'all' ? 'grid' : 'none';
    document.getElementById('past-events').style.display = type === 'past' || type === 'all' ? 'grid' : 'none';
};

window.showEventDetails = async function(eventId) {
    window.selectedEventId = eventId;
    const modal = document.getElementById('eventModal');
    if (!modal) return;
    
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        if (event) {
            const eventDate = new Date(event.date);
            const eventImage = event.image || 'images/events/default.jpg';
            
            document.getElementById('modalImage').src = eventImage;
            document.getElementById('modalTitle').textContent = event.title;
            document.getElementById('modalInfo').innerHTML = `
                <div class="modal-info-item"><i class="fas fa-calendar"></i><span>${eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div class="modal-info-item"><i class="fas fa-clock"></i><span>${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div class="modal-info-item"><i class="fas fa-map-marker-alt"></i><span>${event.location || 'Lieu à définir'}</span></div>
                <div class="modal-info-item"><i class="fas fa-users"></i><span>${event.current_participants || 0} / ${event.max_participants || '∞'} participants</span></div>
            `;
            document.getElementById('modalDescription').innerHTML = `<h3>Description</h3><p>${event.description || 'Description à venir'}</p>`;
            
            const registerBtn = document.getElementById('register-btn');
            if (registerBtn) {
                if (new Date(event.date) < new Date()) {
                    registerBtn.disabled = true;
                    registerBtn.textContent = 'Événement passé';
                } else {
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Confirmer ma présence';
                }
            }
            
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des détails');
    }
};

window.closeEventModal = function() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.remove('active');
    window.selectedEventId = null;
};

window.registerToEvent = async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Veuillez vous connecter pour vous inscrire');
        window.location.href = 'login.html';
        return;
    }
    
    if (!window.selectedEventId) return;
    
    const guests = parseInt(document.getElementById('guests').value);
    const message = document.getElementById('message').value;
    
    try {
        const { error } = await supabase
            .from('event_registrations')
            .insert([{
                event_id: window.selectedEventId,
                user_id: currentUser.id,
                guests: guests,
                message: message,
                status: 'confirmed'
            }]);

        if (error) {
            if (error.code === '23505') {
                alert('Vous êtes déjà inscrit à cet événement');
            } else {
                throw error;
            }
        } else {
            // Mettre à jour le compteur de participants
            await supabase.rpc('increment_event_participants', { 
                event_id: window.selectedEventId, 
                increment: 1 + guests 
            });
            
            alert('Inscription réussie !');
            window.closeEventModal();
            await loadEvents('upcoming');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription');
    }
};

// ==================== FONCTIONS CALENDRIER ====================
function generatePremiumCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const currentMonth = document.getElementById('currentMonth');
    
    if (!calendarDays || !currentMonth || !window.currentEvents) return;
    
    const year = window.currentDate?.getFullYear() || new Date().getFullYear();
    const month = window.currentDate?.getMonth() || new Date().getMonth();
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    currentMonth.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let calendarHTML = '';
    
    let startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDay; i++) {
        calendarHTML += '<div class="calendar-day-premium empty"></div>';
    }
    
    for (let day = 1; day <= lastDate; day++) {
        const eventsOnDay = window.currentEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === month && 
                   eventDate.getFullYear() === year;
        });
        
        const isToday = today.getDate() === day && 
                       today.getMonth() === month && 
                       today.getFullYear() === year;
        
        const eventCount = eventsOnDay.length;
        
        let tooltipContent = '';
        if (eventCount > 0) {
            tooltipContent = `
                <div class="events-tooltip-premium">
                    <div class="tooltip-header-premium">
                        <div class="tooltip-icon-premium">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div>
                            <h4>${eventCount} événement${eventCount > 1 ? 's' : ''}</h4>
                            <p>${day} ${monthNames[month]} ${year}</p>
                        </div>
                    </div>
                    <div class="tooltip-events-list">
                        ${eventsOnDay.slice(0, 5).map(e => {
                            const eventTime = new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            return `
                                <div class="tooltip-event-item" onclick="showEventDetails('${e.id}')">
                                    <div class="tooltip-event-title">${e.title}</div>
                                    <div class="tooltip-event-time">
                                        <i class="fas fa-clock"></i> ${eventTime}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        ${eventCount > 5 ? `
                            <div style="text-align: center; padding: 5px; color: var(--text-color);">
                                + ${eventCount - 5} autre(s)
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        calendarHTML += `
            <div class="calendar-day-premium ${isToday ? 'today' : ''}" onclick="showEventsOnDate(${year}, ${month + 1}, ${day})">
                <span class="day-number-premium">${day}</span>
                ${eventCount > 0 ? `
                    <div class="event-indicators-premium">
                        ${Array(Math.min(eventCount, 3)).fill(0).map(() => '<span class="event-dot-premium"></span>').join('')}
                    </div>
                    ${eventCount > 3 ? `<span class="event-count-premium">+${eventCount - 3}</span>` : ''}
                    ${tooltipContent}
                ` : ''}
            </div>
        `;
    }
    
    const totalCells = startDay + lastDate;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        calendarHTML += '<div class="calendar-day-premium empty"></div>';
    }
    
    calendarDays.innerHTML = calendarHTML;
}

window.changeMonth = function(delta) {
    if (!window.currentDate) window.currentDate = new Date();
    window.currentDate.setMonth(window.currentDate.getMonth() + delta);
    generatePremiumCalendar();
};

window.showEventsOnDate = function(year, month, day) {
    const eventsOnDate = (window.currentEvents || []).filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month - 1 && 
               eventDate.getFullYear() === year;
    });
    
    if (eventsOnDate.length) {
        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        let message = `📅 Événements du ${day} ${monthNames[month-1]} ${year} :\n\n`;
        eventsOnDate.forEach((e, index) => {
            const eventDate = new Date(e.date);
            message += `${index + 1}. ${e.title}\n`;
            message += `   🕐 ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
            message += `   📍 ${e.location || 'Lieu à définir'}\n`;
            message += `   👥 ${e.current_participants || 0}/${e.max_participants || '∞'} participants\n\n`;
        });
        alert(message);
    } else {
        alert(`Aucun événement le ${day}/${month}/${year}`);
    }
};

// ==================== FONCTIONS UTILITAIRES ====================
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

window.formatDate = function(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

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

window.confirmAction = function(message, callback) {
    if (confirm(message)) {
        callback();
    }
};