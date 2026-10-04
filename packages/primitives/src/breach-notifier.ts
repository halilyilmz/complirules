/**
 * KVKK Madde 12/5 ve Kurul'un 24.01.2019 Tarihli ve 2019/10 Sayılı İlke Kararı ile
 * GDPR Madde 33 Uyumlu 72 Saatlik Kişisel Veri İhlal Bildirim Motoru
 */

export interface KurulBreachForm6Fields {
  /** 1. İhlalin gerçekleşme tarihi ve veri sorumlusunca öğrenilme tarihi */
  incidentDate: string;
  discoveryDate: string;

  /** 2. İhlalin kaynağı ve gerçekleşme şekli (Siber saldırı, cihaz kaybı, yetkisiz erişim vb.) */
  breachSourceAndNature: string;

  /** 3. İhlalden etkilenen kişisel veri kategorileri (Kimlik, iletişim, finansal vb.) */
  affectedDataCategories: string[];

  /** 4. İhlalden etkilenen tahmini ilgili kişi sayısı */
  approximateAffectedPersonsCount: number;

  /** 5. İhlalin olası sonuçları ve ilgili kişiler üzerindeki riskler */
  potentialConsequences: string;

  /** 6. İhlalin olumsuz etkilerini gidermek için alınan veya planlanan idari ve teknik tedbirler */
  administrativeAndTechnicalMeasures: string;
}

export interface BreachIncident {
  incidentId: string;
  title: string;
  discoveryTimestamp: number;
  deadlineTimestamp: number; // discovery + 72 hours
  isReportableToAuthority: boolean;
  justificationIfNotReported?: string;
  formDetails?: KurulBreachForm6Fields;
  status: 'DISCOVERED' | 'INVESTIGATING' | 'NOTIFIED_AUTHORITY' | 'NOTIFIED_DATA_SUBJECTS' | 'CLOSED';
}

export class BreachNotifier {
  private static readonly BREACH_WINDOW_HOURS = 72;
  private static readonly BREACH_WINDOW_MS = 72 * 60 * 60 * 1000;

  /**
   * Kurul 2019/10 sayılı İlke Kararı Formundaki 6 zorunlu alanın eksiksiz doldurulduğunu denetler.
   */
  static validateKurulForm(form: Partial<KurulBreachForm6Fields> = {}): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    const f = form ?? {};

    if (!f.incidentDate?.trim()) missingFields.push('field1_incidentDate (İhlalin gerçekleşme tarihi)');
    if (!f.discoveryDate?.trim()) missingFields.push('field1_discoveryDate (İhlalin öğrenilme tarihi)');
    if (!f.breachSourceAndNature?.trim()) missingFields.push('field2_breachSourceAndNature (İhlalin kaynağı ve gerçekleşme şekli)');
    if (!Array.isArray(f.affectedDataCategories) || f.affectedDataCategories.length === 0) {
      missingFields.push('field3_affectedDataCategories (Etkilenen kişisel veri kategorileri)');
    }
    if (typeof f.approximateAffectedPersonsCount !== 'number' || f.approximateAffectedPersonsCount < 0) {
      missingFields.push('field4_approximateAffectedPersonsCount (Etkilenen yaklaşık kişi sayısı)');
    }
    if (!f.potentialConsequences?.trim()) missingFields.push('field5_potentialConsequences (İhlalin olası sonuçları ve riskleri)');
    if (!f.administrativeAndTechnicalMeasures?.trim()) {
      missingFields.push('field6_administrativeAndTechnicalMeasures (Alınan ve planlanan idari/teknik tedbirler)');
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * İhlalin öğrenilme anından itibaren 72 saatlik geri sayımı hesaplar.
   */
  static calculateCountdown(
    discoveryTimestamp: number, 
    currentTimestamp = Date.now()
  ): {
    deadlineTimestamp: number;
    remainingHours: number;
    remainingMinutes: number;
    overdueHours: number;
    overdueMinutes: number;
    isOverdue: boolean;
  } {
    const deadlineTimestamp = discoveryTimestamp + this.BREACH_WINDOW_MS;
    const diffMs = deadlineTimestamp - currentTimestamp;
    const isOverdue = diffMs < 0;

    const remainingHours = isOverdue ? 0 : Math.floor(diffMs / (1000 * 60 * 60));
    const remainingMinutes = isOverdue ? 0 : Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const overdueHours = isOverdue ? Math.floor(Math.abs(diffMs) / (1000 * 60 * 60)) : 0;
    const overdueMinutes = isOverdue ? Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60)) : 0;

