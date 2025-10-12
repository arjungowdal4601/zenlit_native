import { supabase } from './supabase';

export interface Profile {
  id: string;
  display_name: string;
  user_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  email: string;
  account_created_at: string;
}

export interface SocialLinks {
  id: string;
  profile_pic_url: string | null;
  banner_url: string | null;
  bio: string | null;
  instagram: string | null;
  x_twitter: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: Profile & { social_links?: SocialLinks };
}

export async function getCurrentUserProfile(): Promise<{ profile: Profile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { profile: null, socialLinks: null, error: new Error('Not authenticated') };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { profile: null, socialLinks: null, error: profileError };
    }

    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      profile: profile as Profile | null,
      socialLinks: socialLinks as SocialLinks | null,
      error: socialError
    };
  } catch (error) {
    return { profile: null, socialLinks: null, error: error as Error };
  }
}

export async function getProfileById(userId: string): Promise<{ profile: Profile | null; socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return { profile: null, socialLinks: null, error: profileError };
    }

    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return {
      profile: profile as Profile | null,
      socialLinks: socialLinks as SocialLinks | null,
      error: socialError
    };
  } catch (error) {
    return { profile: null, socialLinks: null, error: error as Error };
  }
}

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
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postsError) {
      return { posts: [], error: postsError };
    }

    if (!postsData || postsData.length === 0) {
      return { posts: [], error: null };
    }

    const userIds = [...new Set(postsData.map((p: Post) => p.user_id))];

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

    const profilesMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);
    const socialLinksMap = new Map(socialLinks?.map((s: SocialLinks) => [s.id, s]) || []);

    const postsWithAuthors: PostWithAuthor[] = postsData.map((post: Post) => ({
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

export async function updateSocialLinks(data: Partial<Omit<SocialLinks, 'id' | 'created_at' | 'updated_at'>>): Promise<{ socialLinks: SocialLinks | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { socialLinks: null, error: new Error('Not authenticated') };
    }

    const { data: result, error } = await supabase
      .from('social_links')
      .upsert({
        id: user.id,
        ...data,
      })
      .select()
      .single();

    if (error) {
      return { socialLinks: null, error };
    }

    return { socialLinks: result as SocialLinks, error: null };
  } catch (error) {
    return { socialLinks: null, error: error as Error };
  }
}

export async function uploadImage(
  file: Blob | File | ArrayBuffer | Uint8Array,
  bucket: 'profile-images' | 'post-images',
  fileName: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { url: null, error: new Error('Not authenticated') };
    }

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file as any, {
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}
