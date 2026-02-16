/**
 * Generate URL-friendly slug dari string
 *
 * Contoh:
 *   slugify('The Lord of the Rings')  → 'the-lord-of-the-rings'
 *   slugify('Episode 1: Awakening!') → 'episode-1-awakening'
 *
 * Jika perlu unique, tambahkan suffix:
 *   generateUniqueSlug('My Story', existingSlugs) → 'my-story-a3f1'
 */

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '')   // Hapus karakter non-word (kecuali -)
    .replace(/\-\-+/g, '-')     // Ganti multiple - dengan single -
    .replace(/^-+/, '')          // Hapus - di awal
    .replace(/-+$/, '');         // Hapus - di akhir
};

/**
 * Generate unique slug dengan random suffix
 * Bisa dicek terhadap database untuk memastikan unik
 */
const generateUniqueSlug = (text) => {
  const base = slugify(text);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
};

module.exports = { slugify, generateUniqueSlug };
