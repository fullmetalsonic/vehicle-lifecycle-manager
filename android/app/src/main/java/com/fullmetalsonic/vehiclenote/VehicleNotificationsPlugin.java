package com.fullmetalsonic.vehiclenote;
import android.Manifest;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
@CapacitorPlugin(name="VehicleNotifications",permissions={@Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class VehicleNotificationsPlugin extends Plugin {
    @PluginMethod public void enable(PluginCall call){if(Build.VERSION.SDK_INT>=33&&getPermissionState("notifications")!=PermissionState.GRANTED){requestPermissionForAlias("notifications",call,"permissionResult");}else permissionResult(call);}
    @PermissionCallback private void permissionResult(PluginCall call){JSObject r=new JSObject();r.put("granted",NotificationManagerCompat.from(getContext()).areNotificationsEnabled());call.resolve(r);}
    @PluginMethod public void configure(PluginCall call){try{String plan=call.getString("plan");new org.json.JSONObject(plan);getContext().getSharedPreferences("vehicle-notifications",0).edit().putString("plan",plan).apply();ReminderReceiver.schedule(getContext());call.resolve();}catch(Exception e){call.reject("Could not schedule reminders");}}
    @PluginMethod public void test(PluginCall call){if(!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()){call.reject("Notification permission disabled");return;}try{ReminderReceiver.post(getContext(),"차량 노트 시험 알림","정비 알림을 받을 준비가 되었습니다.");call.resolve();}catch(Exception e){call.reject("Notification failed");}}
}
