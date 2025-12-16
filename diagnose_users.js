const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
    console.log('Starting Supabase Users Table diagnosis...');

    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env.local file not found!');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            let value = line.substring(idx + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });

    const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
    const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!url || !key) {
        console.error('Missing URL or Key');
        return;
    }

    console.log('Connecting to Supabase...');
    const supabase = createClient(url, key);

    try {
        console.log("Attempting to fetch from 'users' table...");
        const { data, error } = await supabase.from('users').select('*').limit(1);

        if (error) {
            console.error('Fetch Failed!');
            console.error('Error Message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error details:', error.details);
        } else {
            console.log('Fetch Successful! Supabase "users" table is reachable.');
            console.log('Data sample:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

diagnose();
