package com.karthick06.moneymanager;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.HashMap;
import java.util.Map;

public class SMSManagerModule extends NativeModule {

  public SMSManagerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "SMSManager";
  }

  /**
   * Request READ_SMS permission from user
   */
  @ReactMethod
  public void requestSMSPermission(Promise promise) {
    try {
      ReactApplicationContext context = getReactApplicationContext();
      
      // Check if permission is already granted
      if (ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED) {
        promise.resolve(true);
        return;
      }

      // Permission will be requested by React Native PermissionsAndroid
      promise.resolve(false);
    } catch (Exception e) {
      promise.reject("ERROR_REQUEST_SMS", e.getMessage());
    }
  }

  /**
   * Check if READ_SMS permission is granted
   */
  @ReactMethod
  public void checkSMSPermission(Promise promise) {
    try {
      ReactApplicationContext context = getReactApplicationContext();
      boolean hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED;
      
      promise.resolve(hasPermission);
    } catch (Exception e) {
      promise.reject("ERROR_CHECK_SMS", e.getMessage());
    }
  }

  /**
   * Get all SMS messages from device
   * Reads from SMS ContentProvider
   */
  @ReactMethod
  public void getAllSMS(Promise promise) {
    try {
      ReactApplicationContext context = getReactApplicationContext();
      
      // Check permission
      if (ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_SMS
        ) != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "SMS read permission not granted");
        return;
      }

      WritableArray smsArray = Arguments.createArray();

      // URI for SMS ContentProvider
      Uri smsUri = Uri.parse("content://sms/inbox");
      
      // Query parameters
      String[] projection = {
        "_id",      // SMS ID
        "address",  // Sender phone number
        "body",     // SMS content
        "date",     // Timestamp
        "type"      // Message type (1=received, 2=sent, etc)
      };

      // Sort by date descending (newest first)
      String sortOrder = "date DESC";

      try (Cursor cursor = context.getContentResolver().query(
          smsUri,
          projection,
          null,
          null,
          sortOrder
      )) {
        if (cursor != null) {
          while (cursor.moveToNext()) {
            WritableMap smsMap = Arguments.createMap();
            
            // Extract SMS data
            String id = cursor.getString(0);
            String address = cursor.getString(1);
            String body = cursor.getString(2);
            long date = cursor.getLong(3);
            int type = cursor.getInt(4);

            // Filter out empty messages and system messages
            if (body != null && !body.isEmpty() && !address.isEmpty()) {
              smsMap.putString("_id", id);
              smsMap.putString("address", address);
              smsMap.putString("body", body);
              smsMap.putDouble("date", (double) date);
              smsMap.putInt("type", type);

              smsArray.pushMap(smsMap);
            }
          }
        }
      }

      promise.resolve(smsArray);
    } catch (Exception e) {
      promise.reject("ERROR_READ_SMS", "Failed to read SMS: " + e.getMessage());
    }
  }

  /**
   * Get total SMS count
   */
  @ReactMethod
  public void getSMSCount(Promise promise) {
    try {
      ReactApplicationContext context = getReactApplicationContext();
      
      // Check permission
      if (ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_SMS
        ) != PackageManager.PERMISSION_GRANTED) {
        promise.resolve(0);
        return;
      }

      Uri smsUri = Uri.parse("content://sms/inbox");
      
      try (Cursor cursor = context.getContentResolver().query(
          smsUri,
          null,
          null,
          null,
          null
      )) {
        int count = cursor != null ? cursor.getCount() : 0;
        promise.resolve(count);
      }
    } catch (Exception e) {
      promise.reject("ERROR_COUNT_SMS", e.getMessage());
    }
  }

  /**
   * Get SMS within date range
   */
  @ReactMethod
  public void getSMSInRange(double startTime, double endTime, Promise promise) {
    try {
      ReactApplicationContext context = getReactApplicationContext();
      
      // Check permission
      if (ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_SMS
        ) != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "SMS read permission not granted");
        return;
      }

      WritableArray smsArray = Arguments.createArray();
      Uri smsUri = Uri.parse("content://sms/inbox");

      String[] projection = {
        "_id",
        "address",
        "body",
        "date",
        "type"
      };

      // Filter by date range
      String selection = "date >= ? AND date <= ?";
      String[] selectionArgs = {
        String.valueOf((long) startTime),
        String.valueOf((long) endTime)
      };
      String sortOrder = "date DESC";

      try (Cursor cursor = context.getContentResolver().query(
          smsUri,
          projection,
          selection,
          selectionArgs,
          sortOrder
      )) {
        if (cursor != null) {
          while (cursor.moveToNext()) {
            WritableMap smsMap = Arguments.createMap();
            
            smsMap.putString("_id", cursor.getString(0));
            smsMap.putString("address", cursor.getString(1));
            smsMap.putString("body", cursor.getString(2));
            smsMap.putDouble("date", (double) cursor.getLong(3));
            smsMap.putInt("type", cursor.getInt(4));

            smsArray.pushMap(smsMap);
          }
        }
      }

      promise.resolve(smsArray);
    } catch (Exception e) {
      promise.reject("ERROR_READ_SMS_RANGE", e.getMessage());
    }
  }

  @ReactMethod
  public void getStoredSMS(Promise promise) {
    try {
      android.content.SharedPreferences prefs = 
        getReactApplicationContext().getSharedPreferences("sms_sync_prefs", Context.MODE_PRIVATE);
      
      WritableArray smsArray = Arguments.createArray();
      int count = prefs.getInt("new_sms_count", 0);
      
      for (int i = 0; i < count; i++) {
        String smsJson = prefs.getString("sms_" + i, null);
        if (smsJson != null) {
          WritableMap smsMap = Arguments.createMap();
          // Parse JSON manually (avoid dependencies)
          String[] parts = smsJson.split("\"");
          for (int j = 0; j < parts.length; j++) {
            if (parts[j].contains("sender")) {
              smsMap.putString("sender", parts[j + 2]);
            } else if (parts[j].contains("body")) {
              smsMap.putString("body", parts[j + 2]);
            } else if (parts[j].contains("timestamp")) {
              smsMap.putDouble("timestamp", Double.parseDouble(parts[j + 2]));
            }
          }
          smsArray.pushMap(smsMap);
        }
      }
      
      promise.resolve(smsArray);
    } catch (Exception e) {
      promise.reject("ERROR_GET_STORED_SMS", e.getMessage());
    }
  }

  @ReactMethod
  public void clearStoredSMS(Promise promise) {
    try {
      android.content.SharedPreferences prefs = 
        getReactApplicationContext().getSharedPreferences("sms_sync_prefs", Context.MODE_PRIVATE);
      
      int count = prefs.getInt("new_sms_count", 0);
      android.content.SharedPreferences.Editor editor = prefs.edit();
      
      for (int i = 0; i < count; i++) {
        editor.remove("sms_" + i);
      }
      editor.putInt("new_sms_count", 0).apply();
      
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERROR_CLEAR_STORED_SMS", e.getMessage());
    }
  }

  @ReactMethod
  public void startRealtimeSync() {
    SMSBroadcastReceiver.setReactContext(getReactApplicationContext());
    android.util.Log.d("SMSManager", "Real-time sync listener registered");
  }

  @ReactMethod
  public void stopRealtimeSync() {
    android.util.Log.d("SMSManager", "Real-time sync listener stopped");
  }
}

