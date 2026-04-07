import { createClient } from '@supabase/supabase-js';
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

// Generate a valid Gambian phone number: +220 followed by 7 digits (first digit 2-9)
function generateGambianPhone() {
  const firstDigit = Math.floor(Math.random() * 8) + 2; // 2-9
  const remainingDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `+220 ${firstDigit}${remainingDigits}`;
}

// Helper to get random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random price within range
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get random integer within range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample review comments for different rating levels
const reviewComments = {
  5: [
    'Excellent! Exactly as described. Highly recommend this seller.',
    'Perfect condition, fast response. Would buy again!',
    'Amazing quality! The seller was very professional.',
    'Best purchase I\'ve made on LocalMarkt. Thank you!',
    'Exceeded my expectations. Great communication from seller.',
    'Top notch! Very satisfied with this transaction.',
  ],
  4: [
    'Good product, minor delay in delivery but overall satisfied.',
    'Very good quality. Seller was helpful and responsive.',
    'Happy with the purchase. Would recommend.',
    'Product as described. Good experience overall.',
    'Nice item, fair price. Would buy from seller again.',
    'Good value for money. Slight wear but acceptable.',
  ],
  3: [
    'Decent product. Met basic expectations.',
    'Average experience. Product works but nothing special.',
    'Okay purchase. Some issues but seller tried to help.',
    'Product is fine. Communication could be better.',
    'Fair deal. Item has some wear not mentioned in listing.',
    'It\'s alright. Expected a bit more for the price.',
  ],
  2: [
    'Not as described. Disappointed with quality.',
    'Product had issues. Seller was slow to respond.',
    'Below expectations. Would not recommend.',
    'Some problems with the item. Not fully satisfied.',
    'Quality wasn\'t great. Be cautious with this listing.',
  ],
  1: [
    'Very poor experience. Product was damaged.',
    'Not as advertised. Do not buy!',
    'Terrible quality. Complete waste of money.',
    'Seller unresponsive. Had many issues.',
  ],
};

// Valid condition values
const CONDITIONS = ['new', 'used_like_new', 'used_good', 'used_fair'];

