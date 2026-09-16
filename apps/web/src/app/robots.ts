import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sinosen-web.onrender.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Espaces authentifiés (client et équipe) — jamais indexés, aucune valeur
      // pour la recherche et ce sont des pages privées par nature.
      disallow: ['/dashboard', '/admin', '/mock-checkout'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
