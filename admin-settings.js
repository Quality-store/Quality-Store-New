// Quality Store Admin Settings
// This file handles admin authentication and settings management

class AdminAuth {
    constructor() {
        this.ADMIN_KEY = 'qualityStore_admin';
        this.SETTINGS_KEY = 'qualityStore_settings';
        this.USERS_KEY = 'qualityStore_users';
        this.ORDERS_KEY = 'qualityStore_orders';
        this.settings = {};
        this.users = [];
        this.ownerBalance = 0;
        this.loadSettings();
        this.loadUsers();
        this.loadBalance();
    }

    loadUsers() {
        const savedUsers = localStorage.getItem(this.USERS_KEY);
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        } else {
            this.users = [];
        }
    }

    saveUsers() {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
    }

    loadBalance() {
        const savedBalance = localStorage.getItem('qualityStore_owner_balance');
        if (savedBalance) {
            this.ownerBalance = parseFloat(savedBalance);
        } else {
            this.ownerBalance = 0;
        }
    }

    saveBalance() {
        localStorage.setItem('qualityStore_owner_balance', this.ownerBalance.toString());
    }

    // User Management Functions
    addUser(userData) {
        const newUser = {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            registrationDate: new Date().toISOString(),
            orderHistory: [],
            totalSpent: 0,
            lastOrderDate: null
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser.id;
    }

    updateUser(userId, userData) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...userData };
            this.saveUsers();
            return true;
        }
        return false;
    }

    getUser(userId) {
        return this.users.find(u => u.id === userId);
    }

    getAllUsers() {
        return [...this.users];
    }

    deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
    }

    // Order tracking for users
    addOrderToUser(userEmail, order) {
        const user = this.users.find(u => u.email === userEmail);
        if (user) {
            user.orderHistory.push(order);
            user.totalSpent += order.total;
            user.lastOrderDate = new Date().toISOString();
            this.saveUsers();
        }
    }

    // Process payment to owner's account
    processPayment(amount, paymentMethod) {
        if (paymentMethod !== 'cod') {
            this.ownerBalance += amount;
            this.saveBalance();
            console.log(`Payment of HK$${amount} processed via ${paymentMethod}. Owner balance: HK$${this.ownerBalance}`);
        }
    }

    getOwnerBalance() {
        return this.ownerBalance;
    }

    getUserOrderHistory(userEmail) {
        const user = this.users.find(u => u.email === userEmail);
        return user ? user.orderHistory : [];
    }

    // Enhanced error handling and debugging
    logError(message, error = null) {
        const timestamp = new Date().toISOString();
        const errorMsg = `[${timestamp}] AdminAuth Error: ${message}`;
        if (error) {
            console.error(errorMsg, error);
        } else {
            console.error(errorMsg);
        }
        // Store error logs for admin review
        this.addErrorLog(message, error);
    }

    addErrorLog(message, error) {
        const errorLogs = JSON.parse(localStorage.getItem('qualityStore_error_logs') || '[]');
        errorLogs.push({
            timestamp: new Date().toISOString(),
            message: message,
            error: error ? error.message : null,
            stack: error ? error.stack : null
        });
        // Keep only last 50 errors
        if (errorLogs.length > 50) {
            errorLogs.splice(0, errorLogs.length - 50);
        }
        localStorage.setItem('qualityStore_error_logs', JSON.stringify(errorLogs));
    }

    getErrorLogs() {
        return JSON.parse(localStorage.getItem('qualityStore_error_logs') || '[]');
    }

    clearErrorLogs() {
        localStorage.removeItem('qualityStore_error_logs');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            this.settings = {
                username: 'admin',
                password: 'quality223'
            };
            this.saveSettings();
        }
    }

    saveSettings() {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    }

    validateLogin(username, password) {
        try {
            if (!username || !password) {
                this.logError('Login validation failed: Missing username or password');
                return false;
            }

            if (!this.settings || !this.settings.username || !this.settings.password) {
                this.logError('Login validation failed: Settings not properly loaded', new Error('Settings object is invalid'));
                return false;
            }

            const isValid = username === this.settings.username && password === this.settings.password;

            if (isValid) {
                console.log('Login validation successful for user:', username);
            } else {
                this.logError(`Login validation failed for user: ${username}`);
            }

            return isValid;
        } catch (error) {
            this.logError('Error during login validation', error);
            return false;
        }
    }

    changeCredentials(newUsername, newPassword, currentPassword) {
        try {
            // Verify current password
            if (currentPassword !== this.settings.password) {
                this.logError('Current password verification failed');
                throw new Error('Current password is incorrect');
            }

            // Validate new credentials
            if (!newUsername || newUsername.length < 3) {
                throw new Error('Username must be at least 3 characters long');
            }

            if (!newPassword || newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Update credentials
            this.settings.username = newUsername;
            this.settings.password = newPassword;
            this.saveSettings();

            console.log('Admin credentials updated successfully');
            return true;
        } catch (error) {
            this.logError('Error changing admin credentials', error);
            throw error;
        }
    }

    getSettings() {
        return { ...this.settings };
    }

    // Session management
    setLoginState(loggedIn) {
        if (loggedIn) {
            sessionStorage.setItem(this.ADMIN_KEY, 'true');
        } else {
            sessionStorage.removeItem(this.ADMIN_KEY);
        }
    }

    // System health check and diagnostics
    runDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            issues: [],
            warnings: [],
            status: 'healthy'
        };

        try {
            // Check if settings are loaded
            if (!this.settings || !this.settings.username || !this.settings.password) {
                diagnostics.issues.push('Admin settings not properly loaded');
                diagnostics.status = 'error';
            }

            // Check localStorage availability
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
            } catch (error) {
                diagnostics.issues.push('localStorage not available');
                diagnostics.status = 'error';
            }

            // Check sessionStorage availability
            try {
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
            } catch (error) {
                diagnostics.warnings.push('sessionStorage not available');
            }

            // Check if users array is initialized
            if (!Array.isArray(this.users)) {
                diagnostics.issues.push('Users array not properly initialized');
                diagnostics.status = 'error';
            }

            // Check for data corruption
            if (this.users.length > 0) {
                const corruptedUsers = this.users.filter(user => !user.id || !user.email);
                if (corruptedUsers.length > 0) {
                    diagnostics.warnings.push(`${corruptedUsers.length} users have missing data`);
                }
            }

        } catch (error) {
            diagnostics.issues.push('Error running diagnostics: ' + error.message);
            diagnostics.status = 'error';
        }

        console.log('AdminAuth Diagnostics:', diagnostics);
        return diagnostics;
    }

    // Reset admin system (use with caution)
    resetSystem() {
        if (confirm('Are you sure you want to reset the admin system? This will clear all data.')) {
            try {
                localStorage.removeItem(this.SETTINGS_KEY);
                localStorage.removeItem(this.USERS_KEY);
                localStorage.removeItem('qualityStore_products');
                localStorage.removeItem('qualityStore_orders');
                localStorage.removeItem('qualityStore_discount');
                sessionStorage.removeItem(this.ADMIN_KEY);

                // Reload settings
                this.settings = {
                    username: 'admin',
                    password: 'quality223'
                };
                this.users = [];
                this.saveSettings();

                console.log('Admin system reset successfully');
                return true;
            } catch (error) {
                this.logError('Error resetting admin system', error);
                return false;
            }
        }
        return false;
    }
}

