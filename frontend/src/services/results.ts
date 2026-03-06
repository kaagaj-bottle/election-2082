import { apiGet } from '@/lib/api-client';
import type {
  CandidateListItem,
  HotSeat,
  PartyTally,
  ProvinceConstituencyResult,
  ProvinceSummary,
  LastUpdated,
} from '@/types/api';

export function getConstituencyResults(constituencyId: number, signal?: AbortSignal) {
  return apiGet<CandidateListItem[]>(
    `/candidates/results/constituency/${constituencyId}/`,
    undefined,
    signal,
  );
}

export function getPartyTally(signal?: AbortSignal) {
  return apiGet<PartyTally[]>('/candidates/results/party-tally/', undefined, signal);
}

export function getProvinceSummary(signal?: AbortSignal) {
  return apiGet<ProvinceSummary[]>('/candidates/results/province-summary/', undefined, signal);
}

export function getHotSeats(signal?: AbortSignal) {
  return apiGet<HotSeat[]>('/candidates/results/hotseats/', undefined, signal);
}

export function getProvinceResults(provinceId: number, signal?: AbortSignal) {
  return apiGet<ProvinceConstituencyResult[]>(
    `/candidates/results/province/${provinceId}/`,
    undefined,
    signal,
  );
}

export function getLastUpdated(signal?: AbortSignal) {
  return apiGet<LastUpdated>('/candidates/results/last-updated/', undefined, signal);
}
