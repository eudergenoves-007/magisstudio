// ─── magis-studio/backend/src/controllers/follow.controller.js ───────────────
import { Follow, Notification } from '../models/Social.model.js';
import User from '../models/User.model.js';

// ─── POST /api/v1/social/users/:id/follow ────────────────────────────────────
export const followUser = async (req, res, next) => {
  try {
    const followerId  = req.user._id;
    const followingId = req.params.id;

    if (followerId.toString() === followingId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const target = await User.findById(followingId).select('username');
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    const existing = await Follow.findOne({ follower: followerId, following: followingId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already following this user.' });
    }

    // If target has private account → pending, else accepted
    const status = 'accepted'; // TODO: check target.isPrivate when implemented
    await Follow.create({ follower: followerId, following: followingId, status });

    await Notification.create({
      recipient: followingId,
      sender:    followerId,
      type:      status === 'pending' ? 'follow_request' : 'follow',
      entity:    { kind: 'User', id: followerId },
      message:   `${req.user.username} comenzó a seguirte`,
    });

    res.status(201).json({ success: true, data: { status } });
  } catch (err) { next(err); }
};

// ─── DELETE /api/v1/social/users/:id/follow ──────────────────────────────────
export const unfollowUser = async (req, res, next) => {
  try {
    const result = await Follow.findOneAndDelete({
      follower:  req.user._id,
      following: req.params.id,
    });
    if (!result) return res.status(404).json({ success: false, message: 'Follow relationship not found.' });
    res.json({ success: true, message: 'Unfollowed successfully.' });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/users/:id/followers ──────────────────────────────────
export const getFollowers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const followers = await Follow.find({ following: req.params.id, status: 'accepted' })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('follower', 'username displayName avatar.url');

    res.json({ success: true, data: followers.map(f => f.follower) });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/users/:id/following ──────────────────────────────────
export const getFollowing = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const following = await Follow.find({ follower: req.params.id, status: 'accepted' })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('following', 'username displayName avatar.url');

    res.json({ success: true, data: following.map(f => f.following) });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/social/notifications ────────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('sender', 'username displayName avatar.url'),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) { next(err); }
};

// ─── PATCH /api/v1/social/notifications/read-all ─────────────────────────────
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};
