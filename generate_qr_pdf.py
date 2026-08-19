import os
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# 1. Generate QR Code image
qr_url = "https://lomba-permata-discovery.netlify.app/"
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

base_dir = os.path.dirname(os.path.abspath(__file__))
logo_path = os.path.join(base_dir, "public", "permata_logo.png")

# 2. Setup PDF Document
pdf_path = os.path.join(base_dir, "Kartu_Akses_Juri_Lomba.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=28,
    bottomMargin=28
)

styles = getSampleStyleSheet()

# Custom Styles
header_title_style = ParagraphStyle(
    'HeaderTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=17,
    leading=21,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

subtitle_style = ParagraphStyle(
    'SubTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#DC2626')
)

link_style = ParagraphStyle(
    'LinkStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=16,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#2563EB')
)

section_heading = ParagraphStyle(
    'SectionHeading',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=13,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#0F172A')
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=11.5,
    textColor=colors.HexColor('#334155')
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=11,
    alignment=TA_CENTER,
    textColor=colors.white
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=10.5,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9.5,
    leading=11.5,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#0F172A')
)

story = []

# Logo
if os.path.exists(logo_path):
    logo_img = Image(logo_path, width=150, height=40)
    logo_img.hAlign = 'CENTER'
    story.append(logo_img)
    story.append(Spacer(1, 4))

# Title & Subtitle
story.append(Paragraph("KARTU AKSES JURI & PANDUAN RESMI PENILAIAN", header_title_style))
story.append(Spacer(1, 2))
story.append(Paragraph("LOMBA SEPEDA HIAS • HUT RI KE-81 PERMATA DISCOVERY", subtitle_style))
story.append(Spacer(1, 6))

story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=0, spaceAfter=8))

# Scan QR Section Header
story.append(Paragraph("📱 SCAN QR CODE DARI KAMERA HP UNTUK MEMBUKA APLIKASI", ParagraphStyle('CenteredHead', parent=section_heading, alignment=TA_CENTER)))
story.append(Spacer(1, 4))

# QR Code Image
img = Image(qr_img_path, width=120, height=120)
img.hAlign = 'CENTER'
story.append(img)
story.append(Spacer(1, 3))

# Link URL
story.append(Paragraph("Atau buka langsung melalui Browser HP / Laptop:", ParagraphStyle('SubText', parent=body_style, alignment=TA_CENTER)))
story.append(Spacer(1, 2))
story.append(Paragraph("<u>https://lomba-permata-discovery.netlify.app/</u>", link_style))
story.append(Spacer(1, 8))

story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=0, spaceAfter=8))

# Table PIN Juri & Admin
story.append(Paragraph("🔑 DAFTAR PIN LOGIN JURI & ADMIN PANITIA", section_heading))
story.append(Spacer(1, 4))

table_data = [
    [
        Paragraph("Peran / Juri", table_header_style),
        Paragraph("Wilayah", table_header_style),
        Paragraph("PIN Akses", table_header_style),
        Paragraph("Hak Akses & Penilaian Lomba", table_header_style)
    ],
    [Paragraph("Juri RT 01", table_cell_bold), Paragraph("Ketua RT 01", table_cell_style), Paragraph("1111", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 01)", table_cell_style)],
    [Paragraph("Juri RT 02", table_cell_bold), Paragraph("Ketua RT 02", table_cell_style), Paragraph("2222", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 02)", table_cell_style)],
    [Paragraph("Juri RT 03", table_cell_bold), Paragraph("Ketua RT 03", table_cell_style), Paragraph("3333", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 03)", table_cell_style)],
    [Paragraph("Juri RT 04", table_cell_bold), Paragraph("Ketua RT 04", table_cell_style), Paragraph("4444", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 04)", table_cell_style)],
    [Paragraph("Juri RT 05", table_cell_bold), Paragraph("Ketua RT 05", table_cell_style), Paragraph("5555", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 05)", table_cell_style)],
    [Paragraph("Juri RT 06", table_cell_bold), Paragraph("Ketua RT 06", table_cell_style), Paragraph("6666", table_cell_bold), Paragraph("Menilai Seluruh Peserta Sepeda (Kecuali RT 06)", table_cell_style)],
    [Paragraph("Admin Master", ParagraphStyle('AdminTitle', parent=table_cell_bold, textColor=colors.HexColor('#DC2626'))), Paragraph("Panitia", table_cell_style), Paragraph("0000", ParagraphStyle('AdminPin', parent=table_cell_bold, textColor=colors.HexColor('#DC2626'))), Paragraph("Check-in Absensi, Kunci Final & Cetak PDF", table_cell_style)],
]

col_widths = [95, 85, 70, 250]
t = Table(table_data, colWidths=col_widths)
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F8FAFC')]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FEF2F2')),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))

story.append(t)
story.append(Spacer(1, 8))

# Instructions Box with emphasized locking rules & attendance
story.append(Paragraph("📌 ATURAN PENILAIAN & SISTEM PENGUNCIAN NILAI RESMI:", section_heading))
story.append(Spacer(1, 3))

instructions_html = """
<b>1. Skala Nilai 1 s/d 10:</b> Gunakan tombol cepat rating [1, 5, 6, 7, 8, 9, 10] atau tombol (-) / (+) saat menilai kreativitas, kerapian, & keindahan sepeda.<br/>
<b>2. Penilaian Silang Otomatis (Anti-Konflik):</b> Juri RT otomatis <b>TIDAK BISA</b> menilai sepeda anak dari RT-nya sendiri (terkunci <i>N/A - RT Sendiri</i> dan dihitung adil dari 5 Juri RT lainnya).<br/>
<b>3. 🔒 PENGUNCIAN NILAI PERMANEN (ANTI-PERUBAHAN SUSULAN):</b> Setelah selesai menilai seluruh peserta, tekan tombol hijau <b>'🔒 Kunci & Kirim Seluruh Nilai'</b> di bawah layar HP. Nilai akan <b>TERKUNCI PERMANEN</b> di HP dan Server Database Cloud serta <b>TIDAK DAPAT DIUBAH LAGI</b> oleh juri secara sepihak.<br/>
<b>4. Penetapan 6 Juara Utama (Individu):</b> Juara 1, Juara 2, Juara 3, Juara Harapan 1, Juara Harapan 2, dan Juara Harapan 3.<br/>
<b>5. Check-in Kehadiran Panitia:</b> Juri hanya menilai peserta sepeda yang berstatus Hadir di Titik Kumpul / Garis Start.
"""
story.append(Paragraph(instructions_html, ParagraphStyle('InstructStyle', parent=body_style, leading=12.5)))

doc.build(story)
print("PDF successfully updated at:", pdf_path)
