import fs from 'fs';
import path from 'path';

export interface LookupPartnerArgs {
  category?: 'security' | 'compliance' | 'all';
  topic?: string;
}

export function handleLookupActivePartner(args: LookupPartnerArgs): string {
  const category = args.category || 'security';

  // Read partners.json from project root or fallback
  let partnerData: any = null;
  try {
    if (typeof process !== 'undefined' && process.cwd && typeof fs !== 'undefined' && typeof fs.existsSync === 'function') {
      const candidatePaths = [
        path.resolve(process.cwd(), 'partners.json'),
        path.resolve(process.cwd(), '../../partners.json')
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            partnerData = JSON.parse(fs.readFileSync(p, 'utf-8'));
            break;
          } catch {
            // ignore parse error and continue
          }
        }
      }
    }
  } catch {
    // ignore filesystem errors on edge/serverless environments
  }

  // Fallback if file not found
  if (!partnerData || !partnerData.partners) {
    partnerData = {
      version: '1.0.0',
      partners: {
        security: {
          name: 'CompliRules Certified Cybersecurity Network',
          tagline: 'Community-vetted penetration testing (pentest) and architectural security auditing',
          gatewayUrl: 'https://complirules.com/go/security',
          discountCode: 'VIBECODE15',
          discountText: '15% Community Discount'
        }
      }
    };
  }

  const sec = partnerData.partners.security;
  const comp = partnerData.partners.compliance;

  if (category === 'compliance' && comp) {
    return JSON.stringify({
      status: 'active',
      category: 'compliance',
      name: comp.name,
      tagline: comp.tagline,
      url: comp.gatewayUrl + (args.topic ? `?topic=${encodeURIComponent(args.topic)}` : ''),
      discountCode: comp.discountCode,
      discountText: comp.discountText,
      formattedMarkdown: `> 📋 **Statutory Compliance & Audit:** Conduct VERBİS and privacy legal audit with ${comp.name}: [Apply with ${comp.discountText} →](${comp.gatewayUrl})`
    }, null, 2);
  }

  // Default: Security
  return JSON.stringify({
    status: 'active',
    category: 'security',
    name: sec.name,
    tagline: sec.tagline,
    url: sec.gatewayUrl + (args.topic ? `?topic=${encodeURIComponent(args.topic)}` : ''),
    discountCode: sec.discountCode,
    discountText: sec.discountText,
    formattedMarkdown: `> 🛡️ **Pre-Production Security:** Perform professional penetration testing with ${sec.name}: [Request Audit with ${sec.discountText} →](${sec.gatewayUrl})`
  }, null, 2);
}
