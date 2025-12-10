import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Blog, { BlogStatus, IBlog } from '../models/Blog.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { getS3Url } from '../utils/s3.js';

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
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      // Allow empty array
      if (!images || images.length === 0) return true;
      // Validate each image URL
      for (const url of images) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
          throw new Error('Each image URL must be a non-empty string');
        }
        try {
          new URL(url);
        } catch {
          throw new Error(`Invalid image URL: ${url}`);
        }
      }
      return true;
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
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      // Allow empty array
      if (!images || images.length === 0) return true;
      // Validate each image URL
      for (const url of images) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
          throw new Error('Each image URL must be a non-empty string');
        }
        try {
          new URL(url);
        } catch {
          throw new Error(`Invalid image URL: ${url}`);
        }
      }
      return true;
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
// Any authenticated user can create blogs
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
    // Any authenticated user can create blogs
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Extract blog data from request body
    const {
      title,
      coverImageUrl,
      images,
      excerpt,
      content,
      status
    } = req.body;

    // Generate slug from title
    const baseSlug = generateSlug(title);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // Process images array - filter out empty strings and validate
    const processedImages = Array.isArray(images) 
      ? images.filter((url: string) => url && typeof url === 'string' && url.trim() !== '')
      : [];

    // Normalize status to ensure it matches the enum value
    // Handle both string and enum values, defaulting to DRAFT
    let normalizedStatus = BlogStatus.DRAFT;
    if (status) {
      const statusLower = typeof status === 'string' ? status.toLowerCase().trim() : String(status).toLowerCase().trim();
      if (statusLower === 'published' || statusLower === BlogStatus.PUBLISHED) {
        normalizedStatus = BlogStatus.PUBLISHED;
      } else {
        // Default to DRAFT for any other value or if explicitly 'draft'
        normalizedStatus = BlogStatus.DRAFT;
      }
    }

    // Ensure author is converted to ObjectId for proper MongoDB storage
    let authorObjectId: Types.ObjectId;
    try {
      authorObjectId = new Types.ObjectId(req.user.id);
    } catch (error) {
      console.error('Error converting author to ObjectId:', error, 'userId:', req.user.id);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Create new blog post with slug
    const blog = await Blog.create({
      title,
      slug: uniqueSlug,
      coverImageUrl: coverImageUrl || undefined,
      images: processedImages.length > 0 ? processedImages : undefined,
      excerpt: excerpt || undefined,
      content: content || undefined,
      status: normalizedStatus, // Use normalized status (enum value)
      author: authorObjectId // Use ObjectId for proper MongoDB storage
    });
    
    // Debug log to verify status is saved correctly
    console.log('Blog created:', {
      id: (blog._id as Types.ObjectId).toString(),
      title: blog.title,
      status: blog.status,
      statusValue: String(blog.status),
      author: blog.author.toString(),
      authorType: blog.author.constructor?.name
    });

    // Populate author information for response
    await blog.populate('author', 'firstName lastName email');

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedBlog = {
      ...blog.toObject(),
      coverImageUrl: blog.coverImageUrl ? (blog.coverImageUrl.startsWith('http') ? blog.coverImageUrl : getS3Url(blog.coverImageUrl)) : undefined,
      images: blog.images && Array.isArray(blog.images) ? blog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    };

    res.status(201).json({
      message: 'Blog created successfully',
      data: transformedBlog
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

// GET /api/blogs - Get all published blogs (public) or all blogs (for admins)
// Supports query params: status, author (for filtering by author), page, limit
// Authentication is optional - public can see published, authenticated users see published + their own drafts, admins see all
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Try to authenticate if token is present (optional)
    await optionalAuthenticate(req);
    
    // Build filter based on authentication and query params
    let filter: { status?: BlogStatus | { $in: BlogStatus[] }; author?: Types.ObjectId | string } = {};
    
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

    // CRITICAL: For non-admin users, always filter by their own author ID first
    // This ensures provider, staff, and customer users only see their own blogs
    // This filter MUST be applied regardless of status to prevent users from seeing other users' blogs
    if (isAuthenticated && userRole !== UserRole.ADMIN && userId) {
      // Non-admin users: always filter by their own ID (ignore authorId from query params for security)
      // Convert userId to ObjectId for proper MongoDB comparison
      try {
        filter.author = new Types.ObjectId(userId);
      } catch (error) {
        // If conversion fails, use string (shouldn't happen but safety check)
        console.error('Error converting userId to ObjectId:', error, 'userId:', userId);
        filter.author = userId;
      }
    } else if (authorId && isAuthenticated && userRole === UserRole.ADMIN) {
      // Admin can filter by specific author if authorId is provided in query params
      try {
        filter.author = new Types.ObjectId(authorId);
      } catch (error) {
        console.error('Error converting authorId to ObjectId:', error, 'authorId:', authorId);
        filter.author = authorId;
      }
    } else if (authorId && isAuthenticated) {
      // If authorId is provided but user is not admin, this shouldn't happen for non-admin users
      // But if it does, we should still filter by their own ID for security
      // This is a safety check
      if (userRole !== UserRole.ADMIN && userId) {
        try {
          filter.author = new Types.ObjectId(userId);
        } catch (error) {
          console.error('Error converting userId to ObjectId (fallback):', error);
          filter.author = userId;
        }
      }
    }
    
    // CRITICAL: If authorId is provided in query for non-admin users, override with their own ID for security
    // This ensures non-admin users can't see other users' blogs even if they try to manipulate the query
    if (isAuthenticated && userRole !== UserRole.ADMIN && userId && authorId && authorId !== userId) {
      console.warn('Non-admin user tried to filter by different author ID. Overriding with their own ID.', {
        userId,
        requestedAuthorId: authorId,
        userRole
      });
      try {
        filter.author = new Types.ObjectId(userId);
      } catch {
        // If conversion fails, use string as fallback
        filter.author = userId;
      }
    }

    // If status is specified in query, use it (for authenticated users)
    // Note: Author filter is already set above for non-admin users, so this won't override it
    // CRITICAL: Status filter must be applied to ensure only the correct status blogs are returned
    if (status && isAuthenticated) {
      const statusLower = status.toLowerCase().trim();
      if (statusLower === 'draft') {
        filter.status = BlogStatus.DRAFT; // Use enum value 'draft'
      } else if (statusLower === 'published') {
        filter.status = BlogStatus.PUBLISHED; // Use enum value 'published'
      } else if (statusLower === 'all') {
        // Show both draft and published
        filter.status = { $in: [BlogStatus.DRAFT, BlogStatus.PUBLISHED] };
      }
    }

    // If not authenticated, only show published blogs
    if (!isAuthenticated) {
      filter.status = BlogStatus.PUBLISHED;
    } else {
      // For authenticated users:
      // - Admin can see all blogs (unless author filter is specified)
      // - Regular users can see published + their own drafts (already filtered by author above)
      if (!status) {
        // Default: show published + user's own drafts
        if (userRole === UserRole.ADMIN) {
          // Admin sees all blogs if no status filter and no author filter
          // If author filter is specified, respect it
          if (!authorId) {
            filter = {}; // No status filter and no author filter = show all
          }
        } else {
          // Regular users see published + their own drafts
          // Author filter is already set above, just set status
          filter.status = { $in: [BlogStatus.DRAFT, BlogStatus.PUBLISHED] };
        }
      }
      // Note: For draft and published status, the filter is already set above
      // The author filter is already applied for non-admin users
    }

    // Debug logging for troubleshooting draft and published filtering issues
    if (status && (status.toLowerCase().trim() === 'draft' || status.toLowerCase().trim() === 'published')) {
      const statusLower = status.toLowerCase().trim();
      console.log(`=== ${statusLower.toUpperCase()} FILTER DEBUG ===`);
      console.log('Request params:', { status, authorId, userId, userRole, isAuthenticated });
      console.log('Filter object:', {
        filter: filter,
        filterAuthor: filter.author?.toString(),
        filterStatus: filter.status,
        filterStatusType: typeof filter.status,
        filterStatusValue: String(filter.status)
      });
      
      // Also check what blogs exist in DB for this user with the requested status
      const testFilter = { 
        author: filter.author,
        status: statusLower === 'draft' ? BlogStatus.DRAFT : BlogStatus.PUBLISHED
      };
      const testBlogs = await Blog.find(testFilter).select('_id title status author createdAt');
      
      // CRITICAL: Also check ALL blogs by this author to see what statuses they have
      const allUserBlogs = await Blog.find({ author: filter.author }).select('_id title status author createdAt');
      
      console.log(`Direct DB query test (author + ${statusLower}):`, {
        filter: testFilter,
        count: testBlogs.length,
        blogs: testBlogs.map((b: IBlog) => ({
          id: (b._id as Types.ObjectId).toString(),
          title: b.title,
          status: b.status,
          statusValue: String(b.status),
          author: b.author.toString(),
          createdAt: b.createdAt
        }))
      });
      
      console.log(`ALL blogs by this author (for verification):`, {
        totalBlogs: allUserBlogs.length,
        publishedCount: allUserBlogs.filter((b: IBlog) => b.status === BlogStatus.PUBLISHED).length,
        draftCount: allUserBlogs.filter((b: IBlog) => b.status === BlogStatus.DRAFT).length,
        blogs: allUserBlogs.map((b: IBlog) => ({
          id: (b._id as Types.ObjectId).toString(),
          title: b.title,
          status: b.status,
          statusValue: String(b.status),
          author: b.author.toString(),
          createdAt: b.createdAt
        }))
      });
    }
    
    // Fetch blogs with the applied filter
    // For non-admin users, filter.author is already set to their userId (as ObjectId)
    // For draft status, filter.status is set to BlogStatus.DRAFT ('draft')
    // Combined: { author: ObjectId(userId), status: 'draft' } for non-admin users viewing drafts
    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination using the same filter
    // CRITICAL: Use the exact same filter for countDocuments to ensure accurate count
    const total = await Blog.countDocuments(filter);
    
    // Additional debug logging for draft and published queries
    if (status && (status.toLowerCase().trim() === 'draft' || status.toLowerCase().trim() === 'published')) {
      const statusLower = status.toLowerCase().trim();
      const expectedStatus = statusLower === 'draft' ? BlogStatus.DRAFT : BlogStatus.PUBLISHED;
      
      // CRITICAL: Verify the count by querying the database directly with the same filter
      const directCount = await Blog.countDocuments(filter);
      const directQuery = await Blog.find(filter).select('_id title status author');
      
      console.log(`${statusLower.charAt(0).toUpperCase() + statusLower.slice(1)} query results:`, {
        paginationTotal: total,
        directCount: directCount,
        blogsReturned: blogs.length,
        directQueryCount: directQuery.length,
        filterApplied: {
          author: filter.author?.toString(),
          status: filter.status,
          statusValue: String(filter.status),
          filterType: typeof filter,
          filterStringified: JSON.stringify(filter)
        },
        blogDetails: blogs.map((b: IBlog) => ({
          id: (b._id as Types.ObjectId).toString(),
          title: b.title,
          status: b.status,
          statusValue: String(b.status),
          statusMatches: b.status === expectedStatus,
          author: typeof b.author === 'object' && b.author?._id ? b.author._id.toString() : b.author?.toString(),
          authorMatches: filter.author ? (typeof b.author === 'object' && b.author?._id ? b.author._id.toString() === filter.author.toString() : b.author?.toString() === filter.author.toString()) : true
        })),
        directQueryResults: directQuery.map((b: IBlog) => ({
          id: (b._id as Types.ObjectId).toString(),
          title: b.title,
          status: b.status,
          statusValue: String(b.status),
          author: b.author.toString()
        }))
      });
      
      // CRITICAL: If there's a mismatch, log a warning
      if (total !== directCount || total !== directQuery.length) {
        console.error(`COUNT MISMATCH for ${statusLower}:`, {
          paginationTotal: total,
          directCount: directCount,
          directQueryLength: directQuery.length,
          filter: filter
        });
      }
      
      console.log(`=== END ${statusLower.toUpperCase()} DEBUG ===`);
    }

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedBlogs = blogs.map(blog => ({
      ...blog.toObject(),
      coverImageUrl: blog.coverImageUrl ? (blog.coverImageUrl.startsWith('http') ? blog.coverImageUrl : getS3Url(blog.coverImageUrl)) : undefined,
      images: blog.images && Array.isArray(blog.images) ? blog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    }));

    res.json({
      data: transformedBlogs,
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

// GET /api/blogs/my - Get published blogs by logged-in user (any role)
// Simplified endpoint for "My Blogs" tab - returns only published blogs by the current user
// IMPORTANT: This route must come before /:id to avoid matching "my" as an ID
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    
    // Convert userId to ObjectId for proper MongoDB comparison
    let authorObjectId: Types.ObjectId;
    try {
      authorObjectId = new Types.ObjectId(userId);
    } catch (error) {
      console.error('Error converting userId to ObjectId:', error, 'userId:', userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    // Find only published blogs by the current user
    const blogs = await Blog.find({
      author: authorObjectId,
      status: BlogStatus.PUBLISHED
    })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Blog.countDocuments({
      author: authorObjectId,
      status: BlogStatus.PUBLISHED
    });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedBlogs = blogs.map(blog => ({
      ...blog.toObject(),
      coverImageUrl: blog.coverImageUrl ? (blog.coverImageUrl.startsWith('http') ? blog.coverImageUrl : getS3Url(blog.coverImageUrl)) : undefined,
      images: blog.images && Array.isArray(blog.images) ? blog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    }));

    res.json({
      data: transformedBlogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching my blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/drafts - Get draft blogs by logged-in user (any role)
// Simplified endpoint for "Drafts" tab - returns only draft blogs by the current user
// IMPORTANT: This route must come before /:id to avoid matching "drafts" as an ID
router.get('/drafts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    
    // Convert userId to ObjectId for proper MongoDB comparison
    let authorObjectId: Types.ObjectId;
    try {
      authorObjectId = new Types.ObjectId(userId);
    } catch (error) {
      console.error('Error converting userId to ObjectId:', error, 'userId:', userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    // Find only draft blogs by the current user
    const drafts = await Blog.find({
      author: authorObjectId,
      status: BlogStatus.DRAFT
    })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Blog.countDocuments({
      author: authorObjectId,
      status: BlogStatus.DRAFT
    });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDrafts = drafts.map(blog => ({
      ...blog.toObject(),
      coverImageUrl: blog.coverImageUrl ? (blog.coverImageUrl.startsWith('http') ? blog.coverImageUrl : getS3Url(blog.coverImageUrl)) : undefined,
      images: blog.images && Array.isArray(blog.images) ? blog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    }));

    res.json({
      data: transformedDrafts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
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

    // If blog is draft, only allow author or admin to view
    if (blog.status === BlogStatus.DRAFT) {
      if (!req.user) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if user is the author or admin
      const isAuthor = blog.author.toString() === req.user.id;
      const isAdmin = req.user.role === UserRole.ADMIN;
      
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedBlog = {
      ...blog.toObject(),
      coverImageUrl: blog.coverImageUrl ? (blog.coverImageUrl.startsWith('http') ? blog.coverImageUrl : getS3Url(blog.coverImageUrl)) : undefined,
      images: blog.images && Array.isArray(blog.images) ? blog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    };

    res.json({
      data: transformedBlog
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

    // Check permissions: users can only edit their own blogs, admin can edit any blog
    const isAuthor = blog.author.toString() === req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only edit your own blogs' });
    }

    // Update blog fields
    const updateData: {
      title?: string;
      slug?: string;
      coverImageUrl?: string;
      images?: string[];
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
    if (req.body.images !== undefined) {
      // Process images array - filter out empty strings
      const processedImages = Array.isArray(req.body.images)
        ? req.body.images.filter((url: string) => url && typeof url === 'string' && url.trim() !== '')
        : [];
      updateData.images = processedImages.length > 0 ? processedImages : [];
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
      // Normalize status to ensure it matches enum values
      const statusLower = String(req.body.status).toLowerCase().trim();
      updateData.status = (statusLower === 'published' 
        ? BlogStatus.PUBLISHED 
        : BlogStatus.DRAFT) as BlogStatus;
      
      // Debug log to verify status update
      console.log('Blog status update:', {
        blogId: id,
        oldStatus: blog.status,
        newStatus: updateData.status,
        statusValue: String(updateData.status),
        requestedStatus: req.body.status
      });
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email');

    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Verify the status was updated correctly
    if (updateData.status) {
      console.log('Blog status updated successfully:', {
        blogId: (updatedBlog._id as Types.ObjectId).toString(),
        title: updatedBlog.title,
        oldStatus: blog.status,
        newStatus: updatedBlog.status,
        statusValue: String(updatedBlog.status),
        statusMatches: updatedBlog.status === updateData.status
      });
    }

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedBlog = {
      ...updatedBlog.toObject(),
      coverImageUrl: updatedBlog.coverImageUrl ? (updatedBlog.coverImageUrl.startsWith('http') ? updatedBlog.coverImageUrl : getS3Url(updatedBlog.coverImageUrl)) : undefined,
      images: updatedBlog.images && Array.isArray(updatedBlog.images) ? updatedBlog.images.map((url: string) => url.startsWith('http') ? url : getS3Url(url)) : undefined
    };

    res.json({
      message: 'Blog updated successfully',
      data: transformedBlog
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

    // Check permissions: users can only delete their own blogs, admin can delete any blog
    const isAuthor = blog.author.toString() === req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own blogs. Only admins can delete other users\' blogs.' });
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

