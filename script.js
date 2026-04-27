const TMDB_API_KEY = ""; // ◀ INSERT YOUR TMDB API KEY HERE
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const IMAGE_BASE_URL_ORIGINAL = "https://image.tmdb.org/t/p/original";

// RESPONSIVE DESIGN MANAGER
function handleDeviceResponsiveness() {
    const width = window.innerWidth;
    const body = document.body;
    
    // Reset all device classes
    body.classList.remove('device-watch', 'device-mobile', 'device-tablet', 'device-desktop');
    
    if (width <= 250) {
        // Apple Watch / Ultra Small Devices
        body.classList.add('device-watch');
    } else if (width <= 768) {
        // Mobile Phones
        body.classList.add('device-mobile');
    } else if (width <= 1024) {
        // Tablets
        body.classList.add('device-tablet');
    } else {
        // Desktop / TV
        body.classList.add('device-desktop');
    }
}

// Initial call on load
handleDeviceResponsiveness();

// Listen to screen resize events
window.addEventListener('resize', handleDeviceResponsiveness);

// State
let allTrending = [];
let allTopRated = [];
let allTvShows = [];
let currentCategoryData = [];

// Local Storage
let favoritesList = JSON.parse(localStorage.getItem('lyra_favorites')) || [];
let watchLaterList = JSON.parse(localStorage.getItem('lyra_watchlater')) || [];

// DOM Elements
const heroBg = document.getElementById('hero-bg');
const heroContent = document.getElementById('hero-content');
const trendingContainer = document.getElementById('trending-container');
const topRatedContainer = document.getElementById('top-rated-container');
const tvShowsContainer = document.getElementById('tv-shows-container');
const discoverContainer = document.getElementById('discover-container');

// New Containers
const hollywoodContainer = document.getElementById('hollywood-container');
const cdramaContainer = document.getElementById('cdrama-container');
const fantasyContainer = document.getElementById('fantasy-container');
const actionContainer = document.getElementById('action-container');

const homeView = document.getElementById('home-view');
const categoryView = document.getElementById('category-view');
const categoryTitle = document.getElementById('category-title');
const categoryGrid = document.getElementById('category-grid');
const emptyState = document.getElementById('empty-state');

// Fallback logic for demo if API_KEY is missing
const isDemoMode = !TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY" || TMDB_API_KEY.trim() === "";

// Utility: Fetch from TMDB
async function fetchFromTMDB(endpoint) {
    if (isDemoMode) {
        throw new Error("TMDB_API_KEY_MISSING");
    }
    try {
        const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

// Show Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 400);
    }, 3000);
}

//  NOTIFICATION & DROPDOWN LOGIC ─
const Btnotification = document.getElementById('notification-btn');
const notifDropdown = document.getElementById('notification-dropdown');

if (Btnotification && notifDropdown) {
    Btnotification.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        // Close other dropdowns
        document.getElementById('profile-dropdown')?.classList.add('hidden');
        document.getElementById('search-results')?.classList.add('hidden');
    });
}

// Close dropdowns on outside click
document.addEventListener('click', () => {
    notifDropdown?.classList.add('hidden');
    document.getElementById('profile-dropdown')?.classList.add('hidden');
    document.getElementById('search-results')?.classList.add('hidden');
});

// Render a single movie/TV card
function createMovieCard(item, type = 'movie') {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date || 'N/A';
    const year = date !== 'N/A' ? date.split('-')[0] : '';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const posterUrl = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750/111111/FFFFFF?text=No+Poster';

    const card = document.createElement('div');
    card.className = 'movie-card fade-in';
    
    // Add type if missing
    if(!item.media_type) item.media_type = type;

    // Convert object to string safely for HTML attribute
    const itemDataStr = encodeURIComponent(JSON.stringify(item));
    card.onclick = () => openTrailer(item.id, item.media_type || type, itemDataStr);

    card.innerHTML = `
        <img src="${posterUrl}" alt="${title}" loading="lazy" onload="this.classList.add('loaded')">
        <div class="card-overlay">
            <div class="card-meta">
                <span class="card-rating">
                    <i class='bx bxs-star'></i> ${rating}
                </span>
                <span class="card-year">${year}</span>
            </div>
            <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-play-btn">
            <i class='bx bx-play'></i>
        </div>
    `;
    return card;
}

// Render the Hero Section
function renderHero(movie) {
    if (!movie) return;
    const title = movie.title || movie.name;
    const backdropUrl = movie.backdrop_path ? `${IMAGE_BASE_URL_ORIGINAL}${movie.backdrop_path}` : '';
    const overview = movie.overview;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
    
    heroBg.style.backgroundImage = `url('${backdropUrl}')`;
    
    // Store data in a safe way for the onclick handler
    const itemDataStr = encodeURIComponent(JSON.stringify(movie));

    heroContent.innerHTML = `
        <div class="hero-meta fade-in">
            <div class="hero-badge gradient-primary shadow-glow-primary">
                #1 TRENDING
            </div>
            <div class="hero-rating glass-panel-light border-primary">
                <i class='bx bxs-star'></i> ${rating}
            </div>
        </div>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-desc">${overview}</p>
        <div class="hero-buttons">
            <button onclick="openTrailer(${movie.id}, '${movie.media_type || 'movie'}', '${itemDataStr}')" class="btn-primary">
                <i class='bx bx-play'></i> Play Now
            </button>
            <button class="btn-secondary glass-panel-light" onclick="toggleSavedItem(${movie.id}, 'watchlater', '${itemDataStr}')">
                <i class='bx bx-plus'></i> My List
            </button>
        </div>
    `;
}

// Generate Mock Data if API is missing
function generateMockData() {
    const mockMovies = Array(15).fill(null).map((_, i) => ({
        id: i,
        title: `Mock Movie ${i+1}`,
        overview: "This is a placeholder description. Please configure your TMDB API Key in your JavaScript file to see real movie data.",
        vote_average: 8.5,
        release_date: "2024-01-01",
        media_type: "movie"
    }));

    allTrending = mockMovies;
    allTopRated = mockMovies;
    allTvShows = mockMovies;

    renderHero(mockMovies[0]);

    const renderList = (container, list) => {
        if(container) {
            container.innerHTML = '';
            list.forEach(m => container.appendChild(createMovieCard(m)));
        }
    };

    renderList(trendingContainer, mockMovies);
    renderList(topRatedContainer, mockMovies);
    renderList(tvShowsContainer, mockMovies);
    renderList(discoverContainer, mockMovies);
    
    renderList(hollywoodContainer, mockMovies.map(m => ({...m, title: "Hollywood " + m.title})));
    renderList(cdramaContainer, mockMovies.map(m => ({...m, title: "C-Drama " + m.title})));
    renderList(fantasyContainer, mockMovies.map(m => ({...m, title: "Fantasy " + m.title})));
    renderList(actionContainer, mockMovies.map(m => ({...m, title: "Action " + m.title})));

    // Show persistent warning
    if(!document.querySelector('.api-warning')) {
        const warning = document.createElement('div');
        warning.className = "api-warning";
        warning.innerHTML = `<p><i class='bx bx-error'></i> API Key Missing</p><p>Using mock data. Edit script.js to add TMDB key.</p>`;
        document.body.appendChild(warning);
    }
}

