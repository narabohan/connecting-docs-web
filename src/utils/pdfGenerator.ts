import { jsPDF } from 'jspdf';
import { LanguageCode } from './translations';

interface PatientPDFData {
    patientName: string;
    language: LanguageCode;
    clinicalSummary: string;
    recommendations: Array<{
        rank: number;
        name: string;
        matchScore: number;
        composition: string[];
        description: string;
        tags: string[];
    }>;
    alignmentScore: number;
}

interface DoctorPDFData {
    patientName: string;
    language: LanguageCode;
    patientProfile: {
        primaryIndication: string;
        secondaryIndication: string;
        painTolerance: string;
        downtimeTolerance: string;
        skinThickness?: string;
    };
    riskFactors: {
        hasMelasma?: boolean;
        acneStatus?: string;
        poreType?: string;
    };
    recommendations: Array<{
        rank: number;
        name: string;
        matchScore: number;
        composition: string[];
        description: string;
        targetLayers?: string | string[];
        faceZones?: string[];
    }>;
    clinicalSummary: string;
}

/**
 * Generate Patient Summary PDF (1 Page)
 * - Clinical Summary
 * - Top 3 Recommendations
 * - Device & Skin Booster Details
 * - CTA to visit ConnectingDocs for full details
 */
export function generatePatientPDF(data: PatientPDFData): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Header
    doc.setFillColor(0, 255, 160);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(3, 6, 10);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ConnectingDocs', margin, 8);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Clinical Intelligence Report', pageWidth - margin, 8, { align: 'right' });

    yPos = 25;

    // Patient Name & Score
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Clinical Report: ${data.patientName}`, margin, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 255, 160);
    doc.text(`Alignment Score: ${data.alignmentScore}%`, margin, yPos);

    yPos += 12;

    // Clinical Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Analysis Summary', margin, yPos);

    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const summaryLines = doc.splitTextToSize(data.clinicalSummary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 4) + 8;

    // Top 3 Recommendations
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 3 Recommended Protocols', margin, yPos);
    yPos += 8;

    data.recommendations.slice(0, 3).forEach((rec, index) => {
        // Rank Badge
        if (index === 0) {
            doc.setFillColor(0, 255, 160);
        } else {
            doc.setFillColor(200, 200, 200);
        }
        doc.roundedRect(margin, yPos - 4, 8, 6, 1, 1, 'F');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${rec.rank}`, margin + 4, yPos, { align: 'center' });

        // Protocol Name
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(rec.name, margin + 12, yPos);

        // Match Score
        doc.setFontSize(9);
        doc.setTextColor(0, 255, 160);
        doc.text(`${rec.matchScore}% Match`, pageWidth - margin, yPos, { align: 'right' });

        yPos += 5;

        // Devices/Composition
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        const devices = rec.composition.join(', ');
        doc.text(`Devices: ${devices}`, margin + 12, yPos);

        yPos += 4;

        // Description
        const descLines = doc.splitTextToSize(rec.description, contentWidth - 15);
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(descLines, margin + 12, yPos);
        yPos += (descLines.length * 3.5) + 6;

        // Divider
        if (index < 2) {
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 4;
        }
    });

    // CTA Section
    yPos += 8;
    doc.setFillColor(240, 255, 250);
    doc.roundedRect(margin, yPos - 4, contentWidth, 25, 2, 2, 'F');

    yPos += 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 80);
    doc.text('View Full Details & Book Consultation', margin + 5, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('For comprehensive analysis, face simulation, and doctor matching,', margin + 5, yPos);

    yPos += 4;
    doc.text('visit your personalized dashboard at ConnectingDocs.com', margin + 5, yPos);

    yPos += 6;
    doc.setTextColor(0, 180, 140);
    doc.setFont('helvetica', 'bold');
    doc.text('connectingdocs.com/dashboard', margin + 5, yPos);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by ConnectingDocs AI Intelligence Engine', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`ConnectingDocs_Report_${data.patientName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate Doctor Clinical Summary PDF (1 Page)
 * - Patient Profile & Indications
 * - Risk Factors
 * - Top 3 Protocol Recommendations with Device Logic
 */
export function generateDoctorPDF(data: DoctorPDFData): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Header
    doc.setFillColor(0, 255, 160);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(3, 6, 10);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ConnectingDocs', margin, 8);

    doc.setFontSize(10);
    doc.text('Clinical Intelligence Panel - Doctor View', pageWidth - margin, 8, { align: 'right' });

    yPos = 25;

    // Patient Name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${data.patientName}`, margin, yPos);

    yPos += 12;

    // Patient Profile Section
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos - 4, contentWidth, 32, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Patient Clinical Profile', margin + 3, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const profileItems = [
        `Primary Indication (70%): ${data.patientProfile.primaryIndication}`,
        `Secondary Indication (30%): ${data.patientProfile.secondaryIndication}`,
        `Pain Tolerance: ${data.patientProfile.painTolerance}`,
        `Downtime Tolerance: ${data.patientProfile.downtimeTolerance}`,
    ];

    if (data.patientProfile.skinThickness) {
        profileItems.push(`Skin Thickness: ${data.patientProfile.skinThickness}`);
    }

    profileItems.forEach(item => {
        doc.text(`• ${item}`, margin + 5, yPos);
        yPos += 4.5;
    });

    yPos += 8;

    // Risk Factors Section
    doc.setFillColor(255, 245, 230);
    doc.roundedRect(margin, yPos - 4, contentWidth, 18, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 100, 0);
    doc.text('⚠ Precautionary Risk Flags', margin + 3, yPos);

    yPos += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 60, 0);

    const riskItems = [];
    if (data.riskFactors.hasMelasma) {
        riskItems.push('Melasma: Modify heat delivery to prevent PIH');
    }
    if (data.riskFactors.acneStatus) {
        riskItems.push(`Acne: ${data.riskFactors.acneStatus}`);
    }
    if (data.riskFactors.poreType) {
        riskItems.push(`Pore Type: ${data.riskFactors.poreType}`);
    }

    if (riskItems.length === 0) {
        doc.text('No major risk flags detected', margin + 5, yPos);
        yPos += 4;
    } else {
        riskItems.forEach(item => {
            doc.text(`• ${item}`, margin + 5, yPos);
            yPos += 4;
        });
    }

    yPos += 10;

    // Clinical Reasoning
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Clinical Reasoning', margin, yPos);

    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const reasoningLines = doc.splitTextToSize(data.clinicalSummary, contentWidth);
    doc.text(reasoningLines, margin, yPos);
    yPos += (reasoningLines.length * 3.5) + 8;

    // Top 3 Protocols with Device Logic
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Recommended Protocol Stack', margin, yPos);
    yPos += 7;

    data.recommendations.slice(0, 3).forEach((rec, index) => {
        // Protocol Header
        if (index === 0) {
            doc.setFillColor(0, 255, 160);
        } else {
            doc.setFillColor(230, 230, 230);
        }
        doc.roundedRect(margin, yPos - 3.5, 6, 5, 0.5, 0.5, 'F');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${rec.rank}`, margin + 3, yPos, { align: 'center' });

        doc.setFontSize(10);
        doc.text(rec.name, margin + 9, yPos);

        doc.setFontSize(8);
        doc.setTextColor(0, 180, 140);
        doc.text(`${rec.matchScore}%`, pageWidth - margin, yPos, { align: 'right' });

        yPos += 5;

        // Device Logic
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');

        const devices = rec.composition.join(', ');
        doc.text(`Devices: ${devices}`, margin + 9, yPos);
        yPos += 3.5;

        if (rec.targetLayers) {
            const layers = Array.isArray(rec.targetLayers) ? rec.targetLayers.join(', ') : rec.targetLayers;
            doc.text(`Target Layers: ${layers}`, margin + 9, yPos);
            yPos += 3.5;
        }

        if (rec.faceZones && rec.faceZones.length > 0) {
            doc.text(`Face Zones: ${rec.faceZones.join(', ')}`, margin + 9, yPos);
            yPos += 3.5;
        }

        yPos += 3;

        // Divider
        if (index < 2 && yPos < 260) {
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
            yPos += 3;
        }
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('ConnectingDocs Clinical Intelligence Engine - Doctor Portal', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`ConnectingDocs_Clinical_${data.patientName.replace(/\s+/g, '_')}.pdf`);
}
