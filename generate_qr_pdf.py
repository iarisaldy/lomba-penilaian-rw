import os
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# 1. Generate QR Code image
qr_url = "https://lomba-permata-discovery.vercel.app/"
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=2,
)
qr.add_data(qr_url)
qr.make(fit=True)

qr_img = qr.make_image(fill_color="#0F172A", back_color="white")
qr_img_path = "/tmp/lomba_qr_code.png"
qr_img.save(qr_img_path)

logo_path = "/Users/muhammadirfan/Documents/lomba/public/permata_logo.png"

# 2. Setup PDF Document
pdf_path = "/Users/muhammadirfan/Documents/lomba/Kartu_Akses_Juri_Lomba.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

# Custom Styles
header_title_style = ParagraphStyle(
    'HeaderTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=24,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

subtitle_style = ParagraphStyle(
    'SubTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=15,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#DC2626')
)

link_style = ParagraphStyle(
    'LinkStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#2563EB')
)

section_heading = ParagraphStyle(
    'SectionHeading',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=15,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#0F172A')
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor('#334155')
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.white
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=13,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

story = []

# Logo
if os.path.exists(logo_path):
    logo_img = Image(logo_path, width=180, height=48)
    logo_img.hAlign = 'CENTER'
    story.append(logo_img)
    story.append(Spacer(1, 6))

# Title & Subtitle
story.append(Paragraph("SISTEM PENILAIAN LOMBA RESMI", header_title_style))
story.append(Spacer(1, 3))
story.append(Paragraph("HUT KEMERDEKAAN RI • PERUMAHAN PERMATA DISCOVERY", subtitle_style))
story.append(Spacer(1, 8))

story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0F172A'), spaceBefore=0, spaceAfter=12))

# Scan QR Section Header
story.append(Paragraph("📱 SCAN QR CODE UNTUK MEMBUKA APLIKASI PENILAIAN", ParagraphStyle('CenteredHead', parent=section_heading, alignment=TA_CENTER)))
story.append(Spacer(1, 8))

# QR Code Image
img = Image(qr_img_path, width=160, height=160)
img.hAlign = 'CENTER'
story.append(img)
story.append(Spacer(1, 6))

# Link URL
story.append(Paragraph("Atau buka melalui Browser HP / Laptop:", ParagraphStyle('SubText', parent=body_style, alignment=TA_CENTER)))
story.append(Spacer(1, 3))
story.append(Paragraph("<u>https://lomba-permata-discovery.vercel.app/</u>", link_style))
story.append(Spacer(1, 12))

story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=0, spaceAfter=12))

# Table PIN Juri & Admin
story.append(Paragraph("🔑 DAFTAR PIN LOGIN JURI & ADMIN PANITIA", section_heading))
story.append(Spacer(1, 6))

table_data = [
    [
        Paragraph("Peran / Juri", table_header_style),
        Paragraph("Perwakilan", table_header_style),
        Paragraph("PIN Akses", table_header_style),
        Paragraph("Keterangan", table_header_style)
    ],
    [Paragraph("Juri RT 01", table_cell_bold), Paragraph("RT 01", table_cell_style), Paragraph("1111", table_cell_bold), Paragraph("Menilai RT 02 s/d RT 06", table_cell_style)],
    [Paragraph("Juri RT 02", table_cell_bold), Paragraph("RT 02", table_cell_style), Paragraph("2222", table_cell_bold), Paragraph("Menilai RT 01, 03 s/d 06", table_cell_style)],
    [Paragraph("Juri RT 03", table_cell_bold), Paragraph("RT 03", table_cell_style), Paragraph("3333", table_cell_bold), Paragraph("Menilai RT 01, 02, 04 s/d 06", table_cell_style)],
    [Paragraph("Juri RT 04", table_cell_bold), Paragraph("RT 04", table_cell_style), Paragraph("4444", table_cell_bold), Paragraph("Menilai RT 01 s/d 03, 05 s/d 06", table_cell_style)],
    [Paragraph("Juri RT 05", table_cell_bold), Paragraph("RT 05", table_cell_style), Paragraph("5555", table_cell_bold), Paragraph("Menilai RT 01 s/d 04, 06", table_cell_style)],
    [Paragraph("Juri RT 06", table_cell_bold), Paragraph("RT 06", table_cell_style), Paragraph("6666", table_cell_bold), Paragraph("Menilai RT 01 s/d 05", table_cell_style)],
    [Paragraph("Admin Rekap", ParagraphStyle('AdminTitle', parent=table_cell_bold, textColor=colors.HexColor('#DC2626'))), Paragraph("Panitia", table_cell_style), Paragraph("0000", ParagraphStyle('AdminPin', parent=table_cell_bold, textColor=colors.HexColor('#DC2626'))), Paragraph("Pantau Rekap & Cetak Pemenang", table_cell_style)],
]

col_widths = [100, 90, 80, 230]
t = Table(table_data, colWidths=col_widths)
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F8FAFC')]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FEF2F2')),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))

story.append(t)
story.append(Spacer(1, 10))

# Instructions Box
story.append(Paragraph("📌 PANDUAN RINGKAS PENILAIAN JURI:", section_heading))
story.append(Spacer(1, 4))

instructions_html = """
<b>1. Scan QR Code</b> di atas menggunakan Kamera HP atau WhatsApp.<br/>
<b>2. Masukkan PIN Login</b> sesuai Juri RT Anda (Contoh: Juri RT 01 = PIN 1111).<br/>
<b>3. Tekan (-) / (+) / Geser Slider</b> untuk memasukkan nilai per kriteria.<br/>
<b>4. Tekan '🔒 Kunci & Kirim'</b> jika sudah selesai menilai peserta tersebut.
"""
story.append(Paragraph(instructions_html, ParagraphStyle('InstructStyle', parent=body_style, leading=14)))

doc.build(story)
print("PDF successfully updated at:", pdf_path)