// Load Home Content for all sections
async function loadHomeContent() {
    if (isDemoMode) {
        generateMockData();
        return;
    }

    try {
        const [trending, topRated, tvShows, hollywood, cdrama, fantasy, action] = await Promise.all([
            fetchFromTMDB('/trending/movie/week'),
            fetchFromTMDB('/movie/top_rated'),
            fetchFromTMDB('/trending/tv/week'),
            fetchFromTMDB('/discover/movie?with_origin_country=US&sort_by=popularity.desc'),
            fetchFromTMDB('/discover/tv?with_origin_country=CN&sort_by=popularity.desc'),
            fetchFromTMDB('/discover/tv?with_genres=10765&sort_by=popularity.desc'),
            fetchFromTMDB('/discover/movie?with_genres=28&sort_by=popularity.desc')
        ]);

        allTrending = trending || [];
        allTopRated = topRated || [];
        allTvShows = tvShows || [];

        if (trending && trending.length > 0) {
            renderHero(trending[0]);
            trendingContainer.innerHTML = '';
            trending.slice(1, 15).forEach(item => trendingContainer.appendChild(createMovieCard(item, 'movie')));
        }

        if (topRated) {
            topRatedContainer.innerHTML = '';
            topRated.slice(0, 15).forEach(item => topRatedContainer.appendChild(createMovieCard(item, 'movie')));
        }

        if (tvShows) {
            tvShowsContainer.innerHTML = '';
            tvShows.slice(0, 15).forEach(item => tvShowsContainer.appendChild(createMovieCard(item, 'tv')));
        }
        
        if (hollywood) {
            hollywoodContainer.innerHTML = '';
            hollywood.slice(0, 15).forEach(item => hollywoodContainer.appendChild(createMovieCard(item, 'movie')));
        }
        if (cdrama) {
            cdramaContainer.innerHTML = '';
            cdrama.slice(0, 15).forEach(item => cdramaContainer.appendChild(createMovieCard(item, 'tv')));
        }
        if (fantasy) {
            fantasyContainer.innerHTML = '';
            fantasy.slice(0, 15).forEach(item => fantasyContainer.appendChild(createMovieCard(item, 'tv')));
        }
        if (action) {
            actionContainer.innerHTML = '';
            action.slice(0, 15).forEach(item => actionContainer.appendChild(createMovieCard(item, 'movie')));
        }

        // We don't render discover immediately unless requested, or if we want to store it.
    } catch (error) {
        console.error("Failed to load content", error);
        if (error.message === "TMDB_API_KEY_MISSING") {
            generateMockData();
        }
    }
}

// Render Category View
function renderCategoryView(title, items, type) {
    homeView.classList.add('hidden');
    categoryView.classList.remove('hidden');
    categoryTitle.textContent = title;
    
    // Hide filter bar for normal categories, show it only for 'discover' specific types
    document.getElementById('filter-bar').classList.add('hidden');
    
    categoryGrid.innerHTML = '';
    
    if (items && items.length > 0) {
        emptyState.classList.add('hidden');
        items.forEach(item => {
            categoryGrid.appendChild(createMovieCard(item, item.media_type || type));
        });
    } else {
        emptyState.classList.remove('hidden');
    }
}

// Navigation Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const section = item.getAttribute('data-section');
        const u = getUser();
        
        if (section === 'home') {
            categoryView.classList.add('hidden');
            homeView.classList.remove('hidden');
        } else if (section === 'trending') {
            renderCategoryView('Trending Now', allTrending, 'movie');
        } else if (section === 'top-rated') {
            renderCategoryView('Top Rated Masterpieces', allTopRated, 'movie');
        } else if (section === 'tv-shows') {
            renderCategoryView('Popular TV Shows', allTvShows, 'tv');
        } else if (section === 'favorites') {
            if (!u.loggedIn) {
                showToast("Please sign in to view your Favorites");
                openLoginModal();
                return;
            }
            renderCategoryView('My Favorites', favoritesList, 'movie');
        } else if (section === 'watch-later') {
            if (!u.loggedIn) {
                showToast("Please sign in to view your Watch Later list");
                openLoginModal();
                return;
            }
            renderCategoryView('Watch Later', watchLaterList, 'movie');
        }
    });
});

// Save Item Logic (Fav/WatchLater)
window.toggleSavedItem = function(id, listType, itemDataStr) {
    const itemData = JSON.parse(decodeURIComponent(itemDataStr));
    let list = listType === 'favorites' ? favoritesList : watchLaterList;
    let key = listType === 'favorites' ? 'lyra_favorites' : 'lyra_watchlater';
    let name = listType === 'favorites' ? 'Favorites' : 'Watch Later';
    
    const index = list.findIndex(i => i.id === id);
    if (index === -1) {
        list.push(itemData);
        showToast(`Added to ${name}`);
    } else {
        list.splice(index, 1);
        showToast(`Removed from ${name}`);
    }
    
    localStorage.setItem(key, JSON.stringify(list));
    
    // Update Modal Buttons if modal is open
    updateModalButtons(id);
}

function updateModalButtons(id) {
    const favBtn = document.getElementById('modal-fav-btn');
    const wlBtn = document.getElementById('modal-wl-btn');
    
    if(favBtn && wlBtn) {
        if(favoritesList.some(i => i.id === id)) {
            favBtn.classList.add('active');
        } else {
            favBtn.classList.remove('active');
        }
        
        if(watchLaterList.some(i => i.id === id)) {
            wlBtn.classList.add('active');
        } else {
            wlBtn.classList.remove('active');
        }
    }
}

// Horizontal Scrolling for Containers
window.scrollContainer = function(containerId, amount) {
    const container = document.getElementById(containerId);
    if (container) {
        container.scrollBy({ left: amount, behavior: 'smooth' });
    }
}

// Hero Carousel Logic
let currentHeroIndex = 0;
const heroPrev = document.getElementById('hero-prev');
const heroNext = document.getElementById('hero-next');

