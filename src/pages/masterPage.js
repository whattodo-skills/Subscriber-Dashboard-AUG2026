import { authentication } from 'wix-members';
import wixLocation from 'wix-location';

authentication.onLogin(() => {
  wixLocation.to('/subscriber-dashboard');
  });