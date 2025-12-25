package com.karthick06.moneymanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Best Practice: Java-First SMS Processing
 * 
 * Strategy:
 * 1. BroadcastReceiver captures SMS immediately (no app needed)
 * 2. Stores SMS metadata in SharedPreferences + JSON file
 * 3. On app open, RealtimeSyncService syncs stored SMS to database
 * 4. If app is active, also emits event for instant UI update
 * 5. Works both foreground AND background
 */
public class SMSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSBroadcastReceiver";
    private static final String PREFS_NAME = "sms_sync_prefs";
    private static final String KEY_NEW_SMS_COUNT = "new_sms_count";
    private static ReactApplicationContext reactContext;

    public static void setReactContext(ReactApplicationContext context) {
        reactContext = context;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null && pdus.length > 0) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();
                        long timestamp = smsMessage.getTimestampMillis();

                        if (isBankSMS(messageBody)) {
                            Log.d(TAG, "📨 Bank SMS from " + sender);
                            
                            // BEST: Save to SharedPreferences immediately (works even if app closed)
                            saveSMSMetadata(context, sender, messageBody, timestamp);
                            
                            // ALSO: Emit event if app is active (instant UI update)
                            if (reactContext != null) {
                                reactContext
                                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("SMSReceived", createEventObject(sender, messageBody, timestamp));
                            }
                        }
                    }
                }
            }
        }
    }

    private void saveSMSMetadata(Context context, String sender, String body, long timestamp) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            int count = prefs.getInt(KEY_NEW_SMS_COUNT, 0);
            
            // Store SMS as JSON line
            String smsJson = String.format(
                "{\"id\":\"%s\",\"sender\":\"%s\",\"body\":\"%s\",\"timestamp\":%d}",
                "sms_" + sender + "_" + timestamp,
                escapeJson(sender),
                escapeJson(body),
                timestamp
            );
            
            prefs.edit()
                .putString("sms_" + count, smsJson)
                .putInt(KEY_NEW_SMS_COUNT, count + 1)
                .apply();
                
            Log.d(TAG, "💾 Saved SMS #" + (count + 1) + " to SharedPreferences");
        } catch (Exception e) {
            Log.e(TAG, "Error saving SMS: " + e.getMessage());
        }
    }

    private static boolean isBankSMS(String body) {
        String[] patterns = {
            "HDFC", "SBI", "ICICI", "Axis", "Kotak", "YES",
            "Paytm", "PhonePe", "Google Pay", "UPI", "Debit",
            "Credit", "Transaction", "Payment", "ATM", "Balance"
        };
        for (String pattern : patterns) {
            if (body.toUpperCase().contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private static Bundle createEventObject(String sender, String body, long timestamp) {
        Bundle bundle = new Bundle();
        bundle.putString("sender", sender);
        bundle.putString("body", body);
        bundle.putLong("timestamp", timestamp);
        return bundle;
    }

    private String escapeJson(String str) {
        return str.replace("\"", "\\\"").replace("\n", "\\n");
    }
}
