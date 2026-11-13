import { expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import QuoteInTrafficNotice from "@/components/folderTraffic/QuoteInTrafficNotice.vue";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));

test("the notice opens the quote's Tráfico file, where it is sent to Operaciones", async () => {
  const wrapper = mount(QuoteInTrafficNotice, {
    props: { file: { code_traffic: "TR-00015", id_house: 8374 } },
    global: { plugins: [createVuetify({ components, directives })] },
  });

  await wrapper.find("button").trigger("click");

  expect(push).toHaveBeenCalledWith({ name: "trafficVer", params: { id: 8374 } });
});