if(heroPrev && heroNext) {
    heroPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if(allTrending.length > 0) {
            currentHeroIndex = (currentHeroIndex - 1 + Math.min(5, allTrending.length)) % Math.min(5, allTrending.length);
            renderHero(allTrending[currentHeroIndex]);
        }
    });

    heroNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if(allTrending.length > 0) {
            currentHeroIndex = (currentHeroIndex + 1) % Math.min(5, allTrending.length);
            renderHero(allTrending[currentHeroIndex]);
        }
    });
}

// TRAILER MODAL

const modal          = document.getElementById('trailer-modal');
const videoContainer = document.getElementById('video-container');
const modalTitle     = document.getElementById('modal-title');
const modalDesc      = document.getElementById('modal-desc');
const modalRating    = document.getElementById('modal-rating');
const modalTypeTag   = document.getElementById('modal-type-tag');

// Title → YouTube trailer key lookup (100+ entries)
const TRAILER_MAP = {
    // Hollywood Action / Sci-Fi
    'dune: part two':               'giXco2jaZ_4',
    'dune part two':                'giXco2jaZ_4',
    'dune':                         'n9uETkla5BA',
    'oppenheimer':                  'uYPbbksJxIg',
    'john wick: chapter 4':         'qEVUtrk8_B4',
    'john wick':                    'u4MDVR9V_nQ',
    'avatar: the way of water':     'a8Gx8wiNbs8',
    'avatar':                       '5PSNL1qE6VY',
    'top gun: maverick':            'qSqVVswa420',
    'top gun maverick':             'qSqVVswa420',
    'the batman':                   'mqqft2x_Aa4',
    'spider-man: no way home':      'JfVOs4VSpmA',
    'spider-man no way home':       'JfVOs4VSpmA',
    'guardians of the galaxy vol. 3': '8g18jFHCLXk',
    'guardians of the galaxy':      'DP_UESiZNV4',
    'black panther: wakanda forever': 'RlOB3UALvrQ',
    'black panther':                'xjDjIUPy6ds',
    'thor: love and thunder':       'Go8nTmfrQd8',
    'doctor strange in the multiverse of madness': 'aWzlQ2N6qqg',
    'the avengers':                 'eOrNdBpGMv8',
    'avengers: endgame':            'TcMBFSGVi1c',
    'avengers: infinity war':       '6ZfuNTqbHE8',
    'mission: impossible – dead reckoning': 'avz9KKQ1dGo',
    'interstellar':                 '2LqzF5WauAw',
    'inception':                    'YoHD9XEInc0',
    'the dark knight':              'EXeTwQWrcwY',
    'barbie':                       'pBk4NYhWNMM',
    'killers of the flower moon':   'EP34Yoxs3FQ',
    'poor things':                  'RlOB3UALvrQ',
    'past lives':                   'UN-jqlC-fmM',
    'the holdovers':                'AoSE-EBVoSo',
    'wonka':                        'otNh9bTjXWg',
    'migration':                    'Oq5kECF9mII',
    'aquaman and the lost kingdom': 'uxPqWgpJbG4',
    'indiana jones and the dial of destiny': 'eQfMbSe7F2g',
    'ant-man and the wasp: quantumania': 'ZlMgPBlDTaA',
    'shazam! fury of the gods':     'oeVHDAssZCM',
    'black adam':                   'X0tOpBuYasI',
    'the flash':                    'hebWYacbdvc',
    'blue beetle':                  '6Z6yMmSZSBE',
    'transformers: rise of the beasts': 'iY0DVF-FTTE',
    'elemental':                    'F5HMY0JcTJg',
    'the little mermaid':           'ydGHKNEdXBg',
    'peter pan & wendy':            'wpL56IfaAqo',
    'haunted mansion':              'kC-rBVVDl0c',
    'the marvels':                  'wS_qbMENKSo',
    'wish':                         'lR7O3Oi98l4',
    'napoleon':                     'OAZWXUkrjPc',
    'maestro':                      'O5kRcQFM9cg',
    'priscilla':                    'pDQImG1iabs',
    'ferrari':                      'EiDWBTNQqmg',
    'saltburn':                     'SAlVaCpDJCo',
    'all of us strangers':          'TvlB2OeJHKo',
    'society of the snow':          'jMGSMEMfGS8',
    'the zone of interest':         'eNOyNFJneak',
    'american fiction':             'fEnM-QBtMrE',
    'the beekeeper':                'G-PD8SYiGZM',
    'anyone but you':               'Vk7r2TS9Qp4',
    'aquaman':                      'WDkg3h8PCVU',
    'venom':                        'u9Mv98Gr5pY',
    'morbius':                      'lSp8eBBFD6c',
    // Hollywood Drama
    'oppenheimer ': 'uYPbbksJxIg',
    'tár':                          'LlsGEquu5No',
    'all quiet on the western front': 'hxhUcnXn8P0',
    'the whale':                    '_AOPh2WjZGs',
    'women talking':                'miFYBZhTyxA',
    'the banshees of inisherin':    'uRu3zLOJN2c',
    'belfast':                      'ySZxftQ3Pec',
    'coda':                         'O1kkBdnrC8U',
    'encanto':                      'LXqoh3WiMuM',
    'tick, tick... boom!':          'LtEuaYA7sVA',
    'being the ricardos':           'WVcm8V3VQdc',
    'nightmare alley':              'cDo5iMqxGz8',
    'drive my car':                 'OGKGD9Ocm1I',
    // Bollywood
    'rrr':                          'f_vbAtFSEc0',
    'pathaan':                      'vqu4z3ZrxNc',
    'jawan':                        'G1GRvTCbKIs',
    'animal':                       'bLZWuMZMuEQ',
    'dunki':                        'T8R3xFQrHRs',
    '12th fail':                    '5a2vBcKJaZ4',
    'tiger 3':                      'u2V4_MSKbCg',
    'yodha':                        'Fj5Ke8MWbP4',
    'sam bahadur':                  '5rGC3-pQXZg',
    'brahmastra':                   'L1lLZFruSRE',
    'pushpa: the rise':             'Q1NKMPhP8PY',
    // K-Drama / Korean
    'parasites':                    '5xH0HfJHsaY',
    'squid game':                   'oqxAJRvoeDs',
    'the glory':                    'iEMgSh7oEPM',
    'all of us are dead':           'IN5TD4VFMIs',
    'hellbound':                    'WJJb3CDVoFs',
    'my mister':                    'qHXPGHmBRZk',
    'crash landing on you':         'TPX7CbzWWBA',
    'itaewon class':                '5aKkT5fBiVc',
    'vincenzo':                     'KiC5YhZxQhU',
    'kingdom':                      'BOsFIVOMCkY',
    // C-Drama / Wuxia
    'the untamed':                  'rGbkPFxBXyU',
    'nirvana in fire':              'JFpNH8EIpAQ',
    'word of honor':                'BPZkMi_PVQE',
    'the story of ming lan':        'dROH2NTcFh0',
    'eternal love':                 'PZ7IfJ0TUWM',
    'ancient love poetry':          'TQ7rjsBe8U4',
    // Sci-Fi & Fantasy Series
    'arcane':                       'fXmAurh012s',
    'house of the dragon':          'DotnJ7tTA34',
    'the rings of power':           'PIBxoA4fxpA',
    'the last of us':               'nnN9mOBfCLk',
    'wednesday':                    'Di310WS8zLk',
    'stranger things':              'mnd7kkKBTRM',
    'the witcher':                  'ndl5hC9KUOY',
    'game of thrones':              'KPLWWIOCOOQ',
    'shadow and bone':              'VBmMU7iS1lc',
    'the wheel of time':            'YaOq0VkMFzk',
    'foundation':                   'GDqkRZ1v_wE',
    'severance':                    'xEQP4VVuyrY',
    'the mandalorian':              'aOC8E8z_ifw',
    'andor':                        'KqA49-IHkAQ',
    'obi-wan kenobi':               'TFodEVSO4hQ',
    'for all mankind':              'i2BfI23Aq4o',
    'dark':                         'ePXnfpLgkNs',
    'see':                          'gphHDHJSCHo',
    'mythic quest':                 'gphHDHJSCHo',
    // Action Series
    'shogun':                       'vj1dGxHG2yc',
    'reacher':                      'gsYHRppxMlI',
    'jack ryan':                    'xnxvn5TIZiA',
    'money heist':                  'to0aMHMRLJY',
    'peaky blinders':               'oVzVdvGIC7U',
    'ozark':                        'bXTXL5eBdDY',
    'breaking bad':                 'HhesaQXLuRY',
    'better call saul':             'HhesaQXLuRY',
    // Western
    'yellowstone':                  'lWe4TRDZ6x0',
    '1883':                         'Wf25KBXzSgc',
    '1923':                         '8uE_yk1YTMA',
    'the good the bad and the ugly': 'TQL_lhAL-4U',
    'tombstone':                    'tBFSDBj67E4',
    // Default fallback
    '__fallback__':                 'fXmAurh012s'  // Arcane trailer
};

