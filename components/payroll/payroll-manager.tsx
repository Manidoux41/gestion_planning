"use client";

import { useState, useTransition } from "react";
import { Check, DollarSign, Download, FileText, LockKeyhole, Plus, Trash2, Zap } from "lucide-react";
import { jsPDF } from "jspdf";
import { createSalaryAdvanceAction, deleteSalaryAdvanceAction } from "@/app/actions/payroll";
import type { PayrollSummary } from "@/lib/payroll";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value);
}

export type SerializedSalaryAdvance = {
  id: string;
  amount: number;
  date: string;
  notes: string | null;
};

type PayrollManagerProps = {
  nanny: {
    id: string;
    name: string;
    weeklyHours: number;
    monthlySalary: number;
    hourlyRate?: number | null;
  };
  familyName: string;
  initialPayroll: PayrollSummary;
  periodStart: string;
  periodEnd: string;
  advances: SerializedSalaryAdvance[];
  currency?: string;
};

export function PayrollManager({
  nanny,
  familyName,
  initialPayroll,
  periodStart,
  periodEnd,
  advances,
}: PayrollManagerProps) {
  const [advanceAmountInput, setAdvanceAmountInput] = useState("");
  const [advanceNotesInput, setAdvanceNotesInput] = useState("");
  const [advanceDateInput, setAdvanceDateInput] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Existing advances already saved in DB
  const existingAdvancesTotal = advances.reduce((sum, a) => sum + a.amount, 0);

  // Live parsed amount from the typing input ("dès la saisie des premiers chiffres")
  const parsedTypedAmount = parseFloat(advanceAmountInput.replace(",", "."));
  const liveTypedAdvance = !isNaN(parsedTypedAmount) && parsedTypedAmount > 0 ? parsedTypedAmount : 0;

  // Real-time recalculated payroll
  const liveTotalAdvance = existingAdvancesTotal + liveTypedAdvance;
  const earnedSalary = initialPayroll.baseSalary + initialPayroll.overtimePay;
  const liveNetToPay = earnedSalary + initialPayroll.bonuses - initialPayroll.deductions - liveTotalAdvance;

  const livePayroll: PayrollSummary = {
    ...initialPayroll,
    salaryAdvance: liveTotalAdvance,
    total: liveNetToPay,
  };

  const startDateFormatted = new Date(periodStart).toLocaleDateString("fr-FR");
  const endDateFormatted = new Date(new Date(periodEnd).getTime() - 86_400_000).toLocaleDateString("fr-FR");

  async function handleAddAdvance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.set("nannyId", nanny.id);

    startTransition(async () => {
      const res = await createSalaryAdvanceAction({ ok: false }, formData);
      if (!res.ok) {
        setFormError(res.error ?? "Erreur lors de l'enregistrement de l'avance.");
      } else {
        setFormSuccess("Avance sur salaire enregistrée avec succès.");
        setAdvanceAmountInput("");
        setAdvanceNotesInput("");
        setTimeout(() => setFormSuccess(null), 4000);
      }
    });
  }

  function handleDeleteAdvance(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette avance sur salaire ?")) return;
    setFormError(null);
    startTransition(async () => {
      const res = await deleteSalaryAdvanceAction(id);
      if (!res.ok) {
        setFormError(res.error ?? "Erreur lors de la suppression de l'avance.");
      }
    });
  }

  function downloadPdf() {
    setIsDownloading(true);
    const pdf = new jsPDF();
    const left = 20;
    let top = 24;

    pdf.setFillColor(49, 91, 76);
    pdf.rect(0, 0, 210, 17, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(15);
    pdf.text("Maison douce", left, 11);
    pdf.setTextColor(28, 39, 34);
    pdf.setFontSize(20);
    pdf.text("Releve de remuneration", left, top + 12);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);
    pdf.text(`Calcul interne - Du ${startDateFormatted} au ${endDateFormatted}`, left, top + 20);

    top += 39;
    pdf.setDrawColor(225, 232, 226);
    pdf.line(left, top, 190, top);
    pdf.setTextColor(55, 72, 62);
    pdf.setFontSize(11);
    pdf.text("Employeur", left, top + 12);
    pdf.text("Employée", 110, top + 12);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);
    pdf.text(familyName, left, top + 20);
    pdf.text(nanny.name, 110, top + 20);
    pdf.text("Paris", left, top + 27);
    pdf.text("Nounou principale", 110, top + 27);

    top += 47;
    pdf.setTextColor(55, 72, 62);
    pdf.setFontSize(12);
    pdf.text("Detail du calcul", left, top);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);

    let currentY = top + 12;
    pdf.text(`Base mensuelle (${livePayroll.normalHours.toFixed(2)} h)`, left, currentY);
    pdf.text(money(livePayroll.baseSalary), 160, currentY);

    currentY += 9;
    pdf.text(`Heures supplementaires (${livePayroll.overtimeHours.toFixed(2)} h)`, left, currentY);
    pdf.text(money(livePayroll.overtimePay), 160, currentY);

    currentY += 9;
    pdf.text("Salaire brut obtenu avec les heures effectuees", left, currentY);
    pdf.text(money(earnedSalary), 160, currentY);

    if (livePayroll.bonuses > 0) {
      currentY += 9;
      pdf.text("Primes", left, currentY);
      pdf.text(money(livePayroll.bonuses), 160, currentY);
    }

    if (livePayroll.deductions > 0) {
      currentY += 9;
      pdf.text("Retenues", left, currentY);
      pdf.text(`-${money(livePayroll.deductions)}`, 160, currentY);
    }

    if (livePayroll.salaryAdvance > 0) {
      currentY += 9;
      pdf.text("Avance sur salaire deduite", left, currentY);
      pdf.text(`-${money(livePayroll.salaryAdvance)}`, 160, currentY);
    }

    currentY += 7;
    pdf.setDrawColor(225, 232, 226);
    pdf.line(left, currentY, 190, currentY);

    currentY += 12;
    pdf.setTextColor(49, 91, 76);
    pdf.setFontSize(13);
    pdf.text("Total net a verser", left, currentY);
    pdf.text(money(livePayroll.total), 160, currentY);

    pdf.setFontSize(9);
    pdf.setTextColor(130, 143, 134);
    pdf.text(`Contrat de reference : ${nanny.weeklyHours} h/semaine, ${nanny.monthlySalary} $/mois.`, left, 260);
    pdf.text("Ce document est un calcul interne et ne constitue pas automatiquement une fiche de paie legale.", left, 268);
    pdf.save(`releve-remuneration-${nanny.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    setIsDownloading(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Rémunération</p>
          <h1>La paie</h1>
          <p className="page-subtitle">Un calcul interne transparent avec prise en compte des avances sur salaire.</p>
        </div>
        <div className="payroll-actions">
          <button type="button" className="outline-button" onClick={downloadPdf} disabled={isDownloading}>
            <Download size={15} /> {isDownloading ? "Génération..." : "Télécharger le PDF"}
          </button>
          <button
            type="button"
            className={`primary-button ${isPrepared ? "prepared-button" : ""}`}
            onClick={() => setIsPrepared(true)}
          >
            {isPrepared ? (
              <>
                <Check size={16} /> Fiche préparée
              </>
            ) : (
              <>
                <FileText size={16} /> Préparer la fiche
              </>
            )}
          </button>
          {isPrepared && <p className="action-success" role="status">La fiche est prête à être vérifiée.</p>}
        </div>
      </div>

      <div className="payroll-period">
        <div>
          <FileText size={19} />
          <span>Période de paie</span>
        </div>
        <strong>Du {startDateFormatted} au {endDateFormatted}</strong>
        <span className="status-pill">
          <span /> Brouillon
        </span>
      </div>

      <section className="payroll-layout">
        <div style={{ display: "grid", gap: 15 }}>
          {/* Detailed Period Calculation Card */}
          <article className="payroll-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Détail du calcul</p>
                <h2>Résumé de la période</h2>
              </div>
              <LockKeyhole size={17} color="#9aa59d" />
            </div>

            <div className="payroll-lines">
              <div>
                <span>
                  Salaire mensuel de base{" "}
                  <small>
                    {livePayroll.plannedHours.toFixed(2)}h prévues (proratisées) · {livePayroll.normalHours.toFixed(2)}h pointées et validées · {livePayroll.hourlyEquivalent.toFixed(2)} $/h équivalent
                  </small>
                </span>
                <strong>{money(livePayroll.baseSalary)}</strong>
              </div>

              <div>
                <span>
                  Heures supplémentaires <small>{livePayroll.overtimeHours.toFixed(2)}h × 125%</small>
                </span>
                <strong>{money(livePayroll.overtimePay)}</strong>
              </div>

              {/* Subtotal earned from worked hours */}
              <div className="payroll-subtotal-line">
                <span>
                  Salaire obtenu avec les heures effectuées{" "}
                  <small>Base validée + Heures supplémentaires</small>
                </span>
                <strong>{money(earnedSalary)}</strong>
              </div>

              {livePayroll.bonuses > 0 && (
                <div>
                  <span>Primes</span>
                  <strong>{money(livePayroll.bonuses)}</strong>
                </div>
              )}

              {livePayroll.deductions > 0 && (
                <div>
                  <span>Autres retenues</span>
                  <strong>-{money(livePayroll.deductions)}</strong>
                </div>
              )}

              {/* Salary Advance deduction line */}
              <div className="payroll-advance-line">
                <span>
                  Avance sur salaire déduite
                  {liveTypedAdvance > 0 ? (
                    <small style={{ color: "#b3543d" }}>
                      {existingAdvancesTotal > 0 ? `${money(existingAdvancesTotal)} enregistrés + ` : ""}
                      {money(liveTypedAdvance)} en cours de saisie (aperçu direct)
                    </small>
                  ) : existingAdvancesTotal > 0 ? (
                    <small>{advances.length} avance(s) enregistrée(s) ce mois-ci</small>
                  ) : (
                    <small>Aucune avance déduite</small>
                  )}
                </span>
                <strong>{liveTotalAdvance > 0 ? `-${money(liveTotalAdvance)}` : "0,00 $"}</strong>
              </div>

              <div className="total-line">
                <span>
                  Total net restant à verser{" "}
                  <small>
                    {liveNetToPay < 0
                      ? "Avance supérieure au salaire gagné pour le moment"
                      : "Salaire des heures effectuées déduit des avances"}
                  </small>
                </span>
                <strong style={{ color: liveNetToPay < 0 ? "#b3543d" : undefined }}>{money(liveNetToPay)}</strong>
              </div>
            </div>
          </article>

          {/* Salary Advance Management Card (Family / Admin Only) */}
          <article className="payroll-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Gestion administrative</p>
                <h2>Avance sur salaire</h2>
              </div>
              <DollarSign size={18} color="#4e7b68" />
            </div>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Notez le montant de l&apos;avance accordée à l&apos;employée. Le salaire net restant est <strong>recalculé immédiatement dès la saisie</strong>.
            </p>

            {formError && <p className="form-error" style={{ marginTop: 10 }}>{formError}</p>}
            {formSuccess && <p className="action-success" style={{ marginTop: 10, fontSize: 12 }}>{formSuccess}</p>}

            <form onSubmit={handleAddAdvance} className="advance-form">
              <div className="advance-input-row">
                <label>
                  Montant de l&apos;avance ($) *
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex : 50"
                    value={advanceAmountInput}
                    onChange={(e) => setAdvanceAmountInput(e.target.value)}
                    autoComplete="off"
                  />
                </label>

                <label>
                  Date du versement
                  <input
                    type="date"
                    name="date"
                    value={advanceDateInput}
                    onChange={(e) => setAdvanceDateInput(e.target.value)}
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: 5, color: "#5a6b60", fontSize: 11, fontWeight: 600 }}>
                Motif ou note (optionnel)
                <input
                  type="text"
                  name="notes"
                  placeholder="Ex : Acompte demandé pour imprévu"
                  value={advanceNotesInput}
                  onChange={(e) => setAdvanceNotesInput(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    color: "#3b4c41",
                    fontSize: 13,
                  }}
                />
              </label>

              {liveTypedAdvance > 0 && (
                <div className="advance-badge-live">
                  <Zap size={14} />
                  <span>
                    Aperçu immédiat : Déduction de <strong>{money(liveTypedAdvance)}</strong> appliquée en direct sur le salaire
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isPending || !advanceAmountInput || liveTypedAdvance <= 0}
                >
                  <Plus size={16} />
                  {isPending ? "Enregistrement..." : "Enregistrer l'avance"}
                </button>
              </div>
            </form>

            {/* List of advances recorded in this month */}
            <div className="advance-section">
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Historique des avances pour ce mois ({advances.length})
              </p>

              {advances.length === 0 ? (
                <p className="page-subtitle" style={{ fontSize: 12 }}>
                  Aucune avance sur salaire n&apos;a encore été enregistrée pour cette période.
                </p>
              ) : (
                <div className="advances-list">
                  {advances.map((adv) => (
                    <div key={adv.id} className="advance-item">
                      <div className="advance-item-info">
                        <b>{new Date(adv.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</b>
                        <small>{adv.notes ? adv.notes : "Avance sur salaire"}</small>
                      </div>
                      <div className="advance-item-amount">
                        <strong>-{money(adv.amount)}</strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdvance(adv.id)}
                          disabled={isPending}
                          title="Supprimer cette avance"
                          aria-label="Supprimer cette avance"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Right Aside: Net summary card */}
        <aside className="payroll-total">
          <p className="eyebrow">Net estimé à verser</p>
          <strong style={{ transition: "all 0.2s ease", color: liveNetToPay < 0 ? "#b3543d" : undefined }}>
            {money(liveNetToPay)}
          </strong>
          
          <div style={{ display: "grid", gap: 3, margin: "10px 0 16px", color: "#617d6a", fontSize: 11 }}>
            <span>Gagné (heures) : <b>{money(earnedSalary)}</b></span>
            {liveTotalAdvance > 0 && (
              <span style={{ color: "#b3543d" }}>Avance déduite : <b>-{money(liveTotalAdvance)}</b></span>
            )}
            {liveNetToPay < 0 && (
              <span style={{ color: "#b3543d", fontSize: 10, fontWeight: 600, marginTop: 4 }}>
                Solde négatif (reliquat à compenser)
              </span>
            )}
          </div>

          <span>{nanny.weeklyHours}h/semaine · {nanny.monthlySalary} $/mois</span>

          <div style={{ width: "100%", marginTop: 24 }}>
            <button
              type="button"
              className="outline-button"
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
              onClick={downloadPdf}
              disabled={isDownloading}
            >
              <Download size={15} /> {isDownloading ? "Génération..." : "Télécharger le PDF"}
            </button>
          </div>
        </aside>
      </section>

      <p className="legal-note">
        Ce calcul prend en compte les pointages réellement effectués par l&apos;employée et validés par la famille, déduits des avances sur salaire accordées. Ce document est un calcul interne et ne constitue pas automatiquement une fiche de paie légale.
      </p>
    </>
  );
}
