// src/data/affiliates.ts

export const roleColors = {
    HeadDeveloper: '#6b00ff',
    Developer: '#6b00ff',
    Staff: '#4177ff',
    Sponsor: '#a331ff',
    Contributor: '#3fd0ff',
  } as const;
  
  export type AffiliateRole = keyof typeof roleColors;
  
  export interface Affiliate {
    uuid: string;
    discord?: string;
    roles: AffiliateRole[];
  }
  
  export const affiliates: Record<string, Affiliate> = {
    'flodlol': {
      uuid: 'c6fd06c5-c716-4e1a-923e-17b48b3f5226',
      discord: '@.flod',
      roles: ['HeadDeveloper'],
    },
    'handsniper': {
      uuid: '871a18c8-01c6-4c94-ab45-a8dce668f09f',
      discord: '@handsniper',
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
    return Object.entries(affiliates).filter(([, data]) =>
      data.roles.includes('Developer') || data.roles.includes('HeadDeveloper')
    );
  };