// Initialize admin auth
const adminAuth = new AdminAuth();

// Export for use in admin.html
window.AdminAuth = adminAuth;

// Storefront UI helpers and fixes injected globally (guarded to run only on storefront)
(function(){
  function isStorefront() {
    return !!document.getElementById('productGrid') || !!document.getElementById('cart');
  }

  // Navigation toggle for mobile
  function toggleNav() {
    const nav = document.getElementById('navMenu');
    if (nav) nav.classList.toggle('open');
  }

  // Section switching on the storefront
  function showSection(sectionId) {
    const map = {
      home: 'home',
      products: 'products',
      wishlist: 'wishlist',
      recommendations: 'recommendationsSection'
    };
    const ids = Object.values(map);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = map[sectionId] || sectionId;
    const tgtEl = document.getElementById(target);
    if (tgtEl) tgtEl.style.display = 'block';
    if (sectionId === 'products' && typeof window.renderProducts === 'function') window.renderProducts();
    if (sectionId === 'wishlist') {
      if (typeof window.renderWishlist === 'function') window.renderWishlist();
      if (typeof window.updateWishlistButtons === 'function') window.updateWishlistButtons();
    }
    if (sectionId === 'recommendations' && typeof window.displayRecommendations === 'function') window.displayRecommendations();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
  }

  // Cart open/close with animation
  function toggleCart() {
    const cart = document.getElementById('cart');
    if (!cart) return;
    const opened = cart.classList.toggle('open');
    if (opened) {
      cart.classList.add('cart-slide-in');
      setTimeout(() => cart.classList.remove('cart-slide-in'), 300);
    }
  }

  // Floating cart badge injection
  function ensureCartBadge() {
    if (document.getElementById('cartCount')) return;
    const btn = document.createElement('button');
    btn.id = 'floatingCartBtn';
    btn.type = 'button';
    btn.className = 'cart-toggle';
    btn.innerHTML = '🛒 <span id="cartCount" class="cart-count" data-count="0">0</span>';
    btn.addEventListener('click', toggleCart);
    document.body.appendChild(btn);
  }

  function updateCartCount() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('qualityStore_cart') || '[]'); } catch (_) {}
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    badge.dataset.count = String(count);
    badge.textContent = String(count);
  }

  // Wrap existing updateCart to also update the badge
  function hookUpdateCart() {
    const orig = window.updateCart;
    if (typeof orig === 'function') {
      window.updateCart = function(...args) {
        try { return orig.apply(this, args); }
        finally { updateCartCount(); }
      };
    } else {
      // Minimal fallback to keep totals and badge in sync
      window.updateCart = function() {
        updateCartCount();
      };
    }
  }

  // Payment method toggles for bank details visibility
  function bindPaymentToggles() {
    const bank = document.getElementById('bankDetailsSection');
    if (!bank) return;
    const radios = Array.from(document.querySelectorAll('input[name="payment"]'));
    if (radios.length === 0) return;
    function refresh() {
      const selected = radios.find(r => r.checked)?.value;
      bank.style.display = selected === 'card' ? 'block' : 'none';
    }
    radios.forEach(r => r.addEventListener('change', refresh));
    refresh();
  }

  // Guest vs register checkout fields
  function toggleGuestCheckout() {
    const guest = document.getElementById('guestOption');
    const fields = document.getElementById('registrationFields');
    if (!fields) return;
    const show = !guest || !guest.checked ? true : false;
    fields.style.display = show ? 'block' : 'none';
    // Update required attributes
    ['customerEmail','customerName','customerAddress','customerPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = show;
    });
  }

  // Simple analytics modal for storefront nav
  function showAnalytics() {
    const orders = JSON.parse(localStorage.getItem('qualityStore_orders') || '[]');
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const totalOrders = orders.length;
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header"><h2>Analytics</h2></div>
        <div>
          <p>Total orders: ${totalOrders}</p>
          <p>Total revenue: ${totalRevenue.toFixed(2)}</p>
        </div>
        <div class="modal-buttons">
          <button type="button" class="btn btn-secondary" id="closeAnalyticsBtn">Close</button>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    document.getElementById('closeAnalyticsBtn')?.addEventListener('click', () => modal.remove());
  }

  // Review helpers if missing
  function ensureReviewHandlers() {
    if (typeof window.submitReview !== 'function') {
      window.submitReview = function(e) {
        e.preventDefault();
        const name = document.getElementById('reviewUserName')?.value?.trim();
        const rating = Number(document.getElementById('reviewRating')?.value);
        const comment = document.getElementById('reviewComment')?.value?.trim();
        if (!name || !rating || !comment) return;
        const reviews = JSON.parse(localStorage.getItem('qualityStore_reviews') || '[]');
        reviews.push({ id: Date.now(), name, rating, comment, date: new Date().toISOString() });
        localStorage.setItem('qualityStore_reviews', JSON.stringify(reviews));
        if (typeof window.showNotification === 'function') window.showNotification('Review submitted!');
        if (typeof window.closeReviewModal === 'function') window.closeReviewModal();
      }
    }
    if (typeof window.closeReviewModal !== 'function') {
      window.closeReviewModal = function(){
        document.getElementById('reviewModal')?.classList.remove('open');
      }
    }
  }

  // Expose globals expected by index.html if not present
  function exposeGlobals() {
    if (!window.toggleNav) window.toggleNav = toggleNav;
    if (!window.showSection) window.showSection = showSection;
    if (!window.showWishlist) window.showWishlist = () => showSection('wishlist');
    if (!window.showRecommendations) window.showRecommendations = () => showSection('recommendations');
    if (!window.showAnalytics) window.showAnalytics = showAnalytics;
    if (!window.toggleCart) window.toggleCart = toggleCart;
    if (!window.toggleGuestCheckout) window.toggleGuestCheckout = toggleGuestCheckout;
  }

  function initStorefront() {
    if (!isStorefront()) return; // Do not run on admin.html
    ensureCartBadge();
    hookUpdateCart();
    updateCartCount();
    bindPaymentToggles();
    exposeGlobals();
    ensureReviewHandlers();
    // Keep badge in sync across tabs
    window.addEventListener('storage', function(e){
      if (e.key === 'qualityStore_cart') updateCartCount();
    });
    // Initialize default visible section
    const home = document.getElementById('home');
    if (home) showSection('home');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorefront);
  } else {
    initStorefront();
  }
})();
