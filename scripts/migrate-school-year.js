#!/usr/bin/env node
/**
 * migrate-school-year.js
 *
 * Backfills school_year = "2025-2026" on all existing records across:
 *   - Attendance Events  (attendanceevents + college-prefixed variants)
 *   - Attendance Logs    (attendancelogs   + college-prefixed variants)
 *   - Payment Campaigns  (payments         + college-prefixed variants)
 *
 * Only documents where school_year is missing, null, or blank ("") are touched.
 * Safe to re-run: records that already have a school_year are left unchanged.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set');
  process.exit(1);
}

const TARGET_YEAR = '2025-2026';

const COLLECTIONS = [
  // Attendance Events
  'attendanceevents',
  'ccs_attendanceevents',
  'coe_attendanceevents',
  'som_attendanceevents',
  'cnahs_attendanceevents',
  // Attendance Logs
  'attendancelogs',
  'ccs_attendancelogs',
  'coe_attendancelogs',
  'som_attendancelogs',
  'cnahs_attendancelogs',
  // Payment Campaigns
  'payments',
  'ccs_payments',
  'coe_payments',
  'som_payments',
  'cnahs_payments',
];

async function migrateCollection(db, collectionName) {
  const col = db.collection(collectionName);

  // Count docs that need updating
  const filter = { $or: [{ school_year: { $exists: false } }, { school_year: null }, { school_year: '' }] };
  const needsUpdate = await col.countDocuments(filter);
  const total = await col.countDocuments();

  if (total === 0) {
    console.log(`  [${collectionName}] — empty collection, skipped`);
    return { updated: 0 };
  }

  if (needsUpdate === 0) {
    console.log(`  [${collectionName}] — ${total} docs, all already have school_year ✓`);
    return { updated: 0 };
  }

  const result = await col.updateMany(filter, { $set: { school_year: TARGET_YEAR } });
  console.log(`  [${collectionName}] — updated ${result.modifiedCount} / ${total} docs`);
  return { updated: result.modifiedCount };
}

async function main() {
  console.log(`Connecting to MongoDB…`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`Connected to: ${db.databaseName}\n`);
  console.log(`Setting school_year = "${TARGET_YEAR}" on records with blank/missing values…\n`);

  let totalUpdated = 0;

  for (const col of COLLECTIONS) {
    const { updated } = await migrateCollection(db, col);
    totalUpdated += updated;
  }

  console.log(`\n✅  Migration complete — ${totalUpdated} record(s) updated across all collections.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
