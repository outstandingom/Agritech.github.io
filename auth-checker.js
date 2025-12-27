// auth-checker.js - Enhanced Authentication Checker
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.supabase = null;
        this.initialized = false;
    }

    // Initialize Supabase client
    async initialize() {
        if (this.initialized) return true;
        
        console.log("AuthChecker: Initializing...");
        
        // Wait for supabaseClient to be available
        let attempts = 0;
        while (!window.supabaseClient && attempts < 30) { // Increased to 30 attempts
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            this.initialized = true;
            console.log("AuthChecker: Supabase client initialized successfully");
            return true;
        } else {
            console.error("AuthChecker: Failed to get Supabase client after", attempts, "attempts");
            return false;
        }
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            // Initialize if needed
            if (!this.initialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    console.warn("AuthChecker: Could not initialize Supabase");
                    return false;
                }
            }
            
            if (!this.supabase) {
                console.error('AuthChecker: No Supabase client available');
                return false;
            }

            // Check Supabase session first
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('AuthChecker: Error checking session:', error);
                return false;
            }

            if (session && session.user) {
                console.log("AuthChecker: User authenticated via Supabase:", session.user.id);
                this.currentUser = session.user;
                
                // Also store in localStorage for compatibility
                const userSession = {
                    user_id: session.user.id,
                    auth_id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email,
                    logged_in: true,
                    session_start: new Date().toISOString()
                };
                
                localStorage.setItem('growsmart_user_session', JSON.stringify(userSession));
                return true;
            }
            
            // Fallback to localStorage check
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                try {
                    const sessionData = JSON.parse(storedSession);
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
            
            return false;
            
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

    // Get user data from users table
    async getUserProfile() {
        try {
            const user = await this.getCurrentUser();
            if (!user || !this.supabase) return null;
            
            // Get user profile from users table
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_id', user.id)
                .single();
            
            if (error) {
                console.warn('AuthChecker: Error getting user profile:', error.message);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('AuthChecker: Error in getUserProfile:', error);
            return null;
        }
    }

    // Redirect to login if not authenticated
    async requireAuth(redirectUrl = 'login.html') {
        // Special handling for login page
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html') ||
            window.location.pathname.includes('reset-password.html')) {
            return true;
        }
        
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            console.log("AuthChecker: User not authenticated, redirecting to login");
            
            // Clear any stale data
            localStorage.removeItem('growsmart_user_session');
            
            // Redirect to login page
            window.location.href = redirectUrl;
            return false;
        }
        
        return true;
    }

    // Sign out user
    async signOut(redirectUrl = 'login.html') {
        try {
            // Clear local storage first
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
            // Try to get from localStorage first
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                if (sessionData.user_id) {
                    this.currentUserId = sessionData.user_id;
                    return this.currentUserId;
                }
            }
            
            // Get from database
            const profile = await this.getUserProfile();
            if (profile && profile.user_id) {
                this.currentUserId = profile.user_id;
                return profile.user_id;
            }
            
            // Fallback to auth user ID
            const user = await this.getCurrentUser();
            return user ? user.id : null;
            
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

// Auto-initialize on page load for non-login pages
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth checker DOM loaded");
    
    // Don't auto-check auth on login/register pages
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html') &&
        !window.location.pathname.includes('reset-password.html')) {
        
        // Initialize auth checker with a small delay
        setTimeout(async () => {
            await window.authChecker.initialize();
            await window.authChecker.requireAuth();
        }, 500);
    }
});
