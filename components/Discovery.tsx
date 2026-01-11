import React, { useState } from 'react';
import { Search, Users, Tag, PlusCircle, Globe } from 'lucide-react';
import { Group } from '../types';

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

export const Discovery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filteredGroups = DISCOVERY_GROUPS.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || group.tags.includes(activeTab);
    return matchesSearch && matchesTab;
  });

  const categories = ['All', 'Tech', 'Arts', 'Sports', 'Gaming', 'Academic', 'Social'];

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8">
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
                  
                  <button className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                    ${group.isPrivate 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {group.isPrivate ? 'Request' : 'Join'}
                    {!group.isPrivate && <PlusCircle size={14} />}
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