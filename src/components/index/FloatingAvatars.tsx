/**
 * FloatingAvatars 组件 - 浮动头像动画效果
 */
import { loadNostrUser } from "@nostr/gadgets/metadata";
import { useEffect, useRef, useState } from "react";
import { useWhitelistUsers } from "../../hooks/useWhitelistUsers";
import { useAnimationFrame } from "../../hooks/useAnimationFrame";
import {
  generateAvatarByPubkey,
  generateInitialAvatars,
  updateAvatarPosition,
  type FloatingAvatar,
} from "../../lib/avatar";

const MAX_AVATARS = 50;

export default function FloatingAvatars() {
  const { users } = useWhitelistUsers(MAX_AVATARS);
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatars, setAvatars] = useState<FloatingAvatar[]>([]);

  // 加载头像图片
  useEffect(() => {
    if (users.length === 0) return;

    // 生成初始头像位置
    const initialAvatars = generateInitialAvatars(users, MAX_AVATARS);
    setAvatars(initialAvatars);

    // 异步加载真实头像图片
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

    loadAvatars();
  }, [users]);

  // 动画循环
  useAnimationFrame(() => {
    setAvatars((prev) => prev.map(updateAvatarPosition));
  }, avatars.length > 0);

  if (users.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {avatars.map((avatar) => (
        <img
          key={avatar.pubkey}
          src={avatar.image || generateAvatarByPubkey(avatar.pubkey)}
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
            (e.target as HTMLImageElement).src = generateAvatarByPubkey(
              avatar.pubkey
            );
          }}
        />
      ))}
    </div>
  );
}
