// Supabase Configuration
const SUPABASE_URL = 'https://nowtlqsmpdmbvjsbtmuk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd3RscXNtcGRtYnZqc2J0bXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mzk2NjUsImV4cCI6MjA3NTUxNTY2NX0.pS_-eUArnyw4J8YE1WHM-IJZQ87_PTNU8gAjVg3zzfk';

// Initialize Supabase client
let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error('Error initializing Supabase client:', error);
}

// Export the Supabase client
window.supabaseClient = supabase;