const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateSupplier = [
  body('name').notEmpty().trim(),
  body('company').optional(),
  body('phone').optional(),
  body('email').optional().isEmail(),
  body('address').optional()
];

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier purchase history
router.get('/:id/purchases', authenticate, async (req, res) => {
  try {
    const purchases = await Supplier.getPurchaseHistory(req.params.id);
    res.json(purchases);
  } catch (error) {
    console.error('Get supplier purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create supplier
router.post('/', authenticate, validateSupplier, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', authenticate, validateSupplier, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await Supplier.update(req.params.id, req.body);
    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete supplier
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await Supplier.delete(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;