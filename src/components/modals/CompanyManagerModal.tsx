import React, { useState } from 'react';
import {
  Building2,
  Gamepad2,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Edit2,
  Save,
  MapPin,
  Phone,
  FileText,
  Wifi,
  DollarSign,
  Palette,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  Clock,
  Laptop,
  Glasses,
  Trophy,
  Coffee,
  Car
} from 'lucide-react';
import {
  CompanyProfile,
  CompanyBranch,
  GamingStation,
  GamingStationType,
  IndustryPresetType
} from '../../types';
import {
  GAME_ZONE_PRESETS,
  applyPresetToCompany,
  createNewGameZoneCompany
} from '../../lib/gameZoneCompanies';
import { triggerHaptic } from '../../lib/haptics';

interface CompanyManagerModalProps {
  companyProfile: CompanyProfile;
  allCompanies?: CompanyProfile[];
  onUpdateCompany: (updated: CompanyProfile) => void;
  onSwitchCompany?: (company: CompanyProfile) => void;
  onCreateCompany?: (newCompany: CompanyProfile) => void;
  onClose: () => void;
}

type ModalTab = 'PROFILE' | 'PRESETS' | 'STATIONS' | 'BRANCHES' | 'SWITCHER';

const EMOJI_OPTIONS = ['🎮', '⚡', '🕹️', '🏆', '🚀', '🎱', '🎲', '👑', '🔥', '💻', '🎯', '🥊', '🏎️', '🎧'];

