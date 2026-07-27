import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bstyuyzlhrkskeqpypka.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const siteUrl = process.env.VITE_SITE_URL || 'https://qureshijewelers.com';

const supabase = createClient(supabaseUrl, supabaseKey!);

interface Product {
  slug: string;
  updated_at: string;
  is_active: boolean;
}

async function generateSitemap() {
  console.log('Fetching products...');
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, updated_at, is_active')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  const urls: string[] = [
    // Static pages
    `<url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${siteUrl}/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${siteUrl}/shop?type=necklace</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${siteUrl}/shop?type=bracelet</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${siteUrl}/shop?type=earring</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${siteUrl}/shop?type=ring</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${siteUrl}/moissanite-guide</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
  ];

  // Product pages
  products?.forEach((product: Product) => {
    const lastmod = product.updated_at ? product.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
    urls.push(
      `<url><loc>${siteUrl}/product/${product.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  console.log(`Generated sitemap with ${urls.length} URLs`);
  console.log(sitemap);
  
  return sitemap;
}

generateSitemap()
  .then(sitemap => {
    // Write to public directory
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, sitemap);
    console.log(`Sitemap written to ${outputPath}`);
  })
  .catch(console.error);
