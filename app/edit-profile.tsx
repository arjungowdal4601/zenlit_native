import { EditProfileForm } from '../src/components/profile/EditProfileForm';
import { useEditProfile } from '../src/hooks/useEditProfile';

export default function EditProfileScreen() {
  return <EditProfileForm profile={useEditProfile()} />;
}
