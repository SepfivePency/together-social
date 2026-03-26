import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';
import { GroupView } from './components/GroupView';
import { Profile } from './components/Profile';
import { Discovery } from './components/Discovery';
import { DirectMessages } from './components/DirectMessages';
import { BottomNav } from './components/BottomNav';
import { GroupsMobile } from './components/GroupsMobile';
import { CURRENT_USER, MOCK_GROUPS, MOCK_POSTS } from './constants';
import { Group, ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.CHAT);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [appBgColor, setAppBgColor] = useState<string>('#0f172a'); // Default slate-950
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>(MOCK_GROUPS);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleJoinGroup = (group: Group) => {
    if (!myGroups.find(g => g.id === group.id)) {
      setMyGroups(prev => [...prev, group]);
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    setMyGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
      setCurrentView(ViewState.HOME);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setActiveGroup(group);
    setCurrentView(ViewState.GROUP);
  };

  const handleViewSelect = (view: ViewState) => {
    setCurrentView(view);
    if (view !== ViewState.GROUP) {
      setActiveGroup(null);
    }
  };

  return (
    <div className="flex h-screen text-slate-100 font-sans overflow-hidden" style={{ backgroundColor: appBgColor }}>
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar 
        groups={myGroups}
        activeGroup={activeGroup}
        onSelectGroup={handleGroupSelect}
        onSelectView={handleViewSelect}
        currentView={currentView}
        showToast={showToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative w-full" style={{ backgroundColor: appBgColor }}>
        {currentView === ViewState.HOME && (
          <Feed currentUser={CURRENT_USER} posts={MOCK_POSTS} showToast={showToast} />
        )}
        
        {currentView === ViewState.GROUP && activeGroup && (
          <GroupView group={activeGroup} currentUser={CURRENT_USER} showToast={showToast} onLeaveGroup={handleLeaveGroup} />
        )}

        {currentView === ViewState.PROFILE && (
          <Profile user={CURRENT_USER} posts={[]} showToast={showToast} appBgColor={appBgColor} setAppBgColor={setAppBgColor} />
        )}

        {currentView === ViewState.DISCOVERY && (
          <Discovery showToast={showToast} onJoinGroup={handleJoinGroup} />
        )}

        {currentView === ViewState.CHAT && (
          <DirectMessages currentUser={CURRENT_USER} showToast={showToast} />
        )}

        {currentView === ViewState.GROUPS_MOBILE && (
          <GroupsMobile groups={myGroups} onSelectGroup={handleGroupSelect} />
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav currentView={currentView} onSelectView={handleViewSelect} />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;