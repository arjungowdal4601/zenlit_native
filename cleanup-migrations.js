const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

// Files to keep (our new consolidated migrations)
const filesToKeep = [
  '20250101000000_initial_schema.sql',
  '20250101000001_storage_buckets.sql',
  '20250101000002_seed_data_optional.sql'
];

// Read all files in migrations directory
const files = fs.readdirSync(migrationsDir);

// Filter SQL files
const sqlFiles = files.filter(f => f.endsWith('.sql'));

// Delete files that are not in the keep list
let deletedCount = 0;
sqlFiles.forEach(file => {
  if (!filesToKeep.includes(file)) {
    const filePath = path.join(migrationsDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${file}`);
      deletedCount++;
    } catch (err) {
      console.error(`Error deleting ${file}:`, err.message);
    }
  }
});

console.log(`\nCleanup complete! Deleted ${deletedCount} old migration files.`);
console.log(`Kept ${filesToKeep.length} new migration files.`);
