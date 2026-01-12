import { loadNostrUser } from "@nostr/gadgets/metadata";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWhitelistUsers } from "../../hooks/useWhitelistUsers";

const MAX_AVATARS = 50;

interface FloatingAvatar {
  pubkey: string;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  image?: string;
}

// Generate default avatar image from pubkey
function generateImageByPubkey(pubkey: string): string {
  const paddedPubkey = pubkey.padEnd(66, "0");
  const colors: string[] = [];
  const controlPoints: string[] = [];
  for (let i = 0; i < 11; i++) {
    const part = paddedPubkey.slice(i * 6, (i + 1) * 6);
    if (i < 3) {
      colors.push(`#${part}`);
    } else {
      controlPoints.push(part);
    }
  }

  const gradients = controlPoints
    .map((point, index) => {
      const cx = parseInt(point.slice(0, 2), 16) % 100;
      const cy = parseInt(point.slice(2, 4), 16) % 100;
      const r = (parseInt(point.slice(4, 6), 16) % 35) + 30;
      const c = colors[index % (colors.length - 1)];
      return `
        <radialGradient id="grad${index}" cx="${cx}%" cy="${cy}%" r="${r}%">
          <stop offset="0%" style="stop-color:${c};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${c};stop-opacity:0" />
        </radialGradient>
        <rect width="100%" height="100%" fill="url(#grad${index})" />
      `;
    })
    .join("");

  const image = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${colors[2]}" fill-opacity="0.3" />
      ${gradients}
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(image)}`;
}

export default function FloatingAvatars() {
  const { users } = useWhitelistUsers(MAX_AVATARS);
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatars, setAvatars] = useState<FloatingAvatar[]>([]);
  const animationRef = useRef<number | null>(null);

  // Initialize avatars with random positions
  const initialAvatars = useMemo(() => {
    return users.map((pubkey) => {
      const size = 32 + Math.random() * 24; // 32-56px
      // Reserve enough margin to prevent clipping with translate(-50%, -50%)
      // Using 8% margin to ensure avatars don't get clipped at edges
      const marginPercent = 8;
      return {
        pubkey,
        x: marginPercent + Math.random() * (100 - 2 * marginPercent),
        y: marginPercent + Math.random() * (100 - 2 * marginPercent),
        size,
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        opacity: 0.15 + Math.random() * 0.15, // 0.15-0.3
      };
    });
  }, [users]);

  // Load avatar images
  useEffect(() => {
    if (users.length === 0) return;

    const loadAvatars = async () => {
      const avatarsWithImages = await Promise.all(
        initialAvatars.map(async (avatar) => {
          try {
            const profile = await loadNostrUser(avatar.pubkey);
            return { ...avatar, image: profile.image };
          } catch {
            return avatar;
          }
        })
      );
      setAvatars(avatarsWithImages);
    };

    setAvatars(initialAvatars);
    loadAvatars();
  }, [initialAvatars, users.length]);

  // Animation loop
  useEffect(() => {
    if (avatars.length === 0) return;

    const marginPercent = 0;
    const minPos = marginPercent;
    const maxPos = 100 - marginPercent;

    const animate = () => {
      setAvatars((prev) =>
        prev.map((avatar) => {
          let newX = avatar.x + avatar.speedX;
          let newY = avatar.y + avatar.speedY;
          let newSpeedX = avatar.speedX;
          let newSpeedY = avatar.speedY;

          // Bounce off edges with margin
          if (newX < minPos || newX > maxPos) {
            newSpeedX = -newSpeedX;
            newX = Math.max(minPos, Math.min(maxPos, newX));
          }
          if (newY < minPos || newY > maxPos) {
            newSpeedY = -newSpeedY;
            newY = Math.max(minPos, Math.min(maxPos, newY));
          }

          return {
            ...avatar,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
          };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [avatars.length]);

  if (users.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {avatars.map((avatar) => (
        <img
          key={avatar.pubkey}
          src={avatar.image || generateImageByPubkey(avatar.pubkey)}
          className="rounded-full object-cover object-center absolute shrink-0"
          style={{
            left: `${avatar.x}%`,
            top: `${avatar.y}%`,
            width: avatar.size,
            height: avatar.size,
            minWidth: avatar.size,
            minHeight: avatar.size,
            transform: "translate(-50%, -50%)",
            opacity: avatar.opacity,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = generateImageByPubkey(
              avatar.pubkey
            );
          }}
        />
      ))}
    </div>
  );
}
