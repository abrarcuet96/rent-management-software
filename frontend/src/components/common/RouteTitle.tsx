import { useEffect } from "react";
import { Outlet, useMatches } from "react-router-dom";

const SITE_NAME = "RentFlow";

function RouteTitle() {
  const matches = useMatches();

  useEffect(() => {
    const routeWithTitle = [...matches].reverse().find(
      (m) => (m.handle as { title?: string } | undefined)?.title,
    );
    const pageTitle = (routeWithTitle?.handle as { title?: string } | undefined)?.title;
    document.title = pageTitle ? `${pageTitle} - ${SITE_NAME}` : SITE_NAME;
  }, [matches]);

  return null;
}

export default function TitleWrapper() {
  return (
    <>
      <RouteTitle />
      <Outlet />
    </>
  );
}
