import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Blog, { BlogStatus } from '../models/Blog.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Utility function to generate URL-friendly slug from title
// Converts title to lowercase, replaces spaces with hyphens, removes special characters
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to generate unique slug
// If slug already exists, append a number to make it unique
async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // MongoDB query filter type - can include slug and optional _id filter
    const query: { slug: string; _id?: { $ne: string } } = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await Blog.findOne(query);
    if (!existing) {
      return slug;
    }
    
    // Slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Validation middleware for blog creation
const createBlogValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be 1-500 characters'),
  body('coverImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // Allow empty string or valid URL
      if (!value || value === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Cover image URL must be a valid URL');
      }
    }),
  body('excerpt')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // Allow empty string or undefined
      if (!value || value === '') return true;
      // Check length if value exists
      if (value.length > 1000) {
        throw new Error(`Excerpt must be less than 1000 characters (current: ${value.length})`);
      }
      return true;
    }),
  body('content')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional()
    .isIn(Object.values(BlogStatus))
    .withMessage('Status must be either draft or published')
];

// Validation middleware for blog updates
const updateBlogValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be 1-500 characters'),
  body('coverImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // Allow empty string or valid URL
      if (!value || value === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Cover image URL must be a valid URL');
      }
    }),
  body('excerpt')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // Allow empty string or undefined
      if (!value || value === '') return true;
      // Check length if value exists
      if (value.length > 1000) {
        throw new Error(`Excerpt must be less than 1000 characters (current: ${value.length})`);
      }
      return true;
    }),
  body('content')
    .optional({ checkFalsy: true })
    .trim(),
  body('status')
    .optional()
    .isIn(Object.values(BlogStatus))
    .withMessage('Status must be either draft or published')
];

