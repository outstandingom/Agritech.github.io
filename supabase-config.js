// supabase-config.js
// Supabase Configuration
const SUPABASE_URL = 'https://nowtlqsmpdmbvjsbtmuk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd3RscXNtcGRtYnZqc2J0bXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mzk2NjUsImV4cCI6MjA3NTUxNTY2NX0.pS_-eUArnyw4J8YE1WHM-IJZQ87_PTNU8gAjVg3zzfk';

// Initialize Supabase client
try {
    // Load the Supabase library first if not already loaded
    if (typeof window.supabase === 'undefined') {
        console.log('Loading Supabase library...');
    }
    
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    });
    
    window.supabaseClient = supabase;
    console.log('Supabase client initialized successfully');
    
    // Initialize auth state immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log('Initial session found:', session.user.id);
        }
    });
    
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    window.supabaseClient = null;
}

// Make it available globally
console.log('Supabase config loaded');
