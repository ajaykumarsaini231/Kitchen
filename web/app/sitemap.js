import { getPublishedDishes } from '../lib/api';
import { SITE_URL } from '../lib/config';

export default async function sitemap() {
  const dishes = await getPublishedDishes();
  const dishUrls = dishes.map((d) => ({
    url: `${SITE_URL}/dish/${d.dishId}`,
    changeFrequency: 'daily',
    priority: 0.7,
  }));
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    ...dishUrls,
  ];
}
