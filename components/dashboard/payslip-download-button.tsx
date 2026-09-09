"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import type { PayrollSummary } from "@/lib/payroll";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value);
}

export function PayslipDownloadButton({ payroll, nannyName, familyName }: { payroll: PayrollSummary; nannyName: string; familyName: string }) {
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
    pdf.text("Bulletin de salaire (previsionnel)", left, top + 12);
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
    pdf.text(familyName, left, top + 20);
    pdf.text(nannyName, 110, top + 20);

    top += 40;
    pdf.setTextColor(55, 72, 62);
    pdf.setFontSize(12);
    pdf.text("Detail du calcul", left, top);
    pdf.setFontSize(10);
    pdf.setTextColor(105, 119, 109);
    pdf.text(`Base mensuelle (${payroll.normalHours.toFixed(2)} h)`, left, top + 12);
    pdf.text(money(payroll.baseSalary), 160, top + 12);
    pdf.text(`Heures supplementaires (${payroll.overtimeHours.toFixed(2)} h)`, left, top + 21);
    pdf.text(money(payroll.overtimePay), 160, top + 21);
    pdf.setDrawColor(225, 232, 226);
    pdf.line(left, top + 30, 190, top + 30);
    pdf.setTextColor(49, 91, 76);
    pdf.setFontSize(13);
    pdf.text("Total estime a payer", left, top + 42);
    pdf.text(money(payroll.total), 160, top + 42);

    pdf.setFontSize(9);
    pdf.setTextColor(130, 143, 134);
    pdf.text("Document previsionnel : ne constitue pas une fiche de paie legale.", left, 270);
    pdf.save("bulletin-salaire-previsionnel.pdf");
    setIsDownloading(false);
  }

  return <button type="button" className="outline-button" onClick={downloadPdf} disabled={isDownloading}><Download size={15} /> {isDownloading ? "Génération..." : "Télécharger mon bulletin"}</button>;
}
