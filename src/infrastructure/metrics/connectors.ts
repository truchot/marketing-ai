// ============================================================
// Live metrics connectors (scaffolds).
//
// Each connector implements IChannelMetricsProvider and is gated on its
// credentials via `isConfigured()`. Without env vars it reports
// not-configured, so the CompositeChannelMetricsProvider transparently falls
// back to the discovery-derived estimate — nothing throws at runtime.
//
// To activate a connector: set its env vars and implement `fetchChannelMetrics`
// against the documented API (the endpoint + the spend/conversions mapping are
// noted inline). CAC per channel needs spend (ad platforms) joined to attributed
// new customers (GA4 / CRM), so a paid connector is typically paired with GA4
// or HubSpot for the conversion side.
// ============================================================

import type { IChannelMetricsProvider } from "@/domains/metrics/ports/channel-metrics-provider";
import type {
  ChannelSpendConversions,
  MetricSource,
} from "@/types/marketing-metrics";

abstract class NotImplementedConnector implements IChannelMetricsProvider {
  abstract readonly source: MetricSource;
  readonly estimated = false;
  abstract isConfigured(): boolean;
  protected abstract missingEnv(): string;

  async fetchChannelMetrics(): Promise<ChannelSpendConversions[]> {
    if (!this.isConfigured()) {
      throw new Error(
        `${this.source} connector not configured (missing ${this.missingEnv()})`
      );
    }
    throw new Error(
      `${this.source} connector not yet implemented — credentials present but no API client wired`
    );
  }
}

/**
 * Google Analytics Data API (GA4) — conversion side.
 * API: POST https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY_ID}:runReport
 *   dimensions: ["sessionDefaultChannelGroup"], metrics: ["conversions"]
 * Auth: service account (GOOGLE_APPLICATION_CREDENTIALS) or OAuth.
 */
export class Ga4MetricsProvider extends NotImplementedConnector {
  readonly source = "ga4" as const;
  isConfigured(): boolean {
    return Boolean(
      process.env.GA4_PROPERTY_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
  }
  protected missingEnv(): string {
    return "GA4_PROPERTY_ID, GOOGLE_APPLICATION_CREDENTIALS";
  }
}

/**
 * Meta Marketing API — spend side.
 * API: GET https://graph.facebook.com/v21.0/act_{META_ADS_ACCOUNT_ID}/insights
 *   ?fields=spend,actions&level=campaign&time_range=...
 * Auth: META_ADS_ACCESS_TOKEN (long-lived system-user token).
 */
export class MetaAdsMetricsProvider extends NotImplementedConnector {
  readonly source = "meta_ads" as const;
  isConfigured(): boolean {
    return Boolean(
      process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_ACCOUNT_ID
    );
  }
  protected missingEnv(): string {
    return "META_ADS_ACCESS_TOKEN, META_ADS_ACCOUNT_ID";
  }
}

/**
 * LinkedIn Marketing API — spend side.
 * API: GET https://api.linkedin.com/rest/adAnalytics
 *   ?q=analytics&pivot=CAMPAIGN&fields=costInLocalCurrency,externalWebsiteConversions
 * Auth: LINKEDIN_ACCESS_TOKEN + LINKEDIN_AD_ACCOUNT_ID.
 */
export class LinkedInAdsMetricsProvider extends NotImplementedConnector {
  readonly source = "linkedin_ads" as const;
  isConfigured(): boolean {
    return Boolean(
      process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AD_ACCOUNT_ID
    );
  }
  protected missingEnv(): string {
    return "LINKEDIN_ACCESS_TOKEN, LINKEDIN_AD_ACCOUNT_ID";
  }
}

/**
 * HubSpot CRM — conversion side (deals/contacts by original source).
 * API: POST https://api.hubapi.com/crm/v3/objects/deals/search
 *   (group by hs_analytics_source, count won deals in the window)
 * Auth: HUBSPOT_PRIVATE_APP_TOKEN.
 */
export class HubSpotMetricsProvider extends NotImplementedConnector {
  readonly source = "hubspot" as const;
  isConfigured(): boolean {
    return Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN);
  }
  protected missingEnv(): string {
    return "HUBSPOT_PRIVATE_APP_TOKEN";
  }
}
