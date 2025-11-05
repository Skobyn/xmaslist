/**
 * Utility to update retailer logo based on item URLs
 */

import { supabase } from '@/lib/supabase/client';
import { detectRetailerFromUrls } from './retailer-logos';

export async function updateRetailerLogo(locationId: string): Promise<void> {
  try {
    console.log('🎨 Updating retailer logo for location:', locationId);

    // Get all lists for this location
    const { data: lists } = await supabase
      .from('lists')
      .select('id')
      .eq('location_id', locationId);

    console.log('📋 Found lists:', lists?.length || 0);

    if (!lists || lists.length === 0) return;

    // Get all items with URLs
    const listIds = lists.map(list => list.id);
    const { data: items } = await supabase
      .from('items')
      .select('url')
      .in('list_id', listIds)
      .not('url', 'is', null);

    console.log('🔗 Found items with URLs:', items?.length || 0);

    if (!items || items.length === 0) return;

    // Detect retailer from URLs
    const urls = items.map(item => item.url!).filter(Boolean);
    console.log('🔍 Analyzing URLs:', urls);

    const retailerInfo = detectRetailerFromUrls(urls);
    console.log('🏪 Detected retailer:', retailerInfo);

    if (retailerInfo) {
      // Update location with logo
      const { error } = await supabase
        .from('locations')
        .update({
          logo_url: retailerInfo.logoUrl,
        })
        .eq('id', locationId);

      if (error) {
        console.error('❌ Error updating logo:', error);
      } else {
        console.log('✅ Logo updated successfully:', retailerInfo.logoUrl);
      }
    } else {
      console.log('❌ No retailer detected from URLs');
    }
  } catch (error) {
    console.error('❌ Error updating retailer logo:', error);
  }
}
