import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/auth/auth";
import { RoutingPath } from "@/utils/routing-paths";
import SuspensePage from "./SuspensePage";

const OidcCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { logInCallback } = useAuth();
  const { data, error } = useQuery({
    queryKey: ["oidc", "callback", searchParams.toString()] as const,
    queryFn: logInCallback,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  if (error) {
    return <Navigate to={RoutingPath.EVENTS} />;
  }

  if (data) {
    return data.returnPath ? <Navigate to={data.returnPath} /> : <Navigate to={RoutingPath.EVENTS} />;
  }

  return <SuspensePage />;
};

export default OidcCallbackPage;
