// Enhanced Authentication Checker
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.supabase = null;
        this.initialized = false;
    }

    // Initialize Supabase client
    async initialize() {
        if (this.initialized) return;
        
        // Wait for supabaseClient to be available
        let attempts = 0;
        while (!window.supabaseClient && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            this.initialized = true;
            console.log("AuthChecker: Supabase client initialized");
        } else {
            console.error("AuthChecker: Failed to get Supabase client");
        }
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            // Ensure initialized
            if (!this.initialized) {
                await this.initialize();
            }
            
            // First check localStorage session
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                try {
                    const sessionData = JSON.parse(storedSession);
                    
                    // Check if session is valid
                    if (sessionData.logged_in && sessionData.auth_id) {
                        console.log("AuthChecker: Valid session found in localStorage");
                        this.currentUser = sessionData;
                        return true;
                    }
                } catch (e) {
                    console.warn("AuthChecker: Error parsing stored session:", e);
                    localStorage.removeItem('growsmart_user_session');
                }
            }
            
            // If no Supabase client, return false
            if (!this.supabase) {
                console.error('AuthChecker: Supabase client not found');
                return false;
            }

            // Check with Supabase
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) {
                console.error('AuthChecker: Error checking auth:', error);
                return false;
            }

            if (user) {
                console.log("AuthChecker: User authenticated via Supabase:", user.id);
                this.currentUser = user;
                return true;
            } else {
                // Clear any stale data
                localStorage.removeItem('growsmart_user_session');
                return false;
            }
        } catch (error) {
            console.error('AuthChecker: Error in checkAuth:', error);
            return false;
        }
    }

    // Get current user
    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const isAuthenticated = await this.checkAuth();
        return isAuthenticated ? this.currentUser : null;
    }

    // Redirect to login if not authenticated
    async requireAuth(redirectUrl = 'login.html') {
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            console.log("AuthChecker: User not authenticated, redirecting to login");
            
            // Clear any stale data
            localStorage.removeItem('growsmart_user_session');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('login.html')) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 100);
            }
            return false;
        }
        
        return true;
    }

    // Sign out user
    async signOut(redirectUrl = 'login.html') {
        try {
            // Clear local storage
            localStorage.removeItem('growsmart_user_session');
            
            // Sign out from Supabase if client exists
            if (this.supabase) {
                const { error } = await this.supabase.auth.signOut();
                if (error) {
                    console.error('AuthChecker: Error signing out from Supabase:', error);
                }
            }
            
            this.currentUser = null;
            this.currentUserId = null;
            
            console.log("AuthChecker: User signed out successfully");
            
            // Redirect
            if (redirectUrl) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 300);
            }
            
            return true;
        } catch (error) {
            console.error('AuthChecker: Error in signOut:', error);
            return false;
        }
    }

    // Get user ID from users table
    async getUserId() {
        if (this.currentUserId) {
            return this.currentUserId;
        }

        try {
            // First check localStorage
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                if (sessionData.user_id) {
                    this.currentUserId = sessionData.user_id;
                    return this.currentUserId;
                }
            }
            
            // Fallback to database query
            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await this.supabase
                .from('users')
                .select('user_id')
                .eq('auth_id', user.id)
                .single();

            if (error) {
                console.error('AuthChecker: Error getting user ID:', error);
                return null;
            }

            this.currentUserId = data.user_id;
            return data.user_id;
        } catch (error) {
            console.error('AuthChecker: Error in getUserId:', error);
            return null;
        }
    }
    
    // Get user data from localStorage (fast, no API call)
    getStoredUserData() {
        try {
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                return JSON.parse(storedSession);
            }
            return null;
        } catch (error) {
            console.error('AuthChecker: Error getting stored user data:', error);
            return null;
        }
    }
}

// Create and export auth checker instance
window.authChecker = new AuthChecker();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth checker initialized");
    // Don't auto-initialize, let pages call it when needed
});
