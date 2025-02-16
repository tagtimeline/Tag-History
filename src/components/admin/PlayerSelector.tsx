// components/admin/PlayerSelector.tsx
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/../lib/firebaseConfig";
import { updatePlayerData } from "@/../lib/playerUtils";
import playerStyles from "@/styles/admin/players.module.css";

interface PastIgn {
  name: string;
}

interface Player {
  id: string;
  currentIgn: string;
  uuid: string;
  pastIgns?: (string | PastIgn)[];
}

interface PlayerSelectorProps {
  onSelect: (player: Player) => void;
  onClose: () => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newPlayerUuid, setNewPlayerUuid] = useState("");
  const [error, setError] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "players"), (snapshot) => {
      const playerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(
        playerData.sort((a, b) => a.currentIgn.localeCompare(b.currentIgn))
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleAddNewPlayer = async () => {
    try {
      if (!newPlayerUuid.trim()) {
        setError("UUID is required");
        return;
      }

      await updatePlayerData(newPlayerUuid);
      setShowNewPlayerForm(false);
      setNewPlayerUuid("");
      setError("");
    } catch (err) {
      setError("Failed to add player");
    }
  };

  const filteredPlayers = players.filter(
    (player) =>
      player.currentIgn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.pastIgns?.some((ign) =>
        (typeof ign === "string" ? ign : ign.name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className={playerStyles.selectorOverlay}>
      <div ref={popupRef} className={playerStyles.selectorPopup}>
        <div className={playerStyles.selectorHeader}>
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={playerStyles.searchInput}
          />
          <button
            onClick={() => setShowNewPlayerForm(true)}
            className={playerStyles.addButton}
          >
            Add New Player
          </button>
        </div>

        {showNewPlayerForm && (
          <div className={playerStyles.newPlayerForm}>
            <input
              type="text"
              placeholder="Enter UUID"
              value={newPlayerUuid}
              onChange={(e) => setNewPlayerUuid(e.target.value)}
              className={playerStyles.searchInput}
            />
            {error && <div className={playerStyles.error}>{error}</div>}
            <div className={playerStyles.newPlayerButtons}>
              <button
                onClick={handleAddNewPlayer}
                className={playerStyles.submitButton}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewPlayerForm(false);
                  setNewPlayerUuid("");
                  setError("");
                }}
                className={playerStyles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={playerStyles.playersList2}>
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className={playerStyles.playerItem}
              onClick={() => onSelect(player)}
            >
              <div className={playerStyles.playerItemLeft}>
                <div className={playerStyles.playerAvatar}>
                  <Image
                    src={`https://crafthead.net/avatar/${player.uuid}`}
                    alt={player.currentIgn}
                    width={24}
                    height={24}
                  />
                </div>
                <span>{player.currentIgn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelector;
