const productsApiUrl = process.env.PRODUCTS_API_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function readProductsFromSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/products?select=id,title,description,image,price,available`;
  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function readProductsFromApi() {
  if (productsApiUrl) {
    const response = await fetch(productsApiUrl, { headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  return readProductsFromSupabase();
}

function normalizeProduct(product, index) {
  return {
    id: product.id ?? product.slug ?? index + 1,
    title: product.title ?? product.name ?? 'Producto disponible',
    description: product.description ?? 'Consulta disponibilidad y características.',
    image: product.image ?? product.image_url ?? product.url ?? '',
    price: product.price ?? 'Consultar',
    available: product.available ?? product.stock ?? true
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const products = await readProductsFromApi();
    const normalized = Array.isArray(products) ? products.map(normalizeProduct) : [];
    res.status(200).json(normalized);
  } catch (error) {
    res.status(200).json([]);
  }
};
