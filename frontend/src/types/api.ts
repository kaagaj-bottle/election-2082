export interface CursorPage<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

// Elections
export interface ElectionListItem {
  id: number;
  name: string;
  name_ne: string;
  slug: string;
  election_date: string;
  is_active: boolean;
}

export interface ElectionDetail extends ElectionListItem {
  total_seats_fptp: number;
  total_seats_pr: number;
  total_districts: number;
  created_at: string;
}

// Geography
export interface Province {
  id: number;
  source_id: number;
  name: string;
  name_ne: string;
}

export interface DistrictMinimal {
  id: number;
  name: string;
  name_ne: string;
}

export interface ProvinceDetail extends Province {
  districts: DistrictMinimal[];
}

export interface District {
  id: number;
  name: string;
  name_ne: string;
  province: Province;
}

export interface DistrictDetail extends District {
  constituencies: ConstituencyMinimal[];
}

export interface ConstituencyMinimal {
  id: number;
  number: number;
}

export interface Constituency {
  id: number;
  number: number;
  district: District;
}

// Parties
export interface Party {
  id: number;
  name_ne: string;
  name: string;
}

export interface PartyDetail extends Party {
  candidate_count: number;
}

// Candidates
export type Gender = 'male' | 'female' | 'other';
export type ElectionType = 'fptp' | 'pr';

export interface CandidateListItem {
  id: number;
  source_id: number;
  name_ne: string;
  name: string;
  age: number | null;
  gender: Gender;
  election_type: ElectionType;
  party: Party;
  constituency: Constituency | null;
  votes_received: number;
  photo_url: string | null;
}

// Stats
export interface GenderStat {
  gender: Gender;
  count: number;
  percentage: number;
}

export interface AgeBucket {
  bucket: string;
  count: number;
}

export interface AgeStats {
  avg_age: number | null;
  min_age: number | null;
  max_age: number | null;
  buckets: AgeBucket[];
}

export interface PartyStat {
  party__id: number;
  party__name_ne: string;
  party__name: string;
  candidate_count?: number;
}

export interface ProvinceStat {
  id: number;
  name: string;
  name_ne: string;
  candidate_count: number;
}

export interface CandidatesPerConstituency {
  avg: number | null;
  min: number | null;
  max: number | null;
}

export interface ElectionStats {
  overview: {
    total_candidates: number;
    total_parties: number;
    total_constituencies: number;
  };
  gender: GenderStat[];
  age: AgeStats;
  party_by_candidates: PartyStat[];
  provinces: ProvinceStat[];
  candidates_per_constituency: CandidatesPerConstituency;
}

export interface CandidateDetail {
  id: number;
  source_id: number;
  election: ElectionListItem;
  election_type: ElectionType;
  name_ne: string;
  name: string;
  age: number | null;
  gender: Gender;
  father_name: string;
  father_name_en: string;
  spouse_name: string;
  spouse_name_en: string;
  address: string;
  address_en: string;
  citizenship_district: string;
  citizenship_district_en: string;
  qualification: string;
  qualification_en: string;
  institution: string;
  institution_en: string;
  experience: string;
  experience_en: string;
  other_details: string;
  other_details_en: string;
  party: Party;
  election_symbol_code: number | null;
  election_symbol_name: string;
  election_symbol_name_en: string;
  constituency: Constituency | null;
  votes_received: number;
  status: string;
  closed_list_rank: number | null;
  voter_id: string;
  inclusion_group: string;
  inclusion_group_en: string;
  has_disability: boolean;
  photo_url: string | null;
}
