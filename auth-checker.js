// Authentication Checker
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            if (!window.supabaseClient) {
                console.error('Supabase client not found');
                return false;
            }

            const { data: { user }, error } = await window.supabaseClient.auth.getUser();
            
            if (error) {
                console.error('Error checking auth:', error);
                return false;
            }

            if (user) {
                this.currentUser = user;
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error in checkAuth:', error);
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
            window.location.href = redirectUrl;
            return false;
        }
        
        return true;
    }

    // Sign out user
    async signOut(redirectUrl = 'login.html') {
        try {
            if (!window.supabaseClient) {
                console.error('Supabase client not found');
                return false;
            }

            const { error } = await window.supabaseClient.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
                return false;
            }

            this.currentUser = null;
            this.currentUserId = null;

            if (redirectUrl) {
                window.location.href = redirectUrl;
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
            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await window.supabaseClient
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
}

// Create and export auth checker instance
window.authChecker = new AuthChecker();