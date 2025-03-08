// components/admin/MassUpdatePlayers.tsx
import { useState, useRef, useEffect } from "react";
import { collection, query, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/../lib/firebaseConfig";
import buttonStyles from "@/styles/admin/buttons.module.css";
import playerStyles from "@/styles/admin/players.module.css";

interface UpdateLogProps {
  logs: string[];
  onClear: () => void;
  onStop: () => void;
  isUpdating: boolean;
  progress: { current: number; total: number };
}

interface CraftyUsername {
  username: string;
}

const UpdateLog: React.FC<UpdateLogProps> = ({
  logs,
  onClear,
  onStop,
  isUpdating,
  progress,
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={playerStyles.updateOverlay}>
      <div className={playerStyles.logsContainer}>
        <div className={playerStyles.logsHeader}>
          Update Logs
          <div className={playerStyles.headerButtons}>
            <button
              className={
                isUpdating
                  ? buttonStyles.controlButton
                  : buttonStyles.controlButtonDisabled
              }
              onClick={onStop}
              disabled={!isUpdating}
            >
              Stop
            </button>
            <button
              className={
                isUpdating
                  ? buttonStyles.controlButtonDisabled
                  : buttonStyles.controlButton
              }
              onClick={onClear}
              disabled={isUpdating}
            >
              Done
            </button>
          </div>
        </div>
        <div className={playerStyles.logs}>
          {progress.total > 0 && (
            <div className={playerStyles.progressIndicator}>
              Player {progress.current}/{progress.total}
            </div>
          )}
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
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loadingIndicator, setLoadingIndicator] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isUpdating) {
      const loadingStates = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingIndicator(loadingStates[i % loadingStates.length]);
        i++;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isUpdating]);

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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      addLog("❌ Process stopped by user");
      setIsUpdating(false);
    }
  };

  const handleClear = () => {
    if (!isUpdating) {
      setLogs([]);
    }
  };

  const handleMassUpdate = async () => {
    setIsUpdating(true);
    setLogs([]);
    setProgress({ current: 0, total: 0 });
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let totalPlayers = 0;
    let uuidUpdates = 0;
    let nameUpdates = 0;

    try {
      addLog("Starting mass update of all players...");

      const playersRef = collection(db, "players");
      const querySnapshot = await getDocs(query(playersRef));
      const players = querySnapshot.docs;
      totalPlayers = players.length;
      setProgress({ current: 0, total: totalPlayers });

      for (let i = 0; i < players.length; i++) {
        // Check if process was aborted
        if (signal.aborted) {
          break;
        }

        const playerDoc = players[i];
        const playerData = playerDoc.data();
        setProgress({ current: i + 1, total: totalPlayers });
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

          // Check if aborted before making network request
          if (signal.aborted) break;

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

          // Find highest past IGN number for proper numbering
          const highestPastIgnNumber = playerData.pastIgns?.length
            ? Math.max(
                ...playerData.pastIgns.map((ign: any) =>
                  typeof ign === "object" && ign.number !== undefined
                    ? ign.number
                    : 0
                )
              )
            : -1;

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
                  number: highestPastIgnNumber + 1, // Use the highest number + 1 for new IGNs
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
              // Sort and renumber pastIgns to ensure proper ordering
              const sortedPastIgns = [...pastIgns].sort((a, b) => {
                const aNum =
                  typeof a === "object" && a.number !== undefined
                    ? a.number
                    : 0;
                const bNum =
                  typeof b === "object" && b.number !== undefined
                    ? b.number
                    : 0;
                return bNum - aNum; // Sort in descending order
              });

              updates.pastIgns = sortedPastIgns;

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

            // Check if aborted before making database update
            if (signal.aborted) break;

            await updateDoc(playerDoc.ref, updates);
            if (needsUuidUpdate) uuidUpdates++;
            if (needsNameUpdate) nameUpdates++;
            addLog(`✅ Successfully updated ${currentIgn}`);
          } else {
            addLog(`✅ ${playerData.currentIgn} is up to date`);
          }
        } catch (error) {
          if (signal.aborted) break;
          addLog(`❌ Error processing ${playerData.currentIgn}: ${error}`);
        }

        // Small delay to avoid rate limiting
        if (!signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (!signal.aborted) {
        addLog(`📊 Summary:`);
        addLog(`Total players checked: ${progress.current}`);
        addLog(`Players with UUID updates: ${uuidUpdates}`);
        addLog(`Players with name updates: ${nameUpdates}`);
        addLog(`✨ Mass update completed successfully!`);
      }
    } catch (error) {
      if (!signal.aborted) {
        addLog(`❌ Fatal error during mass update: ${error}`);
      }
    } finally {
      setIsUpdating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      <button
        className={buttonStyles.addButton}
        onClick={handleMassUpdate}
        disabled={isUpdating}
      >
        {isUpdating ? `Updating ${loadingIndicator}` : "Update All Names"}
      </button>

      {logs.length > 0 && (
        <UpdateLog
          logs={logs}
          onClear={handleClear}
          onStop={handleStop}
          isUpdating={isUpdating}
          progress={progress}
        />
      )}
    </>
  );
}
