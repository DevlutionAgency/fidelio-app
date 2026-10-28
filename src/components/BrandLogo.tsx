import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const BrandMark: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 28, className = '' }) => (
  <span
    className={`relative inline-flex overflow-hidden flex-shrink-0 ${className}`}
    style={{ width: size, height: size, borderRadius: 0.22 * size }}
  >
    <img
      src="/brand/logo-mark.png"
      alt="Fidelio"
      width={size}
      height={size}
      className="w-full h-full object-cover"
    />
  </span>
);

export const BrandLogo: React.FC<{
  size?: number;
  withWordmark?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ size = 28, withWordmark = true, variant = 'dark', className = '' }) => {
  const ratio = 434 / 115;
  const wordH = 0.62 * size;
  const wordW = Math.ceil(wordH * ratio);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="relative inline-flex overflow-hidden flex-shrink-0"
        style={{ width: size, height: size, borderRadius: 0.22 * size }}
      >
        <img
          src="/brand/logo-mark.png"
          alt="Fidelio"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </span>
      {withWordmark &&
        (variant === 'light' ? (
          <span
            role="img"
            aria-label="Fidelio"
            className="inline-block flex-shrink-0"
            style={{
              width: wordW,
              height: wordH,
              backgroundImage: 'url(/brand/wordmark-white.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left center',
            }}
          />
        ) : (
          <span
            role="img"
            aria-label="Fidelio"
            className="inline-block flex-shrink-0 bg-ink"
            style={{
              width: wordW,
              height: wordH,
              WebkitMaskImage: 'url(/brand/wordmark-white.png)',
              maskImage: 'url(/brand/wordmark-white.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
              maskPosition: 'left center',
            }}
          />
        ))}
    </span>
  );
};

export const StickerBadge: React.FC<{
  children: React.ReactNode;
  rotate?: number;
  tone?: 'white' | 'coral' | 'cream' | 'ink';
  className?: string;
}> = ({ children, rotate = -3, tone = 'white', className = '' }) => {
  const tones = {
    white: 'bg-white text-ink',
    coral: 'bg-coral text-white',
    cream: 'bg-cream text-ink',
    ink: 'bg-ink text-white',
  };
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`inline-block rounded-full px-3.5 py-1.5 font-semibold shadow-sticker font-script text-base leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export const QrCodeMatrix: React.FC<{
  code: string;
  size?: number;
  className?: string;
}> = ({ code, size = 112, className = '' }) => {
  return (
    <QRCodeSVG
      value={code || 'FIDELIO'}
      size={size}
      level="M"
      bgColor="#FFFFFF"
      fgColor="#161514"
      className={className}
      aria-label={`QR Code ${code}`}
    />
  );
};

export const WalletPassCard: React.FC<{
  shopName: string;
  logoUrl: string;
  coverUrl: string;
  bgColor: string;
  points: number;
  unitLabel?: string;
  code?: string;
  nextRewardText?: string;
  memberSince?: string;
  showQr?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  shopName,
  logoUrl,
  coverUrl,
  bgColor,
  points,
  unitLabel = 'POINTS',
  code = 'C-6H4BSM',
  nextRewardText = '30 pts',
  memberSince = '12/01/2025',
  showQr = true,
  className = '',
  style,
}) => {
  return (
    <div
      style={{ backgroundColor: bgColor, ...style }}
      className={`w-[240px] rounded-[22px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_22px_44px_-16px_rgba(0,0,0,0.42)] ring-1 ring-black/15 overflow-hidden select-none qr-inversion-interdite ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={logoUrl}
            alt={shopName}
            className="w-[26px] h-[26px] rounded-full object-cover flex-shrink-0 bg-white/10"
          />
          <span className="text-[12.5px] font-semibold tracking-[-0.01em] truncate">{shopName}</span>
        </div>
        <div className="text-right flex-shrink-0 leading-none">
          <p className="text-[7px] font-semibold tracking-[0.07em] uppercase opacity-70">{unitLabel}</p>
          <p className="text-[17px] font-normal tabular-nums tracking-tight mt-0.5">{points}</p>
        </div>
      </div>

      <div className="relative h-[84px] overflow-hidden bg-black/20">
        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      {showQr && (
        <>
          <div className="px-3.5 pt-2.5 pb-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[7px] font-semibold tracking-[0.07em] uppercase opacity-70">
                PROCHAINE RÉCOMPENSE
              </p>
              <p className="text-[11px] font-medium mt-0.5 truncate">{nextRewardText}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-semibold tracking-[0.07em] uppercase opacity-70">
                MEMBRE DEPUIS
              </p>
              <p className="text-[11px] font-medium mt-0.5 tabular-nums">{memberSince}</p>
            </div>
          </div>

          <div className="px-3.5 pt-1 pb-3.5 flex justify-center">
            <div className="bg-white rounded-[10px] px-3 pt-2.5 pb-1.5 shadow-sm flex flex-col items-center">
              <QrCodeMatrix code={code} size={88} />
              <p className="mt-1 text-[8px] font-mono tracking-[0.12em] text-black/60">{code}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
