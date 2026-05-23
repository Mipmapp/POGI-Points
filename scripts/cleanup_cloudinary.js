#!/usr/bin/env node
/**
 * scripts/cleanup_cloudinary.js
 *
 * Scans every MongoDB collection that stores Cloudinary asset references,
 * then lists all images in the Cloudinary `app_uploads` folder and deletes
 * any that are no longer referenced by any document.
 *
 * Collections checked:
 *   Notifications  — notifications, ccs_notifications, coe_notifications,
 *                    som_notifications, cnahs_notifications  (field: public_id)
 *   Students       — students, ccs_students, coe_students,
 *                    som_students, cnahs_students             (field: photo URL)
 *   Masters/Admins — masters                                  (field: photo URL)
 *
 * Usage:
 *   node scripts/cleanup_cloudinary.js           # dry run — shows what would be deleted
 *   node scripts/cleanup_cloudinary.js --delete  # actually delete orphaned images
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const { MONGODB_URL } = process.env;

if (!MONGODB_URL) {
    console.error('❌  MONGODB_URL environment variable is not set.');
    process.exit(1);
}

if (process.env.CLOUDINARY_URL) {
    const url = new URL(process.env.CLOUDINARY_URL);
    cloudinary.config({
        cloud_name: url.hostname,
        api_key:    url.username,
        api_secret: decodeURIComponent(url.password),
    });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
} else {
    console.error(
        '❌  Missing Cloudinary credentials.\n' +
        '    Set CLOUDINARY_URL  — or —  CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.'
    );
    process.exit(1);
}

const DRY_RUN = !process.argv.includes('--delete');
const CLOUDINARY_FOLDER = 'app_uploads';

const NOTIF_COLLECTIONS   = ['notifications', 'ccs_notifications', 'coe_notifications', 'som_notifications', 'cnahs_notifications'];
const STUDENT_COLLECTIONS = ['students',      'ccs_students',      'coe_students',      'som_students',      'cnahs_students'];
const ADMIN_COLLECTIONS   = ['masters'];

/**
 * Extract a Cloudinary public_id from a full delivery URL.
 * Supports versioned and un-versioned URLs:
 *   https://res.cloudinary.com/{cloud}/image/upload/v12345/{public_id}.webp
 *   https://res.cloudinary.com/{cloud}/image/upload/{public_id}.webp
 * Returns null when the URL does not belong to Cloudinary.
 */
function extractPublicId(url) {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('res.cloudinary.com')) return null;
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Paginate through Cloudinary's resource list for a given folder prefix.
 * Returns an array of resource objects { public_id, bytes, created_at, ... }.
 */
async function listAllCloudinaryResources(folder) {
    const resources = [];
    let nextCursor = null;

    process.stdout.write(`\n📂  Listing Cloudinary assets in "${folder}/"...\n`);

    do {
        const params = {
            type:          'upload',
            resource_type: 'image',
            prefix:        folder + '/',
            max_results:   500,
        };
        if (nextCursor) params.next_cursor = nextCursor;

        const result = await cloudinary.api.resources(params);
        resources.push(...result.resources);
        nextCursor = result.next_cursor || null;
        process.stdout.write(`    Found ${resources.length} asset(s) so far...\r`);
    } while (nextCursor);

    process.stdout.write('\n');
    return resources;
}

