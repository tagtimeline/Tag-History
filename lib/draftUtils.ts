// lib/draftUtils.ts

import { EventFormData } from "@/components/admin/EventForm";

interface EventDraft extends EventFormData {
  lastSaved: string;
  eventId?: string;
}

const DRAFTS_STORAGE_KEY = "eventFormDrafts";

// Save form data as a draft
export const saveDraft = (data: EventFormData, eventId?: string) => {
  try {
    const drafts = loadAllDrafts();
    const draftKey = eventId || "new";

    drafts[draftKey] = {
      ...data,
      lastSaved: new Date().toISOString(),
      eventId,
    };

    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Error saving draft:", error);
  }
};

// Load all available drafts
export const loadAllDrafts = (): Record<string, EventDraft> => {
  try {
    const drafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : {};
  } catch (error) {
    console.error("Error loading drafts:", error);
    return {};
  }
};

// Load a specific draft by event ID
export const loadDraft = (eventId?: string): EventFormData | null => {
  try {
    const drafts = loadAllDrafts();
    const draft = drafts[eventId || "new"];
    if (draft) {
      // Convert dates back from ISO strings if needed
      return {
        ...draft,
        date: draft.date || "",
        endDate: draft.endDate || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading draft:", error);
    return null;
  }
};

// Delete a specific draft
export const deleteDraft = (eventId?: string) => {
  try {
    const drafts = loadAllDrafts();
    const draftKey = eventId || "new";

    if (drafts[draftKey]) {
      delete drafts[draftKey];
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    }
  } catch (error) {
    console.error("Error deleting draft:", error);
  }
};

// Check if a draft exists
export const hasDraft = (eventId?: string): boolean => {
  try {
    const drafts = loadAllDrafts();
    return !!drafts[eventId || "new"];
  } catch (error) {
    console.error("Error checking draft existence:", error);
    return false;
  }
};

// Get the last saved time for a draft
export const getDraftLastSaved = (eventId?: string): Date | null => {
  try {
    const drafts = loadAllDrafts();
    const draft = drafts[eventId || "new"];
    return draft ? new Date(draft.lastSaved) : null;
  } catch (error) {
    console.error("Error getting draft last saved time:", error);
    return null;
  }
};

// Check if the current platform is macOS
export const isMacPlatform = (): boolean => {
  return (
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0
  );
};

// Get the appropriate save shortcut text for the current platform
export const getSaveShortcutText = (): string => {
  return isMacPlatform() ? "⌘+S" : "Ctrl+S";
};
