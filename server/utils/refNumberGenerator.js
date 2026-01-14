import { supabase } from '../config/database.js';

/**
 * Generate a unique reference number in format HUDT-YYYY-XXX
 * @returns {Promise<string>} Reference number
 */
export const generateRefNumber = async () => {
  const year = new Date().getFullYear();

  if (!supabase) {
    // Fallback if Supabase is not initialized
    const random = Math.floor(Math.random() * 900) + 100;
    return `HUDT-${year}-${random}`;
  }

  // Get the highest number for this year
  const { data: result } = await supabase
    .from('applications')
    .select('ref_number')
    .like('ref_number', `HUDT-${year}-%`)
    .order('ref_number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;

  if (result && result.ref_number) {
    // Extract the number part and increment
    const parts = result.ref_number.split('-');
    const lastNumber = parseInt(parts[2], 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 3 digits
  const paddedNumber = nextNumber.toString().padStart(3, '0');

  return `HUDT-${year}-${paddedNumber}`;
};
