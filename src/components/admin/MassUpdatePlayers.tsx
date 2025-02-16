// components/admin/MassUpdatePlayers.tsx
import { useState, useRef, useEffect } from "react";
import { collection, query, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/../lib/firebaseConfig";
import buttonStyles from "@/styles/admin/buttons.module.css";
import playerStyles from "@/styles/admin/players.module.css";

interface UpdateLogProps {
  logs: string[];
  onClear: () => void;
}

interface CraftyUsername {
  username: string;
}

const UpdateLog: React.FC<UpdateLogProps> = ({ logs, onClear }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={playerStyles.updateOverlay}>
      <div className={playerStyles.logsContainer}>
        <div className={playerStyles.logsHeader}>
          Update Logs
          <button className={buttonStyles.clearButton} onClick={onClear}>
            Clear
          </button>
        </div>
        <div className={playerStyles.logs}>
          {logs.map((log, index) => (
            <div key={index} className={playerStyles.logEntry}>
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default function MassUpdatePlayers() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const formatUuid = (uuid: string) => {
    if (!uuid || uuid.includes("-")) return uuid;
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(
      12,
      16
    )}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  };

  const handleMassUpdate = async () => {
    setIsUpdating(true);
    setLogs([]);

    let totalPlayers = 0;
    let uuidUpdates = 0;
    let nameUpdates = 0;

    try {
      addLog("Starting mass update of all players...");

      const playersRef = collection(db, "players");
      const querySnapshot = await getDocs(query(playersRef));
      const players = querySnapshot.docs;
      totalPlayers = players.length;

      for (const playerDoc of players) {
        const playerData = playerDoc.data();
        addLog(`Processing ${playerData.currentIgn}...`);

        try {
          const updates: any = {};
          let needsUuidUpdate = false;
          let needsNameUpdate = false;

          // Check main UUID
          const formattedUuid = formatUuid(playerData.uuid);
          if (formattedUuid !== playerData.uuid) {
            updates.uuid = formattedUuid;
            needsUuidUpdate = true;
            addLog(`📝 Formatting UUID for ${playerData.currentIgn}`);
          }

          // Check alt accounts
          if (playerData.altAccounts?.length > 0) {
            const formattedAltAccounts = playerData.altAccounts.map(formatUuid);
            if (
              JSON.stringify(formattedAltAccounts) !==
              JSON.stringify(playerData.altAccounts)
            ) {
              updates.altAccounts = formattedAltAccounts;
              needsUuidUpdate = true;
              addLog(
                `📝 Formatting alt account UUIDs for ${playerData.currentIgn}`
              );
            }
          }

          // Check main account
          if (playerData.mainAccount) {
            const formattedMainAccount = formatUuid(playerData.mainAccount);
            if (formattedMainAccount !== playerData.mainAccount) {
              updates.mainAccount = formattedMainAccount;
              needsUuidUpdate = true;
              addLog(
                `📝 Formatting main account UUID for ${playerData.currentIgn}`
              );
            }
          }

          // Fetch Crafty.gg data
          const craftyResponse = await fetch(
            `https://api.crafty.gg/api/v2/players/${playerData.uuid}`
          );
          if (!craftyResponse.ok) {
            addLog(
              `⚠️ Failed to fetch Crafty.gg data for ${playerData.currentIgn}`
            );
            // Still update UUIDs if needed
            if (needsUuidUpdate) {
              await updateDoc(playerDoc.ref, updates);
              addLog(`✅ Updated UUIDs for ${playerData.currentIgn}`);
              uuidUpdates++;
            }
            continue;
          }

          const craftyData = await craftyResponse.json();
          if (!craftyData.success || !craftyData.data) {
            addLog(`⚠️ Invalid data received for ${playerData.currentIgn}`);
            // Still update UUIDs if needed
            if (needsUuidUpdate) {
              await updateDoc(playerDoc.ref, updates);
              addLog(`✅ Updated UUIDs for ${playerData.currentIgn}`);
              uuidUpdates++;
            }
            continue;
          }

          // Extract current IGN and past usernames
          const currentIgn = craftyData.data.username;
          const pastIgns = Array.from(
            new Set([
              ...(playerData.pastIgns || []),
              ...craftyData.data.usernames
                .map((nameObj: CraftyUsername) => nameObj.username)
                .filter((name: string) => {
                  if (typeof name === "string") {
                    return (
                      name.toLowerCase() !== currentIgn.toLowerCase() &&
                      !playerData.pastIgns?.some(
                        (existingIgn: any) =>
                          (typeof existingIgn === "string"
                            ? existingIgn
                            : existingIgn.name
                          ).toLowerCase() === name.toLowerCase()
                      )
                    );
                  }
                  return false;
                })
                .map((name: string) => ({
                  name,
                  hidden: false,
                  number: playerData.pastIgns?.length
                    ? Math.max(
                        ...playerData.pastIgns.map((ign: any) =>
                          typeof ign === "object" ? ign.number ?? 0 : 0
                        )
                      ) + 1
                    : 0,
                })),
            ])
          );

          // Check if updates are needed
          const currentIgnDifferent =
            currentIgn.toLowerCase() !== playerData.currentIgn.toLowerCase();
          const pastIgnsDifferent =
            JSON.stringify([...pastIgns].sort()) !==
            JSON.stringify([...(playerData.pastIgns || [])].sort());

          if (currentIgnDifferent || pastIgnsDifferent) {
            needsNameUpdate = true;
          }

          if (currentIgnDifferent || pastIgnsDifferent || needsUuidUpdate) {
            if (currentIgnDifferent) {
              updates.currentIgn = currentIgn;
              addLog(
                `📝 Updating current IGN: ${playerData.currentIgn} -> ${currentIgn}`
              );
            }
            if (pastIgnsDifferent) {
              updates.pastIgns = pastIgns.map((ign, index, array) => ({
                ...ign,
                number: array.length - 1 - index,
              }));

              const newIgns = pastIgns
                .filter(
                  (ign) =>
                    typeof ign === "object" &&
                    !playerData.pastIgns?.some(
                      (existingIgn: any) =>
                        (typeof existingIgn === "string"
                          ? existingIgn
                          : existingIgn.name
                        ).toLowerCase() === ign.name.toLowerCase()
                    )
                )
                .map((ign) => ign.name);

              if (newIgns.length > 0) {
                addLog(`📝 Adding new past IGNs: ${newIgns.join(", ")}`);
              }
            }

            updates.lastUpdated = new Date();

            await updateDoc(playerDoc.ref, updates);
            if (needsUuidUpdate) uuidUpdates++;
            if (needsNameUpdate) nameUpdates++;
            addLog(`✅ Successfully updated ${currentIgn}`);
          } else {
            addLog(`✅ ${playerData.currentIgn} is up to date`);
          }
        } catch (error) {
          addLog(`❌ Error processing ${playerData.currentIgn}: ${error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      addLog(`📊 Summary:`);
      addLog(`Total players checked: ${totalPlayers}`);
      addLog(`Players with UUID updates: ${uuidUpdates}`);
      addLog(`Players with name updates: ${nameUpdates}`);
      addLog(`✨ Mass update completed successfully!`);
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
        {isUpdating ? "Updating..." : "Update All Names"}
      </button>

      {logs.length > 0 && <UpdateLog logs={logs} onClear={() => setLogs([])} />}
    </>
  );
}
