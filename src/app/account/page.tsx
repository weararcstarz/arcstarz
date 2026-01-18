import ProtectedRoute from '@/components/ProtectedRoute';
import AccountPage from '@/components/AccountPage';

export default function Account() {
  return (
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  );
}