// Find the best matching YouTube key for a given title
function resolveTrailerKey(title) {
    if (!title) return TRAILER_MAP['__fallback__'];
    const normalized = title.toLowerCase().trim();
    // Exact match
    if (TRAILER_MAP[normalized]) return TRAILER_MAP[normalized];
    // Partial match (title starts with known key)
    for (const key of Object.keys(TRAILER_MAP)) {
        if (key !== '__fallback__' && (normalized.includes(key) || key.includes(normalized))) {
            return TRAILER_MAP[key];
        }
    }
    // Hash fallback from pool
    const pool = Object.values(TRAILER_MAP).filter(k => k !== TRAILER_MAP['__fallback__']);
    const hash = normalized.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return pool[hash % pool.length];
}

// Styled error state with actionable buttons
function showVideoError(title, isNetworkError) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent((title || '') + ' official trailer')}`;
    const icon  = isNetworkError ? 'bx-wifi-off'  : 'bx-video-off';
    const label = isNetworkError ? 'Connection Error' : 'Trailer Unavailable';
    const msg   = isNetworkError
        ? 'Could not reach the video server. Check your connection and try again.'
        : 'No trailer was found for this title.';

    videoContainer.innerHTML = `
        <div class="video-error-state">
            <i class='bx ${icon}'></i>
            <h4>${label}</h4>
            <p>${msg}</p>
            <div class="video-error-actions">
                ${isNetworkError ? `<button class="btn-secondary glass-panel-light" onclick="retryTrailer()"><i class='bx bx-refresh'></i> Retry</button>` : ''}
                <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                    <i class='bx bxl-youtube'></i> Search on YouTube
                </a>
            </div>
        </div>
    `;
}

// Embed a YouTube key directly in the video container
function embedYouTube(key) {
    videoContainer.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&showinfo=0"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
        </iframe>`;
}

// Store last call so Retry can re-invoke exactly
let _lastTrailerCall = null;
window.retryTrailer = function() {
    if (_lastTrailerCall) openTrailer(..._lastTrailerCall);
};

