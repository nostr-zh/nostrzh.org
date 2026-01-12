/**
 * 头像相关工具函数
 */

/**
 * 根据公钥生成默认头像 SVG
 */
export function generateAvatarByPubkey(pubkey: string): string {
  const paddedPubkey = pubkey.padEnd(66, "0");
  const colors: string[] = [];
  const controlPoints: string[] = [];

  // 从公钥提取颜色和控制点
  for (let i = 0; i < 11; i++) {
    const part = paddedPubkey.slice(i * 6, (i + 1) * 6);
    if (i < 3) {
      colors.push(`#${part}`);
    } else {
      controlPoints.push(part);
    }
  }

  // 生成渐变层
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

/**
 * 浮动头像接口
 */
export interface FloatingAvatar {
  pubkey: string;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  image?: string;
}

/**
 * 生成初始浮动头像位置
 */
export function generateInitialAvatars(
  pubkeys: string[],
  maxAvatars: number
): FloatingAvatar[] {
  const marginPercent = 8; // 边距，防止头像被裁剪

  return pubkeys.slice(0, maxAvatars).map((pubkey) => ({
    pubkey,
    x: marginPercent + Math.random() * (100 - 2 * marginPercent),
    y: marginPercent + Math.random() * (100 - 2 * marginPercent),
    size: 32 + Math.random() * 24, // 32-56px
    speedX: (Math.random() - 0.5) * 0.02,
    speedY: (Math.random() - 0.5) * 0.02,
    opacity: 0.15 + Math.random() * 0.15, // 0.15-0.3
  }));
}

/**
 * 更新头像位置（动画帧）
 */
export function updateAvatarPosition(avatar: FloatingAvatar): FloatingAvatar {
  const marginPercent = 0;
  const minPos = marginPercent;
  const maxPos = 100 - marginPercent;

  let newX = avatar.x + avatar.speedX;
  let newY = avatar.y + avatar.speedY;
  let newSpeedX = avatar.speedX;
  let newSpeedY = avatar.speedY;

  // 边缘反弹
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
}
