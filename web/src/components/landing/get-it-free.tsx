"use client";

import Image from "next/image";
import { Globe } from "lucide-react";

const BASE_URL =
  (typeof window !== "undefined" && window.location?.origin) ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://flinote.ai";
const SIGNUP_URL = `${BASE_URL.replace(/\/$/, "")}/sign-up`;

const storeButtonClass =
  "inline-flex h-14 min-w-[180px] items-center gap-3 rounded-xl border border-neutral-700 bg-black px-4 py-3 text-left shadow-[0_1px_2px_rgba(255,255,255,0.06)] transition-all hover:bg-neutral-900 hover:border-neutral-600 active:scale-[0.98]";

function StoreButton({
  href,
  icon,
  topLine,
  bottomLine,
  "aria-label": ariaLabel,
}: {
  href: string;
  icon: React.ReactNode;
  topLine: string;
  bottomLine: string;
  "aria-label": string;
}) {
  return (
    <a
      href={href}
      className={storeButtonClass}
      aria-label={ariaLabel}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center [&>img]:h-8 [&>img]:w-8 [&>svg]:h-7 [&>svg]:w-7 text-white">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium text-white/90">{topLine}</span>
        <span className="text-base font-semibold text-white">{bottomLine}</span>
      </span>
    </a>
  );
}

export function GetItFree() {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=12&data=${encodeURIComponent(
    SIGNUP_URL
  )}`;

  return (
    <section className=" bg-muted/20 py-16 md:py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Get it free
        </h2>

        <div className="mt-12 flex flex-col items-center">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR code to get Flinote"
              width={200}
              height={200}
              className="h-[200px] w-[200px] rounded-lg"
            />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Scan on iPhone or Android
          </p>

          <p className="mt-8 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            — or —
          </p>

          <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3">
            <StoreButton
              href="#"
              aria-label="Download on the App Store"
              icon={
                <Image
                  src="/button-icons/Apple.png"
                  alt=""
                  width={32}
                  height={32}
                  className="object-contain"
                />
              }
              topLine="Download on the"
              bottomLine="App Store"
            />
            <StoreButton
              href="#"
              aria-label="Get it on Google Play"
              icon={
                <Image
                  src="/button-icons/playstore.png"
                  alt=""
                  width={32}
                  height={32}
                  className="object-contain"
                />
              }
              topLine="GET IT ON"
              bottomLine="Google Play"
            />
            <StoreButton
              href="/dashboard"
              aria-label="Start on the Web version"
              icon={<Globe className="text-white" strokeWidth={2} />}
              topLine="Start on the"
              bottomLine="Web version"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
