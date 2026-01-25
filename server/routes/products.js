const express = require('express');
const router = express.Router();

const { db } = require('../services/firebaseService');

// GET /api/products - Get all products (exams with dates)
router.get('/', async (req, res) => {
  try {
    // Try with orderBy, fallback to simple get if index not created
    let snapshot;
    try {
      snapshot = await db.collection('products').orderBy('exam', 'asc').get();
    } catch (orderError) {
      // If orderBy fails (index not created), just get all without ordering
      snapshot = await db.collection('products').get();
    }
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory as fallback
    products.sort((a, b) => (a.exam || '').localeCompare(b.exam || ''));
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:examId - Get specific product
router.get('/:examId', async (req, res) => {
  try {
    const doc = await db.collection('products').doc(req.params.examId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ product: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products - Create a new product (admin only)
router.post('/', async (req, res) => {
  try {
    const { exam, dates, description, offers, price } = req.body;
    
    if (!exam || !dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Exam name and at least one date are required' });
    }

    const parsedPrice = price != null && price !== '' ? parseFloat(price) : undefined;
    const productData = {
      exam,
      dates: dates.map(date => ({ date, available: true })),
      description: description || '',
      offers: offers || [],
      price: parsedPrice != null && !Number.isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('products').add(productData);
    res.status(201).json({ 
      message: 'Product created successfully',
      product: { id: docRef.id, ...productData }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:examId - Update a product (admin only)
router.put('/:examId', async (req, res) => {
  try {
    const { dates, description, offers, price } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (dates) updateData.dates = dates.map(date => typeof date === 'string' ? { date, available: true } : date);
    if (description !== undefined) updateData.description = description;
    if (offers) updateData.offers = offers;
    if (price !== undefined) {
      const p = price !== '' && price != null ? parseFloat(price) : null;
      updateData.price = p != null && !Number.isNaN(p) && p >= 0 ? p : null;
    }

    await db.collection('products').doc(req.params.examId).update(updateData);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:examId - Delete a product (admin only)
router.delete('/:examId', async (req, res) => {
  try {
    await db.collection('products').doc(req.params.examId).delete();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
