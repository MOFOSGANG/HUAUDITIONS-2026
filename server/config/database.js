import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize the database (create default admin if needed)
export async function initDatabase() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized. Check environment variables.');
    return null;
  }

  console.log('✅ Supabase client initialized');

  // Check if default admin exists
  const { data: existingAdmin } = await supabase
    .from('admins')
    .select('id')
    .eq('username', 'admin')
    .single();

  if (!existingAdmin) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'hudt2026admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hudtplatform.com';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const now = new Date().toISOString();

    const { error } = await supabase.from('admins').insert({
      username: adminUsername,
      password_hash: passwordHash,
      email: adminEmail,
      role: 'super_admin',
      created_at: now
    });

    if (error) {
      console.error('❌ Failed to create default admin:', error.message);
    } else {
      console.log(`✅ Default admin created: ${adminUsername}`);
    }
  }

  return supabase;
}

// Get the Supabase client instance
export function getDb() {
  return supabase;
}

// Database query helpers (Supabase-compatible)
export async function runQuery(table, operation, data, match = null) {
  if (!supabase) throw new Error('Supabase not initialized');

  let query;
  switch (operation) {
    case 'insert':
      query = supabase.from(table).insert(data).select();
      break;
    case 'update':
      query = supabase.from(table).update(data).match(match).select();
      break;
    case 'delete':
      query = supabase.from(table).delete().match(match);
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  const { data: result, error } = await query;
  if (error) throw error;
  return result;
}

export async function getOne(table, match) {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .match(match)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function getAll(table, options = {}) {
  if (!supabase) throw new Error('Supabase not initialized');

  let query = supabase.from(table).select('*');

  if (options.match) {
    query = query.match(options.match);
  }
  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Legacy compatibility functions
export function saveDatabase() {
  // No-op for Supabase (auto-saves)
}

export { supabase };
export default { initDatabase, getDb, runQuery, getOne, getAll, saveDatabase, supabase };
