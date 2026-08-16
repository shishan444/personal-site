/**
 * 上传 MIME 白名单（用户裁决 2026-08-15：上限 20MB + 类型白名单）。
 * 静态服务的扩展名集合见 uploads/[...path] 路由；此处按 MIME 收口。
 * 超大文件走附件外链（云盘 URL）方案，不经上传通道。
 */
export const MIME_ALLOWLIST = [
  // 图片（svg 供 Agent 卡片图使用）
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  // 文档
  "application/pdf",
  "text/plain",
  "text/markdown",
  // 压缩包
  "application/zip",
  // 短视频（演示录屏）
  "video/mp4",
  "video/webm",
] as const;

export function isAllowedMimeType(mimeType: string): boolean {
  return (MIME_ALLOWLIST as readonly string[]).includes(mimeType);
}
