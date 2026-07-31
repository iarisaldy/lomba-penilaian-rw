/**
 * GOOGLE APPS SCRIPT FOR SISTEM PENILAIAN LOMBA RW
 * Spreadsheet ID Target: 1vySoeAq2TOjAzVeZ-Bl43H5NuPrfsz17cbme7R8Eht4
 * 
 * CARA MEMASANG:
 * 1. Buka Google Sheet: https://docs.google.com/spreadsheets/d/1vySoeAq2TOjAzVeZ-Bl43H5NuPrfsz17cbme7R8Eht4/edit
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode bawaan di editor, lalu paste seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (Ctrl+S / Cmd+S).
 * 5. Klik tombol "Terapkan" (Deploy) > "Terapkan Baru" (New deployment).
 * 6. Pilih Jenis: "Aplikasi Web" (Web app).
 * 7. Set Konfigurasi:
 *    - Deskripsi: Webhook Penilaian Lomba
 *    - Jalankan sebagai (Execute as): Saya ( email@gmail.com )
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik "Terapkan" (Deploy), berikan izin akses (Authorize access), lalu COPY URL Web App yang dihasilkan.
 * 9. Paste URL tersebut ke aplikasi web di menu "Sync Google Sheets" atau di file `.env.local` / Environment Variables Vercel.
 */

// Fungsi Pembantu: Jalankan fungsi ini 1x di Editor Apps Script (klik tombol "Jalankan") untuk memberikan izin Akses Spreadsheet (OAuth Permission)!
function testPermissions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Akses Spreadsheet Berhasil: " + ss.getName());
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Buat / Ambil Sheet 'Rekap Nilai'
    var sheetRekap = ss.getSheetByName('Rekap Nilai');
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet('Rekap Nilai');
    }

    // 2. Buat / Ambil Sheet 'Log Transaksi'
    var sheetLog = ss.getSheetByName('Log Transaksi');
    if (!sheetLog) {
      sheetLog = ss.insertSheet('Log Transaksi');
      sheetLog.appendRow([
        'Waktu Sync', 
        'Juri ID', 
        'Peserta ID', 
        'C1 (Teknik/Rias)', 
        'C2 (Warna)', 
        'C3 (Kreativitas)', 
        'C4 (Kekompakan)', 
        'Total Subtotal', 
        'Catatan Peserta'
      ]);
      sheetLog.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#E2EFDA');
    }

    var timestamp = data.timestamp || new Date().toISOString();
    var scores = data.scores || {};
    var judgeNotes = data.judgeNotes || {};

    // Mapping Kode Juri & Peserta
    var judgeList = [
      { id: 'juri_rt01', code: 'RT 01', name: 'Juri RT 01' },
      { id: 'juri_rt02', code: 'RT 02', name: 'Juri RT 02' },
      { id: 'juri_rt03', code: 'RT 03', name: 'Juri RT 03' },
      { id: 'juri_rt04', code: 'RT 04', name: 'Juri RT 04' },
      { id: 'juri_rt05', code: 'RT 05', name: 'Juri RT 05' },
      { id: 'juri_rt06', code: 'RT 06', name: 'Juri RT 06' }
    ];

    var participantList = [
      { id: 'p_rt01', code: 'RT 01', name: 'Peserta RT 01' },
      { id: 'p_rt02', code: 'RT 02', name: 'Peserta RT 02' },
      { id: 'p_rt03', code: 'RT 03', name: 'Peserta RT 03' },
      { id: 'p_rt04', code: 'RT 04', name: 'Peserta RT 04' },
      { id: 'p_rt05', code: 'RT 05', name: 'Peserta RT 05' },
      { id: 'p_rt06', code: 'RT 06', name: 'Peserta RT 06' }
    ];

    // Format Ulang Sheet Rekap
    sheetRekap.clear();
    
    // Header Rekap
    var headers = ['No', 'Kode Peserta', 'Nama Peserta'];
    judgeList.forEach(function(j) {
      headers.push(j.code);
    });
    headers.push('Total Nilai', 'Rata-Rata', 'Peringkat');
    
    sheetRekap.appendRow(headers);
    sheetRekap.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2E75B6').setFontColor('#FFFFFF');

    // Catat Log Transaksi & Buat Baris Rekap
    var recaps = [];

    participantList.forEach(function(p, idx) {
      var rowScores = [];
      var totalScore = 0;
      var validJudgeCount = 0;

      judgeList.forEach(function(j) {
        if (j.code === p.code) {
          rowScores.push('N/A');
        } else {
          var pData = (scores[j.id] && scores[j.id][p.id]) ? scores[j.id][p.id] : {};
          var pScores = pData.scores || {};
          var c1 = Number(pScores.c1 || 0);
          var c2 = Number(pScores.c2 || 0);
          var c3 = Number(pScores.c3 || 0);
          var c4 = Number(pScores.c4 || 0);
          var subtotal = c1 + c2 + c3 + c4;

          rowScores.push(subtotal);
          totalScore += subtotal;
          validJudgeCount++;

          if (subtotal > 0 || pData.notes) {
            sheetLog.appendRow([
              timestamp,
              j.code,
              p.code,
              c1,
              c2,
              c3,
              c4,
              subtotal,
              pData.notes || ''
            ]);
          }
        }
      });

      var avgScore = validJudgeCount > 0 ? Number((totalScore / validJudgeCount).toFixed(2)) : 0;
      recaps.push({
        no: idx + 1,
        code: p.code,
        name: p.name,
        scores: rowScores,
        total: totalScore,
        avg: avgScore,
        rank: 0
      });
    });

    // Hitung Ranking
    var sorted = recaps.slice().sort(function(a, b) {
      return b.avg - a.avg || b.total - a.total;
    });

    var currentRank = 1;
    sorted.forEach(function(item, index) {
      if (index > 0 && item.avg < sorted[index - 1].avg) {
        currentRank = index + 1;
      }
      item.rank = currentRank;
    });

    recaps.forEach(function(item) {
      var match = sorted.find(function(s) { return s.code === item.code; });
      var rankVal = match ? match.rank : 0;
      var rankLabel = rankVal === 1 ? '🏆 Juara 1' : (rankVal === 2 ? '🥈 Juara 2' : 'Peringkat ' + rankVal);

      var rowData = [item.no, item.code, item.name];
      item.scores.forEach(function(sc) { rowData.push(sc); });
      rowData.push(item.total, item.avg, rankLabel);
      
      sheetRekap.appendRow(rowData);
    });

    // Tambah Sheet Catatan Umum Juri
    var sheetNotes = ss.getSheetByName('Catatan Juri');
    if (!sheetNotes) {
      sheetNotes = ss.insertSheet('Catatan Juri');
    }
    sheetNotes.clear();
    sheetNotes.appendRow(['Waktu Update', 'Juri', 'Catatan Umum']);
    sheetNotes.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#FFF2CC');
    
    judgeList.forEach(function(j) {
      if (judgeNotes[j.id]) {
        sheetNotes.appendRow([timestamp, j.code + ' (' + j.name + ')', judgeNotes[j.id]]);
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data berhasil disinkronkan ke Google Sheets' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Endpoint Google Apps Script Penilaian Lomba Aktif!")
    .setMimeType(ContentService.MimeType.TEXT);
}
