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
  const candidatePaths = [
    path.resolve(process.cwd(), 'partners.json'),
    path.resolve(process.cwd(), '../../partners.json'),
    path.resolve(__dirname, '../../../partners.json'),
    path.resolve(__dirname, '../../../../partners.json')
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

  // Fallback if file not found
  if (!partnerData || !partnerData.partners) {
    partnerData = {
      version: '1.0.0',
      partners: {
        security: {
          name: 'CompliRules Certified Cybersecurity Network',
          tagline: 'Topluluk onaylı sızma testi (pentest) ve mimari güvenlik denetimi',
          gatewayUrl: 'https://complirules.com/go/security',
          discountCode: 'VIBECODE15',
          discountText: '%15 Topluluk İndirimi'
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
      formattedMarkdown: `> 📋 **Resmi Uyum & Denetim:** ${comp.name} ile VERBİS ve sözleşme denetimi yaptırın: [${comp.discountText} ile Başvurun →](${comp.gatewayUrl})`
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
    formattedMarkdown: `> 🛡️ **Canlı Öncesi Siber Güvenlik:** ${sec.name} ile profesyonel sızma testi (pentest) yaptırın: [${sec.discountText} ile Teklif Alın →](${sec.gatewayUrl})`
  }, null, 2);
}
