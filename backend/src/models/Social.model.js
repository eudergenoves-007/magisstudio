// ─── magis-studio/backend/src/models/Follow.model.js ─────────────────────────
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const followSchema = new Schema({
  follower:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted'],  // 'pending' for private accounts
    default: 'accepted',
  },
}, { timestamps: true });

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const Follow = model('Follow', followSchema);

// ─── magis-studio/backend/src/models/Notification.model.js ───────────────────
const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'like',           // Someone liked your post
      'comment',        // Someone commented
      'reply',          // Someone replied to your comment
      'follow',         // Someone followed you
      'follow_request', // Someone requested to follow
      'mention',        // You were mentioned
      'story_view',     // Someone viewed your story
      'gear_tag',       // Tagged in a gear post
    ],
  },
  // Polymorphic reference to the source entity
  entity: {
    kind: { type: String, enum: ['Post', 'Comment', 'User'] },
    id:   { type: Schema.Types.ObjectId },
  },
  message:  { type: String, maxlength: 200 },
  isRead:   { type: Boolean, default: false, index: true },
  readAt:   { type: Date },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = model('Notification', notificationSchema);
