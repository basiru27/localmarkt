import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server root
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Make sure .env is set up.');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('Starting seed process...');

  try {
    // 1. Clear existing listings
    console.log('Clearing existing listings...');
    // A trick to delete all rows: use neq with a dummy UUID, or just not_eq null
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .not('id', 'is', null);

    if (deleteError) throw deleteError;
    console.log('Existing listings cleared.');

    // 2. Fetch required reference data
    console.log('Fetching users, categories, and regions...');
    
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.error('No users found in the "profiles" table. Please register at least one user before seeding.');
      process.exit(1);
    }

    const { data: categories, error: categoriesError } = await supabase.from('categories').select('id');
    if (categoriesError) throw categoriesError;

    const { data: regions, error: regionsError } = await supabase.from('regions').select('id');
    if (regionsError) throw regionsError;

    // 3. Generate 100 listings
    console.log(`Generating 100 dummy listings across ${profiles.length} users...`);
    const listings = [];

    for (let i = 0; i < 100; i++) {
      const randomUser = faker.helpers.arrayElement(profiles).id;
      const randomCategory = faker.helpers.arrayElement(categories).id;
      const randomRegion = faker.helpers.arrayElement(regions).id;

      listings.push({
        user_id: randomUser,
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 100, max: 25000 })),
        category_id: randomCategory,
        region_id: randomRegion,
        contact: faker.phone.number(),
        image_url: faker.image.urlLoremFlickr({ category: 'product', width: 640, height: 480 }),
      });
    }

    // 4. Insert into database
    console.log('Inserting listings into the database...');
    // Insert in batches of 50 to avoid potential payload size limits, though 100 usually fits
    const { error: insertError } = await supabase.from('listings').insert(listings);

    if (insertError) throw insertError;

    console.log('Successfully seeded 100 listings!');
  } catch (err) {
    console.error('An error occurred during seeding:', err);
  }
}

seed();
