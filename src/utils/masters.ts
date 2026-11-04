interface MasterLock {
  statuslock?: number | boolean;
  statuslockadm?: number | boolean;
}

interface MasterRow extends MasterLock {
  id: number | string;
  status?: number;
  background?: string;
}

const ARRIVED = "#ff9898";
const ARRIVING = "#f9cfcf";

export const blankToNull = <T>(value: T | "" | null | undefined): T | null =>
  value === "" || value === undefined || value === null ? null : value;

export const isEtaBeforeEtd = (etd?: string | null, eta?: string | null): boolean => Boolean(etd && eta && eta < etd);

export const availabilityBaseDate = (modalityCode: string | undefined, etd: string | null, eta: string | null) => {
  if (modalityCode === "I") return etd;
  if (modalityCode === "E") return eta;
  return null;
};

export const isMasterClosed = (master: MasterLock): boolean => Boolean(Number(master.statuslock) || Number(master.statuslockadm));

export const masterRowClass = (master: MasterRow): string | undefined => {
  if (master.status === 0) return "rowNull";
  if (Number(master.statuslock) && Number(master.statuslockadm)) return "rowRedMark";
  if (isMasterClosed(master)) return "rowRed";
  if (master.background === ARRIVED) return "rowLlego";
  if (master.background === ARRIVING) return "rowLlegar";
  return undefined;
};

export const mastersToMoveHouseTo = <T extends MasterRow>(masters: T[], currentId: number | string | string[]): T[] =>
  masters.filter((master) => master.status == 1 && !isMasterClosed(master) && String(master.id) !== String(currentId));
