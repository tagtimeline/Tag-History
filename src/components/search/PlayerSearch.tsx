// src/components/player/PlayerSearch.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import searchStyles from "../../styles/search.module.css";
import debounce from "lodash/debounce";

interface Player {
  id: string;
  currentIgn: string;
  uuid: string;
  pastIgns?: { name: string; hidden: boolean }[];
}

const PlayerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  // Create a player lookup map for O(1) access
  const playerLookup = useMemo(() => {
    const lookup: { [key: string]: Player } = {};
    players.forEach((player) => {
      // Index by current IGN (lowercase)
      if (player.currentIgn) {
        lookup[player.currentIgn.toLowerCase()] = player;
      }
      // Index by document ID
      if (player.id) {
        lookup[player.id.toLowerCase()] = player;
      }
      // Index by past IGNs with proper type checking
      if (Array.isArray(player.pastIgns)) {
        player.pastIgns.forEach((pastIgn) => {
          if (
            pastIgn &&
            typeof pastIgn === "object" &&
            !pastIgn.hidden &&
            pastIgn.name
          ) {
            lookup[pastIgn.name.toLowerCase()] = player;
          }
        });
      }
    });
    return lookup;
  }, [players]);

  // Memoize the search function
  const searchPlayers = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setSearchResults(players);
        return;
      }

      const lowercaseValue = value.toLowerCase();

      // First check exact matches in our lookup
      const exactMatch = playerLookup[lowercaseValue];
      if (exactMatch) {
        setSearchResults([exactMatch]);
        return;
      }

      // If no exact match, filter players that start with the search term
      const filtered = players.filter((player) =>
        player.currentIgn.toLowerCase().startsWith(lowercaseValue)
      );
      setSearchResults(filtered);
    },
    [players, playerLookup]
  );

  // Debounce the search for better performance
  const debouncedSearch = useMemo(
    () => debounce(searchPlayers, 150),
    [searchPlayers]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Reset search when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setSearchTerm("");
      setSearchResults([]);
      setIsFocused(false);
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  // Subscribe to players collection with optimized sorting
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "players"),
      (snapshot) => {
        const playerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];

        // Sort players once during load
        playerData.sort((a, b) => {
          if (a.currentIgn.toLowerCase() === "flodlol") return -1;
          if (b.currentIgn.toLowerCase() === "flodlol") return 1;
          return a.currentIgn.localeCompare(b.currentIgn);
        });

        setPlayers(playerData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching players:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const player = playerLookup[searchTerm.toLowerCase()];
      if (player) {
        router.push(`/player/${player.id}`);
      }
      setSearchTerm("");
      setSearchResults([]);
      setIsFocused(false);
    }
  };

  const handleResultClick = (player: Player) => {
    router.push(`/player/${player.id}`);
    setSearchTerm("");
    setSearchResults([]);
    setIsFocused(false);
  };

  // Memoize the search results rendering
  const renderSearchResults = useMemo(() => {
    if (!searchResults.length) {
      return (
        <div className={searchStyles.noResults}>
          Press enter to search for &quot;{searchTerm}&quot;
        </div>
      );
    }

    return searchResults.map((player) => (
      <div
        key={player.id}
        className={searchStyles.playerResultItem}
        onClick={() => handleResultClick(player)}
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
        <div className={searchStyles.playerResultTitle}>
          {player.currentIgn}
        </div>
      </div>
    ));
  }, [searchResults, searchTerm]);

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
      {isLoading
        ? null
        : (isFocused || searchTerm) && (
            <div className={searchStyles.playerSearchResults}>
              {renderSearchResults}
            </div>
          )}
    </div>
  );
};

export default PlayerSearch;
