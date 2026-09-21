from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

out = Path("output/pdf/Fairwork-Pulse-Synthetic-Haki-Dossier.pdf")
out.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleFP", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=colors.HexColor("#171817"), spaceAfter=8))
styles.add(ParagraphStyle(name="SectionFP", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=colors.HexColor("#171817"), spaceBefore=14, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallFP", parent=styles["BodyText"], fontSize=8.5, leading=12, textColor=colors.HexColor("#5f645f")))
styles.add(ParagraphStyle(name="DemoFP", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=colors.HexColor("#6c5900"), alignment=TA_CENTER, backColor=colors.HexColor("#fff2b3"), borderPadding=7, spaceAfter=14))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#747873"))
    canvas.drawString(42, 28, "Fairwork Pulse - synthetic demonstration dossier")
    canvas.drawRightString(A4[0] - 42, 28, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=46, title="Synthetic Haki Dossier")
story = [
    Paragraph("Fairwork Pulse", styles["TitleFP"]),
    Paragraph("Haki Dossier - worker-prepared record", styles["Heading3"]),
    Spacer(1, 8),
    Paragraph("SYNTHETIC DEMO - all names, events, amounts, and evidence references in this file are fictional.", styles["DemoFP"]),
    Paragraph("Worker details", styles["SectionFP"]),
    Table([["Name", "Amina M."], ["Location", "Nairobi"], ["Work sector", "Construction and artisans"]], colWidths=[130, 350], style=[("FONTNAME", (0,0), (-1,-1), "Helvetica"), ("FONTSIZE", (0,0), (-1,-1), 10), ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#747873")), ("LINEBELOW", (0,0), (-1,-1), .4, colors.HexColor("#e8e7e3")), ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8)]),
    Paragraph("Payment summary", styles["SectionFP"]),
    Table([["Recorded unpaid agreed amount", "KSh 600"], ["Estimated additional entitlement", "KSh 563 - NEEDS REVIEW"]], colWidths=[330, 150], style=[("FONTNAME", (0,0), (-1,-1), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,-1), 11), ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f7f7f4")), ("BACKGROUND", (0,1), (-1,1), colors.HexColor("#fff8d7")), ("BOX", (0,0), (-1,-1), .5, colors.HexColor("#d8dad3")), ("INNERGRID", (0,0), (-1,-1), .5, colors.HexColor("#e8e7e3")), ("TOPPADDING", (0,0), (-1,-1), 10), ("BOTTOMPADDING", (0,0), (-1,-1), 10)]),
    Paragraph("Work and payment timeline", styles["SectionFP"]),
]

rows = [["Date and work", "Agreed", "Paid", "Gap", "Estimate"]]
rows += [["18 Sep 2026\nKaribu Builders\n07:30-17:30", "1,200", "1,000", "200", "450"], ["17 Sep 2026\nKaribu Builders\n08:00-16:30", "1,200", "1,200", "0", "113"], ["14 Sep 2026\nMaua Contractors\n08:00-15:00", "1,100", "700", "400", "0"]]
timeline = Table(rows, colWidths=[200, 70, 70, 60, 80], repeatRows=1)
timeline.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#171817")), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTNAME", (0,1), (-1,-1), "Helvetica"), ("FONTSIZE", (0,0), (-1,-1), 8.5), ("GRID", (0,0), (-1,-1), .5, colors.HexColor("#d8dad3")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8)]))
story += [timeline, Paragraph("Recorded gap = agreed pay minus payment recorded, never below zero. Estimates use entered hours and the stated multiplier. Breaks, occupation, location, and the applicable wage order require review.", styles["SmallFP"]), PageBreak(), Paragraph("Reported incident", styles["SectionFP"]), Paragraph("16 Sep 2026 - Wage concern", styles["Heading3"]), Paragraph("Worker reports that KSh 400 was withheld for lunch and site transport that was not agreed in writing.", styles["BodyText"]), Paragraph("Evidence index", styles["SectionFP"]), Paragraph("No image is embedded in this synthetic dossier. For the live demonstration, attach the prepared synthetic payment image and verify that its filename, capture date, and SHA-256 integrity hash appear here.", styles["SmallFP"]), Paragraph("Prepare for assistance", styles["SectionFP"]), Paragraph("1. Confirm dates, times, breaks, and amounts with the worker.<br/>2. Bring original messages, receipts, photographs, and witness details where available.<br/>3. Ask an adviser which current wage order and remedy process applies.", styles["BodyText"]), Paragraph("Calculation notes", styles["SectionFP"]), Paragraph("Rule references: EMP-17-19 and WAGES-R5-6. Source register checked 21 September 2026. Employment Act, 2007: https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2012-01-02", styles["SmallFP"]), Spacer(1, 18), Paragraph("This dossier organizes worker-provided information. It does not determine liability, guarantee admissibility, or replace legal advice.", styles["DemoFP"])]
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out.resolve())
