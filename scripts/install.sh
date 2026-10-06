#!/bin/bash
# ==============================================================================
# CompliRules: Zero-Dependency Linux/macOS Rule Installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/halilyilmz/complirules/main/scripts/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/halilyilmz/complirules/main/scripts/install.sh | bash -s -- --pack kvkk
#   curl -fsSL https://raw.githubusercontent.com/halilyilmz/complirules/main/scripts/install.sh | bash -s -- --pack gdpr
# ==============================================================================

set -e

PACK="${1:-kvkk}"
TARGET_DIR="${2:-.}"
RULES_DIR="$TARGET_DIR/.cursor/rules"

echo "🛡️  CompliRules — Zero-Dependency Rule Installer"
echo "📦 Seçilen Paket: $PACK"
echo "📂 Hedef Dizin: $TARGET_DIR"

mkdir -p "$RULES_DIR"

BASE_URL="https://raw.githubusercontent.com/halilyilmz/complirules/main/packages/rules/catalog"

case "$PACK" in
  "tr"|"kvkk")
    echo "⬇️  Türkiye KVKK & VUK Kuralları İndiriliyor..."
    curl -fsSL "$BASE_URL/kvkk/01-retention-tombstone.mdc" -o "$RULES_DIR/kvkk-retention-tombstone.mdc"
    curl -fsSL "$BASE_URL/kvkk/02-ui-consent-etk.mdc" -o "$RULES_DIR/kvkk-ui-consent-etk.mdc"
    ;;
  "eu"|"gdpr")
    echo "⬇️  Avrupa Birliği GDPR & EAA Kuralları İndiriliyor..."
    curl -fsSL "$BASE_URL/gdpr/01-right-to-be-forgotten.mdc" -o "$RULES_DIR/gdpr-right-to-be-forgotten.mdc"
    curl -fsSL "$BASE_URL/eaa-a11y/01-wcag-accessibility.mdc" -o "$RULES_DIR/eaa-wcag-accessibility.mdc"
    ;;
  "us"|"hipaa")
    echo "⬇️  ABD HIPAA Kuralları İndiriliyor..."
    curl -fsSL "$BASE_URL/hipaa/01-phi-technical-safeguards.mdc" -o "$RULES_DIR/hipaa-phi-technical-safeguards.mdc"
    ;;
  "all")
    echo "⬇️  Tüm Regülasyon Kuralları İndiriliyor..."
    curl -fsSL "$BASE_URL/kvkk/01-retention-tombstone.mdc" -o "$RULES_DIR/kvkk-retention-tombstone.mdc"
    curl -fsSL "$BASE_URL/kvkk/02-ui-consent-etk.mdc" -o "$RULES_DIR/kvkk-ui-consent-etk.mdc"
    curl -fsSL "$BASE_URL/gdpr/01-right-to-be-forgotten.mdc" -o "$RULES_DIR/gdpr-right-to-be-forgotten.mdc"
    curl -fsSL "$BASE_URL/eaa-a11y/01-wcag-accessibility.mdc" -o "$RULES_DIR/eaa-wcag-accessibility.mdc"
    curl -fsSL "$BASE_URL/hipaa/01-phi-technical-safeguards.mdc" -o "$RULES_DIR/hipaa-phi-technical-safeguards.mdc"
    ;;
  *)
    echo "❌ Bilinmeyen paket: $PACK. Kullanılabilir: kvkk, gdpr, hipaa, all"
    exit 1
    ;;
esac

echo "✅ Tamamlandı! Kurallar $RULES_DIR dizinine kaydedildi."
echo "💡 Cursor, Claude Code veya Windsurf projenizi açtığında bu kuralları otomatik olarak uygulayacaktır."
