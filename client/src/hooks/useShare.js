export function useShareListing() {
  const share = async ({ title, price, location, url }) => {
    const shareData = {
      title: `${title} — GMarkt`,
      text: `D ${Number(price).toLocaleString()} · ${location}`,
      url: url || window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return { method: 'native' };
      } catch (err) {
        if (err.name === 'AbortError') return { method: 'cancelled' };
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      return { method: 'clipboard' };
    } catch {
      const el = document.createElement('input');
      el.value = shareData.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return { method: 'clipboard' };
    }
  };

  return { share };
}
