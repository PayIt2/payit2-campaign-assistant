import type { E2EConfig } from "./env.js";

export interface CampaignDetail {
  id: string;
  title: string;
  status: string;
  goalAmount: number | string | null;
  totalRaised: number | string | null;
  description: string | null;
  themeId: string | null;
  role: string;
}
export interface CampaignSummary { id: string; title: string; status: string }

export const toNumber = (v: number | string | null | undefined): number => (v == null ? 0 : Number(v));

export class DevApi {
  constructor(private readonly cfg: Pick<E2EConfig, "apiUrl" | "apiKey">) {}

  private async request(method: string, path: string): Promise<Response> {
    return fetch(`${this.cfg.apiUrl}${path}`, { method, headers: { "x-api-key": this.cfg.apiKey } });
  }

  private async json<T>(method: string, path: string): Promise<T> {
    const res = await this.request(method, path);
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async getCampaign(id: string): Promise<CampaignDetail | null> {
    const res = await this.request("GET", `/api/v1/campaigns/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET campaign ${id}: ${res.status} ${await res.text()}`);
    return (await res.json()) as CampaignDetail;
  }

  async listMyCampaigns(search?: string): Promise<CampaignSummary[]> {
    const q = new URLSearchParams({ pageSize: "100" });
    if (search) q.set("search", search);
    const body = await this.json<unknown>("GET", `/api/v1/campaigns?${q}`);
    const b = body as Record<string, unknown>;
    const list = Array.isArray(body) ? body : (b.campaigns ?? b.data ?? b.items);
    if (!Array.isArray(list)) {
      throw new Error(`Unexpected campaign list shape, keys: ${Object.keys(b).join(", ")}`);
    }
    return list as CampaignSummary[];
  }

  async listPayments(id: string): Promise<unknown[]> {
    return this.json<unknown[]>("GET", `/api/v1/campaigns/${id}/payments`);
  }

  async deletePermanent(id: string): Promise<void> {
    const res = await this.request("DELETE", `/api/v1/campaigns/${id}/permanent`);
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`DELETE campaign ${id} permanently: ${res.status} ${await res.text()}`);
    }
  }
}