// Realistic Gambian marketplace listings data by category
const listingsData = {
  // Category ID 1: Electronics
  Electronics: [
    {
      title: 'Samsung Galaxy A54 - Like New',
      description: 'Samsung Galaxy A54 smartphone, 128GB storage, 6GB RAM. Used for only 3 months, comes with original charger and box. No scratches, perfect condition. Reason for selling: upgraded to new phone.',
      priceRange: [12000, 18000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'iPhone 12 Pro Max 256GB',
      description: 'iPhone 12 Pro Max in Pacific Blue. 256GB storage, battery health at 87%. Comes with case and charger. Face ID works perfectly. Minor scratches on back.',
      priceRange: [35000, 45000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'LG 43" Smart TV',
      description: 'LG 43 inch Smart TV with webOS. Full HD display, built-in WiFi, Netflix and YouTube apps. Remote control included. Perfect for living room.',
      priceRange: [15000, 22000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'HP Laptop 15 - Intel Core i5',
      description: 'HP Laptop 15 with Intel Core i5 processor, 8GB RAM, 256GB SSD. Windows 11 installed. Great for students and office work. Battery lasts 5-6 hours.',
      priceRange: [25000, 35000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'JBL Bluetooth Speaker',
      description: 'JBL Flip 5 portable Bluetooth speaker. Waterproof design, powerful bass. Battery lasts 12 hours. Perfect for outdoor gatherings and beach trips.',
      priceRange: [4500, 7000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'PlayStation 4 Slim 1TB',
      description: 'PS4 Slim 1TB with 2 controllers. Comes with FIFA 23 and GTA V. All cables included. Console in excellent condition, no issues.',
      priceRange: [18000, 25000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Canon EOS 2000D DSLR Camera',
      description: 'Canon EOS 2000D with 18-55mm lens. Perfect for beginners and photography enthusiasts. Includes camera bag and 32GB SD card. Shutter count: 5000.',
      priceRange: [20000, 28000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Hisense Air Conditioner 1.5HP',
      description: 'Hisense split AC 1.5HP. Energy efficient, cools room quickly. Used for one year. Installation can be arranged for additional fee.',
      priceRange: [18000, 25000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1631567091196-1ed09dab8f82?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 2: Clothing
  Clothing: [
    {
      title: 'Traditional Gambian Kaftan - Embroidered',
      description: 'Beautiful hand-embroidered kaftan in royal blue. Size XL. Perfect for ceremonies, Tobaski, and special occasions. Made by local tailors in Serrekunda.',
      priceRange: [1500, 3500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1583391733981-8b530c480628?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Ladies African Print Dress',
      description: 'Stunning Ankara print dress, custom made. Size M/L. Vibrant colors, perfect for weddings and parties. Only worn once.',
      priceRange: [800, 1800],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1590735213408-9d0bd tried?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Men\'s Business Suits - Various Sizes',
      description: 'Quality business suits imported from Turkey. Available in black, navy, and grey. Sizes 48-54. Price is per suit. Bulk discount available.',
      priceRange: [3500, 6000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Nike Air Force 1 - Size 43',
      description: 'Original Nike Air Force 1 white sneakers. Size EU 43 / US 9.5. Brand new in box, never worn. Bought from UK.',
      priceRange: [5000, 7500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Children\'s School Uniforms Bundle',
      description: 'School uniforms bundle: 3 shirts, 2 trousers/skirts, 1 sweater. Good condition, fits ages 8-10. From reputable school in Kanifing.',
      priceRange: [500, 1200],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Designer Handbag - Louis Vuitton Style',
      description: 'High quality designer-inspired handbag. Brown monogram print. Spacious interior with multiple pockets. Great for daily use.',
      priceRange: [1500, 3000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Adidas Tracksuit - Original',
      description: 'Original Adidas tracksuit, black with white stripes. Size L. Perfect for sports and casual wear. Bought from Sports Direct UK.',
      priceRange: [2500, 4000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Gold Plated Jewelry Set',
      description: 'Beautiful gold plated jewelry set: necklace, earrings, and bracelet. Perfect for weddings and special occasions. Comes in gift box.',
      priceRange: [2000, 4500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 3: Food & Produce
  'Food & Produce': [
    {
      title: 'Fresh Mangoes - Per Crate',
      description: 'Sweet and juicy Gambian mangoes, freshly picked. Price per crate (approximately 20kg). Perfect for juice making or eating fresh. Delivery available in Greater Banjul.',
      priceRange: [300, 600],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1553279768-865429fa0078?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Bag of Rice - 50kg Premium',
      description: 'Premium quality rice, 50kg bag. Long grain, perfect for benachin and other local dishes. Imported from Thailand. Wholesale price available.',
      priceRange: [1800, 2500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Fresh Fish - Bonga (Smoked)',
      description: 'Freshly smoked bonga fish from Tanji fish market. Price per bundle (20 pieces). Perfect for soup and stew. Very fresh, smoked today.',
      priceRange: [150, 350],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Groundnut Oil - 20 Liters',
      description: 'Pure Gambian groundnut oil, 20 liter container. Made locally, no additives. Perfect for cooking domoda and other traditional dishes.',
      priceRange: [1500, 2200],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1598511727379-4e1a082c3cd8?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Fresh Vegetables Bundle',
      description: 'Fresh vegetables bundle: tomatoes, onions, peppers, and okra. All locally grown. Perfect for a week\'s cooking. Pick up from Serrekunda market.',
      priceRange: [200, 450],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Homemade Baobab Juice - 5L',
      description: 'Delicious homemade baobab (bouye) juice. 5 liter container. Made fresh with natural ingredients. Very refreshing! Orders taken daily.',
      priceRange: [150, 300],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Cashew Nuts - 5kg Bag',
      description: 'Premium Gambian cashew nuts, roasted and salted. 5kg bag. Great for snacking or gifting. Export quality, processed locally.',
      priceRange: [1200, 1800],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1563292769-4e05b684851a?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1509340969496-0ca0e5a6bed5?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Palm Oil - 25 Liters',
      description: 'Pure red palm oil, 25 liter container. Unrefined, natural color and taste. Essential for traditional Gambian cooking.',
      priceRange: [1800, 2500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 4: Furniture
  Furniture: [
    {
      title: 'L-Shaped Sofa Set - Modern Design',
      description: 'Beautiful L-shaped sofa set in grey fabric. Seats 6-7 people comfortably. Less than 1 year old. Reason for selling: relocating. Pick up from Kololi.',
      priceRange: [25000, 40000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Wooden Dining Table with 6 Chairs',
      description: 'Solid mahogany dining table with 6 matching chairs. Handcrafted by local carpenter. Table size: 180cm x 90cm. Excellent condition.',
      priceRange: [18000, 28000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Queen Size Bed Frame with Mattress',
      description: 'Queen size wooden bed frame with orthopedic mattress. Bed frame is solid wood, mattress is 8 inches thick. Used for 2 years, still very comfortable.',
      priceRange: [15000, 22000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Office Desk with Chair',
      description: 'Modern office desk with executive chair. Desk has drawers and cable management. Chair is adjustable with lumbar support. Perfect for home office.',
      priceRange: [8000, 15000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Wardrobe - 3 Door with Mirror',
      description: 'Large 3-door wardrobe with center mirror. Plenty of hanging space and shelves. Light wood finish. Dimensions: 150cm W x 200cm H x 55cm D.',
      priceRange: [12000, 20000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Outdoor Plastic Chairs - Set of 10',
      description: 'Heavy duty plastic chairs, set of 10. Perfect for events, outdoor gatherings, or restaurant use. Stackable design. Various colors available.',
      priceRange: [2500, 4500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1503602642458-232111445657?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Kitchen Cabinet Set',
      description: 'Complete kitchen cabinet set: upper and lower cabinets. White finish with stainless steel handles. Includes sink cabinet. Professional installation available.',
      priceRange: [20000, 35000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Traditional Gambian Carved Stool',
      description: 'Beautiful hand-carved traditional Gambian stool. Made from solid wood by local artisan. Perfect as decorative piece or functional seating.',
      priceRange: [800, 2000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1549497538-303791108f95?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1503602642458-232111445657?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 5: Vehicles
  Vehicles: [
    {
      title: 'Toyota Corolla 2015 - Automatic',
      description: 'Toyota Corolla 2015 model, automatic transmission. Mileage: 85,000 km. Regular servicing at Toyota Gambia. AC works perfectly. New tires installed.',
      priceRange: [450000, 550000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Mercedes C-Class 2012',
      description: 'Mercedes Benz C200 2012. Leather interior, sunroof, navigation system. Well maintained, service history available. Minor scratches on bumper.',
      priceRange: [380000, 480000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Motorcycle - Bajaj Boxer 150',
      description: 'Bajaj Boxer 150cc motorcycle. 2022 model, low mileage. Perfect for deliveries or personal transport. Fuel efficient, easy to maintain.',
      priceRange: [35000, 50000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Ford Transit Van 2018',
      description: 'Ford Transit cargo van, 2018 model. Perfect for business deliveries. Diesel engine, economical. High roof model with plenty of cargo space.',
      priceRange: [550000, 700000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1570974270755-9c6c3788ab6e?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Land Cruiser Prado 2010',
      description: 'Toyota Land Cruiser Prado 2010, diesel. 7 seater, 4WD. Perfect for Gambian roads. Well maintained, strong engine. Ideal for family or tours.',
      priceRange: [650000, 850000],
      condition: 'used_fair',
      images: [
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Bicycle - Mountain Bike',
      description: 'Mountain bike, 21-speed gear system. Front suspension. Perfect for exercise or commuting. Minor wear on seat, otherwise excellent condition.',
      priceRange: [3500, 6000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Nissan Patrol 2008 - 4x4',
      description: 'Nissan Patrol 2008, 4.8L petrol engine. True off-road capability. Leather seats, cold AC. High mileage but mechanically sound.',
      priceRange: [400000, 520000],
      condition: 'used_fair',
      images: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Honda Accord 2014',
      description: 'Honda Accord 2014, 2.4L engine. Automatic transmission, cruise control. Very reliable and fuel efficient. Perfect condition inside and out.',
      priceRange: [420000, 520000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 6: Services
  Services: [
    {
      title: 'Professional Photography Services',
      description: 'Professional photography for weddings, events, portraits, and products. High quality equipment, edited photos delivered within 1 week. Packages starting from listed price.',
      priceRange: [2500, 8000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'AC Repair & Installation',
      description: 'Professional air conditioner repair, maintenance, and installation services. All brands serviced. Same-day service available. Free diagnosis with repair.',
      priceRange: [500, 2500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'House Cleaning Services',
      description: 'Professional house cleaning services. Deep cleaning, regular maintenance, move-in/move-out cleaning. Experienced and trustworthy cleaners. Price per session.',
      priceRange: [300, 800],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Private Tutoring - Math & Science',
      description: 'Experienced tutor offering private lessons in Mathematics and Science. WASSCE and IGCSE preparation. Flexible schedule. Online and in-person options available.',
      priceRange: [200, 500],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Catering Services - All Events',
      description: 'Professional catering for weddings, naming ceremonies, corporate events. Gambian and international cuisine. From 50 to 500 guests. Free tasting session.',
      priceRange: [5000, 25000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Car Mechanic Services',
      description: 'Experienced mechanic offering car repair services. Engine repair, electrical work, brake service, oil change. Mobile service available. Fair prices guaranteed.',
      priceRange: [300, 5000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Website Design & Development',
      description: 'Professional website design and development. E-commerce, business websites, portfolios. Mobile responsive design. Hosting setup included. Maintenance packages available.',
      priceRange: [8000, 25000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Event DJ & Sound System Rental',
      description: 'Professional DJ services with full sound system. Weddings, parties, corporate events. Latest music collection. Lighting effects included. Book early for weekends.',
      priceRange: [3000, 10000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 7: Agriculture
  Agriculture: [
    {
      title: 'Groundnut Seeds - 50kg Bag',
      description: 'High quality groundnut seeds for planting. Certified variety, good germination rate. Price per 50kg bag. Bulk orders welcome.',
      priceRange: [2500, 4000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1567892320421-1c657571ea4a?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Water Pump - 3 Inch Diesel',
      description: 'Diesel water pump, 3 inch outlet. Perfect for irrigation and farming. Pumps 1000 liters per minute. Used one season, excellent condition.',
      priceRange: [18000, 28000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Laying Hens - Rhode Island Red',
      description: 'Rhode Island Red laying hens, 6 months old. Good egg production. Price per bird, minimum order 10. Can deliver within Greater Banjul area.',
      priceRange: [250, 450],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1569428034239-f9565e32e224?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Tractor - Massey Ferguson 290',
      description: 'Massey Ferguson 290 tractor. Well maintained, new battery. Comes with plough attachment. Hours: 3500. Perfect for medium to large farms.',
      priceRange: [850000, 1200000],
      condition: 'used_fair',
      images: [
        'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1605002969827-9ac26e1b25e3?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Organic Fertilizer - Cow Manure',
      description: 'Well composted cow manure fertilizer. Excellent for vegetable gardens and crops. Price per truck load. Delivery available.',
      priceRange: [1500, 3000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1585314540237-13cb52f221e4?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1592722212832-fb88a5bb6bf9?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Goats for Sale - Healthy Stock',
      description: 'Healthy goats available for sale. Various sizes and ages. Good for breeding or meat. Vaccinated and dewormed. Price varies by size.',
      priceRange: [3000, 8000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1533318087102-b3ad366ed041?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Drip Irrigation Kit - 1 Acre',
      description: 'Complete drip irrigation system for 1 acre. Includes pipes, drippers, filters, and connectors. Water-saving technology. Installation guide included.',
      priceRange: [15000, 25000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Beehives with Bee Colonies',
      description: 'Langstroth beehives with established bee colonies. Great for honey production. Includes basic beekeeping equipment. Training available for beginners.',
      priceRange: [4000, 7000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=640&h=480&fit=crop',
      ],
    },
  ],

  // Category ID 8: Other
  Other: [
    {
      title: 'Generator - 5KVA Petrol',
      description: 'Firman 5KVA petrol generator. Low noise, fuel efficient. Electric start. Used for backup power. Serviced regularly. Ideal for home or small business.',
      priceRange: [180000, 250000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Solar Panel System - 1KW',
      description: 'Complete solar system: 4x 250W panels, inverter, charge controller, and batteries. Powers lights, TV, and fan. Professional installation available.',
      priceRange: [120000, 180000],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Gym Equipment Set',
      description: 'Home gym set: dumbbells (5-20kg), barbell with weights, bench press, exercise mat. Everything you need for home workouts. Barely used.',
      priceRange: [15000, 25000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Baby Crib with Mattress',
      description: 'Wooden baby crib with mattress. Adjustable height settings. Includes mosquito net. Used for 6 months, excellent condition. Great for newborns.',
      priceRange: [3500, 6000],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Books - University Textbooks Bundle',
      description: 'University textbooks: Business, Economics, and Law. From UTG courses. Good condition with some highlighting. Selling as bundle only.',
      priceRange: [800, 2000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Sewing Machine - Singer',
      description: 'Singer electric sewing machine. Industrial strength, handles all fabrics. Comes with accessories and carrying case. Perfect for tailoring business.',
      priceRange: [8000, 15000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1605289355680-75fb41239154?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Water Tank - 2000 Liters',
      description: 'Polytank water storage tank, 2000 liters capacity. Black color, UV resistant. Used for 1 year, no leaks. Includes tap fitting.',
      priceRange: [8000, 12000],
      condition: 'used_good',
      images: [
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=640&h=480&fit=crop',
      ],
    },
    {
      title: 'Tent - 6 Person Camping',
      description: '6 person camping tent. Waterproof, easy setup. Used twice for beach camping. Includes carry bag and stakes. Perfect for outdoor adventures.',
      priceRange: [3000, 5500],
      condition: 'used_like_new',
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=640&h=480&fit=crop',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=640&h=480&fit=crop',
      ],
    },
  ],
};

// Map category names to IDs (based on schema.sql order)
const categoryNameToId = {
  'Electronics': 1,
  'Clothing': 2,
  'Food & Produce': 3,
  'Furniture': 4,
  'Vehicles': 5,
  'Services': 6,
  'Agriculture': 7,
  'Other': 8,
};

async function seed() {
  console.log('Starting seed process...');

  try {
    // 1. Clear existing listings
    console.log('Clearing existing listings...');
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .not('id', 'is', null);

    if (deleteError) throw deleteError;
    console.log('Existing listings cleared.');

    // 2. Fetch required reference data
    console.log('Fetching users and regions...');
    
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.error('No users found in the "profiles" table. Please register at least one user before seeding.');
      process.exit(1);
    }

    const { data: regions, error: regionsError } = await supabase.from('regions').select('id');
    if (regionsError) throw regionsError;

    // 3. Generate listings from predefined data
    console.log(`Generating listings across ${profiles.length} user(s)...`);
    const listings = [];

    // Create multiple listings from each category
    for (const [categoryName, categoryListings] of Object.entries(listingsData)) {
      const categoryId = categoryNameToId[categoryName];
      
      for (const listing of categoryListings) {
        // Create 1-2 copies of each listing with variations
        const copies = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < copies; i++) {
          const randomUser = randomElement(profiles).id;
          const randomRegion = randomElement(regions).id;
          const price = randomPrice(listing.priceRange[0], listing.priceRange[1]);
          const image = randomElement(listing.images);
          
          listings.push({
            user_id: randomUser,
            title: listing.title,
            description: listing.description,
            price: price,
            condition: listing.condition,
            category_id: categoryId,
            region_id: randomRegion,
            contact: generateGambianPhone(),
            image_url: image,
          });
        }
      }
    }

    // Shuffle listings to mix categories
    for (let i = listings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [listings[i], listings[j]] = [listings[j], listings[i]];
    }

    // 4. Insert into database
    console.log(`Inserting ${listings.length} listings into the database...`);
    const { error: insertError } = await supabase.from('listings').insert(listings);

    if (insertError) throw insertError;

    console.log(`Successfully seeded ${listings.length} listings!`);
    
    // Print summary by category
    console.log('\nListings by category:');
    const categoryCounts = {};
    for (const listing of listings) {
      const catName = Object.keys(categoryNameToId).find(k => categoryNameToId[k] === listing.category_id);
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(categoryCounts)) {
      console.log(`  ${cat}: ${count}`);
    }

    // 5. Generate reviews for listings
    console.log('\nGenerating reviews...');
    
    // Clear existing reviews first
    const { error: deleteReviewsError } = await supabase
      .from('reviews')
      .delete()
      .not('id', 'is', null);
    
    if (deleteReviewsError) {
      console.warn('Could not clear existing reviews (table may not exist):', deleteReviewsError.message);
    } else {
      console.log('Existing reviews cleared.');
    }

    // Fetch inserted listings to get their IDs
    const { data: insertedListings, error: fetchListingsError } = await supabase
      .from('listings')
      .select('id, user_id');
    
    if (fetchListingsError) throw fetchListingsError;

    const reviews = [];
    
    // Generate reviews for approximately 60% of listings
    for (const listing of insertedListings) {
      // Skip some listings (40% won't have reviews)
      if (Math.random() < 0.4) continue;
      
      // Get potential reviewers (users who are NOT the listing owner)
      const potentialReviewers = profiles.filter(p => p.id !== listing.user_id);
      if (potentialReviewers.length === 0) continue;
      
      // Generate 1-4 reviews per listing
      const numReviews = randomInt(1, Math.min(4, potentialReviewers.length));
      const selectedReviewers = [...potentialReviewers]
        .sort(() => Math.random() - 0.5)
        .slice(0, numReviews);
      
      for (const reviewer of selectedReviewers) {
        // Weight ratings towards positive (more 4-5 stars)
        const ratingWeights = [1, 2, 3, 4, 4, 4, 5, 5, 5, 5];
        const rating = randomElement(ratingWeights);
        
        // 70% of reviews have comments
        const hasComment = Math.random() < 0.7;
        const comment = hasComment ? randomElement(reviewComments[rating]) : null;
        
        reviews.push({
          listing_id: listing.id,
          reviewer_id: reviewer.id,
          rating,
          comment,
        });
      }
    }

    if (reviews.length > 0) {
      const { error: insertReviewsError } = await supabase
        .from('reviews')
        .insert(reviews);
      
      if (insertReviewsError) {
        console.warn('Could not insert reviews:', insertReviewsError.message);
      } else {
        console.log(`Successfully seeded ${reviews.length} reviews!`);
        
        // Print review stats
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => ratingCounts[r.rating]++);
        console.log('\nReviews by rating:');
        for (const [rating, count] of Object.entries(ratingCounts)) {
          const stars = '★'.repeat(parseInt(rating)) + '☆'.repeat(5 - parseInt(rating));
          console.log(`  ${stars}: ${count}`);
        }
        
        const withComments = reviews.filter(r => r.comment).length;
        console.log(`\nReviews with comments: ${withComments}/${reviews.length}`);
      }
    }
    
  } catch (err) {
    console.error('An error occurred during seeding:', err);
  }
}

seed();
