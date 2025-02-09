// pages/admin/player.tsx
import { useState, useEffect, FormEvent, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, updateDoc, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { handleAdminLogout } from '@/components/admin/AuthHandler';
import MassUpdatePlayers from '@/components/admin/MassUpdatePlayers';
import { updatePlayerData } from '@/../lib/playerUtils';
import { ROLE_ORDER, sortRolesByPriority } from '@/config/players';

import baseStyles from '@/styles/admin/base.module.css';
import playerStyles from '@/styles/admin/players.module.css';
import controlStyles from '@/styles/controls.module.css';
import formStyles from '@/styles/admin/forms.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';

interface Player {
  id: string;
  currentIgn: string;
  uuid: string;
  pastIgns: Array<{
    name: string; 
    hidden: boolean;
    number?: number;
  }>;
  events: string[];
  lastUpdated: Date;
  role?: string | null;
  mainAccount?: string | null;
  altAccounts?: string[];
}

interface Role {
  id: string;
  tag: string;
  color: string;
}

const initialPlayerForm: Partial<Player> = {
  currentIgn: '',
  pastIgns: [],
  events: [],
  altAccounts: []
};

export default function PlayerManagement() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState(initialPlayerForm);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.replace('/admin/password');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch players
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const fetchedPlayers: Player[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Player));
      
      setPlayers(fetchedPlayers.sort((a, b) => a.currentIgn.localeCompare(b.currentIgn)));
    });

    return () => unsubscribe();
  }, []);

  // Fetch roles
  useEffect(() => {
    const rolesRef = collection(db, 'roles');
    const unsubscribe = onSnapshot(rolesRef, (snapshot) => {
      const fetchedRoles: Role[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role));
      setRoles(fetchedRoles);
    });
  
    return () => unsubscribe();
  }, []);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerForm({ ...player });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
        // Basic validation
        if (!playerForm.uuid?.trim()) {
            setError('Player UUID is required');
            return;
        }

        // Check if player already exists
        const existingPlayer = players.find(p => 
            p.uuid === playerForm.uuid && !selectedPlayer
        );

        if (existingPlayer) {
            setError('This player already exists in the database');
            return;
        }

        // Clean up the form data
        const cleanPastIgns = playerForm.pastIgns?.filter(ign => 
            (typeof ign === 'string' ? ign : ign.name).trim() !== ''
        ).map(ign => 
            typeof ign === 'string' ? { name: ign, hidden: false } : ign
        ) || [];
        
        const cleanAltAccounts = playerForm.altAccounts?.filter(alt => alt.trim() !== '') || [];

        // Fetch latest data from Crafty API to ensure we have current info
        try {
            const craftyResponse = await fetch(`https://api.crafty.gg/api/v2/players/${playerForm.uuid}`);
            if (!craftyResponse.ok) {
                throw new Error('Failed to fetch player data');
            }
            
            const craftyData = await craftyResponse.json();
            if (!craftyData.success || !craftyData.data) {
                throw new Error('Failed to fetch player data');
            }

            // Extract current IGN and past IGNs from Crafty data
            const currentIgn = craftyData.data.username;
            
            // Get new IGNs from Crafty data
            const newPastIgns = craftyData.data.usernames
                .map((nameObj: any) => nameObj.username)
                .filter((name: string) => 
                    name.toLowerCase() !== currentIgn.toLowerCase()
                )
                .map((name: string) => ({ name, hidden: false }));

            // Merge with existing past IGNs while preserving hidden status
            const mergedPastIgns = newPastIgns.map((newIgn: { name: string; hidden: boolean }) => {
                const existing = cleanPastIgns.find(existingIgn => 
                    existingIgn.name.toLowerCase() === newIgn.name.toLowerCase()
                );
                return existing || newIgn;
            });
            
            // Add any existing IGNs that weren't in the Crafty data
            cleanPastIgns.forEach(existingIgn => {
                if (!mergedPastIgns.some((ign: { name: string; hidden: boolean }) => 
                    ign.name.toLowerCase() === existingIgn.name.toLowerCase()
                )) {
                    mergedPastIgns.push(existingIgn);
                }
            });

            // Validate alt accounts
            if (cleanAltAccounts.includes(currentIgn) || 
                cleanAltAccounts.includes(playerForm.uuid?.trim() || '')) {
                setError('A player cannot be their own alt account');
                return;
            }

            // Check for duplicate alt accounts
            const uniqueAlts = [...new Set(cleanAltAccounts)];
            if (uniqueAlts.length !== cleanAltAccounts.length) {
                setError('Duplicate alt accounts are not allowed');
                return;
            }

            // Prepare the player data object
            const playerData = {
              currentIgn: currentIgn,
              uuid: playerForm.uuid.trim(),
              pastIgns: cleanPastIgns
                .map((ign, index, array) => ({
                  ...ign,
                  number: array.length - 1 - index, // Explicitly assign number based on order
                  hidden: ign.hidden ?? false
                }))
                .sort((a, b) => (b.number ?? 0) - (a.number ?? 0)), // Ensure sorted by number
              role: playerForm.role || null,
              altAccounts: cleanAltAccounts,
              events: playerForm.events || [],
              lastUpdated: new Date(),
              mainAccount: playerForm.mainAccount || null
            };

            // If updating existing player
            if (selectedPlayer?.id) {
                const playerRef = doc(db, 'players', selectedPlayer.id);
                await updateDoc(playerRef, playerData);
            } else {
                // Adding new player
                await addDoc(collection(db, 'players'), playerData);
            }

            // Process the player and their alt accounts
            try {
                await updatePlayerData(
                    currentIgn,
                    playerForm.role || null,
                    cleanAltAccounts
                );

                setSuccess(selectedPlayer ? 'Player updated successfully' : 'Player added successfully');

                // Reset form and selection
                setPlayerForm(initialPlayerForm);
                setSelectedPlayer(null);
            } catch (err) {
                if (err instanceof Error) {
                    setError(`Failed to process alt accounts: ${err.message}`);
                } else {
                    setError('Failed to process alt accounts');
                }
                return;
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to fetch player data: ${err.message}`);
            } else {
                setError('Failed to fetch player data');
            }
            return;
        }

    } catch (err) {
        console.error('Error saving player:', err);
        if (err instanceof Error) {
            setError(`Failed to save player: ${err.message}`);
        } else {
            setError('Failed to save player. Please try again.');
        }
    }
};

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const fetchPlayerData = async (input: string) => {
    try {
      // Check if input is UUID format
      const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
      let uuid;
      
      if (uuidRegex.test(input.replace(/-/g, ''))) {
        // Input is UUID, format it properly
        uuid = input.replace(/-/g, '').replace(
          /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/i,
          '$1-$2-$3-$4-$5'
        );
      } else {
        // Input is IGN, need to lookup UUID first
        const searchResponse = await fetch(`https://api.crafty.gg/api/v2/players/search?username=${input}`);
        if (!searchResponse.ok) {
          throw new Error('Failed to find player');
        }
        const searchData = await searchResponse.json();
        if (!searchData.success || !searchData.data?.length) {
          throw new Error('Player not found');
        }
        // Find exact username match
        const player = searchData.data.find(
          (p: any) => p.username.toLowerCase() === input.toLowerCase()
        );
        if (!player) {
          throw new Error('Player not found');
        }
        uuid = player.uuid;
      }
  
      // Get full player data from Crafty API
      const craftyResponse = await fetch(`https://api.crafty.gg/api/v2/players/${uuid}`);
      if (!craftyResponse.ok) {
        throw new Error('Failed to fetch player data');
      }
      
      const craftyData = await craftyResponse.json();
      if (!craftyData.success || !craftyData.data) {
        throw new Error('Failed to fetch player data');
      }
  
      const currentIgn = craftyData.data.username;
  
      // Process past IGNs
      const pastIgns = craftyData.data.usernames
    .map((nameObj: any) => nameObj.username)
    .filter((name: string) => 
        name.toLowerCase() !== currentIgn.toLowerCase()
    )
    .map((name: string, index: number, array: string[]) => ({
        name,
        hidden: false,
        number: array.length - 1 - index // Assign numbers so most recent has highest number
    }));

    setPlayerForm(prev => ({
        ...prev,
        currentIgn: currentIgn,
        uuid: uuid,
        pastIgns: pastIgns.sort((a: { name: string; hidden: boolean; number?: number }, b: { name: string; hidden: boolean; number?: number }) => (b.number ?? 0) - (a.number ?? 0)) // Ensure sorted
    }));
  
    } catch (error) {
      console.error('Error fetching player data:', error);
      setError('Failed to fetch player data');
    }
  };

  const filteredPlayers = players.filter(player => 
    player.currentIgn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.pastIgns?.some(ign => 
      (typeof ign === 'string' ? ign : ign.name).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedRoles = [...roles].sort((a, b) => {
    const aIndex = ROLE_ORDER.indexOf(a.id as typeof ROLE_ORDER[number]);
    const bIndex = ROLE_ORDER.indexOf(b.id as typeof ROLE_ORDER[number]);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const handleLogout = () => handleAdminLogout(router);

  if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className={baseStyles.pageWrapper}>
      <Head>
        <title>Player Management - TNT Tag History</title>
      </Head>

      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/admin">
            <button className={controlStyles.headerButton} style={{ width: 'auto' }}>
              Dashboard
            </button>
          </Link>
          <button onClick={handleLogout} className={controlStyles.headerButton}>
            Logout
          </button>
        </div>
      </Header>
      
      <main className={baseStyles.mainContent}>
        <div className={baseStyles.editLayout}>
          {/* Players List Section */}
          <div className={baseStyles.formSection}>
          <div 
            className={baseStyles.header}
            style={{ 
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: '650px',
            }}
          > 
            <div className={baseStyles.title}>Players List</div>
            <div className={playerStyles.headerButtons}>
              <button 
                type="button" 
                className={buttonStyles.addButton}
                onClick={() => {
                  setSelectedPlayer(null);
                  setPlayerForm(initialPlayerForm);
                }}
              >
                Add New Player
              </button>
              <MassUpdatePlayers />
            </div>
          </div>
  
            <div className={playerStyles.searchContainer}>
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={playerStyles.searchInput}
              />
            </div>
  
            <div className={playerStyles.playersList}>
              {filteredPlayers.map(player => (
                <div 
                  key={player.id} 
                  className={`${playerStyles.playerItem} ${selectedPlayer?.id === player.id ? playerStyles.selected : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className={playerStyles.playerItemLeft}>
                    <div className={playerStyles.playerAvatar}>
                      <Image
                        src={`https://crafthead.net/avatar/${player.uuid}`}
                        alt={player.currentIgn}
                        width={32}
                        height={32}
                      />
                    </div>
                    <span>{player.currentIgn}</span>
                  </div>
                  {player.role && (
                    <div className={playerStyles.playerRole}>
                      {(() => {
                        const roleIds = player.role.split(',');
                        const primaryRoleId = sortRolesByPriority(roleIds.filter((id): id is typeof ROLE_ORDER[number] => 
                          ROLE_ORDER.includes(id as typeof ROLE_ORDER[number])
                        ))[0];
                        const role = roles.find(r => r.id === primaryRoleId);
                        if (!role) return null;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {role.tag}
                            <span 
                              className={playerStyles.roleColor}
                              style={{
                                backgroundColor: `#${role.color}`
                              }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
  
          {/* Player Form Section */}
          <div className={baseStyles.formSection}>
            <div className={baseStyles.header}>
              <div className={baseStyles.title}>
                {selectedPlayer ? 'Edit Player' : 'Add New Player'}
              </div>
            </div>
            <form onSubmit={handleSubmit} className={playerStyles.playerForm}>
              {error && (
                <div className={baseStyles.errorMessage}>
                  <span className={baseStyles.errorText}>{error}</span>
                </div>
              )}
              {success && (
                <div className={baseStyles.successMessage}>
                  <span className={baseStyles.successText}>{success}</span>
                </div>
              )}
  
              {/* Current IGN section */}
              <div className={playerStyles.formSection}>
                <label htmlFor="uuid">Player</label>
                <div className={playerStyles.inputWithAvatar}>
                <input
                  id="uuid"
                  name="uuid"
                  type="text"
                  className={formStyles.input}
                  value={playerForm.uuid ? `${playerForm.currentIgn} (${playerForm.uuid})` : playerForm.currentIgn}
                  onChange={(e) => {
                    // Just update the current IGN on change, don't fetch anything
                    const inputValue = e.target.value;
                    const cleanInput = inputValue.split('(')[0].trim();
                    
                    setPlayerForm(prev => ({
                      ...prev,
                      currentIgn: cleanInput,
                    }));
                  }}
                  onBlur={async (e) => {
                    const inputValue = e.target.value;
                    const cleanInput = inputValue.split('(')[0].trim();

                    // Don't try to fetch if input is too short or empty
                    if (cleanInput.length < 3) return;

                    const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
                    
                    // First check if the input is a UUID
                    if (uuidRegex.test(inputValue.replace(/-/g, ''))) {
                      // Format UUID properly
                      const formattedUUID = inputValue.replace(/-/g, '').replace(
                        /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/i,
                        '$1-$2-$3-$4-$5'
                      );
                      await fetchPlayerData(formattedUUID);
                    } else {
                      // Check if this player exists in our database
                      const player = players.find(p => 
                        p.currentIgn.toLowerCase() === cleanInput.toLowerCase() ||
                        p.pastIgns?.some(ign => 
                          (typeof ign === 'string' ? ign : ign.name).toLowerCase() === cleanInput.toLowerCase()
                        )
                      );
                      
                      if (player) {
                        // If found in database, use their data
                        setPlayerForm(prev => ({
                          ...prev,
                          currentIgn: player.currentIgn,
                          uuid: player.uuid,
                          pastIgns: player.pastIgns || []
                        }));
                      } else {
                        // If not found, try to fetch from API
                        try {
                          await fetchPlayerData(cleanInput);
                        } catch (error) {
                          setError('Player not found');
                        }
                      }
                    }
                  }}
                  placeholder="Enter username or UUID"
                />
                  {playerForm.uuid && (
                    <div className={playerStyles.currentIgnAvatar}>
                      <Image
                        src={`https://crafthead.net/avatar/${playerForm.uuid}`}
                        alt={playerForm.currentIgn || 'Player avatar'}
                        width={30}
                        height={30}
                      />
                    </div>
                  )}
                </div>
              </div>
  
              {/* Past IGNs section */}
              <div className={playerStyles.formSection}>
                <label htmlFor="pastIgns">Name History</label>
                <div 
                  className={playerStyles.pastIgnsList}
                  onDragOver={(e) => {
                    e.preventDefault(); // Allow dropping
                    e.stopPropagation();
                  }}
                >
                  {playerForm.pastIgns
                    ?.slice() // Create a copy
                    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0)) // Sort by number descending
                    .map((ign, index) => {
                    const ignObj = typeof ign === 'string' ? { name: ign, hidden: false } : ign;
                    const ignNumber = ignObj.number ?? 0;

                    return (
                      <div 
                        key={index} 
                        className={playerStyles.pastIgnRow}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                          e.currentTarget.classList.add(playerStyles.dragging);
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove(playerStyles.dragging);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add(playerStyles.dragOver);
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove(playerStyles.dragOver);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const startIndex = parseInt(e.dataTransfer.getData('text'), 10);
                          const endIndex = index;
                          
                          const newPastIgns = [...(playerForm.pastIgns || [])];
                          const [removed] = newPastIgns.splice(startIndex, 1);
                          newPastIgns.splice(endIndex, 0, removed);
                          
                          // Explicitly reassign numbers based on new order
                          const numberedPastIgns = newPastIgns.map((ign, idx, array) => ({
                            ...ign,
                            number: array.length - 1 - idx
                          }));
                          
                          setPlayerForm(prev => ({
                            ...prev,
                            pastIgns: numberedPastIgns
                          }));
                      }}
                      >
                        <span>{ignNumber}.</span>
                        <input
                          type="text"
                          className={formStyles.input}
                          value={ignObj.name}
                          onChange={(e) => {
                            const newPastIgns = [...(playerForm.pastIgns || [])];
                            if (typeof newPastIgns[index] === 'string') {
                              newPastIgns[index] = { name: e.target.value, hidden: false };
                            } else {
                              newPastIgns[index] = { ...newPastIgns[index], name: e.target.value };
                            }
                            setPlayerForm(prev => ({
                              ...prev,
                              pastIgns: newPastIgns
                            }));
                          }}
                        />
                        <button
                          type="button"
                          className={`${buttonStyles.hideButton} ${ignObj.hidden ? buttonStyles.hidden : ''}`}
                          onClick={() => {
                            const newPastIgns = [...(playerForm.pastIgns || [])];
                            if (typeof newPastIgns[index] === 'string') {
                              newPastIgns[index] = { name: newPastIgns[index], hidden: true };
                            } else {
                              newPastIgns[index] = { ...newPastIgns[index], hidden: !newPastIgns[index].hidden };
                            }
                            setPlayerForm(prev => ({
                              ...prev,
                              pastIgns: newPastIgns
                            }));
                          }}
                        >
                          {ignObj.hidden ? 'Hidden' : 'Hide'}
                        </button>
                        <button
                          type="button"
                          className={buttonStyles.deleteButton}
                          onClick={() => {
                            const newPastIgns = [...(playerForm.pastIgns || [])];
                            newPastIgns.splice(index, 1);
                            setPlayerForm(prev => ({
                              ...prev,
                              pastIgns: newPastIgns
                            }));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className={playerStyles.addIgnButton}
                    onClick={() => {
                      setPlayerForm(prev => ({
                        ...prev,
                        pastIgns: [...(prev.pastIgns || []), { name: '', hidden: false }]
                      }));
                    }}
                  >
                    Add Past IGN
                  </button>
                </div>
              </div>

              {/* Roles dropdown */}
              <div className={playerStyles.formSection}>
                <label>Roles</label>
                <div 
                  className={controlStyles.dropdown} 
                  ref={roleDropdownRef}
                  style={{ width: '100%' }}
                >
                  <div 
                    className={controlStyles.dropdownHeader}
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  >
                    <span className={controlStyles.label}>
                      {playerForm.role ? 
                        sortRolesByPriority(playerForm.role.split(',').filter((id): id is typeof ROLE_ORDER[number] => 
                          ROLE_ORDER.includes(id as typeof ROLE_ORDER[number])
                        ))
                          .map(id => roles.find(r => r.id === id.trim())?.tag)
                          .join(', ') 
                        : 'Select roles...'
                      }
                    </span>
                  </div>
                  {isRoleDropdownOpen && (
                    <ul className={controlStyles.dropdownMenu}>
                      {sortedRoles.map((role) => (
                        <li 
                          key={role.id}
                          className={`${controlStyles.dropdownItem} ${
                            playerForm.role?.includes(role.id) ? controlStyles.selected : ''
                          }`}
                          onClick={() => {
                            const currentRoles = playerForm.role ? playerForm.role.split(',') : [];
                            let newRoles;
                            
                            if (currentRoles.includes(role.id)) {
                              newRoles = currentRoles.filter(id => id !== role.id);
                            } else {
                              newRoles = [...currentRoles, role.id];
                            }
                            
                            setPlayerForm(prev => ({
                              ...prev,
                              role: newRoles.length > 0 ? newRoles.join(',') : null
                            }));
                          }}
                        >
                          <span 
                            className={controlStyles.categoryColor} 
                            style={{ backgroundColor: `#${role.color}` }}
                          />
                          {role.tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Alt Accounts or Main Account section */}
              <div className={playerStyles.formSection}>
                {playerForm.mainAccount ? (
                  // If this is an alt account, show the main account info
                  <>
                    <label>Main Account</label>
                    <div className={playerStyles.pastIgnsList}>
                      <div className={playerStyles.pastIgnRow}>
                        {(() => {
                          const mainPlayer = players.find(p => p.uuid === playerForm.mainAccount);
                          const displayValue = mainPlayer 
                            ? `${mainPlayer.currentIgn} (${playerForm.mainAccount})`
                            : playerForm.mainAccount;

                          return (
                            <>
                              <input
                                type="text"
                                className={formStyles.input}
                                value={displayValue}
                                disabled
                                style={{ opacity: 0.7 }}
                              />
                              {mainPlayer && (
                                <div className={playerStyles.altAccountInfo}>
                                  <div 
                                    className={playerStyles.playerAvatar}
                                    style={{ 
                                      width: '30px',
                                      height: '30px'
                                    }}
                                  >
                                    <Image
                                      src={`https://crafthead.net/avatar/${mainPlayer.uuid}`}
                                      alt={mainPlayer.currentIgn}
                                      width={40}
                                      height={40}
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  // If this is a main account, show the alt accounts section
                  <>
                    <label htmlFor="altAccounts">Alt Accounts</label>
                    <div className={playerStyles.pastIgnsList}>
                      {playerForm.altAccounts?.map((account, index) => {
                        const altPlayer = players.find(p => p.uuid === account);
                        const displayValue = altPlayer ? `${altPlayer.currentIgn} (${account})` : account;

                        return (
                          <div key={index} className={playerStyles.pastIgnRow}>
                            <input
                              type="text"
                              className={formStyles.input}
                              value={displayValue}
                              onChange={(e) => {
                                const newAltAccounts = [...(playerForm.altAccounts || [])];
                                const inputValue = e.target.value;
                                
                                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                if (uuidRegex.test(inputValue)) {
                                  newAltAccounts[index] = inputValue;
                                } else {
                                  const player = players.find(p => 
                                    p.currentIgn.toLowerCase() === inputValue.toLowerCase() ||
                                    p.pastIgns?.some(ign => 
                                      (typeof ign === 'string' ? ign : ign.name).toLowerCase() === inputValue.toLowerCase()
                                    )
                                  );
                                  if (player) {
                                    newAltAccounts[index] = player.uuid;
                                  } else {
                                    newAltAccounts[index] = inputValue;
                                  }
                                }
                                
                                setPlayerForm(prev => ({
                                  ...prev,
                                  altAccounts: newAltAccounts
                                }));
                              }}
                              placeholder="Enter IGN or UUID"
                            />
                            <div className={playerStyles.altAccountInfo}>
                              {altPlayer && (
                                <div 
                                  className={playerStyles.playerAvatar}
                                  style={{ 
                                    width: '30px',
                                    height: '30px'
                                  }}
                                >
                                  <Image
                                    src={`https://crafthead.net/avatar/${altPlayer.uuid}`}
                                    alt={altPlayer.currentIgn}
                                    width={40}
                                    height={40}
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className={buttonStyles.deleteButton}
                              onClick={() => {
                                const newAltAccounts = [...(playerForm.altAccounts || [])];
                                newAltAccounts.splice(index, 1);
                                setPlayerForm(prev => ({
                                  ...prev,
                                  altAccounts: newAltAccounts
                                }));
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={playerStyles.addIgnButton}
                        onClick={() => {
                          setPlayerForm(prev => ({
                            ...prev,
                            altAccounts: [...(prev.altAccounts || []), '']
                          }));
                        }}
                      >
                        Add Alt Account
                      </button>
                    </div>
                  </>
                )}
              </div>
  
              {/* Events section */}
              {selectedPlayer && (
                <div className={playerStyles.formSection}>
                  <label>Events (Read-only)</label>
                  <div className={playerStyles.eventsDisplay}>
                    {playerForm.events?.length ? 
                      playerForm.events.map((eventId, index) => (
                        <div key={index} className={playerStyles.eventLink}>
                          <Link 
                            href={`/admin/event/${eventId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {eventId}
                          </Link>
                        </div>
                      )) : 
                      'No events'
                    }
                  </div>
                </div>
              )}
  
              {/* Submit and delete buttons */}
              <div className={playerStyles.buttonGroup}>
                <button 
                  type="submit" 
                  className={buttonStyles.submitButton}
                >
                  {selectedPlayer ? 'Update Player' : 'Add Player'}
                </button>
                <button 
                  type="button" 
                  className={buttonStyles.clearButton}
                  onClick={() => {
                    setSelectedPlayer(null);
                    setPlayerForm(initialPlayerForm);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Clear Fields
                </button>
                {selectedPlayer && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
                        try {
                          await deleteDoc(doc(db, 'players', selectedPlayer.id));
                          setSuccess('Player deleted successfully');
                          setPlayerForm(initialPlayerForm);
                          setSelectedPlayer(null);
                        } catch (err) {
                          console.error('Error deleting player:', err);
                          setError('Failed to delete player. Please try again.');
                        }
                      }
                    }} 
                    className={buttonStyles.deleteButton}
                  >
                    Delete Player
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}