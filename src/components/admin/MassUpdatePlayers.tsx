// components/admin/MassUpdatePlayers.tsx
import { useState } from 'react';
import { collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import buttonStyles from '@/styles/admin/buttons.module.css';
import playerStyles from '@/styles/admin/players.module.css';

interface UpdateLogProps {
  logs: string[];
  onClear: () => void;
}

const UpdateLog: React.FC<UpdateLogProps> = ({ logs, onClear }) => (
  <div className={playerStyles.updateOverlay}>
    <div className={playerStyles.logsContainer}>
      <div className={playerStyles.logsHeader}>
        Update Logs
        <button 
          className={buttonStyles.clearButton}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className={playerStyles.logs}>
        {logs.map((log, index) => (
          <div key={index} className={playerStyles.logEntry}>
            {log}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function MassUpdatePlayers() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleMassUpdate = async () => {
    setIsUpdating(true);
    setLogs([]);

    try {
      addLog('Starting mass update of all players...');
      
      const playersRef = collection(db, 'players');
      const querySnapshot = await getDocs(query(playersRef));
      const players = querySnapshot.docs;

      for (const playerDoc of players) {
        const playerData = playerDoc.data();
        addLog(`Processing ${playerData.currentIgn}...`);
        
        try {
          // Fetch Crafty.gg data
          const craftyResponse = await fetch(`https://api.crafty.gg/api/v2/players/${playerData.uuid}`);
          if (!craftyResponse.ok) {
            addLog(`⚠️ Failed to fetch Crafty.gg data for ${playerData.currentIgn}`);
            continue;
          }
          
          const craftyData = await craftyResponse.json();
          if (!craftyData.success || !craftyData.data) {
            addLog(`⚠️ Invalid data received for ${playerData.currentIgn}`);
            continue;
          }

          // Extract current IGN and past usernames from correct location
          const currentIgn = craftyData.data.username;
          const pastIgns = Array.from(new Set([
            ...(playerData.pastIgns || []), // Keep existing past IGNs
            ...craftyData.data.usernames
              .map((nameObj: any) => nameObj.username)
              .filter((name: string) => {
                if (typeof name === 'string') {
                  // Check if the name is not already in existing past IGNs
                  return name.toLowerCase() !== currentIgn.toLowerCase() && 
                         !playerData.pastIgns?.some(
                           (existingIgn: any) => 
                             (typeof existingIgn === 'string' ? existingIgn : existingIgn.name).toLowerCase() === name.toLowerCase()
                         );
                }
                return false;
              })
              .map((name: string) => ({
                name,
                hidden: false,
                number: playerData.pastIgns?.length ? 
                  Math.max(...playerData.pastIgns.map((ign: any) => 
                    typeof ign === 'object' ? (ign.number ?? 0) : 0
                  )) + 1 : 
                  0
              }))
          ]));

        
          // Update if current IGN is different or if past IGNs have changed
          const currentIgnDifferent = currentIgn.toLowerCase() !== playerData.currentIgn.toLowerCase();
          const pastIgnsDifferent = JSON.stringify([...pastIgns].sort()) !== 
                                  JSON.stringify([...(playerData.pastIgns || [])].sort());

          if (currentIgnDifferent || pastIgnsDifferent) {
            if (currentIgnDifferent) {
              addLog(`📝 Updating current IGN: ${playerData.currentIgn} -> ${currentIgn}`);
            }
            if (pastIgnsDifferent) {
                const newIgns = pastIgns
                  .filter(ign => 
                    typeof ign === 'object' && 
                    !playerData.pastIgns?.some(
                      (existingIgn: any) => 
                        (typeof existingIgn === 'string' ? existingIgn : existingIgn.name).toLowerCase() === ign.name.toLowerCase()
                    )
                  )
                  .map(ign => ign.name);  // Extract just the names for logging
              
                if (newIgns.length > 0) {
                  addLog(`📝 Adding new past IGNs: ${newIgns.join(', ')}`);
                }
              }
            
            await updateDoc(playerDoc.ref, {
                currentIgn,
                pastIgns: pastIgns.map((ign, index, array) => ({
                  ...ign,
                  number: array.length - 1 - index
                })),
                lastUpdated: new Date()
              });
            
            addLog(`✅ Successfully updated ${currentIgn}`);
          } else {
            addLog(`✓ ${playerData.currentIgn} is up to date`);
          }
        } catch (error) {
          addLog(`❌ Error processing ${playerData.currentIgn}: ${error}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      addLog('✨ Mass update completed successfully!');
    } catch (error) {
      addLog(`❌ Fatal error during mass update: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <button 
        className={buttonStyles.addButton}
        onClick={handleMassUpdate}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update All Names'}
      </button>

      {logs.length > 0 && (
        <UpdateLog logs={logs} onClear={() => setLogs([])} />
      )}
    </>
  );
}