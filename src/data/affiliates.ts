// src/data/affiliates.ts

// Define the possible roles and their colors
export const roleColors = {
    Developer: '#6b00ff',
    Staff: '#4177ff',
    Sponsor: '#a331ff',
    Contributor: '#3fd0ff',
  } as const;
  
  // Create a type from the roleColors keys
  export type AffiliateRole = keyof typeof roleColors;
  
  // Interface for affiliate data
  export interface Affiliate {
    uuid: string;
    discord?: string;
    roles: AffiliateRole[];
  }
  
  // Map of IGNs to affiliate data
  export const affiliates: Record<string, Affiliate> = {
    'flodlol': {
      uuid: 'c6fd06c5-c716-4e1a-923e-17b48b3f5226',
      discord: '@.flod',
      roles: ['Developer'],
    },
    'flqw3d': {
      uuid: 'f2cef77a-6daf-4552-bf77-fd553e750a00',
      discord: '@flqw3d',
      roles: ['Staff'],
    },
  };
  
  // Helper function to get role color
  export const getRoleColor = (role: AffiliateRole): string => {
    return roleColors[role];
  };
  
  // Helper function to get affiliate roles
  export const getAffiliateRoles = (ign: string): AffiliateRole[] => {
    return affiliates[ign.toLowerCase()]?.roles || [];
  };
  
  // Helper function to get affiliate data
  export const getAffiliateData = (ign: string): Affiliate | null => {
    return affiliates[ign.toLowerCase()] || null;
  };
  
  // Helper function to get all developers
  export const getDevelopers = (): [string, Affiliate][] => {
    return Object.entries(affiliates).filter(([_, data]) => 
      data.roles.includes('Developer')
    );
  };