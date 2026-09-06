package com.fullmetalsonic.vehiclenote;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** Keeps backup content out of Android's activity saved-state/Binder bundle. */
final class BackupExportStaging {
    static final int MAX_BYTES = 50 * 1024 * 1024;

    static String stage(File cacheDir, String text) throws IOException {
        if (text == null) throw new IOException("Missing backup content");
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IOException("Backup size limit exceeded");
        File dir = new File(cacheDir, "backup-exports");
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Cannot stage backup");
        String token = UUID.randomUUID().toString();
        File target = file(cacheDir, token);
        try (FileOutputStream out = new FileOutputStream(target)) {
            out.write(bytes);
            out.getFD().sync();
        } catch (IOException e) {
            target.delete();
            throw e;
        }
        return token;
    }

    static File file(File cacheDir, String token) throws IOException {
        if (token == null || !token.matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"))
            throw new IOException("Invalid backup token");
        return new File(new File(cacheDir, "backup-exports"), token + ".json");
    }

    static long copy(File cacheDir, String token, OutputStream out) throws IOException {
        File source = file(cacheDir, token);
        long size = source.length();
        if (!source.isFile() || size == 0 || size > MAX_BYTES) throw new IOException("Staged backup unavailable; export again");
        long total = 0;
        try (InputStream in = new FileInputStream(source)) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = in.read(buffer)) != -1) { out.write(buffer, 0, count); total += count; }
        }
        out.flush();
        if (total != size) throw new IOException("Incomplete backup export");
        return total;
    }

    static void discard(File cacheDir, String token) {
        try { file(cacheDir, token).delete(); } catch (IOException ignored) { }
    }
}
