import { supabase } from '../lib/supabase';
import type { NearbyUserData, PublicProfile, SocialLinks } from '../lib/types';

export async function updateUserLocation(
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error } = await supabase.rpc('set_my_location', {
      latitude,
      longitude,
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

    const { error } = await supabase.rpc('set_my_location', {
      latitude: null,
      longitude: null,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

export async function isUserNearby(userId: string): Promise<{ isNearby: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isNearby: false, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase.rpc('is_user_nearby', {
      target_user_id: userId,
    });

    return { isNearby: error ? false : Boolean(data), error };
  } catch (error) {
    return { isNearby: false, error: error as Error };
  }
}

export async function getNearbyUsers(): Promise<{ users: NearbyUserData[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { users: [], error: new Error('Not authenticated') };
    }

    const { data: nearbyLocations, error: nearbyError } = await supabase.rpc(
      'get_nearby_user_ids',
      { include_self: false },
    );

    if (nearbyError) {
      return { users: [], error: nearbyError };
    }

    if (!nearbyLocations || nearbyLocations.length === 0) {
      return { users: [], error: null };
    }

    const nearbyUserIds: string[] = (nearbyLocations as Array<{ user_id: string }>).map(
      (location: { user_id: string }) => location.user_id
    );

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, user_name, account_created_at')
      .in('id', nearbyUserIds);

    if (profilesError) {
      return { users: [], error: profilesError };
    }

    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .in('id', nearbyUserIds);

    const profilesArr: PublicProfile[] = (profiles || []) as PublicProfile[];
    const socialArr: SocialLinks[] = (socialLinks || []) as SocialLinks[];

    const profilesMap: Map<string, PublicProfile> = new Map(
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
