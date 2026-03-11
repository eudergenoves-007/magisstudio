// ─── magis-studio/backend/src/models/Post.model.js ───────────────────────────
//
//  Enterprise Social Post Schema
//  Supports: photos/videos, gear/track links, nested comments (2 levels),
//  reactions, hashtags, mentions, moderation flags, Stories (TTL index)
//
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const mediaItemSchema = new Schema({
  url:          { type: String, required: true },
  publicId:     { type: String, required: true },   // Cloudinary public_id
  type:         { type: String, enum: ['image', 'video'], default: 'image' },
  width:        { type: Number },
  height:       { type: Number },
  thumbnailUrl: { type: String },                    // For videos
  altText:      { type: String, maxlength: 300 },
  order:        { type: Number, default: 0 },
}, { _id: true });

const reactionSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['like', 'love', 'fire', 'wave', 'gold_ear'], default: 'like' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const mentionSchema = new Schema({
  user:     { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  indices:  [Number],   // char positions in caption for highlight
}, { _id: false });

const commentSchema = new Schema({
  author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body:      { type: String, required: true, maxlength: 1000, trim: true },
  mentions:  [mentionSchema],
  reactions: [reactionSchema],
  isEdited:  { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  // One level of nested replies only (enterprise pattern: avoid deep recursion)
  replies: [{
    author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:      { type: String, required: true, maxlength: 500, trim: true },
    mentions:  [mentionSchema],
    reactions: [reactionSchema],
    isEdited:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const moderationSchema = new Schema({
  status:     { type: String, enum: ['clean', 'flagged', 'review', 'removed'], default: 'clean' },
  flags:      [{ type: String, enum: ['spam', 'nudity', 'harassment', 'copyright', 'other'] }],
  flaggedBy:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  notes:      { type: String, maxlength: 500 },
}, { _id: false });

// ─── Main Post Schema ─────────────────────────────────────────────────────────
const postSchema = new Schema(
  {
    // ── Author ────────────────────────────────────────────────────────────────
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // ── Content ───────────────────────────────────────────────────────────────
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      trim: true,
    },
    media: {
      type: [mediaItemSchema],
      validate: { validator: (v) => v.length <= 10, message: 'Max 10 media items per post' },
    },
    hashtags: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 50,
    }],
    mentions: [mentionSchema],

    // ── Post type ─────────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ['regular', 'story', 'reel', 'gear_review_share', 'track_share'],
      default: 'regular',
    },

    // ── Magis Studio integrations ──────────────────────────────────────────────
    linkedGear: {
      item:   { type: Schema.Types.ObjectId, ref: 'GearItem' },
      note:   { type: String, maxlength: 300 },   // "Using this for my mix"
    },
    linkedTrack: {
      item:   { type: Schema.Types.ObjectId, ref: 'AudioTrack' },
      note:   { type: String, maxlength: 300 },
    },

    // ── Story fields (type === 'story') ────────────────────────────────────────
    // TTL handled via index on expiresAt
    expiresAt: { type: Date, default: null },
    storyViewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // ── Engagement ────────────────────────────────────────────────────────────
    reactions:    [reactionSchema],
    comments:     [commentSchema],
    saves:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shares:       { type: Number, default: 0 },

    // ── Visibility & moderation ───────────────────────────────────────────────
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    commentsEnabled: { type: Boolean, default: true },
    likesVisible:    { type: Boolean, default: true },

    moderation: { type: moderationSchema, default: () => ({}) },

    // ── Location ──────────────────────────────────────────────────────────────
    location: {
      name:        { type: String, maxlength: 100 },
      coordinates: { type: [Number], index: '2dsphere' },  // [lng, lat]
    },

    // ── Status ────────────────────────────────────────────────────────────────
    isArchived: { type: Boolean, default: false },
    isPinned:   { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'moderation.status': 1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ 'linkedGear.item': 1 });
postSchema.index({ 'linkedTrack.item': 1 });
// TTL index: auto-delete stories 24h after expiresAt
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { type: 'story' } });
// Full-text on caption + hashtags
postSchema.index({ caption: 'text', hashtags: 'text' }, { name: 'post_text_search' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
postSchema.virtual('reactionCount').get(function () {
  return this.reactions?.length ?? 0;
});
postSchema.virtual('commentCount').get(function () {
  return (this.comments ?? []).reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);
});
postSchema.virtual('isStoryExpired').get(function () {
  return this.type === 'story' && this.expiresAt && this.expiresAt < new Date();
});

// ─── Pre-save: extract hashtags from caption ──────────────────────────────────
postSchema.pre('save', function (next) {
  if (this.isModified('caption') && this.caption) {
    const found = [...this.caption.matchAll(/#(\w{1,50})/g)].map(m => m[1].toLowerCase());
    this.hashtags = [...new Set([...this.hashtags, ...found])];
  }
  // Set story expiry (24h)
  if (this.isNew && this.type === 'story' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// ─── Statics ─────────────────────────────────────────────────────────────────
postSchema.statics.getFeedForUser = function (userId, followingIds, { page = 1, limit = 12 } = {}) {
  const authorIds = [userId, ...followingIds];
  return this.find({
    author: { $in: authorIds },
    type: { $ne: 'story' },
    isArchived: false,
    'moderation.status': { $in: ['clean', 'flagged'] },
    $or: [{ visibility: 'public' }, { author: userId }],
  })
    .sort({ isPinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username displayName avatar.url')
    .populate('linkedGear.item', 'name slug brand media')
    .populate('linkedTrack.item', 'title artist artwork');
};

const Post = model('Post', postSchema);
export default Post;
