// pages/admin/player.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { handleAdminLogout } from '@/components/admin/AuthHandler';
import { updatePlayerData } from '@/../lib/playerUtils';

import baseStyles from '@/styles/admin/base.module.css';
import playerStyles from '@/styles/admin/players.module.css';
import controlStyles from '@/styles/controls.module.css';
import formStyles from '@/styles/admin/forms.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';

interface Player {
  id: string;
  currentIgn: string;
  uuid: string;
  pastIgns: string[];
  events: string[];
  lastUpdated: Date;
  role?: string | null;
}

interface Role {
  id: string;
  tag: string;
  color: string;
}

const initialPlayerForm: Partial<Player> = {
  currentIgn: '',
  pastIgns: [],
  events: []
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

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerForm({ ...player });
    setError('');
    setSuccess('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
        if (!playerForm.currentIgn?.trim()) {
            setError('Player IGN is required');
            return;
        }

        // If updating existing player
        if (selectedPlayer?.id) {
            const playerRef = doc(db, 'players', selectedPlayer.id);
            await updateDoc(playerRef, {
                currentIgn: playerForm.currentIgn.trim(),
                pastIgns: playerForm.pastIgns?.filter(ign => ign.trim() !== '') || [],
                role: playerForm.role || null,
                lastUpdated: new Date()
            });
            setSuccess('Player updated successfully');
        } else {
            // Adding new player
            await updatePlayerData(playerForm.currentIgn.trim(), playerForm.role || null);
            setSuccess('Player added successfully');
        }

        // Reset form
        setPlayerForm(initialPlayerForm);
        setSelectedPlayer(null);
    } catch (err) {
        console.error('Error saving player:', err);
        setError('Failed to save player. Please try again.');
    }
};

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPlayers = players.filter(player => 
    player.currentIgn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.pastIgns?.some(ign => ign.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                    {roles.find(r => r.id === player.role)?.tag || ''}
                    <span 
                      className={playerStyles.roleColor}
                      style={{
                        backgroundColor: `#${roles.find(r => r.id === player.role)?.color}`
                      }}
                    />
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
  
              <div className={playerStyles.formSection}>
                <label htmlFor="currentIgn">Current IGN</label>
                <input
                  id="currentIgn"
                  name="currentIgn"
                  type="text"
                  className={formStyles.input}
                  value={playerForm.currentIgn}
                  onChange={handleFormChange}
                  required
                />
              </div>
  
              {/* Past IGNs section in the form */}
              <div className={playerStyles.formSection}>
                <label htmlFor="pastIgns">Past IGNs</label>
                <div className={playerStyles.pastIgnsList}>
                  {playerForm.pastIgns?.map((ign, index) => (
                    <div key={index} className={playerStyles.pastIgnRow}>
                      <input
                        type="text"
                        className={formStyles.input}
                        value={ign}
                        onChange={(e) => {
                          const newPastIgns = [...(playerForm.pastIgns || [])];
                          newPastIgns[index] = e.target.value;
                          setPlayerForm(prev => ({
                            ...prev,
                            pastIgns: newPastIgns
                          }));
                        }}
                      />
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
                  ))}
                  <button
                    type="button"
                    className={playerStyles.addIgnButton}
                    onClick={() => {
                      setPlayerForm(prev => ({
                        ...prev,
                        pastIgns: [...(prev.pastIgns || []), '']
                      }));
                    }}
                  >
                    Add Past IGN
                  </button>
                </div>
              </div>

              {/* Role selection */}
              <div className={playerStyles.formSection}>
                <label htmlFor="role">Role</label>
                <select
                      id="role"
                      name="role"
                      className={playerStyles.roleSelect}
                      value={playerForm.role || ''}
                      onChange={(e) => setPlayerForm(prev => ({
                          ...prev,
                          role: e.target.value || null
                      }))}
                      style={{
                          backgroundColor: playerForm.role ? 
                              roles.find(r => r.id === playerForm.role)?.color || '#333' : 
                              '#333'
                      }}
                  >
                      <option value="">None</option>
                      {roles.map((role) => (
                          <option 
                              key={role.id} 
                              value={role.id}
                              style={{
                                  backgroundColor: role.color
                              }}
                          >
                              {role.tag}
                          </option>
                      ))}
                  </select>
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
  
              <div className={playerStyles.buttonGroup}>
                <button 
                  type="submit" 
                  className={buttonStyles.submitButton}
                >
                  {selectedPlayer ? 'Update Player' : 'Add Player'}
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