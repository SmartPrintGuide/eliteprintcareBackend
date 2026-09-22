/**
 * Optimize Cloudinary image URLs by adding resize/format transforms.
 * For non-Cloudinary URLs, returns the original URL unchanged.
 */
export function optimizeImageUrl(url, { width = 300, quality = 'auto', format = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;
  // Match Cloudinary upload URLs: .../image/upload/v1234/...
  const match = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.*)$/);
  if (match) {
    return `${match[1]}w_${width},f_${format},q_${quality}/${match[2]}`;
  }
  return url;
}
