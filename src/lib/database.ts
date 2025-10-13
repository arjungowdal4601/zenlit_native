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

    const nearbyUserIds = nearbyLocations.map((loc) => loc.id);

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

export interface Location {
  id: string;
  lat_full: number | null;
  long_full: number | null;
  lat_short: number | null;
  long_short: number | null;
  updated_at: string;
}

export interface NearbyUserData {
  id: string;
  name: string;
  username: string;
  profilePhoto: string | null;
  bio: string | null;
  distance: string;
  socialLinks: {
    instagram?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
  };
}

export async function updateUserLocation(
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const latShort = Math.round(latitude * 100) / 100;
    const longShort = Math.round(longitude * 100) / 100;

    const { error } = await supabase
      .from('locations')
      .upsert({
        id: user.id,
        lat_full: latitude,
        long_full: longitude,
        lat_short: latShort,
        long_short: longShort,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function deleteUserLocation(): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('locations')
      .upsert({
        id: user.id,
        lat_full: null,
        long_full: null,
        lat_short: null,
        long_short: null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function getNearbyUsers(): Promise<{ users: NearbyUserData[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { users: [], error: new Error('Not authenticated') };
    }

    const { data: currentLocation, error: locationError } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', user.id)
      .maybeSingle();

    if (locationError) {
      return { users: [], error: locationError };
    }

    if (!currentLocation || currentLocation.lat_short === null || currentLocation.long_short === null) {
      return { users: [], error: null };
    }

    const latMin = currentLocation.lat_short - 0.01;
    const latMax = currentLocation.lat_short + 0.01;
    const longMin = currentLocation.long_short - 0.01;
    const longMax = currentLocation.long_short + 0.01;

    const { data: nearbyLocations, error: nearbyError } = await supabase
      .from('locations')
      .select('id')
      .neq('id', user.id)
      .not('lat_short', 'is', null)
      .not('long_short', 'is', null)
      .gte('lat_short', latMin)
      .lte('lat_short', latMax)
      .gte('long_short', longMin)
      .lte('long_short', longMax);

    if (nearbyError) {
      return { users: [], error: nearbyError };
    }

    if (!nearbyLocations || nearbyLocations.length === 0) {
      return { users: [], error: null };
    }

    const nearbyUserIds = nearbyLocations.map((loc) => loc.id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', nearbyUserIds);

    if (profilesError) {
      return { users: [], error: profilesError };
    }

    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .in('id', nearbyUserIds);

    const profilesMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);
    const socialLinksMap = new Map(socialLinks?.map((s: SocialLinks) => [s.id, s]) || []);

    const nearbyUsers: NearbyUserData[] = nearbyUserIds.map((userId) => {
      const profile = profilesMap.get(userId);
      const social = socialLinksMap.get(userId);

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        name: profile.display_name,
        username: profile.user_name,
        profilePhoto: social?.profile_pic_url || null,
        bio: social?.bio || null,
        distance: 'Nearby',
        socialLinks: {
          instagram: social?.instagram || null,
          linkedin: social?.linkedin || null,
          twitter: social?.x_twitter || null,
        },
      };
    }).filter((user): user is NearbyUserData => user !== null);

    return { users: nearbyUsers, error: null };
  } catch (error) {
    return { users: [], error: error as Error };
  }
}

export async function uploadImage(
  fileOrUri: Blob | File | ArrayBuffer | Uint8Array | string,
  bucket: 'profile-images' | 'post-images' | 'feedback-images',
  fileName: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { url: null, error: new Error('Not authenticated') };
    }

    let fileToUpload: Blob | File | ArrayBuffer | Uint8Array;

    if (typeof fileOrUri === 'string') {
      const response = await fetch(fileOrUri);
      const blob = await response.blob();
      fileToUpload = blob;
    } else {
      fileToUpload = fileOrUri;
    }

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload as any, {
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

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  is_anonymous_for_a: boolean;
  is_anonymous_for_b: boolean;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ConversationWithParticipant extends Conversation {
  other_user: Profile & { social_links?: SocialLinks };
}

export async function findOrCreateConversation(
  otherUserId: string
): Promise<{ conversation: Conversation | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { conversation: null, error: new Error('Not authenticated') };
    }

    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${otherUserId}),and(user_a_id.eq.${otherUserId},user_b_id.eq.${user.id})`)
      .maybeSingle();

    if (findError) {
      return { conversation: null, error: findError };
    }

    if (existing) {
      return { conversation: existing as Conversation, error: null };
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_a_id: user.id,
        user_b_id: otherUserId,
        is_anonymous_for_a: false,
        is_anonymous_for_b: false,
      })
      .select()
      .single();

    if (createError) {
      return { conversation: null, error: createError };
    }

    return { conversation: created as Conversation, error: null };
  } catch (error) {
    return { conversation: null, error: error as Error };
  }
}

export async function getConversationById(
  conversationId: string
): Promise<{ conversation: Conversation | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      return { conversation: null, error };
    }

    return { conversation: data as Conversation | null, error: null };
  } catch (error) {
    return { conversation: null, error: error as Error };
  }
}

export async function getUserConversations(): Promise<{ conversations: ConversationWithParticipant[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { conversations: [], error: new Error('Not authenticated') };
    }

    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      return { conversations: [], error: conversationsError };
    }

    if (!conversationsData || conversationsData.length === 0) {
      return { conversations: [], error: null };
    }

    const otherUserIds = conversationsData.map((conv: Conversation) =>
      conv.user_a_id === user.id ? conv.user_b_id : conv.user_a_id
    );

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds);

    if (profilesError) {
      return { conversations: [], error: profilesError };
    }

    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .in('id', otherUserIds);

    const profilesMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);
    const socialLinksMap = new Map(socialLinks?.map((s: SocialLinks) => [s.id, s]) || []);

    const conversationsWithParticipants: ConversationWithParticipant[] = conversationsData.map((conv: Conversation) => {
      const otherUserId = conv.user_a_id === user.id ? conv.user_b_id : conv.user_a_id;
      const profile = profilesMap.get(otherUserId);
      const social = socialLinksMap.get(otherUserId);

      return {
        ...conv,
        other_user: {
          ...profile!,
          social_links: social,
        },
      };
    });

    return { conversations: conversationsWithParticipants, error: null };
  } catch (error) {
    return { conversations: [], error: error as Error };
  }
}

export async function getMessagesForConversation(
  conversationId: string,
  limit = 100
): Promise<{ messages: Message[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      return { messages: [], error };
    }

    return { messages: (data || []) as Message[], error: null };
  } catch (error) {
    return { messages: [], error: error as Error };
  }
}

export async function sendMessage(
  conversationId: string,
  text?: string,
  imageUrl?: string
): Promise<{ message: Message | null; error: Error | null }> {
  try {
    if (!text && !imageUrl) {
      return { message: null, error: new Error('Message must have text or image') };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { message: null, error: new Error('Not authenticated') };
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: text || null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (messageError) {
      return { message: null, error: messageError };
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { message: message as Message, error: null };
  } catch (error) {
    return { message: null, error: error as Error };
  }
}

export async function updateConversationAnonymity(
  conversationId: string,
  isAnonymousForA: boolean,
  isAnonymousForB: boolean
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        is_anonymous_for_a: isAnonymousForA,
        is_anonymous_for_b: isAnonymousForB,
      })
      .eq('id', conversationId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function checkProximity(
  userId1: string,
  userId2: string
): Promise<{ isNearby: boolean; error: Error | null }> {
  try {
    const { data: loc1, error: error1 } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', userId1)
      .maybeSingle();

    const { data: loc2, error: error2 } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', userId2)
      .maybeSingle();

    if (error1 || error2) {
      return { isNearby: false, error: error1 || error2 };
    }

    if (!loc1 || !loc2 ||
        loc1.lat_short === null || loc1.long_short === null ||
        loc2.lat_short === null || loc2.long_short === null) {
      return { isNearby: false, error: null };
    }

    const latDiff = Math.abs(loc1.lat_short - loc2.lat_short);
    const longDiff = Math.abs(loc1.long_short - loc2.long_short);

    const isNearby = latDiff <= 0.01 && longDiff <= 0.01;

    return { isNearby, error: null };
  } catch (error) {
    return { isNearby: false, error: error as Error };
  }
}

export async function updateAllConversationAnonymity(): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { data: myLocation, error: myLocError } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', user.id)
      .maybeSingle();

    if (myLocError) {
      return { success: false, error: myLocError };
    }

    const myLocationActive = myLocation && myLocation.lat_short !== null && myLocation.long_short !== null;

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (convError) {
      return { success: false, error: convError };
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, error: null };
    }

    for (const conv of conversations) {
      const otherUserId = conv.user_a_id === user.id ? conv.user_b_id : conv.user_a_id;

      const { data: otherLocation, error: otherLocError } = await supabase
        .from('locations')
        .select('lat_short, long_short')
        .eq('id', otherUserId)
        .maybeSingle();

      if (otherLocError) {
        continue;
      }

      const otherLocationActive = otherLocation && otherLocation.lat_short !== null && otherLocation.long_short !== null;

      let shouldBeAnonymous = true;

      if (myLocationActive && otherLocationActive) {
        const latDiff = Math.abs(myLocation.lat_short - otherLocation.lat_short);
        const longDiff = Math.abs(myLocation.long_short - otherLocation.long_short);
        const isNearby = latDiff <= 0.01 && longDiff <= 0.01;

        if (isNearby) {
          shouldBeAnonymous = false;
        }
      }

      await updateConversationAnonymity(
        conv.id,
        shouldBeAnonymous,
        shouldBeAnonymous
      );
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
