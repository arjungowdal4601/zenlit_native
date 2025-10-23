import { supabase } from '../lib/supabase';
import type { Post, PostWithAuthor, Profile, SocialLinks } from '../lib/types';

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

    const { data: currentLocation, error: locationError } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', user.id)
      .maybeSingle();

    if (locationError) {
      return { posts: [], error: locationError };
    }

    if (!currentLocation || currentLocation.lat_short === null || currentLocation.long_short === null) {
      return { posts: [], error: null };
    }

    const latMin = currentLocation.lat_short - 0.01;
    const latMax = currentLocation.lat_short + 0.01;
    const longMin = currentLocation.long_short - 0.01;
    const longMax = currentLocation.long_short + 0.01;

    const { data: nearbyLocations, error: nearbyError } = await supabase
      .from('locations')
      .select('id')
      .not('lat_short', 'is', null)
      .not('long_short', 'is', null)
      .gte('lat_short', latMin)
      .lte('lat_short', latMax)
      .gte('long_short', longMin)
      .lte('long_short', longMax);

    if (nearbyError) {
      return { posts: [], error: nearbyError };
    }

    if (!nearbyLocations || nearbyLocations.length === 0) {
      return { posts: [], error: null };
    }

    const nearbyUserIds: string[] = (nearbyLocations as Array<{ id: string }>).map(
      (loc: { id: string }) => loc.id
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
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      return { posts: [], error: profilesError };
    }

    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .in('id', userIds);

    const profilesArr: Profile[] = (profiles || []) as Profile[];
    const socialArr: SocialLinks[] = (socialLinks || []) as SocialLinks[];

    const profilesMap: Map<string, Profile> = new Map(
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
