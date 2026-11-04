import { defineStore } from "pinia";
import { ref } from "vue";
import type { ApiResponse } from "@/types/api";
import type {
  QuoteKind,
  TrafficCorrelative,
  TrafficFile,
  TrafficFileOfHouse,
  TrafficFilters,
  TrafficMasterOption,
  TrafficSendPayload,
  TrafficSent,
  TrafficStatus,
  TrafficStatusForm,
  TrafficToOperations,
  TrafficToOperationsPayload,
} from "@/types/traffic";
import type { TrafficFileOfQuote } from "@/utils/trafficSend";
import { downloadPdf } from "@/utils/pdfDownload";
import { request } from "@/utils/request";

const JSON_HEADERS = { "Content-Type": "application/json" };
const url = (path: string) => import.meta.env.VITE_URL_MAIN + path;
const withKey = (idempotencyKey: string) => ({ ...JSON_HEADERS, "idempotency-key": idempotencyKey });
const firstRowOf = <Row>(answer: ApiResponse<Row[]>): Row | null => (answer.estadoflag ? (answer.data[0] ?? null) : null);

export const useTrafficStore = defineStore("traffic", () => {
  const files = ref<TrafficFile[]>([]);
  const statuses = ref<TrafficStatus[]>([]);

  async function fileOfQuote(quoteKind: QuoteKind, idQuote: number | string): Promise<TrafficFileOfQuote | null> {
    return firstRowOf(
      await request<TrafficFileOfQuote>({
        method: "get",
        url: url("traffic_by_quote"),
        headers: JSON_HEADERS,
        params: { quote_kind: quoteKind, id_quote: idQuote },
      }),
    );
  }

  async function fileOfHouse(idHouse: number): Promise<TrafficFileOfHouse | null> {
    return firstRowOf(
      await request<TrafficFileOfHouse>({ method: "get", url: url("traffic_by_house"), headers: JSON_HEADERS, params: { id_house: idHouse } }),
    );
  }

  const sendQuote = (payload: TrafficSendPayload, idempotencyKey: string) =>
    request<TrafficSent>({ method: "post", url: url("traffic_send"), headers: withKey(idempotencyKey), data: payload });

  async function mastersFor(trafficId: number): Promise<TrafficMasterOption[]> {
    const answer = await request<TrafficMasterOption>({ method: "get", url: url(`traffic/${trafficId}/masters`), headers: JSON_HEADERS });
    return answer.estadoflag ? answer.data : [];
  }

  const sendToOperations = (trafficId: number, payload: TrafficToOperationsPayload, idempotencyKey: string) =>
    request<TrafficToOperations>({
      method: "put",
      url: url(`traffic/${trafficId}/send_to_operations`),
      headers: withKey(idempotencyKey),
      data: payload,
    });

  async function loadFiles(filters: TrafficFilters) {
    const answer = await request<TrafficFile>({ method: "get", url: url("traffic_list"), headers: JSON_HEADERS, params: filters });
    files.value = answer.estadoflag ? answer.data : [];
    return answer;
  }

  const setFileStatus = (trafficId: number, idStatus: number | null) =>
    request({ method: "put", url: url(`traffic/${trafficId}/status`), headers: JSON_HEADERS, data: { id_status: idStatus } });

  async function loadStatuses() {
    const answer = await request<TrafficStatus>({ method: "get", url: url("traffic_status"), headers: JSON_HEADERS });
    statuses.value = answer.estadoflag ? answer.data : [];
    return answer;
  }

  const saveStatus = (status: TrafficStatusForm) =>
    status.id
      ? request({ method: "put", url: url(`traffic_status/${status.id}`), headers: JSON_HEADERS, data: status })
      : request({ method: "post", url: url("traffic_status"), headers: JSON_HEADERS, data: status });

  const deleteStatus = (id: number) => request({ method: "delete", url: url(`traffic_status/${id}`), headers: JSON_HEADERS });

  async function correlative(): Promise<TrafficCorrelative | null> {
    return firstRowOf(await request<TrafficCorrelative>({ method: "get", url: url("traffic_correlative"), headers: JSON_HEADERS }));
  }

  const setCorrelative = (correlativo: number | null, manual: boolean) =>
    request({ method: "put", url: url("traffic_correlative"), headers: JSON_HEADERS, data: { correlativo, manual } });

  const exportReport = (filters: TrafficFilters) =>
    downloadPdf({ method: "post", url: url("traffic_report_pdf"), data: filters }, "REPORTE_CONTROL_TRAFICO.pdf");

  return {
    files,
    statuses,
    fileOfQuote,
    fileOfHouse,
    sendQuote,
    sendToOperations,
    mastersFor,
    loadFiles,
    setFileStatus,
    loadStatuses,
    saveStatus,
    deleteStatus,
    correlative,
    setCorrelative,
    exportReport,
  };
});
