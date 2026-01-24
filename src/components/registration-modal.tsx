import AuthModal from "./auth-modal";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserType?: 'owner' | 'provider' | null;
}

export default function RegistrationModal({ isOpen, onClose, defaultUserType }: RegistrationModalProps) {
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      defaultUserType={defaultUserType}
      defaultMode="register"
    />
  );
}