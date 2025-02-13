// src/components/player/PlayerSkinViewer.tsx
import React, { useEffect, useRef } from "react";
import * as skinview3d from "skinview3d";
import type { SkinViewer } from "skinview3d";
import { PlayerProfile } from "../../config/players";
import styles from "../../styles/player.module.css";

interface PlayerSkinViewerProps {
  playerData: PlayerProfile;
}

const PlayerSkinViewer: React.FC<PlayerSkinViewerProps> = ({ playerData }) => {
  const skinViewerRef = useRef<HTMLDivElement>(null);
  const skinViewerInstanceRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    if (skinViewerRef.current) {
      // Remove any existing canvas
      while (skinViewerRef.current.firstChild) {
        skinViewerRef.current.removeChild(skinViewerRef.current.firstChild);
      }

      // Create and configure new skin viewer
      skinViewerInstanceRef.current = new skinview3d.SkinViewer({
        canvas: document.createElement("canvas"),
        width: 300,
        height: 400,
        skin: playerData.textures.skin.url,
        cape: playerData.textures.cape?.url,
      });

      // Append the canvas to our container
      skinViewerRef.current.appendChild(skinViewerInstanceRef.current.canvas);

      // Configure camera - rotate slightly to the left
      skinViewerInstanceRef.current.camera.position.set(30, 0, 45);
      skinViewerInstanceRef.current.camera.lookAt(0, 0, 0);

      // Disable zoom controls
      skinViewerInstanceRef.current.controls.enableZoom = false;

      // Add slow rotation
      skinViewerInstanceRef.current.autoRotateSpeed = 0.5;
      skinViewerInstanceRef.current.autoRotate = true;

      // Clean up
      return () => {
        if (skinViewerInstanceRef.current) {
          skinViewerInstanceRef.current.dispose();
        }
      };
    }
  }, [playerData]);

  return (
    <div className={styles.skinViewerSection}>
      <div className={styles.playerSkinViewer} ref={skinViewerRef}></div>
    </div>
  );
};

export default PlayerSkinViewer;
