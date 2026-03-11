// ─── magis-studio/backend/src/controllers/post.controller.js ─────────────────
import Post from '../models/Post.model.js';
import { Follow, Notification } from '../models/Social.model.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createNotification = async ({ recipient, sender, type, entity, message }) => {
  if (recipient.toString() === sender.toString()) return; // No self-notify
  try {
    await Notification.create({ recipient, sender, type, entity, message });
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

// ─── GET /api/v1/social/feed ──────────────────────────────────────────────────
export const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    const following = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
    const followingIds = following.map(f => f.following);

    const [posts, total] = await Promise.all([
      Post.getFeedForUser(userId, followingIds, { page: Number(page), limit: Number(limit) }),
      Post.countDocuments({
        author: { $in: [userId, ...followingIds] },
        type: { $ne: 'story' },
        isArchived: false,
        'moderation.status': { $in: ['clean', 'flagged'] },
      }),
    ]);

    // Annotate each post with viewer's reaction
    const annotated = posts.map(post => {
      const obj = post.toObject();
      obj.viewerReaction = post.reactions?.find(r => r.user?.toString() === userId.toString())?.type || null;
      obj.isSaved = post.saves?.some(s => s.toString() === userId.toString()) || false;
      return obj;
    });

    res.json({
      success: true,
      data: annotated,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        hasMore: (Number(page) * Number(limit)) < total,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/stories ───────────────────────────────────────────────
export const getStories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const following = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
    const ids = [userId, ...following.map(f => f.following)];

    const stories = await Post.find({
      author: { $in: ids },
      type: 'story',
      expiresAt: { $gt: new Date() },
      'moderation.status': { $in: ['clean', 'flagged'] },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username displayName avatar.url')
      .select('author media caption expiresAt storyViewers createdAt');

    // Group by author
    const grouped = stories.reduce((acc, story) => {
      const aid = story.author._id.toString();
      if (!acc[aid]) acc[aid] = { author: story.author, stories: [], hasUnseen: false };
      const seen = story.storyViewers.some(v => v.toString() === userId.toString());
      if (!seen) acc[aid].hasUnseen = true;
      acc[aid].stories.push({ ...story.toObject(), seen });
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts ────────────────────────────────────────────────
export const createPost = async (req, res, next) => {
  try {
    const { caption, type, visibility, linkedGear, linkedTrack, commentsEnabled, location } = req.body;

    // Media comes from multer-cloudinary (req.files)
    const media = (req.files || []).map((file, i) => ({
      url:      file.path,
      publicId: file.filename,
      type:     file.mimetype.startsWith('video/') ? 'video' : 'image',
      order:    i,
    }));

    if (!caption && media.length === 0) {
      return res.status(422).json({ success: false, message: 'Post must have a caption or at least one media file.' });
    }

    const post = await Post.create({
      author: req.user._id,
      caption, type: type || 'regular',
      media, visibility: visibility || 'public',
      linkedGear:   linkedGear   ? JSON.parse(linkedGear)   : undefined,
      linkedTrack:  linkedTrack  ? JSON.parse(linkedTrack)  : undefined,
      commentsEnabled: commentsEnabled !== 'false',
      location:     location    ? JSON.parse(location)    : undefined,
    });

    await post.populate('author', 'username displayName avatar.url');
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/posts/:id ────────────────────────────────────────────
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar.url')
      .populate('comments.author', 'username displayName avatar.url')
      .populate('comments.replies.author', 'username displayName avatar.url')
      .populate('linkedGear.item', 'name slug brand media review.scores.overall')
      .populate('linkedTrack.item', 'title artist artwork metadata');

    if (!post || post.isArchived) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

// ─── DELETE /api/v1/social/posts/:id ─────────────────────────────────────────
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    // Only author or admin can delete
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Clean Cloudinary assets
    await Promise.allSettled(
      post.media.map(m => deleteFromCloudinary(m.publicId, m.type === 'video' ? 'video' : 'image'))
    );

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts/:id/react ─────────────────────────────────────
export const reactToPost = async (req, res, next) => {
  try {
    const { type = 'like' } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const existing = post.reactions.findIndex(r => r.user.toString() === userId.toString());

    if (existing > -1) {
      if (post.reactions[existing].type === type) {
        // Same reaction → toggle off (unlike)
        post.reactions.splice(existing, 1);
      } else {
        // Different reaction → update type
        post.reactions[existing].type = type;
      }
    } else {
      post.reactions.push({ user: userId, type });
      // Notify author
      createNotification({
        recipient: post.author, sender: userId,
        type: 'like',
        entity: { kind: 'Post', id: post._id },
        message: `${req.user.username} reaccionó a tu publicación`,
      });
    }

    await post.save();
    res.json({ success: true, data: { reactionCount: post.reactions.length } });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts/:id/comments ──────────────────────────────────
export const addComment = async (req, res, next) => {
  try {
    const { body, parentCommentId } = req.body;
    if (!body?.trim()) return res.status(422).json({ success: false, message: 'Comment body is required.' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (!post.commentsEnabled) return res.status(403).json({ success: false, message: 'Comments are disabled.' });

    const userId = req.user._id;

    if (parentCommentId) {
      // Reply to existing comment
      const comment = post.comments.id(parentCommentId);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

      comment.replies.push({ author: userId, body: body.trim() });
      await post.save();

      createNotification({
        recipient: comment.author, sender: userId,
        type: 'reply', entity: { kind: 'Post', id: post._id },
        message: `${req.user.username} respondió a tu comentario`,
      });
    } else {
      // Top-level comment
      post.comments.push({ author: userId, body: body.trim() });
      await post.save();

      createNotification({
        recipient: post.author, sender: userId,
        type: 'comment', entity: { kind: 'Post', id: post._id },
        message: `${req.user.username} comentó tu publicación`,
      });
    }

    await post.populate('comments.author', 'username displayName avatar.url');
    await post.populate('comments.replies.author', 'username displayName avatar.url');

    res.status(201).json({ success: true, data: post.comments });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts/:id/save ──────────────────────────────────────
export const toggleSave = async (req, res, next) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const userId = req.user._id;
    const idx = post.saves.findIndex(s => s.toString() === userId.toString());

    if (idx > -1) post.saves.splice(idx, 1);
    else post.saves.push(userId);

    await post.save();
    res.json({ success: true, data: { saved: idx === -1, saveCount: post.saves.length } });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts/:id/story-view ────────────────────────────────
export const markStoryViewed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Post.findByIdAndUpdate(req.params.id, {
      $addToSet: { storyViewers: userId },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/social/posts/:id/report ────────────────────────────────────
export const reportPost = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const validReasons = ['spam', 'nudity', 'harassment', 'copyright', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(422).json({ success: false, message: 'Invalid report reason.' });
    }

    const post = await Post.findByIdAndUpdate(req.params.id, {
      $addToSet: { 'moderation.flaggedBy': req.user._id, 'moderation.flags': reason },
      $set: { 'moderation.status': 'flagged' },
    }, { new: true });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post reported. Our team will review it.' });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/users/:id/posts ──────────────────────────────────────
export const getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, type } = req.query;
    const filter = {
      author: req.params.id,
      isArchived: false,
      type: type ? type : { $ne: 'story' },
      'moderation.status': { $in: ['clean', 'flagged'] },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select('media caption reactions comments type linkedGear linkedTrack createdAt'),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true, data: posts,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/explore ───────────────────────────────────────────────
export const getExplore = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, hashtag, q } = req.query;
    const filter = {
      type: { $ne: 'story' },
      visibility: 'public',
      isArchived: false,
      'moderation.status': 'clean',
    };
    if (hashtag) filter.hashtags = hashtag.toLowerCase();
    if (q) filter.$text = { $search: q };

    const posts = await Post.find(filter)
      .sort(q ? { score: { $meta: 'textScore' } } : { 'reactions.length': -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('media caption reactions comments hashtags author createdAt')
      .populate('author', 'username avatar.url');

    res.json({ success: true, data: posts });
  } catch (err) { next(err); }
};
