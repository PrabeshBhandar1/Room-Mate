const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
    console.log('Starting Supabase diagnosis...');

    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env.local file not found!');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    console.log('Parsing .env.local content...');
    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return; // Skip comments

        // Find the first equals sign
        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            let value = line.substring(idx + 1).trim();

            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            envVars[key] = value;
            console.log(`Filtered Key found: ${key}`);
        }
    });

    const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
    const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!url) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_URL missing from .env.local');
    } else {
        console.log(`URL Configured: ${url.replace(/^(https?:\/\/[^.]+)\..*$/, '$1...')}`); // minimal logging
    }

    if (!key) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local');
    } else {
        console.log(`Anon Key Configured: ${key.substring(0, 5)}... (Length: ${key.length})`);
    }

    if (!url || !key) {
        console.error('Cannot proceed with connection test due to missing variables.');
        return;
    }

    console.log('Attempting to connect to Supabase...');
    const supabase = createClient(url, key);

    try {
        // Try a simple RPC or Table fetch
        // If the project is paused, this should return a specific error or timeout
        const { data, error } = await supabase.from('roommate_profiles').select('*').limit(1);

        if (error) {
            console.error('Connection Failed!');
            console.error('Error Message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error details:', error.details);
        } else {
            console.log('Connection Successful! Supabase is reachable.');
        }
    } catch (err) {
        console.error('Exception during fetch:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

diagnose();
