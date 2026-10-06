# ==============================================================================
# CompliRules: Zero-Dependency Windows PowerShell Rule Installer
# Usage:
#   irm https://raw.githubusercontent.com/halilyilmz/complirules/main/scripts/install.ps1 | iex
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/halilyilmz/complirules/main/scripts/install.ps1))) -Pack kvkk
# ==============================================================================

param(
    [string]$Pack = "kvkk",
    [string]$TargetDir = "."
)

$rulesDir = Join-Path $TargetDir ".cursor\rules"
if (-not (Test-Path $rulesDir)) {
    New-Item -ItemType Directory -Path $rulesDir -Force | Out-Null
}

$baseUrl = "https://raw.githubusercontent.com/halilyilmz/complirules/main/packages/rules/catalog"

Write-Host "🛡️  CompliRules — Zero-Dependency Rule Installer (Windows)" -ForegroundColor Cyan
Write-Host "📦 Seçilen Paket: $Pack" -ForegroundColor Yellow

switch ($Pack.ToLower()) {
    { $_ -in "tr", "kvkk" } {
        Write-Host "⬇️  Türkiye KVKK & VUK Kuralları İndiriliyor..." -ForegroundColor Green
        Invoke-WebRequest -Uri "$baseUrl/kvkk/01-retention-tombstone.mdc" -OutFile "$rulesDir\kvkk-retention-tombstone.mdc"
        Invoke-WebRequest -Uri "$baseUrl/kvkk/02-ui-consent-etk.mdc" -OutFile "$rulesDir\kvkk-ui-consent-etk.mdc"
    }
    { $_ -in "eu", "gdpr" } {
        Write-Host "⬇️  Avrupa Birliği GDPR & EAA Kuralları İndiriliyor..." -ForegroundColor Green
        Invoke-WebRequest -Uri "$baseUrl/gdpr/01-right-to-be-forgotten.mdc" -OutFile "$rulesDir\gdpr-right-to-be-forgotten.mdc"
        Invoke-WebRequest -Uri "$baseUrl/eaa-a11y/01-wcag-accessibility.mdc" -OutFile "$rulesDir\eaa-wcag-accessibility.mdc"
    }
    { $_ -in "us", "hipaa" } {
        Write-Host "⬇️  ABD HIPAA Kuralları İndiriliyor..." -ForegroundColor Green
        Invoke-WebRequest -Uri "$baseUrl/hipaa/01-phi-technical-safeguards.mdc" -OutFile "$rulesDir\hipaa-phi-technical-safeguards.mdc"
    }
    default {
        Write-Host "⬇️  Tüm Regülasyon Kuralları İndiriliyor..." -ForegroundColor Green
        Invoke-WebRequest -Uri "$baseUrl/kvkk/01-retention-tombstone.mdc" -OutFile "$rulesDir\kvkk-retention-tombstone.mdc"
        Invoke-WebRequest -Uri "$baseUrl/kvkk/02-ui-consent-etk.mdc" -OutFile "$rulesDir\kvkk-ui-consent-etk.mdc"
        Invoke-WebRequest -Uri "$baseUrl/gdpr/01-right-to-be-forgotten.mdc" -OutFile "$rulesDir\gdpr-right-to-be-forgotten.mdc"
        Invoke-WebRequest -Uri "$baseUrl/eaa-a11y/01-wcag-accessibility.mdc" -OutFile "$rulesDir\eaa-wcag-accessibility.mdc"
        Invoke-WebRequest -Uri "$baseUrl/hipaa/01-phi-technical-safeguards.mdc" -OutFile "$rulesDir\hipaa-phi-technical-safeguards.mdc"
    }
}

Write-Host "`n✅ Tamamlandı! Kurallar $rulesDir dizinine kaydedildi." -ForegroundColor Cyan
