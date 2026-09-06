package com.fullmetalsonic.vehiclenote;

import android.content.ContentValues;
import android.content.Intent;
import android.app.Activity;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Base64;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;

import java.security.MessageDigest;
import org.json.*;

@CapacitorPlugin(name = "VehicleStore")
public class VehicleStorePlugin extends Plugin {
    @PluginMethod public void exportBackup(PluginCall call) {
        String text = call.getString("text");
        // Capacitor serializes these options twice when another activity opens.
        // Remove the large body BEFORE launching the picker; retain only its token.
        call.getData().remove("text");
        String token = null;
        try {
            token = BackupExportStaging.stage(getContext().getCacheDir(), text);
            call.getData().put("backupToken", token);
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "vehicle-note.json"));
            startActivityForResult(call, intent, "backupCreated");
        } catch (Exception e) {
            BackupExportStaging.discard(getContext().getCacheDir(), token);
            call.reject("Could not prepare backup. Existing records are unchanged.");
        }
    }
    @ActivityCallback private void backupCreated(PluginCall call, ActivityResult result) {
        if(call == null) return;
        String token = call.getString("backupToken");
        try {
            if(result.getResultCode() != Activity.RESULT_OK || result.getData() == null) { JSObject r=new JSObject();r.put("cancelled",true);call.resolve(r);return; }
            long bytes;
            try(OutputStream out=getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                if(out == null) throw new IOException("Cannot open destination");
                bytes = BackupExportStaging.copy(getContext().getCacheDir(), token, out);
            }
            JSObject r = new JSObject();r.put("bytes", bytes);call.resolve(r);
        } catch(Exception e) { call.reject("Could not save backup file. Choose another destination."); }
        finally { BackupExportStaging.discard(getContext().getCacheDir(), token); }
    }
    private SQLiteDatabase database() {
        SQLiteDatabase db = getContext().openOrCreateDatabase("vehicle-note-v1.db", 0, null);
        db.execSQL("CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS recovery (id INTEGER PRIMARY KEY AUTOINCREMENT, savedAt TEXT NOT NULL, payload TEXT NOT NULL)");
        return db;
    }
    private File photo(String id) throws IOException {
        if (id == null || !id.matches("[a-fA-F0-9-]{36}")) throw new IOException("Invalid photo ID");
        File dir = new File(getContext().getFilesDir(), "receipts");
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create receipt directory");
        return new File(dir, id + ".bin");
    }
    @PluginMethod public synchronized void read(PluginCall call) {
        try (SQLiteDatabase db = database()) {
            StringBuilder state = new StringBuilder();
            // Avoid CursorWindow size limit for larger histories.
            for (int start = 1; ; start += 200000) {
                try (Cursor c = db.rawQuery("SELECT substr(payload,?,200000) FROM state WHERE id=1", new String[]{String.valueOf(start)})) {
                    if (!c.moveToFirst() || c.getString(0).isEmpty()) break;
                    state.append(c.getString(0));
                }
            }
            JSObject result = new JSObject();
            result.put("state", state.length() == 0 ? JSONObject.NULL : state.toString());
            call.resolve(result);
        } catch (Exception e) { call.reject("Could not read stored data. No reset performed."); }
    }
    @PluginMethod public synchronized void readPhoto(PluginCall call) {
        try {
            File f = photo(call.getString("id"));
            if (f.length() > 10 * 1024 * 1024) throw new IOException("Invalid receipt size");
            JSObject result = new JSObject();
            try(FileInputStream in = new FileInputStream(f); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int count;
                while((count=in.read(buffer))!=-1) out.write(buffer,0,count);
                result.put("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            }
            call.resolve(result);
        } catch (Exception e) { call.reject("Could not read receipt. No reset performed."); }
    }
    @PluginMethod public synchronized void write(PluginCall call) {
        try {
            String state = call.getString("state");
            JSONObject payload = new JSONObject(state);
            if (payload.getInt("version") != 1 || !payload.has("vehicles")) throw new IOException("Invalid schema");
            JSONArray photos = call.getArray("photos");
            // Immutable receipt files are finalized before committing the referencing state.
            // A failed commit can leave an unreferenced file, never a dangling state reference.
            for (int i = 0; i < photos.length(); i++) {
                JSONObject p = photos.getJSONObject(i);
                byte[] bytes = Base64.decode(p.getString("base64"), Base64.DEFAULT);
                if (bytes.length == 0 || bytes.length > 10 * 1024 * 1024) throw new IOException("Invalid receipt");
                StringBuilder hash = new StringBuilder();
                for(byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) hash.append(String.format("%02x", b & 255));
                if (!hash.toString().equals(p.getString("hash"))) throw new IOException("Receipt checksum mismatch");
                File target = photo(p.getString("id"));
                if (!target.exists()) {
                    File temp = new File(target.getPath() + ".tmp");
                    try (FileOutputStream out = new FileOutputStream(temp)) { out.write(bytes); out.getFD().sync(); }
                    if (!temp.renameTo(target)) throw new IOException("Receipt commit failed");
                }
            }
            JSONArray references = payload.getJSONArray("receipts");
            for(int i=0;i<references.length();i++) if(!photo(references.getJSONObject(i).getString("id")).isFile()) throw new IOException("Missing photo");
            try (SQLiteDatabase db = database()) {
                db.beginTransaction();
                try {
                    // Keep three prior database snapshots. Immutable photo files remain available.
                    db.execSQL("INSERT INTO recovery(savedAt,payload) SELECT datetime('now'),payload FROM state WHERE id=1 AND payload != ?",new Object[]{state});
                    db.execSQL("DELETE FROM recovery WHERE id NOT IN (SELECT id FROM recovery ORDER BY id DESC LIMIT 3)");
                    ContentValues values = new ContentValues(); values.put("id",1); values.put("payload",state);
                    if(db.insertWithOnConflict("state",null,values,SQLiteDatabase.CONFLICT_REPLACE)<0)throw new IOException("State write failed");
                    db.setTransactionSuccessful();
                } finally { db.endTransaction(); }
            }
            call.resolve();
        } catch (Exception e) { call.reject("Save failed. Previous committed data retained."); }
    }
    @PluginMethod public synchronized void readRecovery(PluginCall call) {
        try(SQLiteDatabase db=database()) {
            JSArray rows=new JSArray();
            try(Cursor ids=db.rawQuery("SELECT id,savedAt FROM recovery ORDER BY id DESC",null)) {
                while(ids.moveToNext()) { StringBuilder payload=new StringBuilder();
                    for(int start=1;;start+=200000)try(Cursor c=db.rawQuery("SELECT substr(payload,?,200000) FROM recovery WHERE id=?",new String[]{String.valueOf(start),ids.getString(0)})){if(!c.moveToFirst()||c.getString(0).isEmpty())break;payload.append(c.getString(0));}
                    JSObject row=new JSObject();row.put("savedAt",ids.getString(1));row.put("state",payload.toString());rows.put(row);
                }
            }
            JSObject result=new JSObject();result.put("states",rows);call.resolve(result);
        }catch(Exception e){call.reject("Could not read recovery snapshots");}
    }
}