// POST /api/blogs - Create a new blog post
// Only ADMIN, STAFF, or PROVIDER roles can create blogs
router.post('/', authenticateToken, createBlogValidation, async (req: AuthRequest, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return detailed validation errors to help debug
      // Type assertion for express-validator field errors which have a 'value' property
      interface FieldError {
        type: 'field';
        path: string;
        msg: string;
        value?: unknown;
      }
      const errorMessages = errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? (err as FieldError).value : undefined
      }));
      
      console.error('Blog creation validation failed:', errorMessages);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: errorMessages,
        details: errors.array()
      });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has permission to create blogs
    // Allow ADMIN, STAFF, and PROVIDER roles
    if (!req.user.role || ![UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins, staff, and providers can create blogs' });
    }

    // Extract blog data from request body
    const {
      title,
      coverImageUrl,
      excerpt,
      content,
      status
    } = req.body;

    // Generate slug from title
    const baseSlug = generateSlug(title);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // Create new blog post with slug
    const blog = await Blog.create({
      title,
      slug: uniqueSlug,
      coverImageUrl: coverImageUrl || undefined,
      excerpt: excerpt || undefined,
      content: content || undefined,
      status: status || BlogStatus.DRAFT,
      author: req.user.id
    });

    // Populate author information for response
    await blog.populate('author', 'firstName lastName email');

    res.status(201).json({
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to optionally authenticate (doesn't fail if no token)
const optionalAuthenticate = async (req: AuthRequest): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Try to authenticate, but don't throw if it fails
      // We'll use a similar approach to authenticateToken but handle errors gracefully
      const { adminAuth } = await import('../firebase-admin.js');
      const User = (await import('../models/User.js')).default;
      
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const user = await User.findOne({
          $or: [
            { firebaseUid: decodedToken.uid },
            { email: decodedToken.email }
          ]
        }).select('-password');
        
        if (user) {
          req.user = {
            id: (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          };
        }
      } catch {
        // Ignore auth errors for optional auth - just continue without user
        // This allows public access to published blogs
      }
    }
  } catch {
    // Ignore errors - continue without authentication
  }
};

// GET /api/blogs - Get all published blogs (public) or all blogs (for admins/staff)
// Supports query params: status, author (for filtering by author), page, limit
// Authentication is optional - public can see published, authenticated can see more
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Try to authenticate if token is present (optional)
    await optionalAuthenticate(req);
    
    // Build filter based on authentication and query params
    let filter: { status?: BlogStatus | { $in: BlogStatus[] }; author?: string } = {};
    
    // Check if user is authenticated (might be null for public access)
    const isAuthenticated = !!req.user;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    // Get query parameters
    const status = req.query.status as string;
    const authorId = req.query.author as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100; // Increased limit for admin dashboard
    const skip = (page - 1) * limit;

    // If status is specified in query, use it (for authenticated users)
    if (status && isAuthenticated) {
      if (status === 'draft' || status === 'published') {
        filter.status = status as BlogStatus;
      } else if (status === 'all') {
        // Show both draft and published
        filter.status = { $in: [BlogStatus.DRAFT, BlogStatus.PUBLISHED] };
      }
    }
    
    // Filter by author if specified
    if (authorId && isAuthenticated) {
      filter.author = authorId;
    }

    // If not authenticated, only show published blogs
    if (!isAuthenticated) {
      filter.status = BlogStatus.PUBLISHED;
    } else {
      // For authenticated users:
      // - Admin/Staff/Provider can see all blogs (their own + all published)
      // - Others can see published + their own drafts
      if (!status) {
        // Default: show published + user's own drafts
        if ([UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER].includes(userRole!)) {
          // Admin/Staff/Provider see all blogs if no status filter
          filter = {}; // No status filter = show all
        } else {
          // Regular users see published + their own drafts
          filter.status = { $in: [BlogStatus.PUBLISHED] };
          if (userId) {
            filter.author = userId;
            filter.status = { $in: [BlogStatus.DRAFT, BlogStatus.PUBLISHED] };
          }
        }
      } else if (status === 'draft') {
        // When filtering drafts, only show user's own drafts (unless admin/staff)
        if (![UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER].includes(userRole!)) {
          if (userId) {
            filter.author = userId;
          }
        }
      }
    }

    // Fetch blogs
    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Blog.countDocuments(filter);

    res.json({
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/:id - Get a single blog post by ID or slug
// Supports both MongoDB ObjectId and slug-based URLs
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to authenticate if token is present (optional)
    await optionalAuthenticate(req);

    // Check if the id is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let blog;
    if (isObjectId) {
      // Try to find by ID first
      blog = await Blog.findById(id).populate('author', 'firstName lastName email');
    }
    
    // If not found by ID or not an ObjectId, try to find by slug
    if (!blog) {
      blog = await Blog.findOne({ slug: id.toLowerCase() }).populate('author', 'firstName lastName email');
    }

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // CRITICAL: Auto-generate slug for existing blogs that don't have one
    // This ensures all blogs have slugs for clean URLs
    if (!blog.slug || !blog.slug.trim()) {
      const baseSlug = generateSlug(blog.title);
      // Cast _id to Types.ObjectId to fix TypeScript type inference after populate
      const uniqueSlug = await generateUniqueSlug(baseSlug, (blog._id as Types.ObjectId).toString());
      blog.slug = uniqueSlug;
      await blog.save(); // Save the slug to database
    }

    // If blog is draft, only allow author, admin, or staff to view
    if (blog.status === BlogStatus.DRAFT) {
      if (!req.user) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if user is the author, admin, or staff
      const isAuthor = blog.author.toString() === req.user.id;
      const isAdminOrStaff = req.user.role === UserRole.ADMIN || req.user.role === UserRole.STAFF;
      
      if (!isAuthor && !isAdminOrStaff) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/blogs/:id - Update a blog post
router.patch('/:id', authenticateToken, updateBlogValidation, async (req: AuthRequest, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return detailed validation errors to help debug
      // Type assertion for express-validator field errors which have a 'value' property
      interface FieldError {
        type: 'field';
        path: string;
        msg: string;
        value?: unknown;
      }
      const errorMessages = errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? (err as FieldError).value : undefined
      }));
      
      console.error('Blog update validation failed:', errorMessages);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: errorMessages,
        details: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Find the blog
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check permissions: only author, admin, or staff can update
    const isAuthor = blog.author.toString() === req.user.id;
    const isAdminOrStaff = req.user.role === UserRole.ADMIN || req.user.role === UserRole.STAFF;

    if (!isAuthor && !isAdminOrStaff) {
      return res.status(403).json({ error: 'You do not have permission to update this blog' });
    }

    // Update blog fields
    const updateData: {
      title?: string;
      slug?: string;
      coverImageUrl?: string;
      excerpt?: string;
      content?: string;
      status?: BlogStatus;
    } = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
      // Regenerate slug if title changed
      const baseSlug = generateSlug(req.body.title);
      updateData.slug = await generateUniqueSlug(baseSlug, id);
    }
    if (req.body.coverImageUrl !== undefined) {
      updateData.coverImageUrl = req.body.coverImageUrl && req.body.coverImageUrl.trim() 
        ? req.body.coverImageUrl.trim() 
        : undefined;
    }
    if (req.body.excerpt !== undefined) {
      updateData.excerpt = req.body.excerpt && req.body.excerpt.trim() 
        ? req.body.excerpt.trim() 
        : undefined;
    }
    if (req.body.content !== undefined) {
      updateData.content = req.body.content && req.body.content.trim() 
        ? req.body.content.trim() 
        : undefined;
    }
    if (req.body.status !== undefined) {
      // Ensure status is lowercase to match enum values
      updateData.status = (req.body.status.toLowerCase() === 'published' 
        ? BlogStatus.PUBLISHED 
        : BlogStatus.DRAFT) as BlogStatus;
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email');

    res.json({
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/blogs/:id - Delete a blog post
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Find the blog
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check permissions: only author, admin, or staff can delete
    const isAuthor = blog.author.toString() === req.user.id;
    const isAdminOrStaff = req.user.role === UserRole.ADMIN || req.user.role === UserRole.STAFF;

    if (!isAuthor && !isAdminOrStaff) {
      return res.status(403).json({ error: 'You do not have permission to delete this blog' });
    }

    // Delete the blog
    await Blog.findByIdAndDelete(id);

    res.json({
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