    return {
      deadlineTimestamp,
      remainingHours,
      remainingMinutes,
      overdueHours,
      overdueMinutes,
      isOverdue
    };
  }

  /**
   * KVKK Kurul Formu için 6 zorunlu alanı içeren resmi JSON bildirim yükünü üretir.
   */
  static generateKurulFormJson(params: {
    organizationName: string;
    contactPerson: string;
    contactEmail: string;
    form: KurulBreachForm6Fields;
  }): string {
    const validation = this.validateKurulForm(params.form);
    const countdown = this.calculateCountdown(new Date(params.form.discoveryDate).getTime());

    const payload = {
      legalBasis: '6698 Sayılı KVKK Madde 12/5 & Kurul Kararı 2019/10',
      documentTitle: 'Kişisel Veri İhlali Bildirim Formu',
      generatedAt: new Date().toISOString(),
      slaStatus: countdown.isOverdue ? 'OVERDUE_WARNING' : 'WITHIN_72H_DEADLINE',
      remainingHoursToSla: countdown.remainingHours,
      overdueHours: countdown.overdueHours,
      formValidation: {
        isComplete: validation.valid,
        missingMandatoryFields: validation.missingFields
      },
      dataController: {
        organizationName: params.organizationName,
        contactPerson: params.contactPerson,
        contactEmail: params.contactEmail
      },
      mandatoryFields: {
        field1_dates: {
          incidentDate: params.form.incidentDate,
          discoveryDate: params.form.discoveryDate
        },
        field2_natureAndSource: params.form.breachSourceAndNature,
        field3_affectedCategories: params.form.affectedDataCategories,
        field4_affectedPersonsCount: params.form.approximateAffectedPersonsCount,
        field5_potentialConsequences: params.form.potentialConsequences,
        field6_remedialMeasures: params.form.administrativeAndTechnicalMeasures
      }
    };

    return JSON.stringify(payload, null, 2);
  }
}

/**
 * Şirket içi İhlal Kayıt Defteri (Internal Incident Register - KVKK & GDPR Art. 33(5))
 * Kurul'a bildirilmeyecek küçük olaylar dahil tüm güvenlik olayları belgelenmelidir.
 */
export class InternalIncidentRegister {
  private incidents: BreachIncident[] = [];

  recordIncident(params: {
    title: string;
    discoveryDate?: Date;
    isReportable: boolean;
    justificationIfNotReported?: string;
    formDetails?: KurulBreachForm6Fields;
  }): BreachIncident {
    const discovery = params.discoveryDate ?? new Date();
    const discoveryTimestamp = discovery.getTime();
    const deadlineTimestamp = discoveryTimestamp + 72 * 60 * 60 * 1000;

    const incident: BreachIncident = {
      incidentId: `INC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: params.title,
      discoveryTimestamp,
      deadlineTimestamp,
      isReportableToAuthority: params.isReportable,
      justificationIfNotReported: params.justificationIfNotReported,
      formDetails: params.formDetails,
      status: 'DISCOVERED'
    };

    this.incidents.push(incident);
    return incident;
  }

  getIncidents(): BreachIncident[] {
    return [...this.incidents];
  }

  getReportablePendingIncidents(now = Date.now()): BreachIncident[] {
    return this.incidents.filter(
      i => i.isReportableToAuthority && i.status !== 'NOTIFIED_AUTHORITY' && i.status !== 'CLOSED'
    );
  }
}
