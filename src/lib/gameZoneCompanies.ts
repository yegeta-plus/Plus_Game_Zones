import { CompanyProfile, GamingStation, CompanyBranch, IndustryPresetType } from '../types';

export const DEFAULT_COMPANY_BRANCHES: CompanyBranch[] = [
  {
    id: 'br-main',
    name: 'Addis Ababa HQ (Bole)',
    city: 'Addis Ababa',
    address: 'Bole Medhanialem, Near Edna Mall',
    phone: '+251 91 122 3344',
    isMain: true
  },
  {
    id: 'br-sarbet',
    name: 'Sarbet Branch',
    city: 'Addis Ababa',
    address: 'Pushkin Square, Sarbet Commercial Plaza',
    phone: '+251 98 936 7877',
    isMain: false
  }
];

export const DEFAULT_GAMING_STATIONS: GamingStation[] = [
  {
    id: 'st-ps5-1',
    name: 'PS5 Station 1 (VIP 4K 65")',
    type: 'PS5',
    hourlyRate: 150,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'DualSense Edge + 4K HDR TV'
  },
  {
    id: 'st-ps5-2',
    name: 'PS5 Station 2 (FIFA / FC25)',
    type: 'PS5',
    hourlyRate: 150,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'EA FC 25 & eFootball'
  },
  {
    id: 'st-ps5-3',
    name: 'PS5 Station 3 (Action & Fighters)',
    type: 'PS5',
    hourlyRate: 150,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'Tekken 8 & Mortal Kombat 1'
  },
  {
    id: 'st-ps4-1',
    name: 'PS4 Station 4 (Pro)',
    type: 'PS4',
    hourlyRate: 100,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'PES 2021 Season Update'
  },
  {
    id: 'st-ps4-2',
    name: 'PS4 Station 5 (Pro)',
    type: 'PS4',
    hourlyRate: 100,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'Grand Theft Auto V & FIFA 23'
  },
  {
    id: 'st-vr-1',
    name: 'VR Pod 1 (Quest 3)',
    type: 'VR_HEADSET',
    hourlyRate: 200,
    controllersCount: 2,
    status: 'AVAILABLE',
    notes: 'Beat Saber & Superhot VR'
  }
];

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'comp-plus-game-zone',
  companyName: 'Plus Game Zone',
  name: 'Plus Game Zone',
  tagline: 'PlayStation & Virtual Reality Lounge',
  logoEmoji: '🎮',
  brandColor: '#10B981', // Cyber Emerald
  industryPreset: 'CONSOLE_LOUNGE',
  branches: DEFAULT_COMPANY_BRANCHES,
  activeBranchId: 'br-main',
  currencySymbol: 'ETB',
  stations: DEFAULT_GAMING_STATIONS,
  tinNumber: '0089765432',
  phone: '+251 98 936 7877',
  email: 'info@plusgamezone.et',
  wifiPassword: 'pluszone_guest_5g',
  rulesNotes: 'Standard playtime: 150 ETB/hr on PS5, 100 ETB/hr on PS4. Additional controller +30 ETB/hr.'
};

export interface GameZonePresetDefinition {
  id: IndustryPresetType;
  title: string;
  tagline: string;
  emoji: string;
  defaultColor: string;
  description: string;
  sampleName: string;
  recommendedStations: Omit<GamingStation, 'id'>[];
  recommendedCategories?: string[];
}

