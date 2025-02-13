// lib/adminUtils.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

interface AdminInfo {
  email: string;
  minecraft_uuid: string;
  discord_id: string;
  minecraft_ign?: string;
}

export async function getAdminInfo(email: string): Promise<AdminInfo | null> {
  try {
    const adminDoc = await getDoc(doc(db, "admins", email));
    if (!adminDoc.exists()) return null;

    const adminData = adminDoc.data() as AdminInfo;

    const mojangRes = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${adminData.minecraft_uuid}`
    );
    if (mojangRes.ok) {
      const mojangData = await mojangRes.json();
      adminData.minecraft_ign = mojangData.username;
    }

    return adminData;
  } catch (error) {
    console.error("Error fetching admin info:", error);
    return null;
  }
}
