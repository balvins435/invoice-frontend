import React from 'react';
import type { InvoiceTemplate } from '@/types';

type Palette = Record<string, string>;

const FALLBACK_PALETTE: Palette = {
  header_bg: '#0F172A',
  header_text: '#FFFFFF',
  header_soft: '#94A3B8',
  header_eyebrow: '#93C5FD',
  accent: '#2563EB',
  hero_bg: '#EFF6FF',
  hero_text: '#1D4ED8',
  table_head_bg: '#F8FAFC',
  table_head_text: '#64748B',
  table_head_rule: '#2563EB',
  grand_bg: '#0F172A',
  grand_text: '#FFFFFF',
  border: '#E2E8F0',
  surface: '#F8FAFC',
};

const Bar = ({
  width,
  color,
  height = 3,
}: {
  width: string;
  color: string;
  height?: number;
}) => (
  <span className="block rounded-full" style={{ width, height, backgroundColor: color }} />
);

const paletteOf = (template: InvoiceTemplate): Palette => ({
  ...FALLBACK_PALETTE,
  ...template.palette,
});

const HeroPreview = ({ palette }: { palette: Palette }) => {
  const headerBg = palette.header_bg;
  const headerText = palette.header_text;
  const headerSoft = palette.header_soft;
  const headerEyebrow = palette.header_eyebrow;
  const heroBg = palette.hero_bg;
  const heroText = palette.hero_text;
  const headBg = palette.table_head_bg;
  const headText = palette.table_head_text;
  const headRule = palette.table_head_rule;
  const grandBg = palette.grand_bg;
  const grandText = palette.grand_text;
  const border = palette.border;
  const surface = palette.surface;
  const headerOutline =
    headerBg.toUpperCase() === '#FFFFFF' ? { border: `1px solid ${border}` } : undefined;

  return (
    <div
      className="flex h-full w-full flex-col gap-[4px] p-[6px]"
      style={{ backgroundColor: surface }}
    >
      <div
        className="flex items-center justify-between gap-2 rounded-[4px] px-[7px] py-[6px]"
        style={{ backgroundColor: headerBg, ...headerOutline }}
      >
        <div className="flex items-center gap-[5px]">
          <span
            className="block h-[14px] w-[18px] rounded-[3px]"
            style={{ backgroundColor: headerText, opacity: 0.92 }}
          />
          <span className="flex flex-col gap-[3px]">
            <Bar width="48px" color={headerText} height={4} />
            <Bar width="40px" color={headerSoft} height={2} />
            <Bar width="32px" color={headerSoft} height={2} />
          </span>
        </div>
        <span className="flex flex-col items-end gap-[4px]">
          <Bar width="26px" color={headerEyebrow} height={5} />
          <Bar width="32px" color={headerSoft} height={2} />
          <Bar width="26px" color={headerSoft} height={2} />
        </span>
      </div>

      <div className="flex overflow-hidden rounded-[4px]" style={{ border: `1px solid ${border}` }}>
        <div className="flex-1 px-[6px] py-[5px]" style={{ backgroundColor: heroBg }}>
          <Bar width="26px" color={heroText} height={2} />
          <span className="mt-[4px] block">
            <Bar width="44px" color={heroText} height={5} />
          </span>
        </div>
        <div className="flex-1 px-[6px] py-[5px]" style={{ borderLeft: `1px solid ${border}` }}>
          <Bar width="24px" color={headText} height={2} />
          <span className="mt-[4px] block">
            <Bar width="38px" color={heroText} height={5} />
          </span>
        </div>
        <div className="flex-1 px-[6px] py-[5px]" style={{ borderLeft: `1px solid ${border}` }}>
          <Bar width="24px" color={headText} height={2} />
          <span className="mt-[4px] block">
            <Bar width="38px" color={heroText} height={5} />
          </span>
        </div>
      </div>

      <div className="flex gap-[4px]">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="flex-1 rounded-[4px] px-[6px] py-[5px]"
            style={{ border: `1px solid ${border}` }}
          >
            <Bar width="22px" color={headText} height={2} />
            <span className="mt-[4px] block">
              <Bar width="40px" color={heroText} height={3} />
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[4px] px-[6px] pt-[5px]" style={{ border: `1px solid ${border}` }}>
        <div
          className="flex items-center justify-between pb-[4px]"
          style={{ borderBottom: `1.5px solid ${headRule}`, backgroundColor: headBg }}
        >
          <Bar width="40px" color={headText} height={3} />
          <Bar width="16px" color={headText} height={3} />
          <Bar width="22px" color={headText} height={3} />
          <Bar width="24px" color={headText} height={3} />
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between py-[5px]"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            <Bar width="54px" color={heroText} height={3} />
            <Bar width="12px" color={border} height={3} />
            <Bar width="20px" color={border} height={3} />
            <Bar width="26px" color={heroText} height={3} />
          </div>
        ))}
      </div>

      <div className="flex items-stretch gap-[5px]">
        <div
          className="flex-1 rounded-[4px] px-[6px] py-[5px]"
          style={{
            border: `1px solid ${border}`,
            borderLeft: `2px solid ${palette.accent}`,
            backgroundColor: surface,
          }}
        >
          <Bar width="30px" color={headText} height={2} />
          <span className="mt-[4px] block">
            <Bar width="58px" color={heroText} height={2} />
          </span>
          <span className="mt-[3px] block">
            <Bar width="46px" color={heroText} height={2} />
          </span>
        </div>
        <div
          className="w-[45%] overflow-hidden rounded-[4px]"
          style={{ border: `1px solid ${border}` }}
        >
          <div className="flex items-center justify-between px-[6px] py-[4px]">
            <Bar width="22px" color={headText} height={2} />
            <Bar width="26px" color={headText} height={2} />
          </div>
          <div
            className="flex items-center justify-between px-[6px] py-[5px]"
            style={{ backgroundColor: grandBg }}
          >
            <Bar width="18px" color={grandText} height={3} />
            <Bar width="30px" color={grandText} height={4} />
          </div>
        </div>
      </div>

      <span className="flex-1" />
    </div>
  );
};

