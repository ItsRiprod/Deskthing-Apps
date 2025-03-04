
export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  richPresence: {
    enabled: boolean;
    mainText: string;
    secondaryText: string;
    showTimer: boolean;
  };
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
}