export const GAME_ZONE_PRESETS: Record<IndustryPresetType, GameZonePresetDefinition> = {
  CONSOLE_LOUNGE: {
    id: 'CONSOLE_LOUNGE',
    title: 'PlayStation & Console Lounge',
    tagline: 'PS5, PS4, FIFA & Fighting Games Lounge',
    emoji: '🎮',
    defaultColor: '#10B981',
    description: 'Designed for console game zones featuring PS5, PS4, Xbox Series X, sports tournaments, and controller rentals.',
    sampleName: 'Apex Gaming Lounge',
    recommendedStations: [
      { name: 'PS5 Station 1 (VIP OLED)', type: 'PS5', hourlyRate: 160, controllersCount: 2, status: 'AVAILABLE', notes: '4K 120Hz display' },
      { name: 'PS5 Station 2 (FIFA / FC25)', type: 'PS5', hourlyRate: 150, controllersCount: 2, status: 'AVAILABLE', notes: 'Dual DualSense controllers' },
      { name: 'PS5 Station 3 (Tekken 8)', type: 'PS5', hourlyRate: 150, controllersCount: 2, status: 'AVAILABLE', notes: 'Arcade stick available' },
      { name: 'PS5 Station 4 (Co-op Story)', type: 'PS5', hourlyRate: 150, controllersCount: 2, status: 'AVAILABLE', notes: 'Split screen co-op setup' },
      { name: 'PS4 Station 5 (Pro)', type: 'PS4', hourlyRate: 100, controllersCount: 2, status: 'AVAILABLE', notes: 'Budget friendly gaming' },
      { name: 'PS4 Station 6 (Pro)', type: 'PS4', hourlyRate: 100, controllersCount: 2, status: 'AVAILABLE', notes: 'PES 2021 & FIFA 23' }
    ]
  },
  PC_CAFE: {
    id: 'PC_CAFE',
    title: 'Esports Arena & PC LAN Center',
    tagline: 'High-FPS PC Gaming, Tournaments & LAN Cafe',
    emoji: '⚡',
    defaultColor: '#0EA5E9',
    description: 'Optimized for PC gaming centers, internet cafes, competitive shooter tournaments, and time-pass LAN stations.',
    sampleName: 'Nexus Esports Arena',
    recommendedStations: [
      { name: 'PC Battle Rig 01 (RTX 4070)', type: 'PC_GAMING', hourlyRate: 140, controllersCount: 1, status: 'AVAILABLE', notes: '240Hz monitor, Mechanical Keyboard' },
      { name: 'PC Battle Rig 02 (RTX 4070)', type: 'PC_GAMING', hourlyRate: 140, controllersCount: 1, status: 'AVAILABLE', notes: 'Valorant & CS2 optimized' },
      { name: 'PC Battle Rig 03 (RTX 4070)', type: 'PC_GAMING', hourlyRate: 140, controllersCount: 1, status: 'AVAILABLE', notes: 'Dota 2 & Apex Legends' },
      { name: 'PC Battle Rig 04 (RTX 4070)', type: 'PC_GAMING', hourlyRate: 140, controllersCount: 1, status: 'AVAILABLE', notes: 'High-speed gigabit fiber' },
      { name: 'PC VIP Streaming Booth', type: 'PC_GAMING', hourlyRate: 220, controllersCount: 1, status: 'AVAILABLE', notes: 'Dual monitor, Shure Mic & Cam' },
      { name: 'PS5 Tournament Console', type: 'PS5', hourlyRate: 160, controllersCount: 2, status: 'AVAILABLE', notes: 'Tournament stage output' }
    ]
  },
  MIXED_ENTERTAINMENT: {
    id: 'MIXED_ENTERTAINMENT',
    title: 'Gaming & Billiards Entertainment Lounge',
    tagline: 'PlayStation, 8-Ball Pool Tables & Refreshments',
    emoji: '🎱',
    defaultColor: '#8B5CF6',
    description: 'Great for combined venues offering pool tables, PlayStation lounges, foosball, and a cafe bar with snacks.',
    sampleName: 'Galaxy Games & Billiards Hub',
    recommendedStations: [
      { name: 'Billiards Table 1 (Tournament Cloth)', type: 'BILLIARDS', hourlyRate: 180, controllersCount: 2, status: 'AVAILABLE', notes: 'Aramith balls, Master cues' },
      { name: 'Billiards Table 2 (Standard 8-Ball)', type: 'BILLIARDS', hourlyRate: 160, controllersCount: 2, status: 'AVAILABLE', notes: 'Full cue rack' },
      { name: 'PS5 VIP Lounge 1', type: 'PS5', hourlyRate: 160, controllersCount: 4, status: 'AVAILABLE', notes: 'Leather sofa, 4 controllers' },
      { name: 'PS5 Lounge 2', type: 'PS5', hourlyRate: 140, controllersCount: 2, status: 'AVAILABLE', notes: 'FC25 & Mortal Kombat' },
      { name: 'Pro Foosball Table', type: 'FOOSBALL', hourlyRate: 80, controllersCount: 4, status: 'AVAILABLE', notes: 'Tornado tournament table' },
      { name: 'VIP Private Room (Console + Pool)', type: 'VIP_ROOM', hourlyRate: 350, controllersCount: 6, status: 'AVAILABLE', notes: 'Private air-conditioned room' }
    ]
  },
  VR_SIMULATOR: {
    id: 'VR_SIMULATOR',
    title: 'Virtual Reality & Motion Racing Center',
    tagline: 'Next-Gen VR Pods & Force-Feedback Racing Simulators',
    emoji: '🚀',
    defaultColor: '#EC4899',
    description: 'Specialized for cutting-edge experiential venues with VR headsets, direct-drive racing simulators, and flight controls.',
    sampleName: 'HyperDrive VR & Sim Lounge',
    recommendedStations: [
      { name: 'Racing Sim Rig 1 (Fanatec Direct Drive)', type: 'RACING_SIMULATOR', hourlyRate: 250, controllersCount: 1, status: 'AVAILABLE', notes: 'F1 24, Assetto Corsa, Triple screen' },
      { name: 'Racing Sim Rig 2 (Force Feedback)', type: 'RACING_SIMULATOR', hourlyRate: 220, controllersCount: 1, status: 'AVAILABLE', notes: 'Gran Turismo 7, PS VR2 integration' },
      { name: 'VR Pod 1 (Meta Quest 3 Arena)', type: 'VR_HEADSET', hourlyRate: 200, controllersCount: 2, status: 'AVAILABLE', notes: '3x3m padded play boundary' },
      { name: 'VR Pod 2 (Meta Quest 3 Arena)', type: 'VR_HEADSET', hourlyRate: 200, controllersCount: 2, status: 'AVAILABLE', notes: 'Beat Saber, Half-Life Alyx' },
      { name: 'PS5 VIP Station', type: 'PS5', hourlyRate: 150, controllersCount: 2, status: 'AVAILABLE', notes: 'Lounge sofa for waiting guests' }
    ]
  },
  COMMUNITY_ZONE: {
    id: 'COMMUNITY_ZONE',
    title: 'Neighborhood Community Game Zone',
    tagline: 'Accessible, Friendly Console Gaming for Everyone',
    emoji: '🕹️',
    defaultColor: '#F59E0B',
    description: 'Designed for high-traffic neighborhood hubs with flexible hourly rates, quick matches, and tournament ladders.',
    sampleName: 'Level Up Game Zone',
    recommendedStations: [
      { name: 'PS5 Main Station', type: 'PS5', hourlyRate: 130, controllersCount: 2, status: 'AVAILABLE', notes: 'FC25 and Tekken' },
      { name: 'PS4 Station 1', type: 'PS4', hourlyRate: 80, controllersCount: 2, status: 'AVAILABLE', notes: 'PES 2021 patch' },
      { name: 'PS4 Station 2', type: 'PS4', hourlyRate: 80, controllersCount: 2, status: 'AVAILABLE', notes: 'PES 2021 patch' },
      { name: 'PS4 Station 3', type: 'PS4', hourlyRate: 80, controllersCount: 2, status: 'AVAILABLE', notes: 'GTA V & Fighting' },
      { name: 'Multiplayer Corner (4 Pads)', type: 'PS4', hourlyRate: 110, controllersCount: 4, status: 'AVAILABLE', notes: 'Party games & 2v2 FIFA' }
    ]
  },
  CUSTOM: {
    id: 'CUSTOM',
    title: 'Custom Game Zone Configuration',
    tagline: 'Tailored specifically for your entertainment company',
    emoji: '✨',
    defaultColor: '#3B82F6',
    description: 'Build your unique entertainment venue with custom stations, custom branch network, and tailored pricing.',
    sampleName: 'My Game Zone',
    recommendedStations: [
      { name: 'Station 1', type: 'PS5', hourlyRate: 150, controllersCount: 2, status: 'AVAILABLE', notes: 'Standard Station' }
    ]
  }
};

