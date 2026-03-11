// ─── magis-studio/backend/src/routes/social.routes.js ────────────────────────
import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { uploadGearImage } from '../config/cloudinary.js';
import {
  getFeed, getStories, createPost, getPost, deletePost,
  reactToPost, addComment, toggleSave, markStoryViewed,
  reportPost, getUserPosts, getExplore,
} from '../controllers/post.controller.js';
import {
  followUser, unfollowUser, getFollowers, getFollowing,
  getNotifications, markAllNotificationsRead,
} from '../controllers/follow.controller.js';

const router = Router();

// All social routes require auth
router.use(protect);

// ── Feed & Discovery ──────────────────────────────────────────────────────────
router.get('/feed',    getFeed);
router.get('/stories', getStories);
router.get('/explore', getExplore);

// ── Posts ─────────────────────────────────────────────────────────────────────
router.post('/posts',
  uploadGearImage.array('media', 10),   // Reuse gear image upload preset
  createPost
);
router.get('/posts/:id',          getPost);
router.delete('/posts/:id',       deletePost);
router.post('/posts/:id/react',   reactToPost);
router.post('/posts/:id/comments',addComment);
router.post('/posts/:id/save',    toggleSave);
router.post('/posts/:id/view',    markStoryViewed);   // For stories
router.post('/posts/:id/report',  reportPost);

// ── User profiles ─────────────────────────────────────────────────────────────
router.get('/users/:id/posts',     getUserPosts);
router.post('/users/:id/follow',   followUser);
router.delete('/users/:id/follow', unfollowUser);
router.get('/users/:id/followers', getFollowers);
router.get('/users/:id/following', getFollowing);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',           getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);

// ── Admin: moderation ─────────────────────────────────────────────────────────
router.patch('/admin/posts/:id/moderate',
  requireRole('admin', 'editor'),
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;
      const { default: Post } = await import('../models/Post.model.js');
      const post = await Post.findByIdAndUpdate(req.params.id, {
        $set: {
          'moderation.status':     status,
          'moderation.notes':      notes,
          'moderation.reviewedBy': req.user._id,
          'moderation.reviewedAt': new Date(),
        },
      }, { new: true });
      res.json({ success: true, data: post });
    } catch (err) { next(err); }
  }
);

export default router;
