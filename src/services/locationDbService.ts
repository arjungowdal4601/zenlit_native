import { supabase } from '../lib/supabase';
import type { Location, NearbyUserData, Profile, SocialLinks } from '../lib/types';

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

export async function isUserNearby(userId: string): Promise<{ isNearby: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isNearby: false, error: new Error('Not authenticated') };
    }

    const { data: currentLocation, error: locationError } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', user.id)
      .maybeSingle();

    if (locationError) {
      return { isNearby: false, error: locationError };
    }

    if (!currentLocation || currentLocation.lat_short === null || currentLocation.long_short === null) {
      return { isNearby: false, error: null };
    }

    const { data: otherLocation, error: otherLocationError } = await supabase
      .from('locations')
      .select('lat_short, long_short')
      .eq('id', userId)
      .maybeSingle();

    if (otherLocationError) {
      return { isNearby: false, error: otherLocationError };
    }

    if (!otherLocation || otherLocation.lat_short === null || otherLocation.long_short === null) {
      return { isNearby: false, error: null };
    }

    const latDiff = Math.abs(currentLocation.lat_short - otherLocation.lat_short);
    const longDiff = Math.abs(currentLocation.long_short - otherLocation.long_short);
    const isNearby = latDiff <= 0.01 && longDiff <= 0.01;

    return { isNearby, error: null };
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
