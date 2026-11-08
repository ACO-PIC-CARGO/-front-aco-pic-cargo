const PROMPTED_VERSION_KEY = "updatePromptedVersion";

export const claimUpdatePrompt = (serverVersion: string): boolean => {
  if (serverVersion === import.meta.env.VITE_VERSION) return false;
  const alreadyPrompted = sessionStorage.getItem(PROMPTED_VERSION_KEY) === serverVersion;
  sessionStorage.setItem(PROMPTED_VERSION_KEY, serverVersion);
  return !alreadyPrompted || !sessionStorage.getItem("auth-token");
};
