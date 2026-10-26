const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Middleware to check database connection status
const requireSupabase = (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.',
      configured: false
    });
  }
  next();
};

// Check backend & Supabase configuration status
app.get('/api/config-status', (req, res) => {
  res.json({
    status: 'ok',
    configured: isSupabaseConfigured,
    supabaseUrl: isSupabaseConfigured ? supabaseUrl.replace(/\/\/[^.]*/, '//***') : null,
    message: isSupabaseConfigured 
      ? 'Connected to Supabase' 
      : 'Supabase credentials missing in .env'
  });
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Helper validation function
function validateProductInput(body) {
  const { name, category, quantity, price, description } = body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Product name is required.');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required.');
  }

  const numQuantity = Number(quantity);
  if (quantity === undefined || quantity === null || isNaN(numQuantity) || numQuantity < 0 || !Number.isInteger(numQuantity)) {
    errors.push('Quantity must be a valid non-negative integer.');
  }

  const numPrice = Number(price);
  if (price === undefined || price === null || isNaN(numPrice) || numPrice < 0) {
    errors.push('Price must be a valid non-negative number.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: name ? name.trim() : '',
      category: category ? category.trim() : '',
      quantity: numQuantity,
      price: Math.round(numPrice * 100) / 100,
      description: description ? description.trim() : ''
    }
  };
}

// Handler: GET all products
async function getAllProducts(req, res) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching products:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('Server error fetching products:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching products.' });
  }
}

// Handler: GET single product by ID
async function getProductById(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Product ID is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: `Product with ID '${id}' not found.` });
      }
      console.error('Supabase error fetching product:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Server error fetching product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// Handler: POST add new product
async function createProduct(req, res) {
  const validation = validateProductInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors
    });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: validation.sanitized.name,
          category: validation.sanitized.category,
          quantity: validation.sanitized.quantity,
          price: validation.sanitized.price,
          description: validation.sanitized.description
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating product:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      data
    });
  } catch (err) {
    console.error('Server error creating product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// Handler: PUT update existing product
async function updateProduct(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Product ID is required.' });
  }

  const validation = validateProductInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors
    });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: validation.sanitized.name,
        category: validation.sanitized.category,
        quantity: validation.sanitized.quantity,
        price: validation.sanitized.price,
        description: validation.sanitized.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating product:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: `Product with ID '${id}' not found.` });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data
    });
  } catch (err) {
    console.error('Server error updating product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// Handler: DELETE product
async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Product ID is required.' });
  }

  try {
    // Delete product from Supabase
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error deleting product:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: `Product with ID '${id}' not found.` });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully!',
      data: data[0]
    });
  } catch (err) {
    console.error('Server error deleting product:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// Mount REST routes (both `/products` and `/api/products` for full compatibility)
app.get('/products', requireSupabase, getAllProducts);
app.get('/products/:id', requireSupabase, getProductById);
app.post('/products', requireSupabase, createProduct);
app.put('/products/:id', requireSupabase, updateProduct);
app.delete('/products/:id', requireSupabase, deleteProduct);

app.get('/api/products', requireSupabase, getAllProducts);
app.get('/api/products/:id', requireSupabase, getProductById);
app.post('/api/products', requireSupabase, createProduct);
app.put('/api/products/:id', requireSupabase, updateProduct);
app.delete('/api/products/:id', requireSupabase, deleteProduct);

// Fallback for SPA/Frontend direct navigation
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// Start Server (only when run directly or not on Vercel)
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Inventory Management Server is running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📊 Database Status: ${isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Not Configured'}`);
    if (!isSupabaseConfigured) {
      console.log(`⚠️  Please add SUPABASE_URL & SUPABASE_ANON_KEY to .env`);
    }
    console.log(`=================================================`);
  });
}

// Export app for Vercel serverless deployment
module.exports = app;

