// src/components/player/PlayerInfo.tsx
import React from 'react';
import { PlayerProfile } from '../../config/players';
import styles from '../../styles/player.module.css';
import { getAffiliateRoles, getRoleColor } from '../../data/affiliates';

const colorMap: { [key: string]: string } = {
  RED: '#FF5555',
  GOLD: '#FFAA00',
  GREEN: '#55FF55',
  YELLOW: '#FFFF55',
  LIGHT_PURPLE: '#FF55FF',
  WHITE: '#FFFFFF',
  BLUE: '#5555FF',
  DARK_GREEN: '#00AA00',
  DARK_RED: '#AA0000',
  DARK_AQUA: '#00AAAA',
  DARK_PURPLE: '#AA00AA',
  DARK_GRAY: '#555555',
  BLACK: '#000000',
  DARK_BLUE: '#0000AA',
  AQUA: '#55FFFF',
  GRAY: '#AAAAAA'
};

interface PlayerInfoProps {
  currentIgn: string;
  playerData: PlayerProfile;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ currentIgn, playerData }) => {
  const getRankDisplay = () => {
    const player = playerData.hypixel;
    if (!player) return { rankDisplay: null, nameColor: '#AAAAAA' };

    const plusColor = player.rankPlusColor ? 
      colorMap[player.rankPlusColor] || '#FF5555' : 
      '#FF5555';

    // Handle staff and special ranks
    switch (player.rank) {
      case 'ADMIN':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#FF5555' }}>[ADMIN]</span>,
          nameColor: '#FF5555'
        };
      case 'GAME_MASTER':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#00AA00' }}>[GM]</span>,
          nameColor: '#00AA00'
        };
      case 'MODERATOR':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#00AA00' }}>[MOD]</span>,
          nameColor: '#00AA00'
        };
      case 'HELPER':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#5555FF' }}>[HELPER]</span>,
          nameColor: '#5555FF'
        };
      case 'YOUTUBER':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#FF5555' }}>[YOUTUBE]</span>,
          nameColor: '#FF5555'
        };
    }

    // Handle MVP++
    if (player.monthlyPackageRank === 'SUPERSTAR') {
      return {
        rankDisplay: (
          <span className={styles.playerRank} style={{ color: '#FFAA00' }}>
            [MVP<span style={{ color: plusColor }}>++</span>]
          </span>
        ),
        nameColor: '#FFAA00'
      };
    }

    // Handle regular ranks
    switch (player.newPackageRank) {
      case 'MVP_PLUS':
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: '#55FFFF' }}>
              [MVP<span style={{ color: plusColor }}>+</span>]
            </span>
          ),
          nameColor: '#55FFFF'
        };
      case 'MVP':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#55FFFF' }}>[MVP]</span>,
          nameColor: '#55FFFF'
        };
      case 'VIP_PLUS':
        return {
          rankDisplay: (
            <span className={styles.playerRank} style={{ color: '#55FF55' }}>
              [VIP<span style={{ color: plusColor }}>+</span>]
            </span>
          ),
          nameColor: '#55FF55'
        };
      case 'VIP':
        return {
          rankDisplay: <span className={styles.playerRank} style={{ color: '#55FF55' }}>[VIP]</span>,
          nameColor: '#55FF55'
        };
      default:
        return { rankDisplay: null, nameColor: '#AAAAAA' };
    }
  };

  const { rankDisplay, nameColor } = getRankDisplay();

  return (
    <div className={styles.playerInfoSection}>
        <div className={styles.playerIGN}>
          {rankDisplay} <span style={{ color: nameColor }}>{currentIgn}</span>
        </div>
        <p className={styles.playerAccountAge}>
          Account created on {new Date(playerData.created_at).toLocaleDateString()}
        </p>
      <div className={styles.playerDetails}>
        {playerData.hypixel && (
            <div className={styles.statsContainer}>
                <p className={styles.playerStats}>
                    <span className={styles.statLabel}>Network Level:</span>{' '}
                    {playerData.hypixel.networkLevel}
                </p>
                {playerData.hypixel?.guild && (
                    <p className={styles.playerStats}>
                    <span className={styles.statLabel}>Guild:</span>{' '}
                    {playerData.hypixel.guild.name}
                    {playerData.hypixel.guild.rank === 'Guild Master' && (
                        <span className={styles.guildMasterTag}> [GM]</span>
                    )}
                    </p>
                )}
                <br></br>
                <p className={styles.playerStats}>
                    <span className={styles.statLabel}>TNT Tag Wins:</span>{' '}
                    {playerData.hypixel.tntGames.wins_tntag}
                </p>
                <p className={styles.playerStats}>
                    <span className={styles.statLabel}>TNT Tag KDR:</span>{' '}
                    {playerData.hypixel.tntGames.kdr}
                </p>
                <p className={styles.playerStats}>
                    <span className={styles.statLabel}>TNT Games Hours:</span>{' '}
                    {typeof playerData.hypixel.tntGames.playtime === 'number' 
                    ? playerData.hypixel.tntGames.playtime 
                    : 'N/A'}
                </p>
                <br></br>
                {playerData.hypixel.discord && (
                    <p className={styles.playerStats}>
                    <span className={styles.statLabel}>Discord:</span>{' '}
                    @{playerData.hypixel.discord}
                    </p>
                )}
            </div>
        )}

        {getAffiliateRoles(currentIgn).map((role) => (
            <span key={role} className={styles.roleContainer}>
                <span className={styles.statLabel}>Timeline:</span>{' '}
                <span style={{ color: getRoleColor(role) }}>
                    {role === 'HeadDeveloper' ? 'Head Developer' : role}
                </span>
            </span>
        ))}

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