window.openTrailer = async function(id, type = 'movie', itemDataStr = null) {
    _lastTrailerCall = [id, type, itemDataStr];

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.classList.add('active'), 10);

    videoContainer.innerHTML = `<div class="spinner"></div>`;

    let itemTitle = '';
    if (itemDataStr) {
        try {
            const d = JSON.parse(decodeURIComponent(itemDataStr));
            itemTitle = d.title || d.name || '';
            modalTitle.textContent    = itemTitle || 'Loading…';
            modalDesc.textContent     = d.overview || 'No description available.';
            modalRating.textContent   = d.vote_average ? d.vote_average.toFixed(1) : 'NR';
            modalTypeTag.textContent  = (d.media_type || type).toUpperCase();
            document.getElementById('modal-fav-btn').onclick = () => toggleSavedItem(id, 'favorites', itemDataStr);
            document.getElementById('modal-wl-btn').onclick  = () => toggleSavedItem(id, 'watchlater', itemDataStr);
            updateModalButtons(id);
        } catch(e) { console.error(e); }
    }

    // ── CAST FETCHING ──
    const castContainer = document.getElementById('modal-cast');
    if (castContainer) castContainer.innerHTML = '<div class="spinner"></div>';

    const renderCast = (cast) => {
        if (!castContainer) return;
        const mainCast = cast.slice(0, 8); // Show up to 8 actors
        if (mainCast.length === 0) {
            castContainer.innerHTML = '<p class="text-dim">Cast information unavailable.</p>';
            return;
        }
        castContainer.innerHTML = mainCast.map(actor => `
            <div class="cast-item">
                <img src="${actor.profile_path ? IMAGE_BASE_URL + actor.profile_path : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(actor.name)}" alt="${actor.name}">
                <div class="cast-info">
                    <p class="actor-name">${actor.name}</p>
                    <p class="actor-role">${actor.character || 'Actor'}</p>
                </div>
            </div>
        `).join('');
    };

    // ── DEMO MODE: resolve the trailer from our lookup map ──
    if (isDemoMode) {
        const key = resolveTrailerKey(itemTitle);
        setTimeout(() => embedYouTube(key), 300);
        
        // Mock cast for demo mode
        const mockCast = [
            { name: "Cillian Murphy", character: "J. Robert Oppenheimer" },
            { name: "Robert Downey Jr.", character: "Lewis Strauss" },
            { name: "Matt Damon", character: "Leslie Groves" },
            { name: "Emily Blunt", character: "Kitty Oppenheimer" },
            { name: "Florence Pugh", character: "Jean Tatlock" },
            { name: "Josh Hartnett", character: "Ernest Lawrence" },
            { name: "Casey Affleck", character: "Boris Pash" },
            { name: "Rami Malek", character: "David Hill" }
        ];
        renderCast(mockCast);
        return;
    }

    // Live mode cast fetch
    try {
        const creditRes = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`);
        const creditData = await creditRes.json();
        renderCast(creditData.cast || []);
    } catch (e) {
        console.error("Cast fetch failed:", e);
        if (castContainer) castContainer.innerHTML = '<p class="text-dim">Could not load cast.</p>';
    }

    // ── LIVE TMDB MODE: fetch real video keys ──
    const fetchVideos = async (lang) => {
        const url = `${BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}${lang ? '&language=' + lang : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()).results || [];
    };

    try {
        let videos = await fetchVideos('en-US');
        if (!videos.length) videos = await fetchVideos('');

        const clip =
            videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
            videos.find(v => v.type === 'Teaser'  && v.site === 'YouTube') ||
            videos.find(v => v.site === 'YouTube');

        if (clip) {
            embedYouTube(clip.key);
        } else {
            // Fall back to our lookup map before showing error
            const fallbackKey = resolveTrailerKey(itemTitle);
            if (fallbackKey) {
                embedYouTube(fallbackKey);
            } else {
                showVideoError(itemTitle, false);
            }
        }
    } catch (err) {
        console.error('Trailer fetch error:', err);
        // Still try the lookup map on network error
        const fallbackKey = resolveTrailerKey(itemTitle);
        if (fallbackKey) {
            embedYouTube(fallbackKey);
        } else {
            showVideoError(itemTitle, true);
        }
    }
}

window.closeTrailer = function() {
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        videoContainer.innerHTML = ''; // Stop video playback
        document.body.classList.remove('modal-open');
    }, 300);
}

// Search Logic
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout;

