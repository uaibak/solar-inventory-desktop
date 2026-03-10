const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateSale = [
  body('customer_id').optional().isInt(),
  body('total_amount').isFloat({ min: 0 }),
  body('payment_method').optional().isIn(['cash', 'card', 'bank_transfer']),
  body('sale_date').optional().isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
  body('items.*.subtotal').isFloat({ min: 0 })
];

// Get all sales
router.get('/', authenticate, async (req, res) => {
  try {
    const sales = await Sale.findAll();
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sale by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sale
router.post('/', authenticate, validateSale, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sale = await Sale.create(req.body);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent sales
router.get('/recent/:limit?', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const sales = await Sale.getRecent(limit);
    res.json(sales);
  } catch (error) {
    console.error('Get recent sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales by date range
router.get('/date-range/:start/:end', authenticate, async (req, res) => {
  try {
    const sales = await Sale.getSalesByDateRange(req.params.start, req.params.end);
    res.json(sales);
  } catch (error) {
    console.error('Get sales by date range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's sales total
router.get('/today/total', authenticate, async (req, res) => {
  try {
    const total = await Sale.getTodaySales();
    res.json({ total });
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly sales total
router.get('/monthly/total', authenticate, async (req, res) => {
  try {
    const total = await Sale.getMonthlySales();
    res.json({ total });
  } catch (error) {
    console.error('Get monthly sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;