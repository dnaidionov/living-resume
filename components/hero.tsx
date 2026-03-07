import Image from "next/image";
import { ChatIcon } from "@/components/chat-icon";
import { DownloadIcon } from "@/components/download-icon";

export function Hero({ onAskAi }: { onAskAi: () => void }) {
  return (
    <section className="section shell" style={{ paddingTop: 36 }}>
      <div className="grid" style={{ alignItems: "stretch" }}>
        <div
          className="card"
          style={{
            padding: 32,
            background:
              "radial-gradient(circle at 85% 10%, rgba(117, 103, 255, 0.3), transparent 35%), radial-gradient(circle at 80% 72%, rgba(221, 57, 132, 0.2), transparent 44%), linear-gradient(160deg, #070b12, #0b1220 64%, #111a30)"
          }}
        >
          <h1 className="hero-title" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Dmitry Naidionov
          </h1>
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "1.5rem",
              fontWeight: 600,
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            Product Manager
          </h2>
          <p className="muted hero-copy">
            Product Strategy, AI Product Lifecycle and LLM Orchestration, Enterprise and Consumer
            Products{" "}
            <a
              href="https://www.linkedin.com/in/dnaidionov/"
              target="_blank"
              rel="noreferrer"
              className="inline-logo-image-link"
              aria-label="LinkedIn profile"
              title="LinkedIn"
            >
              <Image src="/linkedin-mark.svg" alt="LinkedIn" className="inline-logo-image" width={22} height={22} />
            </a>
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, alignItems: "stretch" }}>
            <a href="#experience" className="button secondary">
              Review experience
            </a>
            <a href="#fit-check" className="button secondary">
              Run fit check
            </a>
            <span className="callout-anchor hero-download-anchor">
              <a
                href="/DmitryNaidionov-cv.pdf"
                download="DmitryNaidionov-cv.pdf"
                className="button secondary hero-download-button"
                aria-label="Download classic resume"
              >
                <DownloadIcon />
              </a>
              <span className="callout-bubble">Download classic resume</span>
            </span>
            <button type="button" className="button primary-accent" onClick={onAskAi} style={{ fontWeight: 700 }}>
              <ChatIcon size={22} />
              Ask AI About Me
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
