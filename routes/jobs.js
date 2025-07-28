const express = require('express');
const Job = require('../models/Job');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get all jobs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      jobType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    // Add filters
    if (category) query.category = category;
    if (location) query.location = new RegExp(location, 'i');
    if (jobType) query.jobType = jobType;
    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .populate('postedBy', 'username avatar')
      .populate('comments.user', 'username avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalJobs: total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
});

// Get a single job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'username avatar bio location')
      .populate('comments.user', 'username avatar')
      .populate('applicants.user', 'username avatar')
      .populate('likes', 'username avatar')
      .populate('shares.user', 'username avatar');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error fetching job' });
  }
});

// Create a new job
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      company,
      location,
      salary,
      jobType,
      category,
      skills,
      requirements,
      benefits
    } = req.body;

    const job = new Job({
      title,
      description,
      company,
      location,
      salary,
      jobType,
      category,
      skills: skills || [],
      requirements: requirements || [],
      benefits: benefits || [],
      postedBy: req.user._id
    });

    await job.save();
    await job.populate('postedBy', 'username avatar');

    res.status(201).json({
      message: 'Job posted successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
});

// Update a job
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the owner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'username avatar');

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error updating job' });
  }
});

// Delete a job
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the owner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
});

// Apply for a job
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied
    const alreadyApplied = job.applicants.some(
      applicant => applicant.user.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    job.applicants.push({ user: req.user._id });
    await job.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Server error applying for job' });
  }
});

// Add comment to job
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.comments.push({
      user: req.user._id,
      text
    });

    await job.save();
    await job.populate('comments.user', 'username avatar');

    res.json({
      message: 'Comment added successfully',
      comment: job.comments[job.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// Like/Unlike a job
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const likeIndex = job.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike
      job.likes.splice(likeIndex, 1);
    } else {
      // Like
      job.likes.push(req.user._id);
    }

    await job.save();

    res.json({
      message: likeIndex > -1 ? 'Job unliked' : 'Job liked',
      likesCount: job.likes.length
    });
  } catch (error) {
    console.error('Like job error:', error);
    res.status(500).json({ message: 'Server error liking job' });
  }
});

// Share a job
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.shares.push({ user: req.user._id });
    await job.save();

    res.json({
      message: 'Job shared successfully',
      sharesCount: job.shares.length
    });
  } catch (error) {
    console.error('Share job error:', error);
    res.status(500).json({ message: 'Server error sharing job' });
  }
});

module.exports = router;