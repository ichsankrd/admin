// Catatan Bahan - penyimpanan data di Google Drive (file JSON milik Anda)
const KEY = 'Tz755cBz148FYAVhgdT7YXfS';
const FILE = 'catatan-bahan-data.json';

function getFile_(create) {
  const it = DriveApp.getFilesByName(FILE);
  if (it.hasNext()) return it.next();
  return create ? DriveApp.createFile(FILE, '', 'application/json') : null;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return out_({ ok: true, msg: 'Catatan Bahan aktif' }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.key !== KEY) return out_({ ok: false, error: 'Kunci rahasia salah' });
    const f = getFile_(false);
    const cur = f ? f.getLastUpdated().getTime() : 0;
    if (req.action === 'load') {
      if (!f || !f.getSize()) return out_({ ok: true, empty: true, ver: 0 });
      return out_({ ok: true, ver: cur, data: JSON.parse(f.getBlob().getDataAsString()) });
    }
    if (req.action === 'save') {
      if (f && f.getSize() && !req.force && req.base !== cur) return out_({ ok: false, conflict: true, ver: cur });
      const nf = f || getFile_(true);
      nf.setContent(JSON.stringify(req.data));
      return out_({ ok: true, ver: nf.getLastUpdated().getTime() });
    }
    return out_({ ok: false, error: 'Aksi tidak dikenal' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