async function executeFullSearch(query) {
    if (isDemoMode) {
        showToast("Full search requires API key");
        return;
    }
    
    searchResults.classList.add('hidden');
    homeView.classList.add('hidden');
    categoryView.classList.remove('hidden');
    categoryTitle.textContent = `Search Results for "${query}"`;
    document.getElementById('filter-bar').classList.add('hidden');
    categoryGrid.innerHTML = '';
    document.getElementById('category-loading').classList.remove('hidden');
    emptyState.classList.add('hidden');

    try {
        const response1 = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);
        const response2 = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=2`);
        
        const data1 = await response1.json();
        const data2 = await response2.json();
        
        const combined = [...(data1.results || []), ...(data2.results || [])]
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv');

        document.getElementById('category-loading').classList.add('hidden');

        if (combined.length > 0) {
            combined.forEach(item => categoryGrid.appendChild(createMovieCard(item, item.media_type)));
        } else {
            emptyState.classList.remove('hidden');
        }
    } catch (e) {
        document.getElementById('category-loading').classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query.length > 0) {
            executeFullSearch(query);
            e.target.blur();
        }
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(async () => {
        if (isDemoMode) {
            searchResults.innerHTML = `<div class="search-msg">Search requires TMDB API Key</div>`;
            searchResults.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);
            const data = await response.json();
            
            const results = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv').slice(0, 6);
            
            if (results.length > 0) {
                searchResults.innerHTML = results.map(item => {
                    const title = item.title || item.name;
                    const date = item.release_date || item.first_air_date || '';
                    const year = date ? date.split('-')[0] : '';
                    const img = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/100x150/111111/FFFFFF?text=No+Img';
                    const itemDataStr = encodeURIComponent(JSON.stringify(item));
                    
                    return `
                        <div class="search-item" onclick="openTrailer(${item.id}, '${item.media_type}', '${itemDataStr}')">
                            <img src="${img}" alt="${title}" class="search-item-img">
                            <div class="search-item-info">
                                <h4>${title}</h4>
                                <p class="search-item-meta">
                                    <span class="search-tag">${item.media_type}</span>
                                    <span>${year}</span>
                                </p>
                            </div>
                        </div>
                    `;
                }).join('');
                searchResults.classList.remove('hidden');
            } else {
                searchResults.innerHTML = `<div class="search-msg">No results found for "${query}"</div>`;
                searchResults.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Search error", error);
        }
    }, 500);
});

// Hamburger Menu Logic
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const mainSidebar = document.getElementById('main-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (menuToggleBtn && mainSidebar && sidebarOverlay) {
    menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mainSidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
        setTimeout(() => sidebarOverlay.classList.add('active'), 10);
    });

    sidebarOverlay.addEventListener('click', () => {
        mainSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        setTimeout(() => sidebarOverlay.classList.add('hidden'), 400);
    });
}

// Dropdowns Logic
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

const notificationBtn = document.getElementById('notification-btn');
const notificationDropdown = document.getElementById('notification-dropdown');

function toggleDropdown(btn, dropdown) {
    if(dropdown.classList.contains('hidden')) {
        // close others first
        profileDropdown.classList.add('hidden');
        notificationDropdown.classList.add('hidden');
        
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown(profileBtn, profileDropdown);
});

notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown(notificationBtn, notificationDropdown);
});

// Close all dropdowns and search on outside click
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
    }
    
    if(!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.add('hidden');
    }
    
    if(!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.add('hidden');
    }
});

// Ripple Effect Interaction
document.addEventListener('mousedown', function(e) {
    const target = e.target.closest('button, .nav-item, .action-btn, .tab-btn, .dropdown-item');
    if (target) {
        const circle = document.createElement('span');
        const diameter = Math.max(target.clientWidth, target.clientHeight);
        const radius = diameter / 2;

        const rect = target.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const existingRipple = target.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        if(window.getComputedStyle(target).position === 'static') {
            target.style.position = 'relative';
            target.style.overflow = 'hidden';
        }

        target.appendChild(circle);
        setTimeout(() => { circle.remove(); }, 600);
    }
});

// Category Tabs and Filters Logic
let currentDiscoverType = 'movie'; // 'movie' or 'tv'

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        if (filter === 'all') {
            document.getElementById('category-view').classList.add('hidden');
            document.getElementById('home-view').classList.remove('hidden');
            // Remove active from sidebar
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelector('[data-section="home"]').classList.add('active');
        } else {
            currentDiscoverType = filter;
            fetchAndRenderFilteredContent();
        }
    });
});

document.getElementById('apply-filters-btn').addEventListener('click', () => {
    fetchAndRenderFilteredContent();
});

async function fetchAndRenderFilteredContent() {
    document.getElementById('home-view').classList.add('hidden');
    const catView = document.getElementById('category-view');
    catView.classList.remove('hidden');
    
    const isMovie = currentDiscoverType === 'movie';
    document.getElementById('category-title').textContent = isMovie ? 'Discover Movies' : 'Discover Series';
    
    // Show filter bar
    document.getElementById('filter-bar').classList.remove('hidden');
    
    const sortVal = document.getElementById('sort-select').value;
    const yearVal = document.getElementById('year-select').value;
    const ratingVal = document.getElementById('rating-select').value;
    const originVal = document.getElementById('origin-select').value;
    const studioVal = document.getElementById('studio-select').value;
    
    const grid = document.getElementById('category-grid');
    const loader = document.getElementById('category-loading');
    const empty = document.getElementById('empty-state');
    
    grid.innerHTML = '';
    loader.classList.remove('hidden');
    empty.classList.add('hidden');

    if (isDemoMode) {
        // Simulate network delay
        setTimeout(() => {
            loader.classList.add('hidden');
            
            // Generate mock data that visually respects the user's filters
            let mockMovies = Array(20).fill(null).map((_, i) => {
                const rating = ratingVal ? parseFloat(ratingVal) + (Math.random() * (10 - parseFloat(ratingVal))) : (6 + Math.random() * 4);
                const year = yearVal ? yearVal : (2000 + Math.floor(Math.random() * 24));
                const sortLabel = sortVal.includes('popularity') ? 'Pop' : sortVal.includes('vote') ? 'Rated' : 'Recent';
                
                let originLabel = "Filtered";
                if(originVal === 'WESTERN') originLabel = "Western";
                else if (originVal === 'IN') originLabel = "Bollywood";
                else if (originVal === 'KR') originLabel = "K-Drama";
                else if (originVal === 'CN') originLabel = "C-Drama";
                else if (originVal === 'ZA') originLabel = "South African";
                else if (originVal === 'US') originLabel = "Hollywood";
                
                let studioLabel = "";
                if (studioVal === '49') studioLabel = " [HBO Max]";
                else if (studioVal === '2552') studioLabel = " [Apple TV+]";
                else if (studioVal === '213') studioLabel = " [Netflix]";
                else if (studioVal === '420') studioLabel = " [Marvel]";

                return {
                    id: Math.floor(Math.random() * 1000000),
                    title: `${originLabel} ${isMovie ? 'Movie' : 'Show'} ${i+1} (${sortLabel})${studioLabel}`,
                    overview: "This is a mock item generated to demonstrate the complex filter functionality including Origin and Studio. Add a TMDB API Key in script.js to fetch real Hollywood data.",
                    vote_average: rating,
                    release_date: `${year}-05-15`,
                    first_air_date: `${year}-05-15`,
                    media_type: currentDiscoverType
                };
            });

            // Mock sorting visually
            if (sortVal.includes('asc')) {
                mockMovies.reverse();
            }

            if (mockMovies.length > 0) {
                mockMovies.forEach(item => grid.appendChild(createMovieCard(item, currentDiscoverType)));
                showToast("Applied Mock Filters");
            } else {
                empty.classList.remove('hidden');
            }
        }, 600);
        return;
    }
    
    let url = `${BASE_URL}/discover/${currentDiscoverType}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=${sortVal}&page=1`;
    
    if(yearVal) {
        url += isMovie ? `&primary_release_year=${yearVal}` : `&first_air_date_year=${yearVal}`;
    }
    if(ratingVal) {
        url += `&vote_average.gte=${ratingVal}&vote_count.gte=100`; // require some votes so it's not a random 10/10
    }
    if(originVal) {
        if(originVal === 'WESTERN') {
            url += `&with_genres=37`; // TMDB Genre ID for Western
        } else {
            url += `&with_origin_country=${originVal}`;
        }
    }
    if(studioVal) {
        if (isMovie) {
            url += `&with_companies=${studioVal}`;
        } else {
            url += `&with_networks=${studioVal}`;
        }
    }
    
    try {
        // Fetch 2 pages for "very many slots"
        const [res1, res2] = await Promise.all([
            fetch(url),
            fetch(url.replace('&page=1', '&page=2'))
        ]);
        
        const data1 = await res1.json();
        const data2 = await res2.json();
        
        const combined = [...(data1.results || []), ...(data2.results || [])];
        
        loader.classList.add('hidden');
        if (combined.length > 0) {
            combined.forEach(item => grid.appendChild(createMovieCard(item, currentDiscoverType)));
        } else {
            empty.classList.remove('hidden');
        }
    } catch (e) {
        loader.classList.add('hidden');
        empty.classList.remove('hidden');
        console.error(e);
    }
}

// Populate Year Select Filter
function initYearSelect() {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y >= 1990; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }
    }
}

// ACCOUNT SYSTEM — Multi-Account Store


const AUTH_KEY      = 'lyra_auth';         // currently logged-in user
const ACCOUNTS_KEY  = 'lyra_accounts';     // all registered accounts

const DEFAULT_USER = {
    name:    'Guest',
    email:   '',
    plan:    'Free',
    avatarId: 68,
    lang:    'en',
    quality: 'auto',
    loggedIn: false
};

// Helpers
function getUser()    { 
    const uStr = localStorage.getItem(AUTH_KEY);
    if (!uStr) {
        return { ...DEFAULT_USER };
    }
    return JSON.parse(uStr); 
}
function saveUser(u)  { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function getAccounts(){ return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; }
function saveAccounts(a){ localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }

// Sync sidebar UI to current auth state
function refreshProfileUI() {
    const u = getUser();
    const usernameEl  = document.getElementById('sidebar-username');
    const planEl      = document.getElementById('sidebar-plan');
    const avatarEl    = document.getElementById('sidebar-avatar');
    const crownIcon   = document.getElementById('crown-icon');
    
    // Panels
    const profileBtn  = document.getElementById('profile-btn');
    const guestView   = document.getElementById('guest-view');

    // Buttons in dropdown
    const logoutBtn   = document.getElementById('btn-logout');
    const settingsBtn = document.getElementById('btn-open-settings');
    const subBtn      = document.getElementById('btn-open-subscription');
    const devicesBtn  = document.getElementById('btn-open-devices');

    if (usernameEl)  usernameEl.textContent  = u.loggedIn ? u.name : 'Guest';
    if (planEl)      planEl.textContent      = u.loggedIn ? u.plan + ' Plan' : '';
    if (avatarEl)    avatarEl.src            = `https://i.pravatar.cc/150?img=${u.avatarId || 68}`;
    if (crownIcon)   crownIcon.style.display = u.loggedIn && u.plan !== 'Free' ? 'block' : 'none';

    if (profileBtn)  profileBtn.classList.toggle('hidden', !u.loggedIn);
    if (guestView)   guestView.classList.toggle('hidden', u.loggedIn);

    if (logoutBtn)   logoutBtn.classList.toggle('hidden', !u.loggedIn);
    if (settingsBtn) settingsBtn.classList.toggle('hidden', !u.loggedIn);
    if (subBtn)      subBtn.classList.toggle('hidden', !u.loggedIn);
    if (devicesBtn)  devicesBtn.classList.toggle('hidden', !u.loggedIn);
}

