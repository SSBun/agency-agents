// Agent search and filter functionality

document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // Language Toggle
  // ============================================
  const langButtons = document.querySelectorAll('.lang-btn');
  let currentLang = 'en';

  function setLanguage(lang) {
    currentLang = lang;
    
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    document.body.classList.toggle('lang-zh', lang === 'zh');
    localStorage.setItem('agent-lang', lang);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      langButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === btn.dataset.lang));
    });
  });

  const savedLang = localStorage.getItem('agent-lang');
  if (savedLang) {
    setLanguage(savedLang);
  }

  // ============================================
  // View Toggle
  // ============================================
  const viewButtons = document.querySelectorAll('.view-btn');
  const agentsGrid = document.getElementById('agents-grid');

  function setView(view) {
    if (agentsGrid) {
      agentsGrid.classList.toggle('view-compact', view === 'compact');
    }
    localStorage.setItem('agent-view', view);
  }

  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      viewButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
        b.setAttribute('aria-pressed', b.dataset.view === view);
      });
      setView(view);
    });
  });

  // Restore view state
  const savedView = localStorage.getItem('agent-view');
  if (savedView) {
    viewButtons.forEach(b => {
      const isActive = b.dataset.view === savedView;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive);
    });
    if (agentsGrid) {
      agentsGrid.classList.toggle('view-compact', savedView === 'compact');
    }
  }

  // ============================================
  // Favorites System
  // ============================================

  // Load favorites from localStorage
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('agent-favorites') || '[]');
    } catch {
      return [];
    }
  }

  function saveFavorites(favorites) {
    localStorage.setItem('agent-favorites', JSON.stringify(favorites));
    updateFavoritesCount();
  }

  function toggleFavorite(agentName, event) {
    event.preventDefault();
    event.stopPropagation();

    const favorites = getFavorites();
    const index = favorites.indexOf(agentName);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(agentName);
    }

    saveFavorites(favorites);
    updateFavoriteButtons();
    applyFilters();
  }

  function updateFavoriteButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const agentName = btn.dataset.agent;
      const isFavorite = favorites.includes(agentName);
      btn.classList.toggle('active', isFavorite);
      btn.innerHTML = isFavorite ? '⭐' : '☆';
      btn.setAttribute('aria-pressed', isFavorite);
      btn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    });
  }

  function updateFavoritesCount() {
    const favorites = getFavorites();
    // Update the favorites filter button count
    const favBtn = document.querySelector('.filter-btn[data-category="favorites"]');
    if (favBtn) {
      favBtn.innerHTML = favorites.length > 0 ? `⭐ ${favorites.length}` : '⭐';
    }
  }

  // ============================================
  // Category Filter
  // ============================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  let currentCategory = 'all';

  const savedCategory = localStorage.getItem('agent-category');
  if (savedCategory) {
    currentCategory = savedCategory;
    filterButtons.forEach(b => {
      const isActive = b.dataset.category === currentCategory;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive);
    });
  } else {
    filterButtons.forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.category === 'all');
    });
  }

  // ============================================
  // Search Functionality
  // ============================================
  const searchInput = document.getElementById('search-input');
  const agentCards = document.querySelectorAll('.agent-card');
  const noResults = document.getElementById('no-results');

  function getSuggestionTerms(query) {
    // Provide search suggestions based on partial match
    const suggestions = [];
    const terms = ['engineer', 'developer', 'manager', 'designer', 'specialist', 'analyst', 'architect', 'tester', 'writer', 'strategist'];
    
    terms.forEach(term => {
      if (term.startsWith(query.toLowerCase()) && term !== query.toLowerCase()) {
        suggestions.push(term);
      }
    });
    
    return suggestions.slice(0, 3);
  }

  function applyFilters() {
    const favorites = getFavorites();
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let visibleCount = 0;

    agentCards.forEach(card => {
      const cardCategory = card.dataset.category || '';
      const cardName = card.dataset.name || '';
      const cardDescription = card.dataset.description || '';

      // When favorites is selected, show all favorites regardless of category
      const isFavoriteCategory = currentCategory === 'favorites';
      const categoryMatch = currentCategory === 'all' || cardCategory === currentCategory || isFavoriteCategory;
      const searchMatch = !query ||
        cardName.includes(query) ||
        cardDescription.includes(query);
      const favoriteMatch = !isFavoriteCategory || favorites.includes(cardName);

      const isVisible = categoryMatch && searchMatch && favoriteMatch;
      card.style.display = isVisible ? '' : 'none';

      if (isVisible) visibleCount++;
    });

    // Update no results message
    if (noResults) {
      if (visibleCount === 0) {
        noResults.style.display = '';

        // Add suggestion if search has query
        if (currentCategory === 'favorites' && favorites.length === 0) {
          noResults.innerHTML = `
            <div class="no-results-content">
              <span class="no-results-icon">⭐</span>
              <h3 class="no-results-title">No favorites yet</h3>
              <p class="no-results-text">Click the star icon on any agent to add it to your favorites!</p>
              <button class="no-results-btn" onclick="resetFilters()">Show all agents</button>
            </div>
          `;
        } else if (currentCategory === 'favorites') {
          noResults.innerHTML = `
            <div class="no-results-content">
              <span class="no-results-icon">🔍</span>
              <h3 class="no-results-title">No favorites match</h3>
              <p class="no-results-text">Try a different search term within your favorites</p>
              <button class="no-results-btn" onclick="clearSearch()">Clear search</button>
            </div>
          `;
        } else if (query) {
          noResults.innerHTML = `
            <div class="no-results-content">
              <span class="no-results-icon">🔍</span>
              <h3 class="no-results-title">No favorites match</h3>
              <p class="no-results-text">No favorites match "${query}"</p>
              <button class="no-results-btn" onclick="clearSearch()">Clear search</button>
            </div>
          `;
        } else if (query) {
          const suggestions = getSuggestionTerms(query);
          if (suggestions.length > 0) {
            noResults.innerHTML = `
              <div class="no-results-content">
                <span class="no-results-icon">🔍</span>
                <h3 class="no-results-title">No agents found</h3>
                <p class="no-results-text">No agents match "${query}"</p>
                <p class="no-results-suggestion">Try searching for:</p>
                <div class="no-results-suggestions">
                  ${suggestions.map(s => `<button class="suggestion-btn" onclick="applySuggestion('${s}')">${s}</button>`).join('')}
                </div>
                <button class="no-results-btn" onclick="clearSearch()">Clear search</button>
              </div>
            `;
          } else {
            noResults.innerHTML = `
              <div class="no-results-content">
                <span class="no-results-icon">🔍</span>
                <h3 class="no-results-title">No agents found</h3>
                <p class="no-results-text">No agents match "${query}"</p>
                <button class="no-results-btn" onclick="clearSearch()">Clear search</button>
              </div>
            `;
          }
        } else {
          noResults.innerHTML = `
            <div class="no-results-content">
              <span class="no-results-icon">📭</span>
              <h3 class="no-results-title">No agents in this category</h3>
              <p class="no-results-text">Try selecting a different category</p>
              <button class="no-results-btn" onclick="resetFilters()">Show all agents</button>
            </div>
          `;
        }
      } else {
        noResults.style.display = 'none';
      }
    }
  }

  // Global functions for no results buttons
  window.clearSearch = function() {
    if (searchInput) {
      searchInput.value = '';
      localStorage.removeItem('agent-search');
    }
    applyFilters();
  };

  window.applySuggestion = function(suggestion) {
    if (searchInput) {
      searchInput.value = suggestion;
      localStorage.setItem('agent-search', suggestion);
    }
    applyFilters();
  };

  window.resetFilters = function() {
    currentCategory = 'all';
    localStorage.removeItem('agent-category');

    filterButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.category === 'all');
      b.setAttribute('aria-pressed', b.dataset.category === 'all');
    });

    window.clearSearch();
  };

  // Filter button handlers
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;

      filterButtons.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive);
      });

      localStorage.setItem('agent-category', currentCategory);
      applyFilters();
    });
  });

  // Search input handlers
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      localStorage.setItem('agent-search', searchInput.value);
      applyFilters();
    });
    
    // Restore search query
    const savedSearch = localStorage.getItem('agent-search');
    if (savedSearch) {
      searchInput.value = savedSearch;
    }
  }

  // Initialize
  updateFavoriteButtons();
  updateFavoritesCount();
  applyFilters();

  // Expose functions globally
  window.filterAgents = function(query) {
    if (searchInput) {
      searchInput.value = query;
      localStorage.setItem('agent-search', query);
    }
    applyFilters();
  };
  
  window.applyFilters = applyFilters;
  window.toggleFavorite = toggleFavorite;
});
