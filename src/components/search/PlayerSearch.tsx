// src/components/player/PlayerSearch.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import searchStyles from '../../styles/search.module.css';

interface Player {
    id: string;
    currentIgn: string;
    uuid: string;
    pastIgns?: string[];
}

const PlayerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      setSearchTerm('');
      setSearchResults([]);
      setIsFocused(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'players'),
      (snapshot) => {
        const playerData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        // Sort players alphabetically and ensure flodlol is first
        //playerData.sort((a, b) => a.currentIgn.localeCompare(b.currentIgn));

        // Sort players alphabetically and ensure flodlol is first
        playerData.sort((a, b) => {
          if (a.currentIgn.toLowerCase() === 'flodlol') return -1;
          if (b.currentIgn.toLowerCase() === 'flodlol') return 1;
          return a.currentIgn.localeCompare(b.currentIgn);
        });
        
        setPlayers(playerData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching players:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      const lowercaseValue = value.toLowerCase();
      const filtered = players.filter(player => 
        player?.currentIgn?.toLowerCase().startsWith(lowercaseValue)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(players);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/player/${searchTerm.trim()}`);
      setSearchTerm('');
      setSearchResults([]);
      setIsFocused(false);
    }
  };

  const handleResultClick = (playerIgn: string) => {
    router.push(`/player/${playerIgn}`);
    setSearchTerm('');
    setSearchResults([]);
    setIsFocused(false);
  };

  return (
    <div className={searchStyles.searchContainer}>
      <input 
        type="text" 
        className={searchStyles.playerSearchInput}
        placeholder="Search players..." 
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        onFocus={() => {
          setIsFocused(true);
          setSearchResults(players);
        }}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
        }}
      />
      {isLoading ? (
        <div className={searchStyles.playerSearchResults}> 
          <div className={searchStyles.loadingText}>Loading...</div>
        </div>
      ) : (isFocused || searchTerm) && (
        <div className={searchStyles.playerSearchResults}>
          {searchResults.length > 0 ? (
            searchResults.map(player => (
              <div 
                key={player.id} 
                className={searchStyles.playerResultItem}
                onClick={() => handleResultClick(player.currentIgn)}
              >
                <div className={searchStyles.avatarWrapper}>
                  <Image
                    src={`https://crafthead.net/avatar/${player.uuid}`}
                    alt={player.currentIgn}
                    width={24}
                    height={24}
                    className={searchStyles.playerAvatar}
                  />
                </div>
                <div className={searchStyles.playerResultTitle}>{player.currentIgn}</div>
              </div>
            ))
          ) : (
            <div className={searchStyles.noResults}>
              Press enter to search for &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;