package com.fullmetalsonic.vehiclenote;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
public final class BackupExportStagingTest {
    interface Attempt { void run() throws IOException; }
    static void fails(Attempt task) throws Exception { try { task.run(); throw new AssertionError("Expected IOException"); } catch(IOException expected){} }
    public static void main(String[] args) throws Exception {
        File cache=Files.createTempDirectory("vehicle-backup-test-").toFile();
        String text="한글 사진 백업\n".repeat(100000);
        String token=BackupExportStaging.stage(cache,text);
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        long n=BackupExportStaging.copy(cache,token,out);
        if(n!=text.getBytes(StandardCharsets.UTF_8).length || !Arrays.equals(out.toByteArray(),text.getBytes(StandardCharsets.UTF_8)))throw new AssertionError("UTF8 changed");
        fails(()->BackupExportStaging.file(cache,"../../outside"));
        fails(()->BackupExportStaging.stage(cache,null));
        fails(()->BackupExportStaging.stage(cache,""));
        fails(()->BackupExportStaging.stage(cache,"x".repeat(BackupExportStaging.MAX_BYTES+1)));
        fails(()->BackupExportStaging.copy(cache,token,new OutputStream(){public void write(int b)throws IOException{throw new IOException("Disk full");}}));
        BackupExportStaging.discard(cache,token);
        if(BackupExportStaging.file(cache,token).exists())throw new AssertionError("Temporary file retained");
        fails(()->BackupExportStaging.copy(cache,token,new ByteArrayOutputStream()));
        BackupExportStaging.discard(cache,null);
        new File(cache,"backup-exports").delete();cache.delete();
        System.out.println("PASS: multi-MB Unicode streaming, size/path validation, output failure, cancellation cleanup, missing-stage rejection");
    }
}