const LetterheadPreview = ({ palette }: { palette: Palette }) => {
  const ink = palette.header_text;
  const muted = palette.header_soft;
  const rule = palette.accent;
  const headBg = palette.table_head_bg;
  const border = palette.border;

  return (
    <div className="flex h-full w-full flex-col gap-[6px] bg-white p-[8px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-[3px]">
          <Bar width="68px" color={ink} height={6} />
          <Bar width="54px" color={muted} height={2} />
          <Bar width="46px" color={muted} height={2} />
          <Bar width="60px" color={muted} height={2} />
        </div>
        <div className="flex flex-col items-end gap-[3px]">
          <Bar width="46px" color={ink} height={8} />
          <Bar width="26px" color={muted} height={2} />
        </div>
      </div>

      <span className="block w-full" style={{ height: 2, backgroundColor: rule }} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-[3px]">
          <Bar width="20px" color={muted} height={2} />
          <Bar width="56px" color={ink} height={4} />
          <Bar width="44px" color={muted} height={2} />
        </div>
        <div className="flex flex-col gap-[3px]">
          {[0, 1, 2, 3].map((row) => (
            <span key={row} className="flex items-center justify-end gap-[4px]">
              <Bar width="28px" color={muted} height={2} />
              <Bar width="24px" color={ink} height={2} />
            </span>
          ))}
        </div>
      </div>

      <div style={{ border: `1px solid ${border}` }}>
        <div
          className="flex items-center gap-[6px] px-[6px] py-[5px]"
          style={{ backgroundColor: headBg, borderBottom: `1.5px solid ${rule}` }}
        >
          <Bar width="40px" color={ink} height={3} />
          <span className="ml-auto flex items-center gap-[6px]">
            <Bar width="16px" color={ink} height={3} />
            <Bar width="22px" color={ink} height={3} />
            <Bar width="22px" color={ink} height={3} />
          </span>
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-[6px] px-[6px] py-[6px]"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            <Bar width="46px" color={ink} height={3} />
            <span className="ml-auto flex items-center gap-[6px]">
              <Bar width="12px" color={muted} height={3} />
              <Bar width="20px" color={muted} height={3} />
              <Bar width="26px" color={ink} height={3} />
            </span>
          </div>
        ))}
      </div>

      <div className="ml-auto flex w-[60%] flex-col gap-[4px]">
        <span className="flex items-center justify-between">
          <Bar width="26px" color={muted} height={2} />
          <Bar width="32px" color={muted} height={2} />
        </span>
        <span className="flex items-center justify-between">
          <Bar width="26px" color={muted} height={2} />
          <Bar width="32px" color={muted} height={2} />
        </span>
        <span
          className="flex items-center justify-between pt-[5px]"
          style={{ borderTop: `2px solid ${rule}` }}
        >
          <Bar width="30px" color={ink} height={4} />
          <Bar width="40px" color={ink} height={5} />
        </span>
      </div>

      <span className="flex-1" />
    </div>
  );
};

/**
 * A miniature, colour-accurate sample of an invoice template. It is decorative:
 * the surrounding picker card carries the accessible name and state.
 */
export const TemplatePreview = ({
  template,
  className = '',
}: {
  template: InvoiceTemplate;
  className?: string;
}) => {
  const palette = paletteOf(template);

  return (
    <div
      aria-hidden="true"
      className={`aspect-[210/297] w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
    >
      {template.layout === 'letterhead' ? (
        <LetterheadPreview palette={palette} />
      ) : (
        <HeroPreview palette={palette} />
      )}
    </div>
  );
};