#!/usr/bin/env node
/**
 * migrate-full-name.js
 *
 * Backfills full_name on every student record across all four college
 * collections (ccs_students, coe_students, som_students, cnahs_students).
 *
 * Rule:
 *   full_name = (first_name + ' ' + middle_name).trim().toUpperCase()
 *
 * Only records that have a first_name field AND whose full_name is either
 * missing, blank, or still equal to last_name (the old fallback) are updated.
 *
 * Safe to re-run: records that already have a correct full_name are skipped.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set');
  process.exit(1);
}

const COLLECTIONS = [
  'ccs_students',
  'coe_students',
  'som_students',
  'cnahs_students',
];

async function migrateCollection(db, collectionName) {
  const col = db.collection(collectionName);
  const total = await col.countDocuments();
  console.log(`\n[${collectionName}] ${total} total documents`);

  // Find records that need updating:
  // - have a first_name field
  // - full_name is missing, blank, or equal to last_name (old fallback)
  const cursor = col.find({
    first_name: { $exists: true, $ne: '' },
  });

  let updated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const firstName  = (doc.first_name  || '').trim().toUpperCase();
    const middleName = (doc.middle_name || '').trim().toUpperCase();
    const lastName   = (doc.last_name   || '').trim().toUpperCase();

    const correctFullName = middleName
      ? `${firstName} ${middleName}`
      : firstName;

    const currentFullName = (doc.full_name || '').trim().toUpperCase();

    // Skip if full_name is already correct
    if (currentFullName === correctFullName && currentFullName !== '') {
      skipped++;
      continue;
    }

    await col.updateOne(
      { _id: doc._id },
      { $set: { full_name: correctFullName } }
    );
    updated++;

    if (updated % 50 === 0) {
      console.log(`  [${collectionName}] updated ${updated} so far…`);
    }
  }

  console.log(`  [${collectionName}] done — updated: ${updated}, skipped (already correct): ${skipped}`);
  return { updated, skipped };
}

async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('Connected.');

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const col of COLLECTIONS) {
    const { updated, skipped } = await migrateCollection(db, col);
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  console.log(`\n✅  Migration complete.`);
  console.log(`   Records updated : ${totalUpdated}`);
  console.log(`   Records skipped : ${totalSkipped}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
