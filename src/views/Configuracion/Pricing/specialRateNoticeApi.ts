import { request } from "@/utils/request";
import { noticeFromResponse } from "@/components/folderPricing/specialRateNotice";
import type { SpecialRateNotice } from "@/components/folderPricing/specialRateNotice";

const NOTICE_URL = "quote_special_rate_notice";

export const getSpecialRateNotice = async () =>
  noticeFromResponse(await request<SpecialRateNotice>({ method: "get", url: NOTICE_URL }));

export const saveSpecialRateNotice = (notice: SpecialRateNotice) =>
  request({ method: "put", url: NOTICE_URL, data: notice });
