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

var SPREADSHEET_ID = '1vySoeAq2TOjAzVeZ-Bl43H5NuPrfsz17cbme7R8Eht4';

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Fungsi Pembantu: Jalankan fungsi ini 1x di Editor Apps Script (klik tombol "Jalankan") untuk memberikan izin Akses Spreadsheet (OAuth Permission)!
function testPermissions() {
  var ss = getSpreadsheet();
  Logger.log("Akses Spreadsheet Berhasil: " + ss.getName());
}

// ============================================================
// MASTER DATA — ID harus SAMA PERSIS dengan frontend (tanpa prefix p_)
// ============================================================
var JUDGE_LIST = [
  { id: 'juri_rt01', code: 'RT 01', name: 'Juri RT 01' },
  { id: 'juri_rt02', code: 'RT 02', name: 'Juri RT 02' },
  { id: 'juri_rt03', code: 'RT 03', name: 'Juri RT 03' },
  { id: 'juri_rt04', code: 'RT 04', name: 'Juri RT 04' },
  { id: 'juri_rt05', code: 'RT 05', name: 'Juri RT 05' },
  { id: 'juri_rt06', code: 'RT 06', name: 'Juri RT 06' }
];

// FIX BUG-01: Participant IDs diubah dari 'p_rt01' → 'rt01' agar cocok dengan frontend
var PARTICIPANT_LIST = [
  { id: 'rt01', code: 'RT 01', name: 'Peserta RT 01' },
  { id: 'rt02', code: 'RT 02', name: 'Peserta RT 02' },
  { id: 'rt03', code: 'RT 03', name: 'Peserta RT 03' },
  { id: 'rt04', code: 'RT 04', name: 'Peserta RT 04' },
  { id: 'rt05', code: 'RT 05', name: 'Peserta RT 05' },
  { id: 'rt06', code: 'RT 06', name: 'Peserta RT 06' }
];

// FIX NOTE-04: judgeMap & participantMap diletakkan di scope atas agar tidak terkena ReferenceError
var JUDGE_MAP = {
  'RT 01': 'juri_rt01', 'juri_rt01': 'juri_rt01',
  'RT 02': 'juri_rt02', 'juri_rt02': 'juri_rt02',
  'RT 03': 'juri_rt03', 'juri_rt03': 'juri_rt03',
  'RT 04': 'juri_rt04', 'juri_rt04': 'juri_rt04',
  'RT 05': 'juri_rt05', 'juri_rt05': 'juri_rt05',
  'RT 06': 'juri_rt06', 'juri_rt06': 'juri_rt06'
};