// ── LOGIN MODAL ──
function openLoginModal() {
    const m = document.getElementById('login-modal');
    if (m) {
        m.classList.remove('hidden');
        document.body.classList.add('modal-open');
        document.getElementById('profile-dropdown')?.classList.add('hidden');
        setTimeout(() => m.classList.add('active'), 10);
    }
}
window.openLoginModal = openLoginModal;

function closeLoginModal() {
    const m = document.getElementById('login-modal');
    if (m) {
        m.classList.remove('active');
        setTimeout(() => {
            m.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }
}
window.closeLoginModal = closeLoginModal;

window.switchAuthTab = function(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-signup')?.classList.toggle('active', !isLogin);
    document.getElementById('form-login')?.classList.toggle('hidden', !isLogin);
    document.getElementById('form-signup')?.classList.toggle('hidden', isLogin);
    // Clear errors
    document.getElementById('login-error')?.classList.add('hidden');
    document.getElementById('signup-error')?.classList.add('hidden');
};

// ── AUTH HANDLERS (LOCALSTORAGE) ──

window.handleLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const errorEl = document.getElementById('login-error');
    
    const accounts = getAccounts();
    const user = accounts[email];
    
    if (user) {
        user.loggedIn = true;
        saveUser(user);
        refreshProfileUI();
        closeLoginModal();
        showToast(`Welcome back, ${user.name}!`);
    } else {
        errorEl.textContent = "Account not found. Please sign up.";
        errorEl.classList.remove('hidden');
    }
};

window.handleSignup = function(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const errorEl = document.getElementById('signup-error');
    
    const accounts = getAccounts();
    if (accounts[email]) {
        errorEl.textContent = "Email already registered.";
        errorEl.classList.remove('hidden');
        return;
    }
    
    const newUser = {
        name,
        email,
        plan: 'Free',
        avatarId: Math.floor(Math.random() * 70),
        lang: 'en',
        quality: 'auto',
        loggedIn: true
    };
    
    accounts[email] = newUser;
    saveAccounts(accounts);
    saveUser(newUser);
    
    refreshProfileUI();
    closeLoginModal();
    showToast(`Account created! Welcome, ${name}.`);
};

window.handleLogout = function() {
    const guest = { ...DEFAULT_USER };
    saveUser(guest);
    refreshProfileUI();
    document.getElementById('profile-dropdown')?.classList.add('hidden');
    showToast("Signed out successfully. See you soon! 👋");
};

window.handleSocialLogin = function(provider) {
    showToast(`Connecting to ${provider}...`);
    setTimeout(() => {
        const socialUser = {
            name: `${provider} User`,
            email: `social@${provider.toLowerCase()}.com`,
            plan: 'Free',
            avatarId: 10,
            lang: 'en',
            quality: 'auto',
            loggedIn: true
        };
        saveUser(socialUser);
        refreshProfileUI();
        closeLoginModal();
        showToast(`Logged in via ${provider}!`);
    }, 1500);
};

window.togglePwd = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') { input.type = 'text';     icon.className = 'bx bx-show'; }
    else                           { input.type = 'password'; icon.className = 'bx bx-hide'; }
};

// LOGIN
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pwd   = document.getElementById('login-password').value;
    const err   = document.getElementById('login-error');

    if (!email) { err.textContent = 'Please enter your email.'; err.classList.remove('hidden'); return; }
    if (pwd.length < 4) { err.textContent = 'Password must be at least 4 characters.'; err.classList.remove('hidden'); return; }

   //   Don Victor is the primary user according to the project
    const u = {
        name: 'Don Victor',
        email: email,
        plan: 'Premium',
        avatarId: 68,
        lang: 'en',
        quality: '4k',
        loggedIn: true
    };
    
    saveUser(u);
    err.classList.add('hidden');
    closeLoginModal();
    refreshProfileUI();
    showToast(`Welcome back, Don Victor! 👋`);
}
window.handleLogin = handleLogin;

// SIGN UP — register a new account 
function handleSignup(e) {
    e.preventDefault();
    const name  = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const pwd   = document.getElementById('signup-password').value;
    const err   = document.getElementById('signup-error');

    if (!name)  { err.textContent = 'Please enter your name.'; err.classList.remove('hidden'); return; }
    if (!email) { err.textContent = 'Please enter your email.'; err.classList.remove('hidden'); return; }
    if (pwd.length < 4) { err.textContent = 'Password must be at least 4 characters.'; err.classList.remove('hidden'); return; }

   
    const u = {
        name: 'Don Victor',
        email: email,
        plan: 'Premium',
        avatarId: 68,
        lang: 'en',
        quality: '4k',
        loggedIn: true
    };
    
    saveUser(u);
    err.classList.add('hidden');
    closeLoginModal();
    refreshProfileUI();
    showToast(`Welcome to StreamHub, Don Victor! 🎉`);
}
window.handleSignup = handleSignup;

// Wire dropdown buttons
document.getElementById('btn-open-login')?.addEventListener('click', () => {
    openLoginModal();
    switchAuthTab('login');
    // Clear form
    document.getElementById('login-email').value    = '';
    document.getElementById('login-password').value = '';
});



