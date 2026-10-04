/**
 * KVKK Madde 11 & 13 ve Başvuru Usul Tebliği Md. 5/2 ile GDPR Madde 12 & 17 Uyumlu
 * Veri Sahibi Başvuru (Data Subject Request - DSR) Bilet Yönetim Motoru
 */

export type DsrRequestType = 
  | 'INFORMATION'   // Bilgi edinme (KVKK Md. 11/1-a, b)
  | 'ACCESS'        // Veriye erişim (GDPR Art. 15)
  | 'RECTIFICATION' // Düzeltme (KVKK Md. 11/1-d, GDPR Art. 16)
  | 'ERASURE'       // Silme/Yok etme/Unutulma (KVKK Md. 11/1-e, GDPR Art. 17)
  | 'PORTABILITY'   // Veri taşınabilirliği (GDPR Art. 20)
  | 'OBJECTION';    // İtiraz / Otomatik karar itirazı (KVKK Md. 11/1-g)

export type DsrTicketStatus = 
  | 'RECEIVED'      // Başvuru alındı
  | 'UNDER_REVIEW'  // Hukuk / Uyum ekibi incelemesinde
  | 'PROCESSING'    // Teknik veri silme/düzeltme işleminde
  | 'COMPLETED'     // Talebe olumlu yanıt verildi ve sonuçlandırıldı
  | 'REJECTED';     // Gerekçeli olarak reddedildi

export interface KvkkDsrApplicantPayload {
  fullName: string;
  tcknOrPassport: string;
  notificationAddress: string;
  emailOrPhone: string;
  requestSubject: string;
  signatureVerified: boolean;
}

export interface DsrTicket {
  ticketId: string;
  jurisdiction: 'KVKK_TR' | 'GDPR_EU';
  requestType: DsrRequestType;
  status: DsrTicketStatus;
  applicant: KvkkDsrApplicantPayload;
  receivedAt: string;
  deadlineDate: string;
  isOverdue: boolean;
  remainingDays: number;
  downstreamProcessorsNotified: boolean;
  notifiedProcessors: string[];
  resolutionNotes?: string;
  isExtended?: boolean;
  extensionJustification?: string;
}

export class DsrEngine {
  /**
   * Tebliğ Md. 5/2'de belirtilen zorunlu başvuru unsurlarını doğrular:
   * Ad, soyad, TCKN (veya pasaport), tebligat adresi, e-posta/telefon ve talep konusu.
   */
  static validateKvkkApplicantPayload(payload: Partial<KvkkDsrApplicantPayload> = {}): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    const p = payload ?? {};

    if (!p.fullName?.trim()) missingFields.push('fullName (Ad Soyad)');
    if (!p.tcknOrPassport?.trim()) missingFields.push('tcknOrPassport (TCKN veya Pasaport No)');
    if (!p.notificationAddress?.trim()) missingFields.push('notificationAddress (Tebligata Esas Adres)');
    if (!p.emailOrPhone?.trim()) missingFields.push('emailOrPhone (Bildirime Esas E-posta veya Telefon)');
    if (!p.requestSubject?.trim()) missingFields.push('requestSubject (Talep Konusu)');

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * KVKK Md. 13 (Kesin 30 gün) veya GDPR Art. 12 (1 ay) uyarınca yeni bir DSR bileti oluşturur.
   */
  static createTicket(params: {
    jurisdiction?: 'KVKK_TR' | 'GDPR_EU';
    requestType: DsrRequestType;
    applicant: KvkkDsrApplicantPayload;
    receivedDate?: Date;
    currentDate?: Date;
  }): DsrTicket {
    const jurisdiction = params.jurisdiction ?? 'KVKK_TR';
    const receivedDate = params.receivedDate ?? new Date();
    
    // KVKK Md. 13: Kesin olarak 30 gün (bu süre uzatılamaz!)
    const deadline = new Date(receivedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = params.currentDate ?? new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      ticketId: `DSR-${jurisdiction}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      jurisdiction,
      requestType: params.requestType,
      status: 'RECEIVED',
      applicant: params.applicant,
      receivedAt: receivedDate.toISOString(),
      deadlineDate: deadline.toISOString(),
      isOverdue: diffMs < 0,
      remainingDays: Math.max(0, remainingDays),
      downstreamProcessorsNotified: false,
      notifiedProcessors: []
    };
  }

  /**
   * GDPR Madde 12(3) uyarınca karmaşık taleplerde süreyi 2 aya kadar uzatır.
   * KVKK Madde 13'te süre uzatımı bulunmadığı için KVKK biletlerinde HATA FIRLATIR.
   */
  static extendTicketDeadline(
    ticket: DsrTicket, 
    justification: string, 
    extensionDays = 60,
    currentDate = new Date()
  ): DsrTicket {
    if (ticket.jurisdiction === 'KVKK_TR') {
      throw new Error('KVKK_NON_EXTENDABLE: KVKK Madde 13 gereğince 30 günlük yasal süre kesin olup hiçbir şekilde uzatılamaz!');
    }

    if (ticket.isExtended) {
      throw new Error('GDPR_EXTENSION_ALREADY_APPLIED: GDPR Article 12(3) uyarınca ek süre yalnızca bir defaya mahsus (en fazla 2 ay) uygulanabilir.');
    }

    if (!justification || justification.trim().length < 10) {
      throw new Error('GDPR_JUSTIFICATION_REQUIRED: Süre uzatımı için gerekçe en az 10 karakter olmalıdır (GDPR Art. 12(3)).');
    }

    const currentDeadline = new Date(ticket.deadlineDate);
    const newDeadline = new Date(currentDeadline.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    const diffMs = newDeadline.getTime() - currentDate.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      ...ticket,
      deadlineDate: newDeadline.toISOString(),
      isExtended: true,
      extensionJustification: justification.trim(),
      remainingDays: Math.max(0, remainingDays),
      isOverdue: diffMs < 0
    };
  }

  /**
   * Bilet durumunu günceller.
   */
  static updateStatus(
    ticket: DsrTicket, 
    newStatus: DsrTicketStatus, 
    resolutionNotes?: string
  ): DsrTicket {
    return {
      ...ticket,
      status: newStatus,
      resolutionNotes: resolutionNotes ?? ticket.resolutionNotes
    };
  }

  /**
   * KVKK Madde 11/1-f ve GDPR Madde 19:
   * Kişisel verilerin düzeltilmesi veya silinmesi durumunda, verilerin aktarıldığı
   * üçüncü kişilere (CRM, e-posta sağlayıcı, bulut yedekleri vb.) bildirim yapılması (Downstream Notification).
   */
  static notifyDownstreamProcessors(
    ticket: DsrTicket, 
    processors: string[]
  ): DsrTicket {
    return {
      ...ticket,
      downstreamProcessorsNotified: true,
      notifiedProcessors: Array.from(new Set([...ticket.notifiedProcessors, ...processors]))
    };
  }

  /**
   * Kalan süreyi ve yasal SLA aşım durumunu hesaplar.
   */
  static calculateRemainingSla(deadlineDate: string, currentDate = new Date()): {
    remainingDays: number;
    isOverdue: boolean;
  } {
    const deadline = new Date(deadlineDate);
    const diffMs = deadline.getTime() - currentDate.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      remainingDays: Math.max(0, remainingDays),
      isOverdue: diffMs < 0
    };
  }
}