const BRAND_COLORS = [
  { name: 'Emerald', hex: '#10B981', bg: 'bg-[#10B981]' },
  { name: 'Cyan', hex: '#0EA5E9', bg: 'bg-[#0EA5E9]' },
  { name: 'Violet', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
  { name: 'Orange', hex: '#F97316', bg: 'bg-[#F97316]' },
  { name: 'Amber', hex: '#F59E0B', bg: 'bg-[#F59E0B]' },
  { name: 'Rose', hex: '#EF4444', bg: 'bg-[#EF4444]' },
  { name: 'Pink', hex: '#EC4899', bg: 'bg-[#EC4899]' }
];

export const CompanyManagerModal: React.FC<CompanyManagerModalProps> = ({
  companyProfile,
  allCompanies = [companyProfile],
  onUpdateCompany,
  onSwitchCompany,
  onCreateCompany,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('PROFILE');
  const [profile, setProfile] = useState<CompanyProfile>({ ...companyProfile });
  const [hasChanges, setHasChanges] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Station Form State
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<GamingStationType>('PS5');
  const [newStationRate, setNewStationRate] = useState('150');
  const [newStationControllers, setNewStationControllers] = useState('2');
  const [newStationNotes, setNewStationNotes] = useState('');

  // Branch Form State
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Addis Ababa');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // New Company Form State
  const [newCompName, setNewCompName] = useState('');
  const [newCompPreset, setNewCompPreset] = useState<IndustryPresetType>('CONSOLE_LOUNGE');
  const [newCompCity, setNewCompCity] = useState('Addis Ababa');

  const handleSaveProfile = () => {
    triggerHaptic('success');
    onUpdateCompany(profile);
    setHasChanges(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleApplyPreset = (presetKey: IndustryPresetType) => {
    triggerHaptic('medium');
    const updated = applyPresetToCompany(profile, presetKey);
    setProfile(updated);
    onUpdateCompany(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    triggerHaptic('medium');
    const newStation: GamingStation = {
      id: `st-${Date.now()}`,
      name: newStationName.trim(),
      type: newStationType,
      hourlyRate: parseFloat(newStationRate) || 150,
      controllersCount: parseInt(newStationControllers) || 2,
      status: 'AVAILABLE',
      notes: newStationNotes.trim()
    };
    const updatedStations = [...profile.stations, newStation];
    const updatedProfile = { ...profile, stations: updatedStations };
    setProfile(updatedProfile);
    onUpdateCompany(updatedProfile);
    setShowAddStation(false);
    setNewStationName('');
    setNewStationNotes('');
  };

  const handleDeleteStation = (id: string) => {
    triggerHaptic('light');
    const updated = profile.stations.filter(st => st.id !== id);
    const updatedProfile = { ...profile, stations: updated };
    setProfile(updatedProfile);
    onUpdateCompany(updatedProfile);
  };

  const handleToggleStationStatus = (id: string) => {
    triggerHaptic('light');
    const updated = profile.stations.map(st => {
      if (st.id === id) {
        const nextStatus: GamingStation['status'] =
          st.status === 'AVAILABLE' ? 'IN_SESSION' : st.status === 'IN_SESSION' ? 'MAINTENANCE' : 'AVAILABLE';
        return {
          ...st,
          status: nextStatus,
          currentSessionStartedAt: nextStatus === 'IN_SESSION' ? new Date().toISOString() : undefined
        };
      }
      return st;
    });
    const updatedProfile = { ...profile, stations: updated };
    setProfile(updatedProfile);
    onUpdateCompany(updatedProfile);
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    triggerHaptic('medium');
    const newBranch: CompanyBranch = {
      id: `br-${Date.now()}`,
      name: newBranchName.trim(),
      city: newBranchCity.trim() || 'Addis Ababa',
      address: newBranchAddress.trim(),
      phone: newBranchPhone.trim(),
      isMain: profile.branches.length === 0
    };
    const updatedBranches = [...profile.branches, newBranch];
    const updatedProfile = { ...profile, branches: updatedBranches };
    setProfile(updatedProfile);
    onUpdateCompany(updatedProfile);
    setShowAddBranch(false);
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
  };

  const handleSetActiveBranch = (branchId: string) => {
    triggerHaptic('light');
    const updated = { ...profile, activeBranchId: branchId };
    setProfile(updated);
    onUpdateCompany(updated);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    triggerHaptic('heavy');
    const created = createNewGameZoneCompany(newCompName, newCompPreset, newCompCity);
    if (onCreateCompany) {
      onCreateCompany(created);
    }
    setProfile(created);
    onUpdateCompany(created);
    setNewCompName('');
    setActiveTab('PROFILE');
  };

  const getStationTypeIcon = (type: GamingStationType) => {
    switch (type) {
      case 'PS5':
      case 'PS4':
      case 'XBOX':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'PC_GAMING':
        return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'VR_HEADSET':
        return <Glasses className="w-4 h-4 text-pink-400" />;
      case 'RACING_SIMULATOR':
        return <Car className="w-4 h-4 text-orange-400" />;
      case 'BILLIARDS':
      case 'FOOSBALL':
        return <Trophy className="w-4 h-4 text-violet-400" />;
      default:
        return <Gamepad2 className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#111622] border border-[#1E2D40] w-full max-w-2xl rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1E2D40] flex items-center justify-between bg-[#151C2C]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/10"
              style={{ backgroundColor: `${profile.brandColor}25`, borderColor: profile.brandColor }}
            >
              {profile.logoEmoji || '🎮'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base leading-tight">
                  {profile.companyName || 'Game Zone Company Settings'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  {profile.currencySymbol || 'ETB'}
                </span>
              </div>
              <p className="text-xs text-[#8899BB] mt-0.5">
                Multi-Company & Venue Configuration for Any Game Zone
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-[#1E2D40] text-[#8899BB] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Notice Banner */}
        {savedNotice && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-400 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Company profile and venues updated successfully across the ERP!</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-[#1E2D40] bg-[#0E131E] px-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('PROFILE');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#8899BB] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Company Branding</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('PRESETS');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PRESETS'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#8899BB] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Game Zone Presets</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('STATIONS');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'STATIONS'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#8899BB] hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stations ({profile.stations.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('BRANCHES');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BRANCHES'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#8899BB] hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <span>Branches ({profile.branches.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('SWITCHER');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SWITCHER'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-[#8899BB] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>Switch Company ({allCompanies.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: Company Profile & Branding */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8899BB] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Game Zone / Company Name
                  </label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => {
                      setProfile({ ...profile, companyName: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="e.g. Galaxy Game Zone"
                    className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-semibold"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8899BB] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={profile.tagline || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, tagline: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="e.g. PlayStation & Virtual Reality Lounge"
                    className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              {/* Logo Emoji & Accent Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Emoji Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8899BB] flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" /> Company Icon / Emoji
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap p-2 bg-[#182133] border border-[#1E2D40] rounded-xl">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setProfile({ ...profile, logoEmoji: emoji });
                          setHasChanges(true);
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                          profile.logoEmoji === emoji
                            ? 'bg-emerald-500/30 border border-emerald-400 scale-110 shadow-sm'
                            : 'hover:bg-[#1E2D40] text-slate-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Color Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8899BB] flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-pink-400" /> Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-[#182133] border border-[#1E2D40] rounded-xl">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        onClick={() => {
                          triggerHaptic('light');
                          setProfile({ ...profile, brandColor: c.hex });
                          setHasChanges(true);
                        }}
                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${c.bg} ${
                          profile.brandColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {profile.brandColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact, TIN & WiFi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8899BB] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-cyan-400" /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, phone: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="+251 9X XXX XXXX"
                    className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8899BB] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-400" /> TIN / Tax Reg #
                  </label>
                  <input
                    type="text"
                    value={profile.tinNumber || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, tinNumber: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="e.g. 0089765432"
                    className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8899BB] flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-emerald-400" /> Guest WiFi Password
                  </label>
                  <input
                    type="text"
                    value={profile.wifiPassword || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, wifiPassword: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="Guest Wi-Fi"
                    className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* Rules & Playtime notes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[#8899BB] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Venue Pricing & Playtime Rules Note
                </label>
                <textarea
                  rows={2}
                  value={profile.rulesNotes || ''}
                  onChange={(e) => {
                    setProfile({ ...profile, rulesNotes: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="e.g. Standard rate: 150 ETB/hr on PS5. Additional controller +30 ETB/hr. No smoking inside."
                  className="w-full bg-[#182133] border border-[#1E2D40] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Company Branding</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Game Zone Industry Presets */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <div className="bg-[#182133] border border-[#1E2D40] p-3.5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Instant Templates for Another Game Zone
                </p>
                <p className="text-[#8899BB] text-[11px] leading-relaxed">
                  Choose a preset to instantly configure gaming stations, standard Ethiopian hourly rates, and venue tags tailored to your business model.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {Object.values(GAME_ZONE_PRESETS).map((preset) => {
                  const isCurrent = profile.industryPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-[#18233C] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-[#151C2C] border-[#1E2D40] hover:border-[#2E4160]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.emoji}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Active Preset
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{preset.title}</h4>
                          <p className="text-[11px] text-[#00D4AA] font-medium mt-0.5">{preset.tagline}</p>
                        </div>
                        <p className="text-xs text-[#8899BB] leading-relaxed line-clamp-3">
                          {preset.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#1E2D40]/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {preset.recommendedStations.length} Stations included
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-sm'
                          }`}
                        >
                          {isCurrent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                          <span>{isCurrent ? 'Applied' : 'Apply Preset'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Gaming Stations & Rates */}
          {activeTab === 'STATIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Station Inventory & Hourly Rates</h4>
                  <p className="text-xs text-[#8899BB]">Configure PS5, PS4, PC, VR and Billiards stations in the venue</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStation(!showAddStation)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Station</span>
                </button>
              </div>

              {/* Add Station Form */}
              {showAddStation && (
                <form onSubmit={handleAddStation} className="p-4 bg-[#182133] border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#1E2D40] pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> New Station Setup
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddStation(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Station Name</label>
                      <input
                        type="text"
                        value={newStationName}
                        onChange={(e) => setNewStationName(e.target.value)}
                        placeholder="e.g. PS5 Station 7 (OLED)"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Type</label>
                      <select
                        value={newStationType}
                        onChange={(e) => setNewStationType(e.target.value as GamingStationType)}
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="PS5">PlayStation 5 (PS5)</option>
                        <option value="PS4">PlayStation 4 (PS4)</option>
                        <option value="XBOX">Xbox Series X / S</option>
                        <option value="PC_GAMING">Gaming PC / LAN Rig</option>
                        <option value="VR_HEADSET">Virtual Reality (VR Pod)</option>
                        <option value="RACING_SIMULATOR">Racing Wheel Simulator</option>
                        <option value="BILLIARDS">Billiards / 8-Ball Pool</option>
                        <option value="FOOSBALL">Foosball Table</option>
                        <option value="VIP_ROOM">VIP Private Room</option>
                        <option value="OTHER">Other Game Station</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Hourly Rate (ETB)</label>
                      <input
                        type="number"
                        value={newStationRate}
                        onChange={(e) => setNewStationRate(e.target.value)}
                        placeholder="150"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Controllers / Seats</label>
                      <input
                        type="number"
                        value={newStationControllers}
                        onChange={(e) => setNewStationControllers(e.target.value)}
                        placeholder="2"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Station Notes</label>
                      <input
                        type="text"
                        value={newStationNotes}
                        onChange={(e) => setNewStationNotes(e.target.value)}
                        placeholder="e.g. 4K 120Hz TV"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Station to Venue</span>
                  </button>
                </form>
              )}

              {/* Station Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.stations.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 bg-[#151C2C] border border-[#1E2D40] rounded-xl flex items-center justify-between hover:border-[#2E4160] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1E2D40]/60 flex items-center justify-center shrink-0">
                        {getStationTypeIcon(st.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-white leading-tight">{st.name}</h5>
                          <button
                            type="button"
                            onClick={() => handleToggleStationStatus(st.id)}
                            title="Click to toggle status: Available / In Session / Maintenance"
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                              st.status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : st.status === 'IN_SESSION'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {st.status === 'AVAILABLE' ? 'OPEN' : st.status === 'IN_SESSION' ? 'IN PLAY' : 'SERVICE'}
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                          {st.hourlyRate} ETB <span className="text-[10px] text-[#8899BB] font-normal">/ hr</span>
                          {st.notes && <span className="text-[10px] text-slate-400 font-normal"> · {st.notes}</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStation(st.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete station"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Branches & Locations */}
          {activeTab === 'BRANCHES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Company Branches & Venues</h4>
                  <p className="text-xs text-[#8899BB]">Manage multiple branches for this Game Zone company</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBranch(!showAddBranch)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Branch</span>
                </button>
              </div>

              {/* Add Branch Form */}
              {showAddBranch && (
                <form onSubmit={handleAddBranch} className="p-4 bg-[#182133] border border-pink-500/40 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#1E2D40] pb-2">
                    <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> New Branch Venue
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Branch Name</label>
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. Hawassa Lakeview Branch"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">City / Region</label>
                      <input
                        type="text"
                        value={newBranchCity}
                        onChange={(e) => setNewBranchCity(e.target.value)}
                        placeholder="e.g. Hawassa"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Address / Street</label>
                      <input
                        type="text"
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        placeholder="e.g. Commercial Center, 2nd Floor"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Phone</label>
                      <input
                        type="text"
                        value={newBranchPhone}
                        onChange={(e) => setNewBranchPhone(e.target.value)}
                        placeholder="+251 9X XXX XXXX"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Branch</span>
                  </button>
                </form>
              )}

              {/* Branch Cards */}
              <div className="space-y-2">
                {profile.branches.map((br) => {
                  const isActive = profile.activeBranchId === br.id;
                  return (
                    <div
                      key={br.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-[#18233C] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-[#151C2C] border-[#1E2D40]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{br.name}</h5>
                            {br.isMain && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-400">
                                HQ
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400">
                                Active Venue
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8899BB] mt-0.5">
                            {br.city}{br.address ? ` · ${br.address}` : ''} {br.phone ? `· 📞 ${br.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveBranch(br.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1E2D40] hover:bg-emerald-500 hover:text-slate-900 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        {profile.branches.length > 1 && !br.isMain && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              const updated = profile.branches.filter(b => b.id !== br.id);
                              const updatedProfile = { ...profile, branches: updated };
                              setProfile(updatedProfile);
                              onUpdateCompany(updatedProfile);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: Switch Company / Add New Company */}
          {activeTab === 'SWITCHER' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Registered Game Zone Companies</h4>
                <p className="text-xs text-[#8899BB]">
                  Switch between multiple game zones or provision a new entertainment business
                </p>
              </div>

              {/* List of Registered Companies */}
              <div className="space-y-2">
                {allCompanies.map((comp) => {
                  const isCurrent = comp.id === profile.id;
                  return (
                    <div
                      key={comp.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-[#18233C] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-[#151C2C] border-[#1E2D40] hover:border-[#2E4160]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/10"
                          style={{ backgroundColor: `${comp.brandColor}25`, borderColor: comp.brandColor }}
                        >
                          {comp.logoEmoji || '🎮'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{comp.companyName}</h5>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8899BB] mt-0.5">
                            {comp.tagline} · {comp.branches.length} branches · {comp.stations.length} stations
                          </p>
                        </div>
                      </div>

                      {!isCurrent && onSwitchCompany && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('medium');
                            onSwitchCompany(comp);
                            setProfile(comp);
                            setActiveTab('PROFILE');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create New Company Form */}
              <div className="p-4 bg-[#182133] border border-violet-500/40 rounded-xl space-y-3 pt-3">
                <div className="border-b border-[#1E2D40] pb-2">
                  <h5 className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Setup New Game Zone Company
                  </h5>
                  <p className="text-[10px] text-[#8899BB]">
                    Create a separate profile for another game lounge or branch company
                  </p>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">Company Name</label>
                      <input
                        type="text"
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        placeholder="e.g. Nexus Esports Lounge"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8899BB]">City</label>
                      <input
                        type="text"
                        value={newCompCity}
                        onChange={(e) => setNewCompCity(e.target.value)}
                        placeholder="e.g. Addis Ababa"
                        className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8899BB]">Business Model / Preset</label>
                    <select
                      value={newCompPreset}
                      onChange={(e) => setNewCompPreset(e.target.value as IndustryPresetType)}
                      className="w-full bg-[#111622] border border-[#1E2D40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                    >
                      <option value="CONSOLE_LOUNGE">🎮 PlayStation & Console Lounge (PS5/PS4/FIFA)</option>
                      <option value="PC_CAFE">⚡ Esports Arena & PC LAN Center (RTX Gaming Rigs)</option>
                      <option value="MIXED_ENTERTAINMENT">🎱 Gaming & Billiards Lounge (Consoles + Pool)</option>
                      <option value="VR_SIMULATOR">🚀 Virtual Reality & Racing Sim Center (VR Pods)</option>
                      <option value="COMMUNITY_ZONE">🕹️ Neighborhood Community Game Zone</option>
                      <option value="CUSTOM">✨ Custom Configuration</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & Launch Game Zone Company</span>
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
