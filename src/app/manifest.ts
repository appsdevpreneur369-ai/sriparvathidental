import type { MetadataRoute } from 'next';
import { siteBrand, siteClinic } from '@/lib/content';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteClinic.name.value,
    short_name: siteClinic.shortName,
    start_url: '/',
    display: 'browser',
    background_color: siteBrand.colors.background,
    theme_color: siteBrand.colors.primary,
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  };
}
