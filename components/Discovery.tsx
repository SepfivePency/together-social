import React, { useState, useEffect } from 'react';
import { Search, Users, Tag, PlusCircle, Globe, X, Building2, GraduationCap } from 'lucide-react';
import { Group, Channel } from '../types';

// Mock data for discovery
const DISCOVERY_GROUPS = [
  {
    id: 'd1',
    name: 'Photography Club',
    description: 'A community for photographers of all levels. Weekly challenges and photo walks.',
    members: 1250,
    tags: ['Arts', 'Hobby'],
    image: 'https://picsum.photos/id/250/400/200',
    isPrivate: false
  },
  {
    id: 'd2',
    name: 'Varsity Esports',
    description: 'Official campus esports team. League, Valorant, and Rocket League.',
    members: 340,
    tags: ['Gaming', 'Sports'],
    image: 'https://picsum.photos/id/300/400/200',
    isPrivate: true
  },
  {
    id: 'd3',
    name: 'Student Developers',
    description: 'Connect with other student devs, hackathon teams, and project showcases.',
    members: 890,
    tags: ['Tech', 'Academic'],
    image: 'https://picsum.photos/id/30/400/200',
    isPrivate: false
  },
  {
    id: 'd4',
    name: 'Campus Musicians',
    description: 'Find bandmates, discuss music theory, and promote your gigs.',
    members: 560,
    tags: ['Music', 'Arts'],
    image: 'https://picsum.photos/id/450/400/200',
    isPrivate: false
  },
  {
    id: 'd5',
    name: 'Debate Society',
    description: 'Weekly debates on current events and philosophical topics.',
    members: 120,
    tags: ['Academic', 'Social'],
    image: 'https://picsum.photos/id/500/400/200',
    isPrivate: true
  },
  {
    id: 'd6',
    name: 'Culinary Arts',
    description: 'Sharing recipes, cooking tips, and organizing potlucks.',
    members: 430,
    tags: ['Food', 'Hobby'],
    image: 'https://picsum.photos/id/600/400/200',
    isPrivate: false
  }
];

export const Discovery: React.FC<{ showToast?: (msg: string) => void, onJoinGroup?: (group: Group) => void }> = ({ showToast, onJoinGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [verificationState, setVerificationState] = useState<'select' | 'school' | 'enterprise' | null>('select');
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [requestedGroups, setRequestedGroups] = useState<Set<string>>(new Set());

  const handleJoin = (groupId: string, isPrivate: boolean) => {
    if (isPrivate) {
      setRequestedGroups(prev => {
        const newSet = new Set(prev);
        newSet.add(groupId);
        return newSet;
      });
      showToast?.('Join request sent!');
    } else {
      setJoinedGroups(prev => {
        const newSet = new Set(prev);
        newSet.add(groupId);
        return newSet;
      });
      
      const discoveryGroup = DISCOVERY_GROUPS.find(g => g.id === groupId);
      if (discoveryGroup && onJoinGroup) {
        const newGroup: Group = {
          id: discoveryGroup.id,
          name: discoveryGroup.name,
          icon: discoveryGroup.image,
          description: discoveryGroup.description,
          members: discoveryGroup.members + 1,
          channels: [
            { id: `c1-${discoveryGroup.id}`, name: 'general', type: 'text' },
            { id: `c2-${discoveryGroup.id}`, name: 'announcements', type: 'text' },
            { id: `c3-${discoveryGroup.id}`, name: 'voice-lounge', type: 'voice' }
          ]
        };
        onJoinGroup(newGroup);
      }
      showToast?.('Successfully joined group!');
    }
  };

  const handleVerificationSubmit = () => {
    setVerificationState(null);
    showToast?.('Verification submitted successfully!');
  };

  const filteredGroups = DISCOVERY_GROUPS.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || group.tags.includes(activeTab);
    return matchesSearch && matchesTab;
  });

  const categories = ['All', 'Tech', 'Arts', 'Sports', 'Gaming', 'Academic', 'Social'];

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8 relative">
      {/* Identity Verification Modal */}
      {verificationState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setVerificationState(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8 mt-2">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
              <p className="text-slate-400 text-sm">
                Connect with your real community by verifying your school or enterprise email.
              </p>
            </div>

            {verificationState === 'select' && (
              <div className="space-y-4">
                <button 
                  onClick={() => setVerificationState('school')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-slate-400 transition-colors">
                    <GraduationCap size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">School Verification</div>
                    <div className="text-xs text-slate-400">Use your .edu email address</div>
                  </div>
                </button>

                <button 
                  onClick={() => setVerificationState('enterprise')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Enterprise Verification</div>
                    <div className="text-xs text-slate-400">Use your company email address</div>
                  </div>
                </button>
              </div>
            )}

            {verificationState === 'school' && (
              <div className="space-y-4 text-left animate-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">School Name</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Stanford University" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Student ID</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Your Student ID" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Your Name" />
                </div>
                <button onClick={handleVerificationSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors mt-4">
                  Submit Verification
                </button>
                <button onClick={() => setVerificationState('select')} className="w-full text-slate-400 hover:text-white text-sm mt-2">
                  Back
                </button>
              </div>
            )}

            {verificationState === 'enterprise' && (
              <div className="space-y-4 text-left animate-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Google" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Employee ID</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="Your Employee ID" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="Your Name" />
                </div>
                <button onClick={handleVerificationSubmit} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 rounded-lg transition-colors mt-4">
                  Submit Verification
                </button>
                <button onClick={() => setVerificationState('select')} className="w-full text-slate-400 hover:text-white text-sm mt-2">
                  Back
                </button>
              </div>
            )}

            {verificationState === 'select' && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setVerificationState(null)}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Find Your Community
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Discover groups, clubs, and societies on campus. Connect with people who share your passions.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mt-6">
            <input
              type="text"
              placeholder="Search for groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-full py-3 px-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg"
            />
            <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${activeTab === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <div key={group.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl group">
              <div className="h-32 overflow-hidden relative">
                <img 
                  src={group.image} 
                  alt={group.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
                  {group.isPrivate ? 'Private' : 'Public'}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white line-clamp-1">{group.name}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {group.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {group.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <Users size={16} />
                    <span>{group.members}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleJoin(group.id, group.isPrivate)}
                    disabled={joinedGroups.has(group.id) || requestedGroups.has(group.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${group.isPrivate 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {group.isPrivate 
                      ? (requestedGroups.has(group.id) ? 'Requested' : 'Request') 
                      : (joinedGroups.has(group.id) ? 'Joined' : 'Join')}
                    {!group.isPrivate && !joinedGroups.has(group.id) && <PlusCircle size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredGroups.length === 0 && (
            <div className="text-center py-12 text-slate-500">
                <div className="flex justify-center mb-4">
                    <Globe size={48} className="opacity-20" />
                </div>
                <p>No groups found matching your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};