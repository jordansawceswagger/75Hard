import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import SignIn from './screens/SignIn';
import Today from './screens/Today';
import Friends from './screens/Friends';
import History from './screens/History';
import Onboarding from './screens/Onboarding';
import Profile from './screens/Profile';
import BottomNav from './components/BottomNav';

function Protected({ children, requireProfile = true }) {
  const { session, profile, profileLoaded, loading } = useAuth();
  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!session) return <Navigate to="/signin" replace />;
  // Wait for the profile fetch before deciding to redirect to onboarding,
  // otherwise existing users flash to /onboarding on every load.
  if (requireProfile && !profileLoaded) return <p style={{ padding: 20 }}>Loading...</p>;
  if (requireProfile && !profile) return <Navigate to="/onboarding" replace />;
  return children;
}

function ProtectedLayout({ children }) {
  return (
    <Protected>
      <div style={{ paddingBottom: 80 }}>{children}</div>
      <BottomNav />
    </Protected>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/onboarding" element={<Protected requireProfile={false}><Onboarding /></Protected>} />
          <Route path="/" element={<ProtectedLayout><Today /></ProtectedLayout>} />
          <Route path="/party" element={<ProtectedLayout><Friends /></ProtectedLayout>} />
          <Route path="/quest" element={<ProtectedLayout><History /></ProtectedLayout>} />
          <Route path="/me" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
