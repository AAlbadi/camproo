import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ExploreView } from './components/explore/ExploreView';
import { SpotDetailPage } from './components/spot-detail/SpotDetailPage';
import { HostOnboardingWizard } from './components/host/HostOnboardingWizard';
import { MyTripsPage } from './components/trips/MyTripsPage';
import { HostDashboardPage } from './components/my-spots/HostDashboardPage';
import { MessagingCenter } from './components/messages/MessagingCenter';
import { CommunityForum } from './components/community/CommunityForum';
import { SafetyCenterPage } from './components/safety/SafetyCenterPage';
import { UserProfilePage } from './components/profile/UserProfilePage';
import { AboutPage } from './components/about/AboutPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RequestStayModal } from './components/spot-detail/RequestStayModal';
import { SupportInquiryModal } from './components/common/SupportInquiryModal';
import { DonationPopup } from './components/common/DonationPopup';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Spot, isPublicSpot } from './types';
import { useEffect } from 'react';
import { trackPageView } from './lib/tracker';
import { onAuthStateChange } from './lib/supabase';

export const App: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    registerUser,
    switchUser,
    setSelectedSpotId,
    isSupportModalOpen,
    setIsSupportModalOpen,
    supportModalTopic,
    supportModalSubject
  } = useApp();
  const [modalSpot, setModalSpot] = useState<Spot | null>(null);

  // Automatically track page visits
  useEffect(() => {
    trackPageView(`/${currentView === 'home' ? '' : currentView}`);
  }, [currentView]);

  // Listen for Supabase OAuth return once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      if (authUser?.email) {
        const savedUsersRaw = localStorage.getItem('camproo_users');
        const savedUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
        const existing = savedUsers.find((u: any) => u.email === authUser.email);
        if (existing) {
          switchUser(existing.id);
          return;
        }

        registerUser({
          name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          role: 'traveler',
          email: authUser.email,
          phone: authUser.phone || '+1 (555) 789-0123',
          avatar: authUser.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=0284c7&color=fff',
          bio: 'Verified US roamer roaming scenic spots.',
          homeRegion: 'United States',
          yearsRVing: 2,
          rig: {
            type: 'class_c',
            makeModel: 'Camper Rig',
            lengthFt: 25,
            year: 2023
          },
          verifications: { email: true, phone: true, idDocument: true, rvOwnership: true }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRequestStay = (spot: Spot) => {
    if (isPublicSpot(spot)) {
      setSelectedSpotId(spot.id);
      setCurrentView('spot-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setModalSpot(spot);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-cream-900 selection:bg-roo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-16 md:pb-0">
        {(currentView === 'home' || currentView === 'explore') && (
          <ExploreView onRequestStay={handleRequestStay} />
        )}

        {currentView === 'spot-detail' && (
          <SpotDetailPage />
        )}

        {currentView === 'host-onboarding' && (
          <HostOnboardingWizard />
        )}

        {currentView === 'trips' && (
          <MyTripsPage />
        )}

        {currentView === 'my-spots' && (
          <HostDashboardPage />
        )}

        {currentView === 'messages' && (
          <MessagingCenter />
        )}

        {currentView === 'community' && (
          <CommunityForum />
        )}

        {currentView === 'safety' && (
          <SafetyCenterPage />
        )}

        {currentView === 'profile' && (
          <UserProfilePage />
        )}

        {currentView === 'about' && (
          <AboutPage />
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      <Footer />

      {/* Persistent Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Corner Donation Widget - hidden on spot-detail and mobile to avoid blocking content */}
      {currentView !== 'spot-detail' && (
        <div className="hidden md:block">
          <DonationPopup position="bottom-right" />
        </div>
      )}

      {/* Global Stay Request Modal */}
      {modalSpot && (
        <RequestStayModal
          spot={modalSpot}
          onClose={() => setModalSpot(null)}
          onSuccess={() => {
            setModalSpot(null);
            setCurrentView('trips');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Support & Inquiries Modal */}
      <SupportInquiryModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        defaultTopic={supportModalTopic}
        defaultSubject={supportModalSubject}
      />
    </div>
  );
};
export default App;