// FIX BUG-01: Participant map juga mengarah ke ID tanpa prefix p_
var PARTICIPANT_MAP = {
  'RT 01': 'rt01', 'rt01': 'rt01', 'p_rt01': 'rt01',
  'RT 02': 'rt02', 'rt02': 'rt02', 'p_rt02': 'rt02',
  'RT 03': 'rt03', 'rt03': 'rt03', 'p_rt03': 'rt03',
  'RT 04': 'rt04', 'rt04': 'rt04', 'p_rt04': 'rt04',
  'RT 05': 'rt05', 'rt05': 'rt05', 'p_rt05': 'rt05',
  'RT 06': 'rt06', 'rt06': 'rt06', 'p_rt06': 'rt06'
};

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    var ss = getSpreadsheet();
    
    // Handle Reset Action
    if (data.reset) {
      var sRekap = ss.getSheetByName('Rekap Nilai');
      if (sRekap) {
        sRekap.clear();
        sRekap.appendRow(['No', 'Kode Peserta', 'Nama Peserta', 'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'Total Nilai', 'Rata-Rata', 'Peringkat']);
        sRekap.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#D9EAD3');
      }
      var sLog = ss.getSheetByName('Log Transaksi');
      if (sLog) {
        sLog.clear();
        sLog.appendRow(['Waktu Sync', 'Juri ID', 'Peserta ID', 'C1 (Kerapian)', 'C2 (Kreativitas)', 'C3 (Kesulitan)', 'C4 (Kekompakan)', 'Total Subtotal', 'Catatan Peserta']);
        sLog.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#EFEFEF');
      }
      var sNotes = ss.getSheetByName('Catatan Juri');
      if (sNotes) {
        sNotes.clear();
        sNotes.appendRow(['Waktu Update', 'Juri', 'Catatan Umum']);
        sNotes.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#FFF2CC');
      }

      try {
        var scriptProperties = PropertiesService.getScriptProperties();
        scriptProperties.setProperty('MASTER_PAYLOAD', JSON.stringify({
          scores: {},
          judgeNotes: {},
          resetTimestamp: data.resetTimestamp || Date.now()
        }));
      } catch(e) {}

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Seluruh data berhasil direset' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheetRekap = ss.getSheetByName('Rekap Nilai');
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet('Rekap Nilai');
    }
    sheetRekap.clear();

    // 2. Buat / Ambil Sheet 'Log Transaksi'
    var sheetLog = ss.getSheetByName('Log Transaksi');
    if (!sheetLog) {
      sheetLog = ss.insertSheet('Log Transaksi');
      sheetLog.appendRow([
        'Waktu Sync', 
        'Juri ID', 
        'Peserta ID', 
        'C1 (Kerapian)', 
        'C2 (Kreativitas)', 
        'C3 (Kesulitan)', 
        'C4 (Kekompakan)', 
        'Total Subtotal', 
        'Catatan Peserta'
      ]);
      sheetLog.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#E2EFDA');
    }

    var timestamp = data.timestamp || new Date().toISOString();
    var scores = data.scores || {};
    var judgeNotes = data.judgeNotes || {};

    // Format Ulang Sheet Rekap
    var headers = ['No', 'Kode Peserta', 'Nama Peserta'];
    JUDGE_LIST.forEach(function(j) {
      headers.push(j.code);
    });
    headers.push('Total Nilai', 'Rata-Rata', 'Peringkat');
    
    sheetRekap.appendRow(headers);
    sheetRekap.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2E75B6').setFontColor('#FFFFFF');

    // Catat Log Transaksi & Buat Baris Rekap
    var recaps = [];

    PARTICIPANT_LIST.forEach(function(p, idx) {
      var rowScores = [];
      var totalScore = 0;
      var validJudgeCount = 0;

      JUDGE_LIST.forEach(function(j) {
        if (j.code === p.code) {
          rowScores.push('N/A');
        } else {
          // FIX BUG-01: lookup by p.id ('rt01') karena frontend mengirim dengan ID tanpa prefix
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
    
    JUDGE_LIST.forEach(function(j) {
      if (judgeNotes[j.id]) {
        sheetNotes.appendRow([timestamp, j.code + ' (' + j.name + ')', judgeNotes[j.id]]);
      }
    });

    // Save & Merge Master Payload in Script Properties for Multi-Device Realtime Sync
    try {
      var scriptProperties = PropertiesService.getScriptProperties();
      var existingRaw = scriptProperties.getProperty('MASTER_PAYLOAD');
      var existingData = existingRaw ? JSON.parse(existingRaw) : { scores: {}, judgeNotes: {}, resetTimestamp: 0 };
      
      if (data.reset) {
        existingData = { scores: {}, judgeNotes: {}, resetTimestamp: data.resetTimestamp || Date.now() };
      } else {
        if (data.scores) {
          for (var jId in data.scores) {
            existingData.scores[jId] = Object.assign({}, existingData.scores[jId] || {}, data.scores[jId]);
          }
        }
        if (data.judgeNotes) {
          existingData.judgeNotes = Object.assign({}, existingData.judgeNotes || {}, data.judgeNotes);
        }
        if (data.resetTimestamp) {
          existingData.resetTimestamp = data.resetTimestamp;
        }
      }
      scriptProperties.setProperty('MASTER_PAYLOAD', JSON.stringify(existingData));
    } catch(err) {
      Logger.log("Failed to save master payload: " + err.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data berhasil disinkronkan ke Google Sheets' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readScoresFromSpreadsheet() {
  var ss = getSpreadsheet();
  var masterScores = {};
  var masterNotes = {};

  var judgeList = [
    { id: 'juri_rt01', code: 'RT 01', colIdx: 4 },
    { id: 'juri_rt02', code: 'RT 02', colIdx: 5 },
    { id: 'juri_rt03', code: 'RT 03', colIdx: 6 },
    { id: 'juri_rt04', code: 'RT 04', colIdx: 7 },
    { id: 'juri_rt05', code: 'RT 05', colIdx: 8 },
    { id: 'juri_rt06', code: 'RT 06', colIdx: 9 }
  ];

  // 1. Baca langsung dari Sheet 'Rekap Nilai'
  var sheetRekap = ss.getSheetByName('Rekap Nilai');
  if (sheetRekap) {
    var lastRow = sheetRekap.getLastRow();
    if (lastRow > 1) {
      var values = sheetRekap.getRange(2, 1, lastRow - 1, 12).getValues();
      values.forEach(function(row) {
        var pCode = String(row[1]).trim();
        // FIX BUG-01: PARTICIPANT_MAP mengarah ke 'rt01' (tanpa prefix p_)
        var pId = PARTICIPANT_MAP[pCode] || pCode;

        if (pId) {
          judgeList.forEach(function(j) {
            var rawVal = row[j.colIdx - 1]; // 0-indexed column
            if (rawVal !== 'N/A' && rawVal !== '' && rawVal !== null && !isNaN(rawVal)) {
              var totalVal = Number(rawVal);
              if (totalVal > 0) {
                if (!masterScores[j.id]) masterScores[j.id] = {};
                var c1Val = Math.round(totalVal * 0.3);
                var c2Val = Math.round(totalVal * 0.3);
                var c3Val = Math.round(totalVal * 0.2);
                var c4Val = totalVal - (c1Val + c2Val + c3Val);
                
                masterScores[j.id][pId] = {
                  scores: {
                    c1: c1Val,
                    c2: c2Val,
                    c3: c3Val,
                    c4: c4Val
                  }
                };
              }
            }
          });
        }
      });
    }
  }

  // 2. Baca dari 'Log Transaksi' jika tersedia untuk rincian c1-c4 yang presisi
  // (Ini akan override data rekap apabila ada, karena lebih detail/presisi)
  var sheetLog = ss.getSheetByName('Log Transaksi');
  if (sheetLog) {
    var lastLog = sheetLog.getLastRow();
    if (lastLog > 1) {
      var logVals = sheetLog.getRange(2, 1, lastLog - 1, 9).getValues();

      logVals.forEach(function(row) {
        var jCode = String(row[1]).trim();
        var pCode = String(row[2]).trim();
        // FIX NOTE-04: Gunakan JUDGE_MAP & PARTICIPANT_MAP dari scope atas (tidak undefined lagi)
        var jId = JUDGE_MAP[jCode] || jCode;
        var pId = PARTICIPANT_MAP[pCode] || pCode;
        var c1 = Number(row[3] || 0);
        var c2 = Number(row[4] || 0);
        var c3 = Number(row[5] || 0);
        var c4 = Number(row[6] || 0);
        var note = String(row[8] || '').trim();

        if (jId && pId && (c1 > 0 || c2 > 0 || c3 > 0 || c4 > 0)) {
          if (!masterScores[jId]) masterScores[jId] = {};
          masterScores[jId][pId] = {
            scores: { c1: c1, c2: c2, c3: c3, c4: c4 },
            notes: note
          };
        }
      });
    }
  }

  // FIX NOTE-04: Baca catatan juri menggunakan JUDGE_MAP dari scope atas
  var sheetNotes = ss.getSheetByName('Catatan Juri');
  if (sheetNotes) {
    var lastNotesRow = sheetNotes.getLastRow();
    if (lastNotesRow > 1) {
      var noteVals = sheetNotes.getRange(2, 1, lastNotesRow - 1, 3).getValues();
      noteVals.forEach(function(row) {
        var jRaw = String(row[1]).trim();
        var noteText = String(row[2] || '').trim();
        // FIX NOTE-04: JUDGE_MAP sekarang tersedia dari scope atas
        for (var code in JUDGE_MAP) {
          if (jRaw.indexOf(code) !== -1) {
            masterNotes[JUDGE_MAP[code]] = noteText;
          }
        }
      });
    }
  }

  return { scores: masterScores, judgeNotes: masterNotes };
}

function doGet(e) {
  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    var payloadRaw = scriptProperties.getProperty('MASTER_PAYLOAD');
    var payload;

    if (payloadRaw) {
      payload = JSON.parse(payloadRaw);
    }

    if (!payload || !payload.scores || Object.keys(payload.scores).length === 0) {
      var sheetData = readScoresFromSpreadsheet();
      payload = {
        scores: sheetData.scores,
        judgeNotes: sheetData.judgeNotes,
        resetTimestamp: 0
      };
    }

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
