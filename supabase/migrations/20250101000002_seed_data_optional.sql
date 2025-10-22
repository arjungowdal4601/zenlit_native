/*
  # Seed Data (Optional)

  ## Overview
  This migration inserts dummy test data for development purposes.
  **This can be safely skipped in production environments.**

  ## Data Created
  1. **5 Test Profiles** - Dummy user accounts with realistic data
  2. **Social Links** - Profile pictures, bios, and social media handles
  3. **Location Data** - Test locations all within proximity range (~1.5km)
  4. **Sample Posts** - Content posts from each user with images

  ## Important Notes
  - All images use Pexels open-source stock photos
  - Test users have fixed UUIDs for consistency
  - Locations are clustered around San Francisco coordinates
  - Use `ON CONFLICT DO NOTHING` to prevent errors on re-run

  ## To Skip This Migration
  If you don't want test data, simply delete this file or don't apply it.
*/

DO $$
DECLARE
  user1_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  user2_id uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  user3_id uuid := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  user4_id uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  user5_id uuid := 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
BEGIN
  -- ============================================================================
  -- 1. INSERT TEST PROFILES
  -- ============================================================================

  INSERT INTO public.profiles (id, display_name, user_name, email, account_created_at)
  VALUES
    (user1_id, 'Alex Johnson', 'alexj', 'alex@example.com', now()),
    (user2_id, 'Sarah Martinez', 'sarahm', 'sarah@example.com', now()),
    (user3_id, 'Michael Chen', 'mikec', 'mike@example.com', now()),
    (user4_id, 'Emma Williams', 'emmaw', 'emma@example.com', now()),
    (user5_id, 'James Brown', 'jamesb', 'james@example.com', now())
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================================
  -- 2. INSERT SOCIAL LINKS
  -- ============================================================================

  INSERT INTO public.social_links (id, instagram, linkedin, x_twitter, bio, profile_pic_url, banner_url)
  VALUES
    (user1_id, 'alexj.photo', 'alex-johnson', 'alexj_dev',
     'Photographer & Tech enthusiast. Love capturing moments and building cool things.',
     'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=400',
     'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    (user2_id, 'sarahmartinez', 'sarah-martinez', 'sarah_designs',
     'UI/UX Designer creating beautiful digital experiences. Coffee lover',
     'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
     'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    (user3_id, 'mikectech', 'michael-chen', 'mike_codes',
     'Full-stack developer | Open source contributor | Always learning',
     'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
     'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    (user4_id, 'emmawilliams', 'emma-williams', 'emma_travels',
     'Travel blogger | Adventure seeker | Making memories around the world',
     'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
     'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    (user5_id, 'jamesbrown', 'james-brown', 'james_fitness',
     'Fitness coach | Nutrition expert | Helping people achieve their goals',
     'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400',
     'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=1200')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================================
  -- 3. INSERT LOCATION DATA
  -- ============================================================================

  -- All users are within 0.01 degree (~1.5km) proximity for testing
  INSERT INTO public.locations (id, lat_full, long_full, lat_short, long_short, updated_at)
  VALUES
    (user1_id, 37.7749, -122.4194, 37.77, -122.42, now()),
    (user2_id, 37.7750, -122.4195, 37.77, -122.42, now()),
    (user3_id, 37.7748, -122.4193, 37.77, -122.42, now()),
    (user4_id, 37.7751, -122.4196, 37.77, -122.42, now()),
    (user5_id, 37.7747, -122.4192, 37.77, -122.42, now())
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================================
  -- 4. INSERT SAMPLE POSTS
  -- ============================================================================

  INSERT INTO public.posts (user_id, content, image_url, created_at)
  VALUES
    (user1_id, 'Just captured this amazing sunset! The golden hour never disappoints.',
     'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '2 hours'),
    (user1_id, 'New photography project starting today. Excited to share the journey with you all!',
     NULL,
     now() - interval '1 day'),
    (user2_id, 'Working on a new UI design for a mobile app. Clean interfaces are my passion!',
     'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '3 hours'),
    (user2_id, 'Coffee and design – the perfect combination for a productive morning',
     'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '5 hours'),
    (user3_id, 'Just pushed a new feature to production! Love it when everything works on the first try',
     NULL,
     now() - interval '4 hours'),
    (user3_id, 'Contributing to open source is so rewarding. Check out this cool project I found!',
     'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '2 days'),
    (user4_id, 'Exploring the streets of this beautiful city! Every corner tells a story',
     'https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '6 hours'),
    (user4_id, 'Travel tip: Always try the local food. You never know what amazing flavors you will discover!',
     'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '1 day'),
    (user5_id, 'Morning workout complete! Remember, consistency is key to reaching your fitness goals',
     'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800',
     now() - interval '7 hours'),
    (user5_id, 'Nutrition tip of the day: Drink plenty of water throughout your workout sessions!',
     NULL,
     now() - interval '3 days')
  ON CONFLICT DO NOTHING;

END $$;
