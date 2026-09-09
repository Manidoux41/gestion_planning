export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  familyName: string;
  initials: string;
};

export const mockUser: MockUser = {
  id: "user_demo_amelie",
  name: "Amélie Martin",
  email: "amelie.martin@example.com",
  role: "owner",
  familyName: "Famille Martin",
  initials: "AM",
};

export function getCurrentUser(): MockUser {
  return mockUser;
}
