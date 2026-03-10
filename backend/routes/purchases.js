const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validatePurchase = [
  body('supplier_id').isInt(),
  body('total_amount').isFloat({ min: 0 }),
  body('purchase_date').optional().isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
  body('items.*.subtotal').isFloat({ min: 0 })
];

// Get all purchases
router.get('/', authenticate, async (req, res) => {
  try {
    const purchases = await Purchase.findAll();
    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get purchase by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase
router.post('/', authenticate, validatePurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const purchase = await Purchase.create(req.body);
    res.status(201).json(purchase);
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent purchases
router.get('/recent/:limit?', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const purchases = await Purchase.getRecent(limit);
    res.json(purchases);
  } catch (error) {
    console.error('Get recent purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;