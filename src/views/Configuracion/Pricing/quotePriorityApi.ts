import { request } from "@/utils/request";

export interface QuotePriority {
  id: number | null;
  name: string;
  color_all: string;
  color_requested: string;
  color_sent: string;
  color_returned: string;
  position: number;
  active: boolean;
  in_use?: boolean;
}

const PRIORITIES_URL = "quote_priorities";

export const listQuotePriorities = () =>
  request<QuotePriority>({ method: "get", url: PRIORITIES_URL, params: { include_inactive: 1 } });

export const saveQuotePriority = (priority: QuotePriority) => {
  const { id, name, color_all, color_requested, color_sent, color_returned, position, active } = priority;
  return request({
    method: "post",
    url: PRIORITIES_URL,
    data: { id, name, color_all, color_requested, color_sent, color_returned, position, active },
  });
};

export const deleteQuotePriority = (id: number) => request({ method: "delete", url: `${PRIORITIES_URL}/${id}` });
