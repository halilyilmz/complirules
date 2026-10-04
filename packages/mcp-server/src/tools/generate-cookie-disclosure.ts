export interface CookieItem {
  name: string;
  provider: string;
  category: 'strictly_necessary' | 'functional' | 'analytics' | 'marketing';
  purpose: string;
  expiry: string;
}

export interface GenerateCookieDisclosureArgs {
  appName: string;
  cookies: CookieItem[];
}

export function handleGenerateCookieDisclosure(args: GenerateCookieDisclosureArgs): string {
  const { appName, cookies } = args;

  const categories = {
    strictly_necessary: [] as CookieItem[],
    functional: [] as CookieItem[],
    analytics: [] as CookieItem[],
    marketing: [] as CookieItem[],
  };

  for (const c of cookies ?? []) {
    if (categories[c.category]) {
      categories[c.category].push(c);
    }
  }

  const renderTable = (items: CookieItem[]) => {
    if (items.length === 0) return '_None registered._\n';
    return (
      '| Cookie Name | Provider | Purpose | Expiry |\n' +
      '|---|---|---|---|\n' +
      items.map(i => `| \`${i.name}\` | ${i.provider} | ${i.purpose} | ${i.expiry} |`).join('\n') +
      '\n'
    );
  };

  return `
# Cookie & Terminal Equipment Disclosure: ${appName}
**Governing Laws:** ePrivacy Directive Art. 5(3), CJEU C-673/17 (Planet49), KVKK Çerez Rehberi (2022)

## 1. Strictly Necessary Cookies (Zorunlu Çerezler)
*Legal Basis: ePrivacy Art. 5(3) Exemption / GDPR Art. 6(1)(f) / KVKK Art. 5(2)(f). Prior consent is not required.*
${renderTable(categories.strictly_necessary)}

## 2. Functional Cookies (İşlevsel Çerezler)
*Legal Basis: Explicit Consent (Açık Rıza).*
${renderTable(categories.functional)}

## 3. Performance & Analytics Cookies (Analitik Çerezler)
*Legal Basis: Explicit Consent (Açık Rıza). Never loaded before consent.*
${renderTable(categories.analytics)}

## 4. Advertising & Remarketing Cookies (Pazarlama Çerezleri)
*Legal Basis: Explicit Consent (Açık Rıza). Cross-context behavioral tracking strictly gated.*
${renderTable(categories.marketing)}

## Consent Revocation Guarantee
Users can modify or revoke their choices at any time via the cookie settings modal. Per GDPR Art. 7(3), withdrawal is as easy as granting.
  `.trim();
}
