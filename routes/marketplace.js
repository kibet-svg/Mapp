const express = require('express');
const Product = require('../models/Product');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      location,
      condition,
      minPrice,
      maxPrice,
      search,
      isService,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isAvailable: true };

    // Add filters
    if (category) query.category = category;
    if (location) query.location = new RegExp(location, 'i');
    if (condition) query.condition = condition;
    if (isService !== undefined) query.isService = isService === 'true';
    
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('seller', 'username avatar location')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username avatar bio location')
      .populate('reviews.user', 'username avatar')
      .populate('favorites', 'username avatar');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Create a new product/service
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      isService,
      serviceDetails,
      images,
      tags
    } = req.body;

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      location,
      isService: isService || false,
      serviceDetails: isService ? serviceDetails : undefined,
      images: images || [],
      tags: tags || [],
      seller: req.user._id
    });

    await product.save();
    await product.populate('seller', 'username avatar');

    res.status(201).json({
      message: isService ? 'Service posted successfully' : 'Product posted successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// Update a product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('seller', 'username avatar');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// Delete a product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// Add review to product
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    await product.save();
    await product.populate('reviews.user', 'username avatar');

    res.json({
      message: 'Review added successfully',
      review: product.reviews[product.reviews.length - 1]
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

// Add/Remove from favorites
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const favoriteIndex = product.favorites.indexOf(req.user._id);

    if (favoriteIndex > -1) {
      // Remove from favorites
      product.favorites.splice(favoriteIndex, 1);
    } else {
      // Add to favorites
      product.favorites.push(req.user._id);
    }

    await product.save();

    res.json({
      message: favoriteIndex > -1 ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: favoriteIndex === -1
    });
  } catch (error) {
    console.error('Favorite product error:', error);
    res.status(500).json({ message: 'Server error updating favorites' });
  }
});

// Get user's products
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({
      seller: req.params.userId,
      isAvailable: true
    })
      .populate('seller', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments({
      seller: req.params.userId,
      isAvailable: true
    });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({ message: 'Server error fetching user products' });
  }
});

// Get user's favorites
router.get('/favorites/my', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({
      favorites: req.user._id,
      isAvailable: true
    })
      .populate('seller', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments({
      favorites: req.user._id,
      isAvailable: true
    });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
});

module.exports = router;