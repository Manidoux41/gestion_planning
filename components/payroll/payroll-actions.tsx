"use client";

import { useState } from "react";
import { Check, Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import type { PayrollSummary } from "@/lib/payroll";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value);
}

export function PayrollActions({ payroll }: { payroll: PayrollSummary }) {
  const [isPrepared, setIsPrepared] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    pdf.text("Calcul interne - Septembre 2026", left, top + 20);

    top += 39;
    pdf.setDrawColor(225, 232, 226);
    pdf.line(left, top, 190, top);
    pdf.setTextColor(55, 72, 62);
    pdf.setFontSize(11);
    pdf.text("Employeur", left, top + 12);
    pdf.text("Employée", 110, top + 12);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);
    pdf.text("Famille Martin", left, top + 20);
    pdf.text("Boneth Deap", 110, top + 20);
    pdf.text("12 rue des Lilas, Paris", left, top + 27);
    pdf.text("Nounou principale", 110, top + 27);

    top += 47;
    pdf.setTextColor(55, 72, 62);
    pdf.setFontSize(12);
    pdf.text("Detail du calcul", left, top);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);
    pdf.text(`Base mensuelle (${payroll.normalHours.toFixed(2)} h)`, left, top + 12);
    pdf.text(money(payroll.baseSalary), 160, top + 12);
    pdf.text(`Heures supplementaires (${payroll.overtimeHours.toFixed(2)} h)`, left, top + 21);
    pdf.text(money(payroll.overtimePay), 160, top + 21);
    pdf.text("Primes", left, top + 30);
    pdf.text(money(payroll.bonuses), 160, top + 30);
    pdf.text("Retenues", left, top + 39);
    pdf.text(`-${money(payroll.deductions)}`, 160, top + 39);
    pdf.setDrawColor(225, 232, 226);
    pdf.line(left, top + 46, 190, top + 46);
    pdf.setTextColor(49, 91, 76);
    pdf.setFontSize(13);
    pdf.text("Total estime a payer", left, top + 58);
    pdf.text(money(payroll.total), 160, top + 58);

    pdf.setFontSize(9);
    pdf.setTextColor(130, 143, 134);
    pdf.text("Contrat de reference : 35 h/semaine, 330 $/mois.", left, 260);
    pdf.text("Ce document est un calcul interne et ne constitue pas automatiquement une fiche de paie legale.", left, 268);
    pdf.save("fiche-remuneration-septembre-2026.pdf");
    setIsDownloading(false);
  }

  function preparePayroll() {
    setIsPrepared(true);
  }

  return <div className="payroll-actions"><button className="outline-button" onClick={downloadPdf} disabled={isDownloading}><Download size={15} /> {isDownloading ? "Génération..." : "Télécharger le PDF"}</button><button className={`primary-button ${isPrepared ? "prepared-button" : ""}`} onClick={preparePayroll}>{isPrepared ? <><Check size={16} /> Fiche préparée</> : <><FileText size={16} /> Préparer la fiche</>}</button>{isPrepared && <p className="action-success" role="status">La fiche est prête à être vérifiée.</p>}</div>;
}