/**
 * Creates a new Game Zone Company Profile with defaults and unique ID
 */
export function createNewGameZoneCompany(
  name: string,
  presetKey: IndustryPresetType = 'CONSOLE_LOUNGE',
  city: string = 'Addis Ababa'
): CompanyProfile {
  const preset = GAME_ZONE_PRESETS[presetKey] || GAME_ZONE_PRESETS.CONSOLE_LOUNGE;
  const compId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const mainBranchId = `br-${Date.now()}-1`;

  const stations: GamingStation[] = preset.recommendedStations.map((st, idx) => ({
    id: `st-${Date.now()}-${idx + 1}`,
    name: st.name,
    type: st.type,
    hourlyRate: st.hourlyRate,
    controllersCount: st.controllersCount || 2,
    status: 'AVAILABLE' as const,
    notes: st.notes
  }));

  const finalName = name.trim() || preset.sampleName;

  return {
    id: compId,
    companyName: finalName,
    name: finalName,
    tagline: preset.tagline,
    logoEmoji: preset.emoji,
    brandColor: preset.defaultColor,
    industryPreset: presetKey,
    branches: [
      {
        id: mainBranchId,
        name: `${city} Main Branch`,
        city: city,
        address: `${city} Commercial District`,
        phone: '+251 91 000 0000',
        isMain: true
      }
    ],
    activeBranchId: mainBranchId,
    currencySymbol: 'ETB',
    stations,
    tinNumber: '',
    phone: '',
    email: '',
    wifiPassword: 'guest_wifi_password',
    rulesNotes: `Welcome to ${name}! Enjoy high-speed gaming.`
  };
}

/**
 * Applies a preset to an existing company profile without overwriting custom company identity
 */
export function applyPresetToCompany(
  current: CompanyProfile,
  presetKey: IndustryPresetType
): CompanyProfile {
  const preset = GAME_ZONE_PRESETS[presetKey];
  if (!preset) return current;

  const newStations: GamingStation[] = preset.recommendedStations.map((st, idx) => ({
    id: `st-${Date.now()}-${idx + 1}`,
    name: st.name,
    type: st.type,
    hourlyRate: st.hourlyRate,
    controllersCount: st.controllersCount || 2,
    status: 'AVAILABLE' as const,
    notes: st.notes
  }));

  return {
    ...current,
    tagline: preset.tagline,
    logoEmoji: preset.emoji,
    brandColor: preset.defaultColor,
    industryPreset: presetKey,
    stations: newStations
  };
}

/**
 * Calculates session price based on station hourly rate and minutes played
 */
export function calculateStationPlaytimeCost(
  hourlyRate: number,
  durationMinutes: number
): number {
  if (durationMinutes <= 0) return 0;
  const rawCost = (hourlyRate / 60) * durationMinutes;
  // Round to nearest 5 or 10 ETB for clean cash handling
  return Math.round(rawCost / 5) * 5;
}
