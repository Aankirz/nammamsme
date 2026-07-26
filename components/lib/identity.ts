export const BUSINESS = {
  name: "Gupta Hosiery Mills",
  gstin: "03AABCG1234H1Z5",
  place: "Ludhiana",
} as const;

export interface SignedInUser {
  name: string | null;
  email: string | null;
  image: string | null;
}
