import http from "@/api/axios-config";

const CONNECTION_ERROR_MESSAGE =
  "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

export const request = async (config) => {
  try {
    const { data } = await http(config);
    return data;
  } catch (error) {
    const body = error.response && error.response.data;
    return {
      estadoflag: false,
      mensaje: (body && body.mensaje) || CONNECTION_ERROR_MESSAGE,
      tipomensaje: "TMSGERR",
      data: [],
    };
  }
};

export const isEmptyResult = (response) =>
  !response.estadoflag && response.tipomensaje === "TMSGINF";

export const fetchPublicPackages = () =>
  request({ method: "get", url: "public/subscription_packages" });

export const fetchPackages = () =>
  request({ method: "get", url: "subscription_packages" });

export const fetchPackageModules = () =>
  request({ method: "get", url: "subscription_package_modules" });

export const createPackage = (payload) =>
  request({ method: "post", url: "subscription_packages", data: payload });

export const updatePackage = (id, payload) =>
  request({ method: "put", url: `subscription_packages/${id}`, data: payload });

export const setPackageActive = (id, isActive) =>
  request({
    method: "patch",
    url: `subscription_packages/${id}/status`,
    data: { is_active: isActive },
  });

export const fetchPaddleSync = () =>
  request({ method: "get", url: "subscription_packages/paddle_sync" });

export const applyPaddleSync = () =>
  request({ method: "post", url: "subscription_packages/paddle_sync" });

export const fetchRegistrationTrialSetting = () =>
  request({ method: "get", url: "registration_trial_setting" });

export const saveRegistrationTrialSetting = (trialDays) =>
  request({
    method: "put",
    url: "registration_trial_setting",
    data: { trial_days: trialDays },
  });
