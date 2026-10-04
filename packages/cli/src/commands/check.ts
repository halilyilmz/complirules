import path from 'path';
import { scanDirectory } from '@complirules/linter';

export function executeCheck(targetPath = '.'): boolean {
  console.log(`\n🔍 CompliRules Statik Regülasyon ve Güvenlik Denetimi Başlatılıyor...`);
  console.log(`📂 Hedef Yol: ${path.resolve(targetPath)}\n`);

  const result = scanDirectory(targetPath);

  console.log(`📊 Taranan Dosya Sayısı: ${result.checkedFilesCount}`);

  if (result.violations.length === 0) {
    console.log('✅ Tebrikler! Projede herhangi bir regülasyon veya PII sızıntısı ihlali tespit edilmedi.\n');
    return true;
  }

  console.log(`\n🚨 TESPİT EDİLEN İHLALLER (${result.violations.length} adet):`);
  console.log(`   Kritik: ${result.summary.critical} | Yüksek: ${result.summary.high} | Orta: ${result.summary.medium}\n`);

  for (const v of result.violations) {
    const icon = v.severity === 'CRITICAL' ? '🛑' : v.severity === 'HIGH' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${v.severity}] ${v.ruleId} — ${v.file}:${v.line}:${v.column}`);
    console.log(`   Mevzuat Dayanağı: ${v.lawCitation}`);
    console.log(`   Mesaj: ${v.message}`);
    console.log(`   İhlal Eden Kod: \`${v.matchedSnippet}\``);
    if (v.suggestedFix) {
      console.log(`   💡 Önerilen Düzeltme: ${v.suggestedFix}`);
    }
    console.log('   ' + '-'.repeat(60));
  }

  if (result.summary.critical > 0 || result.summary.high > 0) {
    console.log('\n❌ HATA: Projede kritik/yüksek düzeyde yasal uyumluluk ihlali bulunmaktadır. CI/CD kontrolü başarısız oldu.\n');
    return false;
  }

  return true;
}
