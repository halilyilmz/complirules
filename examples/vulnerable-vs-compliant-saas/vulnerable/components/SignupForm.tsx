// Vulnerable Signup Form
import React from 'react';

export function SignupForm() {
  return (
    <form className="space-y-4">
      <input type="email" placeholder="E-posta" />
      <input type="password" placeholder="Şifre" />

      {/* TEHLİKELİ HATA 1: defaultChecked={true} (Pre-ticked box / Dark Pattern) */}
      {/* TEHLİKELİ HATA 2: Bundled Consent (Kullanıcı sözleşmesi ile pazarlama izni tek kutuda birleştirilmiş) */}
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked={true} required />
        <span>Kullanıcı sözleşmesini ve kampanya e-postalarını kabul ediyorum.</span>
      </label>

      {/* TEHLİKELİ HATA 3: outline: none (Klavye odak halkası yok) ve buton içinde aria-label yok */}
      <button style={{ outline: 'none' }}>
        <svg><path d="M0 0h24v24H0z" /></svg>
      </button>
    </form>
  );
}