/* ─────────────────────────────────────────────────────────────────────────── */

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       SSAAM — Cloudinary Orphan Cleanup Script           ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(
        DRY_RUN
            ? '\n🔍  DRY RUN — nothing will be deleted.\n    Rerun with --delete to permanently remove orphaned images.\n'
            : '\n⚠️   DELETE mode — orphaned images WILL be permanently removed.\n'
    );

    const referencedPublicIds = new Set();
    const client = new MongoClient(MONGODB_URL);

    try {
        await client.connect();
        const db = client.db();
        console.log('✅  Connected to MongoDB Atlas.\n');

        /* ── 1. Notification public_ids (stored directly) ──────────────────── */
        console.log('📋  Scanning notification collections...');
        for (const collName of NOTIF_COLLECTIONS) {
            const docs = await db
                .collection(collName)
                .find({ public_id: { $exists: true, $ne: null } }, { projection: { public_id: 1 } })
                .toArray();
            let added = 0;
            for (const doc of docs) {
                if (doc.public_id) { referencedPublicIds.add(doc.public_id); added++; }
            }
            console.log(`    ${collName.padEnd(24)} ${added} image reference(s)`);
        }

        /* ── 2. Student profile photos (Cloudinary URL → extract public_id) ── */
        console.log('\n👤  Scanning student collections...');
        for (const collName of STUDENT_COLLECTIONS) {
            const docs = await db
                .collection(collName)
                .find(
                    { photo: { $exists: true, $ne: null, $type: 'string' } },
                    { projection: { photo: 1 } }
                )
                .toArray();
            let added = 0;
            for (const doc of docs) {
                const pid = extractPublicId(doc.photo);
                if (pid) { referencedPublicIds.add(pid); added++; }
            }
            console.log(`    ${collName.padEnd(24)} ${added} cloudinary photo(s)`);
        }

        /* ── 3. Admin/master profile photos ─────────────────────────────────── */
        console.log('\n🔑  Scanning admin (masters) collection...');
        for (const collName of ADMIN_COLLECTIONS) {
            const docs = await db
                .collection(collName)
                .find(
                    { photo: { $exists: true, $ne: null, $type: 'string' } },
                    { projection: { photo: 1 } }
                )
                .toArray();
            let added = 0;
            for (const doc of docs) {
                const pid = extractPublicId(doc.photo);
                if (pid) { referencedPublicIds.add(pid); added++; }
            }
            console.log(`    ${collName.padEnd(24)} ${added} cloudinary photo(s)`);
        }

    } finally {
        await client.close();
    }

    console.log(`\n📊  Total unique referenced assets in DB: ${referencedPublicIds.size}`);

    /* ── 4. List everything Cloudinary has in app_uploads ─────────────────── */
    const allCloudinaryAssets = await listAllCloudinaryResources(CLOUDINARY_FOLDER);
    console.log(`    Total assets in Cloudinary "${CLOUDINARY_FOLDER}/": ${allCloudinaryAssets.length}`);

    /* ── 5. Identify orphans ──────────────────────────────────────────────── */
    const orphans = allCloudinaryAssets.filter(r => !referencedPublicIds.has(r.public_id));

    console.log(`\n🗑️   Orphaned assets (in Cloudinary but not in DB): ${orphans.length}`);

    if (orphans.length === 0) {
        console.log('\n✨  Your Cloudinary storage is already clean — no orphans found!');
        return;
    }

    const totalBytes = orphans.reduce((sum, r) => sum + (r.bytes || 0), 0);
    const totalMB    = (totalBytes / 1024 / 1024).toFixed(2);

    console.log('\n  public_id                                         size        created');
    console.log('  ' + '─'.repeat(80));
    for (const r of orphans) {
        const sizeMB = ((r.bytes || 0) / 1024 / 1024).toFixed(2).padStart(7);
        const date   = (r.created_at || '').slice(0, 10);
        console.log(`  ${r.public_id.padEnd(48)}  ${sizeMB} MB   ${date}`);
    }
    console.log(`\n  💾  Reclaimable storage: ${totalMB} MB across ${orphans.length} image(s)`);

    if (DRY_RUN) {
        console.log('\n⏭️   Dry run complete. No changes were made.');
        console.log('    Run with --delete to permanently remove the images listed above.\n');
        return;
    }

    /* ── 6. Delete orphans ────────────────────────────────────────────────── */
    console.log('\n🗑️   Deleting orphaned images (with CDN invalidation)...\n');
    let deleted = 0;
    let failed  = 0;

    for (const r of orphans) {
        try {
            await cloudinary.uploader.destroy(r.public_id, { invalidate: true });
            console.log(`  ✅  Deleted: ${r.public_id}`);
            deleted++;
        } catch (err) {
            console.error(`  ❌  Failed:  ${r.public_id} — ${err.message}`);
            failed++;
        }
    }

    const freed = (orphans
        .slice(0, deleted)
        .reduce((sum, r) => sum + (r.bytes || 0), 0) / 1024 / 1024
    ).toFixed(2);

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  Cleanup complete!                       ║');
    console.log(`║  Deleted : ${String(deleted).padEnd(30)}║`);
    console.log(`║  Failed  : ${String(failed).padEnd(30)}║`);
    console.log(`║  Freed   : ${String(freed + ' MB').padEnd(30)}║`);
    console.log('╚══════════════════════════════════════════╝\n');
}

main().catch(err => {
    console.error('\n❌  Script failed:', err.message);
    process.exit(1);
});
