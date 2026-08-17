import { useQuery } from "@tanstack/react-query";
import { fetchBranches } from "./branches";
import { useAuthStore } from "../auth/auth-store";

/** Sedes visibles para el usuario actual (RB-018: corporativo ve todas, el resto solo las suyas). */
export function useAuthorizedBranches() {
  const user = useAuthStore((s) => s.user);
  const query = useQuery({
    queryKey: ["sedes"],
    queryFn: fetchBranches,
    enabled: !!user,
  });

  const branches = (query.data ?? []).filter(
    (b) => user?.isCorporate || user?.sedeIds.includes(b.id),
  );

  return { ...query, branches };
}
