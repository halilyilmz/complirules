// Compliant Signup Form (KVKK, ETK & EAA 2025 Standard)
import React, { useState } from 'react';

export function CompliantSignupForm() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  return (
    <form className="space-y-4 max-w-md mx-auto p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
          E-posta Adresi
        </label>
        <input 
          id="email" 
          type="email" 
          required 
          className="w-full mt-1 px-3 py-2 border rounded-md focus-visible:outline-2 focus-visible:outline-blue-600" 
        />
      </div>

      {/* KVKK Aydınlatma Metni: Bilgilendirme metnidir, onay kutusu gerektirmez */}
      <p className="text-xs text-neutral-600">
        Kişisel verileriniz{" "}
        <a href="/kvkk-aydinlatma" target="_blank" className="text-blue-600 underline hover:text-blue-800">
          KVKK Aydınlatma Metni
        </a>{" "}
        kapsamında güvenle işlenmektedir.
      </p>

      {/* 1. Zorunlu Sözleşme Onayı (Sözleşmenin İfası, Açık Rıza Değildir) */}
      <label className="flex items-start gap-2.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          required
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
        />
        <span>
          <a href="/terms" target="_blank" className="underline font-medium">Kullanıcı Sözleşmesini</a> okudum ve kabul ediyorum.
        </span>
      </label>

      {/* 2. İhtiyari ETK / Pazarlama İzni (ZORUNLU DEĞİL, DEFAULT CHECKED FALSE) */}
      <label className="flex items-start gap-2.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
        />
        <span className="text-neutral-700">
          Kampanya, promosyon ve bülten iletilerini SMS ve E-posta ile almayı kabul ediyorum. (İsteğe bağlı)
        </span>
      </label>

      {/* EAA 2025 Erişilebilir Buton: Min 44x44px dokunma alanı ve belirgin odak halkası */}
      <button
        type="submit"
        aria-label="Hesap Oluştur ve Devam Et"
        className="min-h-[44px] w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 transition"
      >
        Hesap Oluştur
      </button>
    </form>
  );
}
