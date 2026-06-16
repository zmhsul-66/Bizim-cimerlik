const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Checking if pg_stat_statements exists or if we can run RPC...');
  
  // Since we only have REST access, we cannot select from view pg_stat_statements 
  // directly unless it is exposed in public schema. Let's try:
  const { data, error } = await supabase
    .from('pg_stat_statements')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error querying pg_stat_statements:', error.message);
  } else {
    console.log('pg_stat_statements:', data);
  }
}

main().catch(console.error);
