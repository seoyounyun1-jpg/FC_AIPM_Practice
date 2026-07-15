import { Navigate, Route, Routes } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage.jsx';
import HomePage from './pages/HomePage.jsx';
import RoundPage from './pages/RoundPage.jsx';
import { getLocalUserId } from './lib/localUser.js';

function RootRedirect() {
  const userId = getLocalUserId();
  return <Navigate to={userId ? '/home' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/round/:topicId" element={<RoundPage />} />
    </Routes>
  );
}
