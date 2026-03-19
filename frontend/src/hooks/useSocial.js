import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ── Mock Initial Data ────────────────────────────────────────────────────────
const MOCK_STORAGE_KEY = 'magis_mock_posts';

const getMockData = () => {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Initial dummy data
  const initialPosts = [
    {
      _id: 'post1',
      author: { _id: 'a1', username: 'AudioGuru', avatar: { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guru' } },
      caption: '¡Probando la nueva interfaz de Magis Studio! Qué elegante se ve este feed. #glassmorphism',
      media: [],
      createdAt: new Date().toISOString(),
      reactionCount: 5,
      viewerReaction: null,
      comments: []
    },
    {
      _id: 'post2',
      author: { _id: 'a2', username: 'BeatMaker99', avatar: { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beat' } },
      caption: 'Miren este hermoso hardware que acabo de conseguir.',
      media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800' }],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactionCount: 20,
      viewerReaction: 'like',
      comments: []
    }
  ];

  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialPosts));
  return initialPosts;
};

// Helper for simulating async API calls
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ── Keys ──────────────────────────────────────────────────────────────────────
export const socialKeys = {
  feedInfinite:  ()     => ['social', 'feed', 'infinite'],
  stories:       ()     => ['social', 'stories'],
  post:          (id)   => ['social', 'post', id],
  notifications: ()     => ['social', 'notifications'],
};

// ── Feed (infinite scroll mock) ──────────────────────────────────────────────
export const useFeed = () =>
  useInfiniteQuery({
    queryKey: socialKeys.feedInfinite(),
    queryFn: async ({ pageParam = 1 }) => {
      await delay(500);
      const posts = getMockData();
      // Simple pagination: just return all posts on page 1, empty on others
      if (pageParam === 1) {
        return { data: posts, pagination: { hasMore: false, page: 1 } };
      }
      return { data: [], pagination: { hasMore: false, page: pageParam } };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 60 * 2,
  });

// ── Stories (mock empty) ─────────────────────────────────────────────────────
export const useStories = () =>
  useQuery({
    queryKey: socialKeys.stories(),
    queryFn: async () => {
      await delay(300);
      return []; // empty groups for now
    },
    staleTime: 1000 * 60,
  });

export const useNotifications = () =>
  useQuery({
    queryKey: socialKeys.notifications(),
    queryFn: async () => ({ data: [], unreadCount: 0 }),
    staleTime: 1000 * 60,
  });

// ── Create post (mock + local storage) ────────────────────────────────────────
export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      await delay(1000);

      const newPost = {
        _id: 'post_' + Date.now(),
        author: JSON.parse(localStorage.getItem('magis_mock_user') || '{}'),
        caption: data.get('caption'),
        media: JSON.parse(data.get('mockMedia') || '[]'),
        createdAt: new Date().toISOString(),
        reactionCount: 0,
        viewerReaction: null,
        comments: []
      };

      const current = getMockData();
      const updated = [newPost, ...current];
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updated));

      return { data: newPost };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() });
      toast.success('Publicación creada');
    },
    onError: () => toast.error('Error al publicar'),
  });
};

export const useReactToPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, type = 'like' }) => {
        await delay(200);
        const posts = getMockData();
        const updated = posts.map(p => {
            if(p._id === postId) {
                // simple toggle mock
                const isLiking = p.viewerReaction !== type;
                return {
                    ...p,
                    viewerReaction: isLiking ? type : null,
                    reactionCount: p.reactionCount + (isLiking ? 1 : -1)
                };
            }
            return p;
        });
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updated));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() })
  });
};

export const useDeletePost = () => { return { mutate: () => {} } };
export const useAddComment = () => { return { mutate: () => {} } };
export const useToggleSave = () => { return { mutate: () => {} } };
export const useMarkNotificationsRead = () => { return { mutate: () => {} } };
