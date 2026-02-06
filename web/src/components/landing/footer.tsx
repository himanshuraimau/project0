"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { Github, Twitter, Linkedin, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

export function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    background: isDark ? "#000000" : "#f9fafb",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    textPrimary: isDark ? "#ffffff" : "#000000",
    textMuted: isDark ? "#a1a1aa" : "#6b7280",
    textSection: isDark ? "#e5e5e5" : "#111827",
    logoBg: isDark ? "#ffffff" : "#000000",
    logoText: isDark ? "#111827" : "#ffffff",
    link: isDark ? "#a1a1aa" : "#4b5563",
    linkHover: isDark ? "#ffffff" : "#000000",
    social: isDark ? "#9ca3af" : "#4b5563",
    socialHover: isDark ? "#ffffff" : "#000000",
  } as const;

  const handleLinkEnter = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = colors.linkHover;
  };

  const handleLinkLeave = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = colors.link;
  };

  const handleSocialEnter = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = colors.socialHover;
  };

  const handleSocialLeave = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = colors.social;
  };

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
    >
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.logoBg, color: colors.logoText }}
              >
               <Image
                src="/logo.png"
                alt="Flinote logo"
                width={32}
                height={32}
                style={{ objectFit: "contain" }}
                priority
              />
              </div>
              <span className="font-bold text-xl" style={{ color: colors.textPrimary }}>
                Flinote
              </span>
            </div>
            <p className="text-sm mb-4 max-w-xs" style={{ color: colors.textMuted }}>
              Making education accessible, intelligent, and efficient for everyone through advanced AI.
            </p>
          </div>

          {[{
            title: "Product",
            links: ["Features", "Pricing", "Changelog", "Docs"],
          }, {
            title: "Company",
            links: ["About", "Blog", "Careers", "Contact"],
          }, {
            title: "Legal",
            links: [
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ],
          }].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4" style={{ color: colors.textSection }}>
                {section.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {section.links.map((link) => {
                  const href = typeof link === 'string' ? '#' : link.href;
                  const label = typeof link === 'string' ? link : link.label;
                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        style={{ color: colors.link, transition: "color 0.2s ease" }}
                        onMouseEnter={handleLinkEnter}
                        onMouseLeave={handleLinkLeave}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>
            © {new Date().getFullYear()} Flinote. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[{
              icon: Twitter,
              label: "Twitter",
            }, {
              icon: Github,
              label: "GitHub",
            }, {
              icon: Linkedin,
              label: "LinkedIn",
            }].map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href="#"
                style={{ color: colors.social, transition: "color 0.2s ease" }}
                onMouseEnter={handleSocialEnter}
                onMouseLeave={handleSocialLeave}
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}