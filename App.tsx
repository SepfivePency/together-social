import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';
import { GroupView } from './components/GroupView';
import { Profile } from './components/Profile';
import { Discovery } from './components/Discovery';
import { DirectMessages } from './components/DirectMessages';
import { BottomNav } from './components/BottomNav';
import { CURRENT_USER, MOCK_GROUPS, MOCK_POSTS } from './constants';
import { Group, ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

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
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar 
        groups={MOCK_GROUPS}
        activeGroup={activeGroup}
        onSelectGroup={handleGroupSelect}
        onSelectView={handleViewSelect}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative w-full">
        {currentView === ViewState.HOME && (
          <Feed currentUser={CURRENT_USER} posts={MOCK_POSTS} />
        )}
        
        {currentView === ViewState.GROUP && activeGroup && (
          <GroupView group={activeGroup} currentUser={CURRENT_USER} />
        )}

        {currentView === ViewState.PROFILE && (
          <Profile user={CURRENT_USER} posts={[]} />
        )}

        {currentView === ViewState.DISCOVERY && (
          <Discovery />
        )}

        {currentView === ViewState.CHAT && (
          <DirectMessages currentUser={CURRENT_USER} />
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav currentView={currentView} onSelectView={handleViewSelect} />
    </div>
  );
}

export default App;