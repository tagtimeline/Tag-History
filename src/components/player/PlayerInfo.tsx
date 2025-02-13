// src/components/player/PlayerInfo.tsx
import React, { useEffect, useState } from "react";
import { PlayerProfile, ROLE_ORDER } from "../../config/players";
import styles from "../../styles/player.module.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";

import { sortRolesByPriority } from "../../config/players";

const colorMap: { [key: string]: string } = {
  RED: "#FF5555",
  GOLD: "#FFAA00",
  GREEN: "#55FF55",
  YELLOW: "#FFFF55",
  LIGHT_PURPLE: "#FF55FF",
  WHITE: "#FFFFFF",
  BLUE: "#5555FF",
  DARK_GREEN: "#00AA00",
  DARK_RED: "#AA0000",
  DARK_AQUA: "#00AAAA",
  DARK_PURPLE: "#AA00AA",
  DARK_GRAY: "#555555",
  BLACK: "#000000",
  DARK_BLUE: "#0000AA",
  AQUA: "#55FFFF",
  GRAY: "#AAAAAA",
};

interface PlayerInfoProps {
  currentIgn: string;
  playerData: PlayerProfile;
  role?: string | null;
}

interface Role {
  id: string;
  tag: string;
  color: string;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ currentIgn, playerData }) => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const rolesRef = collection(db, "roles");
    const unsubscribe = onSnapshot(rolesRef, (snapshot) => {
      const fetchedRoles: Role[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Role)
      );
      setRoles(fetchedRoles);
    });

    return () => unsubscribe();
  }, []);

  const getRankDisplay = () => {
    const player = playerData.hypixel;
    if (!player) return { rankDisplay: null, nameColor: "#AAAAAA" };

    const plusColor = player.rankPlusColor
      ? colorMap[player.rankPlusColor] || "#FF5555"
      : "#FF5555";

    // Handle staff and special ranks
    switch (player.rank) {
      case "ADMIN":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#FF5555" }}>
              [ADMIN]
            </span>
          ),
          nameColor: "#FF5555",
        };
      case "GAME_MASTER":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#00AA00" }}>
              [GM]
            </span>
          ),
          nameColor: "#00AA00",
        };
      case "MODERATOR":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#00AA00" }}>
              [MOD]
            </span>
          ),
          nameColor: "#00AA00",
        };
      case "HELPER":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#5555FF" }}>
              [HELPER]
            </span>
          ),
          nameColor: "#5555FF",
        };
      case "YOUTUBER":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#FF5555" }}>
              [YOUTUBE]
            </span>
          ),
          nameColor: "#FF5555",
        };
    }

    // Handle MVP++
    if (player.monthlyPackageRank === "SUPERSTAR") {
      return {
        rankDisplay: (
          <span className={styles.playerRank} style={{ color: "#FFAA00" }}>
            [MVP<span style={{ color: plusColor }}>++</span>]
          </span>
        ),
        nameColor: "#FFAA00",
      };
    }

    // Handle regular ranks
    switch (player.newPackageRank) {
      case "MVP_PLUS":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#55FFFF" }}>
              [MVP<span style={{ color: plusColor }}>+</span>]
            </span>
          ),
          nameColor: "#55FFFF",
        };
      case "MVP":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#55FFFF" }}>
              [MVP]
            </span>
          ),
          nameColor: "#55FFFF",
        };
      case "VIP_PLUS":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#55FF55" }}>
              [VIP<span style={{ color: plusColor }}>+</span>]
            </span>
          ),
          nameColor: "#55FF55",
        };
      case "VIP":
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: "#55FF55" }}>
              [VIP]
            </span>
          ),
          nameColor: "#55FF55",
        };
      default:
        return { rankDisplay: null, nameColor: "#AAAAAA" };
    }
  };

  const { rankDisplay, nameColor } = getRankDisplay();

  return (
    <div className={styles.playerInfoSection}>
      <div className={styles.playerIGN}>
        {rankDisplay} <span style={{ color: nameColor }}>{currentIgn}</span>
      </div>
      <p className={styles.playerAccountAge}>
        Account created on{" "}
        {new Date(playerData.created_at).toLocaleDateString()}
      </p>
      <div className={styles.playerDetails}>
        {playerData.hypixel && (
          <div className={styles.statsContainer}>
            <p className={styles.playerStats}>
              <span className={styles.statLabel}>Network Level:</span>{" "}
              {playerData.hypixel.networkLevel}
            </p>
            {playerData.hypixel?.guild && (
              <p className={styles.playerStats}>
                <span className={styles.statLabel}>Guild:</span>{" "}
                {playerData.hypixel.guild.name}
                {playerData.hypixel.guild.rank === "Guild Master" && (
                  <span className={styles.guildMasterTag}> [GM]</span>
                )}
              </p>
            )}
            <br />
            <p className={styles.playerStats}>
              <span className={styles.statLabel}>TNT Tag Wins:</span>{" "}
              {playerData.hypixel.tntGames.wins_tntag}
            </p>
            <p className={styles.playerStats}>
              <span className={styles.statLabel}>TNT Tag KDR:</span>{" "}
              {playerData.hypixel.tntGames.kdr}
            </p>
            <p className={styles.playerStats}>
              <span className={styles.statLabel}>TNT Games Hours:</span>{" "}
              {typeof playerData.hypixel.tntGames.playtime === "number"
                ? playerData.hypixel.tntGames.playtime
                : "N/A"}
            </p>
            <br />
            {playerData.hypixel.discord && (
              <p className={styles.playerStats}>
                <span className={styles.statLabel}>Discord:</span> @
                {playerData.hypixel.discord}
              </p>
            )}
            {playerData.role && (
              <p className={styles.playerStats}>
                <span className={styles.statLabel}>Timeline:</span>
                <div className={styles.roleList}>
                  {sortRolesByPriority(
                    playerData.role
                      .split(",")
                      .filter((id): id is (typeof ROLE_ORDER)[number] =>
                        ROLE_ORDER.includes(id as (typeof ROLE_ORDER)[number])
                      )
                  ).map((roleId, index) => {
                    const role = roles.find((r) => r.id === roleId.trim());
                    if (!role) return null;

                    return (
                      <React.Fragment key={index}>
                        <div className={styles.roleBox}>
                          <span
                            className={styles.roleIndicator}
                            style={{ backgroundColor: `#${role.color}` }}
                          />
                          <span className={styles.roleTag}>{role.tag}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </p>
            )}
          </div>
        )}

        <div className={styles.playerLinks}>
          <a
            href={`https://namemc.com/profile/${currentIgn}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.playerLinkButton}
          >
            NameMC
          </a>
          <a
            href={`https://25karma.xyz/player/${currentIgn}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.playerLinkButton}
          >
            25karma
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
