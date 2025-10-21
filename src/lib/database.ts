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

export async function updateProfileDisplayName(displayName: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError };
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

    const nearbyUserIds: string[] = (nearbyLocations as Array<{ id: string }>).map(
      (loc: { id: string }) => loc.id
    );

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

    const profilesArr: Profile[] = (profiles || []) as Profile[];
    const socialArr: SocialLinks[] = (socialLinks || []) as SocialLinks[];

    const profilesMap: Map<string, Profile> = new Map(
      profilesArr.map((p) => [p.id, p])
    );
    const socialLinksMap: Map<string, SocialLinks> = new Map(
      socialArr.map((s) => [s.id, s])
    );

    const nearbyUsers: NearbyUserData[] = nearbyUserIds
      .map<NearbyUserData | null>((userId: string) => {
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
      })
      .filter((user: NearbyUserData | null): user is NearbyUserData => user !== null);

    return { users: nearbyUsers, error: null };
  } catch (error) {
    return { users: [], error: error as Error };
  }
}

export async function deleteImageFromStorage(
  imageUrl: string | null,
  bucket: 'profile-images' | 'post-images' | 'feedback-images'
): Promise<{ success: boolean; error: Error | null }> {
  if (!imageUrl) {
    return { success: true, error: null };
  }

  try {
    // Extract path relative to the bucket root, handling any nesting depth
    // Expected public URL: .../storage/v1/object/public/<bucket>/<path>
    const cleanUrl = imageUrl.split('?')[0];
    const regex = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
    const match = cleanUrl.match(regex);
    const filePath = match && match[1] ? match[1] : cleanUrl.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function uploadImage(
  fileOrUri: Blob | File | ArrayBuffer | Uint8Array | string,
  bucket: 'profile-images' | 'post-images' | 'feedback-images',
  fileName: string,
  options?: { contentType?: string }
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

    const uploadPayload =
      fileToUpload instanceof Uint8Array
        ? fileToUpload.buffer
        : fileToUpload;

    const uploadOptions: { upsert: boolean; contentType?: string } = {
      upsert: true,
    };

    if (options?.contentType) {
      uploadOptions.contentType = options.contentType;
    }

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadPayload as any, uploadOptions);

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

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
}

export interface MessageThread {
  other_user_id: string;
  other_user: Profile & { social_links?: SocialLinks };
  last_message: Message;
  unread_count: number;
}



export async function getUserMessageThreads(): Promise<{ threads: MessageThread[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { threads: [], error: new Error('Not authenticated') };
    }

    // Get nearby users first
    const { users: nearbyUsers, error: nearbyError } = await getNearbyUsers();
    if (nearbyError) {
      return { threads: [], error: nearbyError };
    }

    if (!nearbyUsers || nearbyUsers.length === 0) {
      return { threads: [], error: null };
    }

    const nearbyUserIds = nearbyUsers.map(u => u.id);

    // Get all messages where current user is sender or receiver AND other party is nearby
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.in.(${nearbyUserIds.join(',')})),and(receiver_id.eq.${user.id},sender_id.in.(${nearbyUserIds.join(',')}))`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      return { threads: [], error: messagesError };
    }

    if (!messagesData || messagesData.length === 0) {
      return { threads: [], error: null };
    }

    // Group messages by other user
    const threadMap = new Map<string, Message[]>();
    messagesData.forEach((msg: Message) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!threadMap.has(otherUserId)) {
        threadMap.set(otherUserId, []);
      }
      threadMap.get(otherUserId)!.push(msg as Message);
    });

    // Get unread counts
    const { data: unreadData } = await supabase.rpc('get_unread_message_counts');
    const unreadMap = new Map<string, number>();
    if (unreadData) {
      unreadData.forEach((item: { sender_id: string; unread_count: number }) => {
        unreadMap.set(item.sender_id, item.unread_count);
      });
    }

    // Build threads with user info
    const nearbyUsersMap = new Map(nearbyUsers.map(u => [u.id, u]));

    const threads: MessageThread[] = [];
    threadMap.forEach((messages, otherUserId) => {
      const userData = nearbyUsersMap.get(otherUserId);
      if (!userData) return;

      const lastMessage = messages[0]; // Already sorted by created_at DESC
      threads.push({
        other_user_id: otherUserId,
        other_user: {
          id: userData.id,
          display_name: userData.name,
          user_name: userData.username,
          date_of_birth: null,
          gender: null,
          email: '',
          account_created_at: '',
          social_links: {
            id: userData.id,
            profile_pic_url: userData.profilePhoto || null,
            banner_url: null,
            bio: userData.bio || null,
            instagram: userData.socialLinks.instagram || null,
            x_twitter: userData.socialLinks.twitter || null,
            linkedin: userData.socialLinks.linkedin || null,
            created_at: '',
            updated_at: '',
          },
        },
        last_message: lastMessage,
        unread_count: unreadMap.get(otherUserId) || 0,
      });
    });

    // Sort threads by last message time
    threads.sort((a, b) =>
      new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
    );

    return { threads, error: null };
  } catch (error) {
    return { threads: [], error: error as Error };
  }
}

export async function getMessagesBetweenUsers(
  otherUserId: string,
  limit = 100
): Promise<{ messages: Message[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { messages: [], error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
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
  receiverId: string,
  text: string
): Promise<{ message: Message | null; error: Error | null }> {
  try {
    if (!text || text.trim().length === 0) {
      return { message: null, error: new Error('Message must have text') };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { message: null, error: new Error('Not authenticated') };
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        text,
      })
      .select()
      .single();

    if (messageError) {
      return { message: null, error: messageError };
    }

    return { message: message as Message, error: null };
  } catch (error) {
    return { message: null, error: error as Error };
  }
}

export async function markMessagesDelivered(
  otherUserId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.rpc('mark_messages_delivered', {
      other_user_id: otherUserId,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function markMessagesRead(
  otherUserId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.rpc('mark_messages_read', {
      other_user_id: otherUserId,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export interface UserUnreadCount {
  sender_id: string;
  unread_count: number;
}

export async function getUnreadCounts(): Promise<{ counts: UserUnreadCount[]; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('get_unread_message_counts');

    if (error) {
      return { counts: [], error };
    }

    return { counts: (data || []) as UserUnreadCount[], error: null };
  } catch (error) {
    return { counts: [], error: error as Error };
  }
}

