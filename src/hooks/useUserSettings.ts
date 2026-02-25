import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserSettings {
  profileVisibility: string;
  showOnlineStatus: boolean;
  resumeVisibility: boolean;
  genderFilterEnabled: boolean;
  shareLiveTrip: boolean;
  privateMoodLogs: boolean;
  theme: string;
  glassmorphism: boolean;
  notifyDirectMessages: boolean;
  notifyMentions: boolean;
  notifyReplies: boolean;
  notifyDeadlines: boolean;
  notifyStudyGroups: boolean;
  notifyEvents: boolean;
  notifyJobAlerts: boolean;
  notifyResearchUpdates: boolean;
  notifyRideUpdates: boolean;
  notifyMoodReminder: boolean;
  googleCalendarConnected: boolean;
  githubConnected: boolean;
  linkedinConnected: boolean;
  zoomConnected: boolean;
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  dyslexicFont: boolean;
  phone: string;
  linkedin: string;
  github: string;
}

const defaultSettings: UserSettings = {
  profileVisibility: "campus",
  showOnlineStatus: true,
  resumeVisibility: true,
  genderFilterEnabled: false,
  shareLiveTrip: true,
  privateMoodLogs: true,
  theme: "dark",
  glassmorphism: true,
  notifyDirectMessages: true,
  notifyMentions: true,
  notifyReplies: true,
  notifyDeadlines: true,
  notifyStudyGroups: true,
  notifyEvents: true,
  notifyJobAlerts: true,
  notifyResearchUpdates: true,
  notifyRideUpdates: true,
  notifyMoodReminder: false,
  googleCalendarConnected: false,
  githubConnected: true,
  linkedinConnected: false,
  zoomConnected: false,
  fontScale: 100,
  highContrast: false,
  reduceMotion: true,
  screenReader: false,
  dyslexicFont: false,
  phone: "",
  linkedin: "",
  github: ""
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSettingsRow = useCallback((data: any): UserSettings => ({
    ...defaultSettings,
    ...data,
    phone: data?.phone || "",
    linkedin: data?.linkedin || "",
    github: data?.github || ""
  }), []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("UserSettings")
      .select("*")
      .eq("userId", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user settings:", error.message || error);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(mapSettingsRow(data));
    } else {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("UserSettings")
        .upsert({
          userId: user.id,
          ...defaultSettings,
          updatedAt: new Date().toISOString()
        }, { onConflict: "userId" })
        .select("*")
        .single();

      if (upsertError) {
        console.error("Error creating default user settings:", upsertError.message || upsertError);
      } else if (upsertedData) {
        setSettings(mapSettingsRow(upsertedData));
      } else {
        setSettings(defaultSettings);
      }
    }

    setLoading(false);
  }, [mapSettingsRow]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    if (!userId) return { error: "Not authenticated" };

    const nextSettings = { ...settings, ...partial };
    setSettings(nextSettings);

    const { error } = await supabase
      .from("UserSettings")
      .upsert({
        userId,
        ...nextSettings,
        updatedAt: new Date().toISOString()
      }, { onConflict: "userId" });

    if (error) {
      console.error("Error updating user settings:", error.message || error);
      setSettings(settings);
      return { error: error.message || "Failed to save settings" };
    }

    if (Object.prototype.hasOwnProperty.call(partial, "showOnlineStatus")) {
      const { error: profileError } = await supabase
        .from("Profile")
        .update({
          showOnlineStatus: partial.showOnlineStatus,
          updatedAt: new Date().toISOString()
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error syncing online status to Profile:", profileError.message || profileError);
      }
    }

    return { error: null };
  }, [settings, userId]);

  const resetAccessibility = useCallback(async () => {
    return await updateSettings({
      fontScale: 100,
      highContrast: false,
      reduceMotion: true,
      screenReader: false,
      dyslexicFont: false
    });
  }, [updateSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refetchSettings: fetchSettings,
    resetAccessibility
  };
}
