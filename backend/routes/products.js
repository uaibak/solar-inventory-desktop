const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateProduct = [
  body('name').notEmpty().trim(),
  body('brand').optional(),
  body('model').optional(),
  body('watt_capacity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }),
  body('category_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('supplier_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('barcode').optional(),
  body('purchase_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  body('sale_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('minimum_stock').optional().isInt({ min: 0 })
];

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.supplier_id) filters.supplier_id = req.query.supplier_id;
    if (req.query.search) filters.search = req.query.search;

    const products = await Product.findAll(filters);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post('/', authenticate, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticate, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.update(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await Product.delete(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock products
router.get('/low-stock/all', authenticate, async (req, res) => {
  try {
    const products = await Product.getLowStock();
    res.json(products);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory value
router.get('/inventory/value', authenticate, async (req, res) => {
  try {
    const value = await Product.getInventoryValue();
    res.json(value);
  } catch (error) {
    console.error('Get inventory value error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
