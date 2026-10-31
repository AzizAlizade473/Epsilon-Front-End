/**
 * 04.b — Locale validation script for npm run i18n:check.
 *
 * Verifies that:
 * 1. az.json (primary/default), en.json, and ru.json exist and are valid JSON.
 * 2. Every base key in az.json is covered in en.json and ru.json.
 *    Plural-form suffixes (_one, _other, _few, _many, _zero, _two) are
 *    stripped to the base key before comparison so that each locale may use
 *    its own set of plural suffixes (e.g. ru uses _one/_few/_many/_other while
 *    az and en only need _one/_other).
 * 3. No extra BASE keys exist in en.json or ru.json that are missing in az.json.
 * 4. No string value is empty or pure whitespace.
 */

const fs = require('node:fs');
const path = require('node:path');

const localesDir = path.join(__dirname, '..', 'locales');
const languages = ['az', 'en', 'ru'];

/** Suffixes that i18next uses for plural forms. */
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

function loadJson(file) {
  const filePath = path.join(localesDir, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file missing: ${file}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Returns a flat map of dotted-path → value for all leaf nodes in `obj`.
 */
function getLeaves(obj, prefix = '') {
  const leaves = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(leaves, getLeaves(val, fullPath));
    } else {
      leaves[fullPath] = val;
    }
  }
  return leaves;
}

/**
 * Returns the base key by stripping a trailing plural suffix if present.
 * e.g. "common.points_one" → "common.points"
 *      "navigation.welcome" → "navigation.welcome"
 */
function baseKey(key) {
  for (const suffix of PLURAL_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return key.slice(0, key.length - suffix.length);
    }
  }
  return key;
}

/**
 * Returns the set of unique base keys from a flat leaves map.
 */
function baseKeySet(leaves) {
  const set = new Set();
  for (const key of Object.keys(leaves)) {
    set.add(baseKey(key));
  }
  return set;
}

try {
  const [az, en, ru] = languages.map((lang) => loadJson(`${lang}.json`));
  const azLeaves = getLeaves(az);
  const enLeaves = getLeaves(en);
  const ruLeaves = getLeaves(ru);

  const azBases = baseKeySet(azLeaves);
  const enBases = baseKeySet(enLeaves);
  const ruBases = baseKeySet(ruLeaves);

  let errors = 0;

  // Check en against az base keys
  for (const base of azBases) {
    if (!enBases.has(base)) {
      console.error(`[i18n:check] Missing key in en.json: ${base}`);
      errors++;
    }
  }
  for (const base of enBases) {
    if (!azBases.has(base)) {
      console.error(
        `[i18n:check] Extra key in en.json not in az.json: ${base}`,
      );
      errors++;
    }
  }

  // Check ru against az base keys
  for (const base of azBases) {
    if (!ruBases.has(base)) {
      console.error(`[i18n:check] Missing key in ru.json: ${base}`);
      errors++;
    }
  }
  for (const base of ruBases) {
    if (!azBases.has(base)) {
      console.error(
        `[i18n:check] Extra key in ru.json not in az.json: ${base}`,
      );
      errors++;
    }
  }

  // Check no empty strings in any locale
  for (const [lang, leaves] of [
    ['az', azLeaves],
    ['en', enLeaves],
    ['ru', ruLeaves],
  ]) {
    for (const [key, val] of Object.entries(leaves)) {
      if (typeof val === 'string' && val.trim() === '') {
        console.error(`[i18n:check] Empty string in ${lang}.json: ${key}`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`[i18n:check] Failed with ${errors} error(s).`);
    process.exit(1);
  }

  console.log(
    `[i18n:check] All ${azBases.size} base keys validated across az, en, ru.`,
  );
} catch (err) {
  console.error('[i18n:check] Fatal error:', err.message);
  process.exit(1);
}
