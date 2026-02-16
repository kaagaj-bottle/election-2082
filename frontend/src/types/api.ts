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
  spouse_name: string;
  address: string;
  citizenship_district: string;
  qualification: string;
  institution: string;
  experience: string;
  other_details: string;
  party: Party;
  election_symbol_code: number | null;
  election_symbol_name: string;
  constituency: Constituency | null;
  votes_received: number;
  status: string;
  closed_list_rank: number | null;
  voter_id: string;
  inclusion_group: string;
  has_disability: boolean;
  photo_url: string | null;
}
