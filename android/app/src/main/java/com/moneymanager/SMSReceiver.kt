package com.moneymanager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

/**
 * SMS Broadcast Receiver
 * Listens for incoming SMS messages in real-time
 */
class SMSReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        try {
            if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
                val bundle = intent.extras ?: return
                val pdus = bundle.get("pdus") as Array<*>

                for (pdu in pdus) {
                    val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray)
                    val sender = smsMessage.displayOriginatingAddress
                    val body = smsMessage.messageBody
                    val timestamp = smsMessage.timestampMillis

                    // Log received SMS
                    Log.d("SMSReceiver", "New SMS from: $sender, Body: $body")

                    // You can emit an event or store for later processing
                    // For now, this just logs
                }
            }
        } catch (e: Exception) {
            Log.e("SMSReceiver", "Error receiving SMS: ${e.message}")
        }
    }
}
