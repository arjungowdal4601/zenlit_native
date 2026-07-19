import { supabase } from '../lib/supabase';
import type { Post, PostWithAuthor, PublicProfile, SocialLinks } from '../lib/types';

export async function getUserPosts(userId: string): Promise<{ posts: Post[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { posts: [], error };
    }

    return { posts: (data || []) as Post[], error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

export async function getFeedPosts(limit = 50): Promise<{ posts: PostWithAuthor[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { posts: [], error: new Error('Not authenticated') };
    }

    const { data: nearbyLocations, error: nearbyError } = await supabase.rpc(
      'get_nearby_user_ids',
      { include_self: true },
    );

    if (nearbyError) {
      return { posts: [], error: nearbyError };
    }

    if (!nearbyLocations || nearbyLocations.length === 0) {
      return { posts: [], error: null };
    }

    const nearbyUserIds: string[] = (nearbyLocations as Array<{ user_id: string }>).map(
      (location: { user_id: string }) => location.user_id
    );

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', nearbyUserIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postsError) {
      return { posts: [], error: postsError };
    }

    if (!postsData || postsData.length === 0) {
      return { posts: [], error: null };
    }

    const userIds: string[] = [...new Set((postsData as Post[]).map((p: Post) => p.user_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, user_name, account_created_at')
      .in('id', userIds);

    if (profilesError) {
      return { posts: [], error: profilesError };
    }

    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .in('id', userIds);

    const profilesArr: PublicProfile[] = (profiles || []) as PublicProfile[];
    const socialArr: SocialLinks[] = (socialLinks || []) as SocialLinks[];

    const profilesMap: Map<string, PublicProfile> = new Map(
      profilesArr.map((p) => [p.id, p])
    );
    const socialLinksMap: Map<string, SocialLinks> = new Map(
      socialArr.map((s) => [s.id, s])
    );

    const postsWithAuthors: PostWithAuthor[] = (postsData as Post[]).map((post: Post) => ({
      ...post,
      author: {
        ...profilesMap.get(post.user_id)!,
        social_links: socialLinksMap.get(post.user_id),
      },
    }));

    return { posts: postsWithAuthors, error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

export async function createPost(
  content: string,
  imageInput?: string | string[] | null,
): Promise<{ post: Post | null; error: Error | null }> {
  try {
    const trimmedContent = content.trim();

    if (!trimmedContent.length) {
      return { post: null, error: new Error('Post content is required') };
    }

    if (Array.isArray(imageInput)) {
      return { post: null, error: new Error('Only one image can be attached to a post') };
    }

    const normalizedImageUrl =
      typeof imageInput === 'string' && imageInput.trim().length ? imageInput.trim() : null;

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { post: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: trimmedContent,
        image_url: normalizedImageUrl,
      })
      .select()
      .single();

    if (error) {
      return { post: null, error };
    }

    return { post: data as Post, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

export async function updatePost(
  postId: string,
  content: string,
  imageInput?: string | string[] | null,
): Promise<{ post: Post | null; error: Error | null }> {
  try {
    const trimmedContent = content.trim();

    if (!trimmedContent.length) {
      return { post: null, error: new Error('Post content is required') };
    }

    if (Array.isArray(imageInput)) {
      return { post: null, error: new Error('Only one image can be attached to a post') };
    }

    const normalizedImageUrl =
      typeof imageInput === 'string' && imageInput.trim().length ? imageInput.trim() : null;

    const { data, error } = await supabase
      .from('posts')
      .update({
        content: trimmedContent,
        image_url: normalizedImageUrl,
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      return { post: null, error };
    }

    return { post: data as Post, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

export async function deletePost(postId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
