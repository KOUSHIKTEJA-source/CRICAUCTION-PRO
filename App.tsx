
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  Settings, 
  Gavel, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight,
  ShieldCheck,
  Palette, 
  Clock,
  Trash2,
  X,
  Maximize2,
  ArrowRight,
  Image as ImageIcon,
  ChevronLeft,
  Camera,
  Layers,
  Zap,
  FileJson,
  LayoutDashboard,
  CheckCircle2,
  Undo2,
  Share2,
  Download,
  Eye,
  Cloud,
  CloudOff,
  Radio,
  Copy,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type AppState = 'landing' | 'setup' | 'active';
type PlayerRole = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
type ActiveTab = 'auction' | 'gallery' | 'teams';

interface BidRange {
  id: string;
  min: number;
  max: number | null;
  increment: number;
}

interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  age: number;
  basePrice: number;
  currentBid: number;
  status: 'Unsold' | 'Sold' | 'Live' | 'Draft';
  soldToId: string | null;
  stats: {
    matches: number;
    strikeRate: number;
  };
  verified: boolean;
  image: string;
}

interface Team {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

interface Bid {
  id: string;
  playerId: string;
  teamName: string;
  amount: number;
  timestamp: string;
}

interface AuctionConfig {
  title: string;
  bidRanges: BidRange[];
  timePerPlayer: number;
  primaryColor: string;
  fontFamily: string;
  maxPlayersPerTeam: number;
  defaultTeamBudget: number;
}

interface SyncData {
  config: AuctionConfig;
  teams: Team[];
  players: Player[];
  bids: Bid[];
  timeLeft: number;
  isTimerRunning: boolean;
  lastUpdated: number;
}

// Global Public Sync Endpoint
// This ID serves as the "Public Room" for everyone.
const GLOBAL_ROOM_ID = 'cricauction_public_v1';
const SYNC_SERVICE_URL = `https://jsonblob.com/api/jsonBlob/1344446549230534656`; // Using a fixed public blob

const App: React.FC = () => {
  // Persistence Loading
  const savedStateStr = localStorage.getItem('cricauction_pro_state');
  const initialData = savedStateStr ? JSON.parse(savedStateStr) : null;

  const [appState, setAppState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('auction');
  const [selectedRole, setSelectedRole] = useState<PlayerRole | 'All'>('All');
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  
  // Role/Sync State
  const [isHost, setIsHost] = useState<boolean>(localStorage.getItem('cricauction_is_host') === 'true');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Main State Hooks
  const [config, setConfig] = useState<AuctionConfig>(initialData?.config || {
    title: 'Public Premier League',
    bidRanges: [
      { id: '1', min: 0, max: 50000, increment: 2000 },
      { id: '2', min: 50001, max: 200000, increment: 5000 },
      { id: '3', min: 200001, max: null, increment: 10000 },
    ],
    timePerPlayer: 60,
    primaryColor: '#39FF14',
    fontFamily: 'Space Grotesk',
    maxPlayersPerTeam: 15,
    defaultTeamBudget: 10000000
  });

  const [teams, setTeams] = useState<Team[]>(initialData?.teams || [
    { id: '1', name: 'Mumbai Mavericks', budget: 10000000, spent: 0 },
    { id: '2', name: 'Delhi Dynamos', budget: 10000000, spent: 0 },
    { id: '3', name: 'Chennai Kings', budget: 10000000, spent: 0 },
    { id: '4', name: 'Bangalore Blasters', budget: 10000000, spent: 0 }
  ]);

  const [players, setPlayers] = useState<Player[]>(initialData?.players || [
    {
      id: '1',
      name: 'Aryan Sharma',
      role: 'All-rounder',
      age: 24,
      basePrice: 50000,
      currentBid: 0,
      status: 'Live',
      soldToId: null,
      stats: { matches: 45, strikeRate: 145.5 },
      verified: true,
      image: 'https://images.unsplash.com/photo-1540739414822-5c5703f4c812?w=800&fit=crop'
    }
  ]);

  const [bids, setBids] = useState<Bid[]>(initialData?.bids || []);
  const [timeLeft, setTimeLeft] = useState(initialData?.timeLeft || config.timePerPlayer);
  const [isTimerRunning, setIsTimerRunning] = useState(initialData?.isTimerRunning || false);

  // --- SYNC ENGINE ---

  // Host Broadcast: Send updates to the global feed whenever state changes
  useEffect(() => {
    if (appState === 'landing') return;

    if (isHost) {
      const dataToSave = { config, teams, players, bids, timeLeft, isTimerRunning };
      localStorage.setItem('cricauction_pro_state', JSON.stringify(dataToSave));
      broadcastToCloud({ ...dataToSave, lastUpdated: Date.now() });
    }
  }, [config, teams, players, bids, timeLeft, isTimerRunning, isHost, appState]);

  // Viewer/Global Mode: Poll the global feed for updates
  useEffect(() => {
    let interval: number;
    if (!isHost && appState === 'active') {
      // Initial fetch
      pollCloud();
      // Regular polling
      interval = window.setInterval(pollCloud, 2000);
    }
    return () => clearInterval(interval);
  }, [isHost, appState]);

  const broadcastToCloud = async (state: SyncData) => {
    setSyncStatus('syncing');
    try {
      await fetch(SYNC_SERVICE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      setSyncStatus('idle');
    } catch (err) {
      setSyncStatus('error');
    }
  };

  const pollCloud = async () => {
    try {
      const response = await fetch(SYNC_SERVICE_URL);
      if (response.ok) {
        const remote: SyncData = await response.json();
        setConfig(remote.config);
        setTeams(remote.teams);
        setPlayers(remote.players);
        setBids(remote.bids);
        setTimeLeft(remote.timeLeft);
        setIsTimerRunning(remote.isTimerRunning);
      }
    } catch (err) {
      console.error("Cloud fetch error:", err);
    }
  };

  const startAsHost = () => {
    setIsHost(true);
    localStorage.setItem('cricauction_is_host', 'true');
    setAppState('setup');
  };

  const startAsViewer = () => {
    setIsHost(false);
    localStorage.setItem('cricauction_is_host', 'false');
    setAppState('active');
  };

  const fullReset = () => {
    if (confirm("Reset local auction data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- AUCTION LOGIC ---
  const getCurrentIncrement = (currentPrice: number) => {
    const range = config.bidRanges.find(r => 
      currentPrice >= r.min && (r.max === null || currentPrice <= r.max)
    );
    return range ? range.increment : 1000;
  };

  const handleImageUpload = (playerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, image: base64String } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  // Ref for hidden file input for importing players
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse simple CSV -> players. Expect header line with columns: name,role,age,basePrice,image,verified
  const parseCsvToPlayers = (csv: string): Player[] => {
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const out: Player[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = cols[j] ?? '';
      }
      const p: Player = {
        id: Date.now().toString() + Math.random().toString(36).slice(2,8),
        name: obj.name || 'Unknown Player',
        role: (['Batsman','Bowler','All-rounder','Wicketkeeper'].includes(obj.role) ? obj.role : 'Batsman') as PlayerRole,
        age: Number(obj.age) || 20,
        basePrice: Number(obj.baseprice || obj.basePrice || 10000) || 10000,
        currentBid: 0,
        status: 'Draft',
        soldToId: null,
        stats: { matches: Number(obj.matches) || 0, strikeRate: Number(obj.strikerate || obj.strikeRate) || 0 },
        verified: (String(obj.verified || '').toLowerCase() === 'true'),
        image: obj.image || ''
      };
      out.push(p);
    }
    return out;
  };

  const handleImportPlayersFile = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    // Accept either an input event or a File passed directly
    const file = (e as any).target ? (e as any).target.files?.[0] : (e as File);
    if (!file) return;
    try {
      const text = await file.text();
      let newPlayers: Player[] = [];
      // Try JSON first
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          newPlayers = parsed.map((item: any) => ({
            id: item.id || (Date.now().toString() + Math.random().toString(36).slice(2,8)),
            name: item.name || 'Unknown',
            role: (['Batsman','Bowler','All-rounder','Wicketkeeper'].includes(item.role) ? item.role : 'Batsman') as PlayerRole,
            age: Number(item.age) || 20,
            basePrice: Number(item.basePrice || item.base_price) || 10000,
            currentBid: Number(item.currentBid) || 0,
            status: item.status || 'Draft',
            soldToId: item.soldToId || null,
            stats: { matches: Number(item.matches) || 0, strikeRate: Number(item.strikeRate) || 0 },
            verified: !!item.verified,
            image: item.image || ''
          }));
        }
      } catch (jsonErr) {
        // Not JSON, try CSV
        newPlayers = parseCsvToPlayers(text);
      }

      if (newPlayers.length === 0) {
        alert('No players parsed from file. Ensure the file is valid JSON array or CSV with headers.');
        return;
      }

      setPlayers(prev => [...prev, ...newPlayers]);
      alert(`Imported ${newPlayers.length} players successfully.`);
    } catch (err) {
      console.error('Import error', err);
      alert('Failed to import players. See console for details.');
    } finally {
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentPlayer = useMemo(() => players.find(p => p.status === 'Live'), [players]);

  const filteredDraftPlayers = useMemo(() => {
    return players.filter(p => p.status === 'Draft' && (selectedRole === 'All' || p.role === selectedRole));
  }, [players, selectedRole]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleBid = (teamId: string) => {
    if (!currentPlayer || !isHost) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (bids.length > 0 && bids[0].teamName === team.name) {
      alert("Highest bidder already!");
      return;
    }

    const playersBoughtCount = players.filter(p => p.soldToId === team.id).length;
    if (playersBoughtCount >= config.maxPlayersPerTeam) {
      alert("Squad full!");
      return;
    }

    const currentPrice = currentPlayer.currentBid || currentPlayer.basePrice;
    const increment = getCurrentIncrement(currentPrice);
    const newAmount = currentPrice + increment;

    if (team.spent + newAmount > team.budget) {
      alert("Purse exhausted!");
      return;
    }

    const newBid: Bid = {
      id: Math.random().toString(36).substr(2, 9),
      playerId: currentPlayer.id,
      teamName: team.name,
      amount: newAmount,
      timestamp: new Date().toISOString()
    };

    setBids([newBid, ...bids]);
    setPlayers(prev => prev.map((p): Player => p.id === currentPlayer.id ? { ...p, currentBid: newAmount } : p));
    setTimeLeft(config.timePerPlayer);
    setIsTimerRunning(true);
  };

  const undoBid = () => {
    if (bids.length === 0 || !isHost) return;
    const [removed, ...remaining] = bids;
    setBids(remaining);
    setPlayers(prev => prev.map((p): Player => 
      p.id === currentPlayer?.id ? { ...p, currentBid: remaining[0]?.amount || 0 } : p
    ));
    setTimeLeft(config.timePerPlayer);
  };

  const startAuctionForNextPlayer = (id?: string) => {
    if (!isHost) return;
    setPlayers(prev => {
      const updated = prev.map((p): Player => p.status === 'Live' ? { ...p, status: 'Draft' } : p);
      const targetId = id || filteredDraftPlayers[0]?.id;
      if (!targetId) return updated;
      return updated.map((p): Player => p.id === targetId ? { ...p, status: 'Live' } : p);
    });
    setTimeLeft(config.timePerPlayer);
    setBids([]);
  };

  const finalizeSale = (sold: boolean) => {
    if (!currentPlayer || !isHost) return;
    const lastBid = bids[0];
    const winningTeam = lastBid ? teams.find(t => t.name === lastBid.teamName) : null;
    
    setPlayers(prev => {
      const updated = prev.map((p): Player => p.id === currentPlayer.id ? { 
        ...p, 
        status: (sold && winningTeam ? 'Sold' : 'Unsold') as Player['status'],
        soldToId: sold && winningTeam ? winningTeam.id : null 
      } : p);
      return updated;
    });

    if (sold && lastBid && winningTeam) {
      setTeams(prev => prev.map(t => t.id === winningTeam.id ? { ...t, spent: t.spent + lastBid.amount } : t));
    }

    setIsTimerRunning(false);
    setTimeLeft(config.timePerPlayer);
    setBids([]);
  };

  // --- UTILITIES ---
  /**
   * Fix for shareSquad error: Copies the current squad list to the clipboard.
   */
  const shareSquad = (team: Team) => {
    const squad = players.filter(p => p.soldToId === team.id);
    const text = `${team.name} Squad:\n` + squad.map(p => `- ${p.name} (${p.role}): ₹${p.currentBid.toLocaleString()}`).join('\n');
    navigator.clipboard.writeText(text).then(() => alert("Squad info copied to clipboard!"));
  };

  /**
   * Fix for downloadSquad error: Downloads the squad data as a JSON file.
   */
  const downloadSquad = (team: Team) => {
    const squad = players.filter(p => p.soldToId === team.id);
    const data = {
      teamName: team.name,
      budgetUsed: team.spent,
      squad: squad.map(p => ({ name: p.name, role: p.role, price: p.currentBid }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${team.name.replace(/\s+/g, '_')}_squad.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6" style={{ fontFamily: config.fontFamily }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 max-w-4xl">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-[#39FF14] rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(57,255,20,0.3)]">
              <Trophy className="text-black w-10 h-10" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              Cric<span style={{ color: config.primaryColor }}>Auction</span> Pro
            </h1>
            <p className="text-gray-500 text-xl font-medium">Real-time Global Cricket Auction Dashboard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
            <button onClick={startAsHost} className="group p-10 bg-white text-black rounded-[2.5rem] transition-all hover:scale-105 active:scale-95 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <Unlock size={40} className="mx-auto mb-4" />
                <span className="text-2xl font-black uppercase">Host Auction</span>
                <p className="text-[10px] font-bold uppercase opacity-50 mt-2">Full Control & Sync</p>
              </div>
            </button>
            <button onClick={startAsViewer} className="group p-10 bg-[#0d0d0d] border border-white/10 text-white rounded-[2.5rem] transition-all hover:border-white/30 hover:scale-105 active:scale-95">
              <Eye size={40} className="mx-auto mb-4 text-gray-400 group-hover:text-white" />
              <span className="text-2xl font-black uppercase">View Live Feed</span>
              <p className="text-[10px] font-bold uppercase opacity-50 mt-2">Watch-only Public Mode</p>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (appState === 'setup') {
    return (
      <div className="min-h-screen bg-[#050505] p-6 lg:p-12 overflow-y-auto no-scrollbar" style={{ fontFamily: config.fontFamily }}>
        <header className="max-w-7xl mx-auto flex justify-between items-center mb-16">
          <button onClick={() => setAppState('landing')} className="flex items-center gap-2 text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest"><ChevronLeft size={16}/> Back</button>
          <button onClick={() => setAppState('active')} className="px-12 py-5 bg-white text-black font-black rounded-3xl text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Enter Live Feed <ArrowRight className="inline ml-2" /></button>
        </header>

        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
          <div className="lg:col-span-4 space-y-12">
            <section className="space-y-6">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Palette size={20} style={{color: config.primaryColor}}/> Admin Settings</h3>
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3 block">Event Title</label>
                  <input type="text" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 font-bold text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3 block">Max Squad Size</label>
                  <input type="number" value={config.maxPlayersPerTeam} onChange={e => setConfig({...config, maxPlayersPerTeam: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 font-bold text-white outline-none" />
                </div>
              </div>
            </section>
            <button onClick={fullReset} className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase">Wipe Local Data</button>
          </div>

          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Users size={20} style={{color: config.primaryColor}}/> Franchise List</h3>
                <button onClick={() => setTeams([...teams, { id: Date.now().toString(), name: 'New Team', budget: 10000000, spent: 0 }])} className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase">Add Team</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teams.map(team => (
                  <div key={team.id} className="p-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] relative group">
                    <input type="text" value={team.name} onChange={e => setTeams(teams.map(t => t.id === team.id ? {...t, name: e.target.value} : t))} className="bg-transparent text-2xl font-black italic uppercase outline-none mb-4 w-full" />
                    <input type="number" value={team.budget} onChange={e => setTeams(teams.map(t => t.id === team.id ? {...t, budget: Number(e.target.value)} : t))} className="bg-white/5 px-4 py-2 rounded-xl text-sm font-black outline-none w-full" />
                    <button onClick={() => setTeams(teams.filter(t => t.id !== team.id))} className="absolute top-6 right-6 p-2 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Gavel size={20} style={{color: config.primaryColor}}/> Players</h3>
                <button onClick={() => setPlayers([...players, { id: Date.now().toString(), name: 'New Player', role: 'Batsman', age: 20, basePrice: 10000, currentBid: 0, status: 'Draft', soldToId: null, stats: { matches: 0, strikeRate: 0 }, verified: false, image: '' }])} className="px-5 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase">Add Player</button>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {players.map(player => (
                  <div key={player.id} className="p-8 bg-[#0d0d0d] border border-white/5 rounded-[3rem] flex items-center gap-8 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center relative">
                      {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-700" />}
                      <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.onchange=(e)=>handleImageUpload(player.id, e as any); i.click(); }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Camera size={16}/></button>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-6">
                      <input type="text" value={player.name} onChange={e => setPlayers(players.map(p => p.id === player.id ? {...p, name: e.target.value} : p))} className="bg-transparent font-black text-lg outline-none border-b border-white/5" />
                      <select value={player.role} onChange={e => setPlayers(players.map(p => p.id === player.id ? {...p, role: e.target.value as any} : p))} className="bg-transparent text-sm font-bold outline-none border-b border-white/5">
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-rounder">All-rounder</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                      </select>
                      <div className="flex items-center gap-4">
                        <input type="number" value={player.basePrice} onChange={e => setPlayers(players.map(p => p.id === player.id ? {...p, basePrice: Number(e.target.value)} : p))} className="bg-transparent text-sm font-bold outline-none flex-1 border-b border-white/5" />
                        <button onClick={() => setPlayers(players.filter(p => p.id !== player.id))} className="text-red-500"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden" style={{ fontFamily: config.fontFamily }}>
      <nav className="p-6 lg:px-12 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: config.primaryColor }}>
            <Trophy size={20} className="text-black" />
          </div>
          <h2 className="font-black italic uppercase tracking-tighter text-2xl hidden md:block">{config.title}</h2>
        </div>

        <div className="flex items-center gap-4">
           {/* GLOBAL SYNC INDICATOR */}
           <div className="bg-white/5 border border-white/10 px-5 py-2 rounded-full flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_10px_currentColor]`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {isHost ? 'Broadcasting to Public Feed' : 'Viewing Global Feed'}
              </span>
              {isHost ? <Lock size={12} className="text-blue-500" /> : <Eye size={12} className="text-green-500" />}
           </div>

           <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab('auction')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'auction' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Auction</button>
              <button onClick={() => setActiveTab('gallery')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'gallery' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Gallery</button>
              <button onClick={() => setActiveTab('teams')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'teams' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Squads</button>
              {isHost && <button onClick={() => setAppState('setup')} className="p-2 ml-4 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white"><Settings size={20}/></button>}
              <button onClick={() => setAppState('landing')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"><X size={20}/></button>
           </div>
        </div>
      </nav>

      {activeTab === 'auction' && (
        <main className="flex-1 flex flex-col p-6 lg:p-12 gap-8 overflow-y-auto no-scrollbar relative">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 flex-1">
            {/* Summary */}
            <div className="xl:col-span-1 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] px-2 mb-4">Capital Standings</h3>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh] no-scrollbar">
                {teams.map(team => (
                  <div key={team.id} className="p-6 bg-[#0d0d0d] border border-white/5 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-sm uppercase italic mb-1">{team.name}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Purse: ₹{(team.budget - team.spent).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bidding Central */}
            <div className="xl:col-span-2 space-y-8 flex flex-col">
              <AnimatePresence mode="wait">
                {currentPlayer ? (
                  <motion.div key={currentPlayer.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col relative">
                    <div className="absolute top-10 right-10 z-10">
                      <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-black ${timeLeft < 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-white/10 text-white'}`}>
                        <span className="text-2xl leading-none italic">{timeLeft}</span>
                        <p className="text-[7px] uppercase tracking-tighter">Clock</p>
                      </div>
                    </div>

                    <div className="flex-1 p-10 lg:p-16 flex flex-col md:flex-row gap-16 items-center">
                       <div className="w-full lg:w-1/2 aspect-square rounded-[3.5rem] overflow-hidden border border-white/10 relative shadow-2xl bg-black">
                          {currentPlayer.image ? <img src={currentPlayer.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon size={64} /></div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                          <div className="absolute bottom-10 left-10">
                             <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">{currentPlayer.name}</h1>
                             <span className="bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{currentPlayer.role}</span>
                          </div>
                       </div>
                       <div className="flex-1 space-y-10 w-full">
                          <div>
                             <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">Current Valuation</p>
                             <p className="text-6xl lg:text-8xl font-black tracking-tighter italic leading-none" style={{ color: config.primaryColor }}>
                               ₹{(currentPlayer.currentBid || currentPlayer.basePrice).toLocaleString()}
                             </p>
                          </div>
                          
                          {isHost && (
                            <div className="flex gap-4 pt-6">
                               <button onClick={() => finalizeSale(true)} className="flex-1 py-5 bg-white text-black font-black rounded-3xl uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Hammer Down</button>
                               <button onClick={() => finalizeSale(false)} className="flex-1 py-5 bg-transparent border border-white/20 text-white font-black rounded-3xl uppercase tracking-widest hover:bg-white/5 transition-all">Unsold</button>
                            </div>
                          )}
                          {!isHost && (
                            <div className="pt-6 border-t border-white/5 mt-10">
                               <div className="flex items-center gap-3 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                                  <Radio size={14} className="animate-pulse text-red-500" /> Receiving Public Live Feed
                               </div>
                            </div>
                          )}
                       </div>
                    </div>

                    {isHost && (
                      <div className="p-8 border-t border-white/5 bg-black/40">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                              <Zap size={14} style={{color: config.primaryColor}}/> Rapid Response Grid
                            </h4>
                            <button onClick={undoBid} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase">
                               <Undo2 size={12}/> Undo Bid
                            </button>
                         </div>
                         <div className="flex flex-row overflow-x-auto gap-3 pb-2 no-scrollbar">
                           {teams.map(team => {
                             const isHighest = bids[0]?.teamName === team.name;
                             return (
                               <button 
                                 key={team.id}
                                 onClick={() => handleBid(team.id)}
                                 disabled={isHighest}
                                 className={`flex-shrink-0 px-8 py-5 rounded-2xl border font-black uppercase tracking-tighter text-xs transition-all ${isHighest ? 'bg-white/5 border-white/10 text-gray-600 opacity-50' : 'bg-[#0a0a0a] border-white/10 text-white hover:border-white/30 hover:scale-105 shadow-xl'}`}
                               >
                                 {team.name}
                               </button>
                             );
                           })}
                         </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex-1 bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-20 text-center">
                     <Gavel size={64} className="text-gray-800 mb-8" />
                     <h2 className="text-4xl font-black italic uppercase mb-4">Auction Pool</h2>
                     <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map(role => (
                          <button key={role} onClick={() => setSelectedRole(role as any)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all ${selectedRole === role ? 'bg-white text-black' : 'border border-white/10 text-gray-500'}`}>{role}</button>
                        ))}
                     </div>
                     <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 h-64 overflow-y-auto no-scrollbar space-y-2">
                        {filteredDraftPlayers.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:bg-white/10">
                            <span className="font-black italic uppercase text-sm">{p.name} <span className="text-[10px] text-gray-600 ml-2">({p.role})</span></span>
                            {isHost && <button onClick={() => startAuctionForNextPlayer(p.id)} className="p-2 bg-white text-black rounded-lg opacity-0 group-hover:opacity-100"><ArrowRight size={14}/></button>}
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* History */}
            <div className="xl:col-span-1 flex flex-col h-full overflow-hidden">
               <h3 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] px-2 mb-4">Live Bid History</h3>
               <div className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-8 space-y-4 overflow-y-auto no-scrollbar">
                  <AnimatePresence>
                    {bids.map((bid, i) => (
                      <motion.div key={bid.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-5 rounded-2xl border ${i === 0 ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent opacity-40'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{bid.teamName}</span>
                        </div>
                        <p className="text-2xl font-black italic">₹{bid.amount.toLocaleString()}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {bids.length === 0 && <p className="text-center opacity-10 mt-20 italic">No bids in current round.</p>}
               </div>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'gallery' && (
        <main className="flex-1 p-6 lg:p-20 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">The Roster</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {players.map(player => {
                const owner = teams.find(t => t.id === player.soldToId);
                return (
                  <div key={player.id} className="group bg-[#0d0d0d] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
                    <div className="h-72 relative bg-black">
                      {player.image ? <img src={player.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={48}/></div>}
                      <div className="absolute top-8 left-8">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${player.status === 'Sold' ? 'bg-green-500 text-black' : player.status === 'Live' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{player.status}</span>
                      </div>
                      {owner && (
                        <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                          <p className="text-sm font-black italic uppercase text-white">{owner.name}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-8 space-y-4">
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{player.name}</h4>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase">{player.role}</span>
                        <span className="text-lg font-black italic">₹{(player.currentBid || player.basePrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'teams' && (
        <main className="flex-1 p-6 lg:p-20 overflow-y-auto no-scrollbar">
           <div className="max-w-7xl mx-auto space-y-16">
              <h1 className="text-7xl lg:text-9xl font-black uppercase italic tracking-tighter leading-none">The Squads</h1>
              <div className="flex flex-wrap gap-4">
                {teams.map(team => (
                  <button key={team.id} onClick={() => setViewingTeamId(team.id)} className={`px-8 py-6 rounded-[2.5rem] border font-black uppercase text-lg transition-all ${viewingTeamId === team.id ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>{team.name}</button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {viewingTeamId && (
                  <motion.div key={viewingTeamId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 bg-white/5 p-10 lg:p-20 rounded-[4rem] border border-white/10">
                    {(() => {
                      const team = teams.find(t => t.id === viewingTeamId)!;
                      const squad = players.filter(p => p.soldToId === team.id);
                      return (
                        <div className="space-y-12">
                           <div className="flex justify-between items-end gap-10 border-b border-white/10 pb-10">
                              <div className="space-y-4">
                                <h2 className="text-6xl font-black italic uppercase tracking-tighter">{team.name}</h2>
                                <div className="flex gap-3">
                                  <button onClick={() => shareSquad(team)} className="px-6 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Share2 size={14}/> Share</button>
                                  <button onClick={() => downloadSquad(team)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Download size={14}/> Save</button>
                                </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Budget Used</p>
                                 <p className="text-4xl font-black italic" style={{ color: config.primaryColor }}>₹{team.spent.toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                             {squad.map(player => (
                               <div key={player.id} className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                                        {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto h-full text-gray-800" size={24}/>}
                                     </div>
                                     <p className="font-black italic uppercase text-lg">{player.name}</p>
                                  </div>
                                  <p className="text-xl font-black italic" style={{ color: config.primaryColor }}>₹{player.currentBid.toLocaleString()}</p>
                               </div>
                             ))}
                             {squad.length === 0 && <p className="col-span-full py-20 border border-dashed border-white/5 rounded-[3rem] text-center italic text-gray-700">No players acquired yet.</p>}
                           </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </main>
      )}

      {/* Ambiance */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-10">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] blur-[250px] rounded-full transition-all duration-1000 animate-pulse" style={{ background: config.primaryColor }} />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] blur-[250px] rounded-full transition-all duration-1000 animate-pulse" style={{ background: config.primaryColor }} />
      </div>
    </div>
  );
};

export default App;