// SOCIAL LOGINS
window.handleSocialLogin = function(provider) {
    showToast(`Connecting to ${provider}... 🔄`);
    
    // Simulate a brief delay for "OAuth" redirect/popup
    setTimeout(() => {
        const accounts = getAccounts();
        const providerEmail = `${provider.toLowerCase()}@example.com`;
        
        // If account doesn't exist, create a mock one for the provider
        if (!accounts[providerEmail]) {
            accounts[providerEmail] = {
                ...DEFAULT_USER,
                name: `${provider} User`,
                email: providerEmail,
                avatarId: provider === 'Google' ? 1 : provider === 'Facebook' ? 2 : 3,
                loggedIn: true
            };
            saveAccounts(accounts);
        }

        const u = { ...accounts[providerEmail], loggedIn: true };
        delete u.password;
        saveUser(u);
        
        closeLoginModal();
        refreshProfileUI();
        showToast(`Successfully signed in with ${provider}! 🚀`);
    }, 1500);
};

// FORGOT PASSWORD
window.handleForgotPassword = function() {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        showToast("Please enter your email address first. 📧");
    } else {
        showToast(`Reset link sent to ${email} (Demo) ✉️`);
    }
};

// ACCOUNT SETTINGS MODAL 
let currentAvatarId = 68;

window.closeSettingsModal = function() {
    const m = document.getElementById('settings-modal');
    if (m) {
        m.classList.remove('active');
        setTimeout(() => {
            m.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }
};

window.switchSettingsTab = function(tabId) {
    // Update nav buttons
    document.querySelectorAll('.settings-nav .nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabId));
    });
    // Update tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('hidden', tab.id !== `tab-${tabId}`);
    });
};

function openSettingsModal() {
    const u = getUser();
    if (!u.loggedIn) { showToast('Please log in first'); return; }
    
    // Reset to profile tab
    switchSettingsTab('profile');
    
    currentAvatarId = u.avatarId || 68;
    document.getElementById('settings-name').value  = u.name  || '';
    document.getElementById('settings-email').value = u.email || '';
    document.getElementById('settings-lang').value  = u.lang  || 'en';
    document.getElementById('settings-quality').value = u.quality || 'auto';
    document.getElementById('settings-avatar-preview').src = `https://i.pravatar.cc/150?img=${currentAvatarId}`;
    document.getElementById('avatar-index-label').textContent = `Avatar ${currentAvatarId}`;
    document.getElementById('settings-pwd').value = '';
    document.getElementById('settings-pwd-confirm').value = '';
    document.getElementById('settings-error').classList.add('hidden');
    const m = document.getElementById('settings-modal');
    if (m) {
        m.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => m.classList.add('active'), 10);
    }
}

window.cycleAvatar = function(dir) {
    currentAvatarId = Math.max(1, Math.min(70, currentAvatarId + dir));
    document.getElementById('settings-avatar-preview').src = `https://i.pravatar.cc/150?img=${currentAvatarId}`;
    document.getElementById('avatar-index-label').textContent = `Avatar ${currentAvatarId}`;
};

window.handleSaveSettings = function(e) {
    e.preventDefault();
    const err     = document.getElementById('settings-error');
    const newPwd  = document.getElementById('settings-pwd').value;
    const confPwd = document.getElementById('settings-pwd-confirm').value;

    if (newPwd && newPwd !== confPwd) {
        err.textContent = 'Passwords do not match.';
        err.classList.remove('hidden'); return;
    }
    if (newPwd && newPwd.length < 6) {
        err.textContent = 'Password must be at least 6 characters.';
        err.classList.remove('hidden'); return;
    }

    const u = getUser();
    u.name      = document.getElementById('settings-name').value.trim()  || u.name;
    u.email     = document.getElementById('settings-email').value.trim() || u.email;
    u.lang      = document.getElementById('settings-lang').value;
    u.quality   = document.getElementById('settings-quality').value;
    u.avatarId  = currentAvatarId;
    saveUser(u);
    err.classList.add('hidden');
    closeSettingsModal();
    refreshProfileUI();
    showToast('Settings saved! ✅');
};

document.getElementById('btn-open-settings')?.addEventListener('click', () => {
    document.getElementById('profile-dropdown').classList.add('hidden');
    openSettingsModal();
});

// ── SUBSCRIPTION MODAL ──
window.closeSubscriptionModal = function() {
    const m = document.getElementById('subscription-modal');
    if (m) {
        m.classList.remove('active');
        setTimeout(() => {
            m.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }
};

function openSubscriptionModal() {
    const u = getUser();
    if (!u.loggedIn) { showToast('Please log in to manage your plan'); return; }
    const label = document.getElementById('current-plan-label');
    if (label) label.innerHTML = `Currently on <strong>${u.plan} Plan</strong>`;
    // Highlight current plan card
    ['Free','Premium','Ultimate'].forEach(p => {
        const card = document.getElementById(`sub-card-${p.toLowerCase()}`);
        if (card) card.classList.toggle('sub-card-active', u.plan === p);
    });
    const m = document.getElementById('subscription-modal');
    if (m) {
        m.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => m.classList.add('active'), 10);
    }
}

window.selectPlan = function(plan) {
    const u = getUser();
    if (!u.loggedIn) { showToast('Please log in first'); return; }
    u.plan = plan;
    saveUser(u);
    const label = document.getElementById('current-plan-label');
    if (label) label.innerHTML = `Currently on <strong>${plan} Plan</strong>`;
    ['Free','Premium','Ultimate'].forEach(p => {
        const card = document.getElementById(`sub-card-${p.toLowerCase()}`);
        if (card) card.classList.toggle('sub-card-active', p === plan);
    });
    refreshProfileUI();
    showToast(`Switched to ${plan} Plan! 🎉`);
};

document.getElementById('btn-open-subscription')?.addEventListener('click', () => {
    document.getElementById('profile-dropdown').classList.add('hidden');
    openSubscriptionModal();
});

document.getElementById('btn-open-devices')?.addEventListener('click', () => {
    document.getElementById('profile-dropdown').classList.add('hidden');
    openSettingsModal();
    switchSettingsTab('devices');
});

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
    initYearSelect();
    loadHomeContent();
    refreshProfileUI();
});

window.openRedeemModal = function() {
    document.getElementById('profile-dropdown')?.classList.add('hidden');
    const code = prompt("Enter your 12-digit gift code:");
    if (code) {
        if (code.length >= 8) {
            showToast("Processing code...");
            setTimeout(() => {
                showToast("Success! $10.00 added to your wallet. 🎁");
            }, 1500);
        } else {
            showToast("Invalid code format.");
        }
    }
};

window.handleDeviceLogout = function(deviceName, btn) {
    if(confirm(`Sign out from ${deviceName}?`)) {
        btn.closest('.device-item').style.opacity = '0.5';
        btn.closest('.device-item').style.pointerEvents = 'none';
        btn.remove();
        showToast(`Logged out from ${deviceName}`);
    }
};

