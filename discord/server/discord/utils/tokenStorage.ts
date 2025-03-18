import { DeskThing } from "@deskthing/server";

export class TokenStorage {
  private readonly TOKEN_KEY = "discord_token";
  
  constructor() {}

  async saveToken(token: string): Promise<void> {
    try {
      const data = await DeskThing.getData() || {};
      await DeskThing.saveData({ 
        ...data,
        [this.TOKEN_KEY]: token 
      });
    } catch (error) {
      console.error("Failed to save Discord token:", error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const data = await DeskThing.getData();
      return data?.[this.TOKEN_KEY] as string || null;
    } catch (error) {
      console.error("Failed to retrieve Discord token:", error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      const data = await DeskThing.getData() || {};
      const { [this.TOKEN_KEY]: _, ...remainingData } = data;
      
      await DeskThing.saveData(remainingData);
      DeskThing.sendLog("Discord token cleared from storage");
    } catch (error) {
      console.error("Failed to clear Discord token:", error);
      throw error;
    }
  }
}
