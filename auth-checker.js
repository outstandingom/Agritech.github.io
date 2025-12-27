// Enhanced Authentication Checker
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.supabase = window.supabaseClient;
    }

    // Check if user is authenticated with multiple fallbacks
    async checkAuth() {
        try {
            // First check localStorage session
            const storedSession = localStorage.getItem('growsmart_user_session');
            if (storedSession) {
                try {
                    const sessionData = JSON.parse(storedSession);
                    // Check if session is not expired (24 hours)
                    const sessionStart = new Date(sessionData.session_start);
                    const now = new Date();
                    const hoursDiff = Math.abs(now - sessionStart) / 36e5;
                    
                    if (hoursDiff < 24 && sessionData.logged_in) {
                        console.log("Valid session found in localStorage");
                        this.currentUser = sessionData;
                        return true;
                    } else {
                        console.log("Session expired, clearing...");
                        localStorage.removeItem('growsmart_user_session');
                    }
                } catch (e) {
                    console.warn("Error parsing stored session:", e);
                    localStorage.removeItem('growsmart_user_session');
                }
            }
            
            // If no Supabase client, return false
            if (!this.supabase) {
                console.error('Supabase client not found');
                return false;
            }

            // Check with Supabase
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) {
                console.error('Error checking auth:', error);
                return false;
            }

            if (user) {
                console.log("User authenticated via Supabase:", user.id);
                this.currentUser = user;
                
                // Update localStorage with fresh session
                await this.syncUserProfile();
                return true;
            } else {
                // Clear any stale data
                localStorage.removeItem('growsmart_user_session');
                sessionStorage.removeItem('growsmart_session_active');
                return false;
            }
        } catch (error) {
            console.error('Error in checkAuth:', error);
            return false;
        }
    }

    // Sync user profile with localStorage
    async syncUserProfile() {
        if (!this.supabase || !this.currentUser) return;
        
        try {
            const { data: userProfile, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_id', this.currentUser.id)
                .single();
            
            const sessionData = {
                user_id: userProfile?.user_id || this.currentUser.id,
                auth_id: this.currentUser.id,
                email: this.currentUser.email,
                name: userProfile?.full_name || this.currentUser.user_metadata?.full_name || 'User',
                language: userProfile?.language || 'English',
                role: userProfile?.role || 'farmer',
                logged_in: true,
                session_start: new Date().toISOString(),
                last_updated: new Date().toISOString()
            };
            
            localStorage.setItem('growsmart_user_session', JSON.stringify(sessionData));
            sessionStorage.setItem('growsmart_session_active', 'true');
            sessionStorage.setItem('growsmart_user_id', sessionData.user_id);
            
            console.log("Session synced to localStorage");
        } catch (error) {
            console.warn("Could not sync user profile:", error);
            // Still create basic session
            const basicSession = {
                user_id: this.currentUser.id,
                auth_id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || 'User',
                language: 'English',
                role: 'farmer',
                logged_in: true,
                session_start: new Date().toISOString()
            };
            localStorage.setItem('growsmart_user_session', JSON.stringify(basicSession));
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
            console.log("User not authenticated, redirecting to login");
            // Clear any stale data
            localStorage.removeItem('growsmart_user_session');
            sessionStorage.clear();
            
            // Redirect with a small delay to ensure cleanup
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 100);
            return false;
        }
        
        return true;
    }

    // Sign out user
    async signOut(redirectUrl = 'login.html') {
        try {
            // Clear all local storage
            localStorage.removeItem('growsmart_user_session');
            sessionStorage.clear();
            
            // Sign out from Supabase if client exists
            if (this.supabase) {
                const { error } = await this.supabase.auth.signOut();
                if (error) {
                    console.error('Error signing out from Supabase:', error);
                }
            }
            
            this.currentUser = null;
            this.currentUserId = null;
            
            console.log("User signed out successfully");
            
            // Redirect
            if (redirectUrl) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 300);
            }
            
            return true;
        } catch (error) {
            console.error('Error in signOut:', error);
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
                console.error('Error getting user ID:', error);
                return null;
            }

            this.currentUserId = data.user_id;
            return data.user_id;
        } catch (error) {
            console.error('Error in getUserId:', error);
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
            console.error('Error getting stored user data:', error);
            return null;
        }
    }
}

// Create and export auth checker instance
window.authChecker = new AuthChecker();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth checker initialized");
});
