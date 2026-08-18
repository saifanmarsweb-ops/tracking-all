import { useCallback, useState } from "react";
import type { Section } from "./lib/types";
import { StoreProvider } from "./state/store";
import { MobileNav, Sidebar } from "./components/Sidebar";
import { ToastHost } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Budget from "./pages/Budget";
import Tasks from "./pages/Tasks";
import Work from "./pages/Work";
import Vault from "./pages/Vault";
import Notes from "./pages/Notes";

interface Route {
  section: Section;
  intent?: unknown;
  n: number;
}

function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* static glows */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(1000px 640px at 10% -12%, rgba(62,207,142,0.09), transparent 62%)",
            "radial-gradient(860px 560px at 92% 4%, rgba(91,200,245,0.075), transparent 60%)",
            "radial-gradient(980px 720px at 68% 112%, rgba(245,184,75,0.06), transparent 62%)",
            "radial-gradient(700px 500px at -8% 78%, rgba(199,155,242,0.05), transparent 60%)",
          ].join(","),
        }}
      />
      {/* drifting orbs */}
      <div className="animate-drift absolute left-[16%] top-[8%] h-[340px] w-[340px] rounded-full bg-mint/[0.05] blur-[90px]" />
      <div className="animate-drift2 absolute right-[8%] top-[42%] h-[300px] w-[300px] rounded-full bg-aqua/[0.05] blur-[90px]" />
      {/* grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse 95% 75% at 50% 0%, black 25%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 95% 75% at 50% 0%, black 25%, transparent 78%)",
        }}
      />
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>({ section: "dashboard", n: 0 });

  const nav = useCallback((section: Section, intent?: unknown) => {
    setRoute((r) => ({ section, intent, n: r.n + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const page = (() => {
    switch (route.section) {
      case "finance":
        return <Finance onNav={nav} intent={route.intent} />;
      case "budget":
        return <Budget onNav={nav} intent={route.intent} />;
      case "tasks":
        return <Tasks onNav={nav} intent={route.intent} />;
      case "work":
        return <Work onNav={nav} intent={route.intent} />;
      case "vault":
        return <Vault onNav={nav} intent={route.intent} />;
      case "notes":
        return <Notes onNav={nav} intent={route.intent} />;
      default:
        return <Dashboard onNav={nav} />;
    }
  })();

  return (
    <StoreProvider>
      <div className="relative min-h-screen font-sans text-fog">
        <Ambient />
        <Sidebar section={route.section} onNav={nav} />
        <MobileNav section={route.section} onNav={nav} />
        <main className="relative z-10 mx-auto max-w-[1220px] px-4 pb-16 pt-6 sm:px-7 lg:ml-[236px] lg:px-10 lg:pt-9">
          <div key={`${route.section}-${route.n}`}>{page}</div>
        </main>
        <ToastHost />
      </div>
    </StoreProvider>
  );
}
