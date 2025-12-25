// DEPRECATED: Implementation moved to com.karthick06.moneymanager.SMSBroadcastReceiver
// This file kept for reference - actual implementation in correct package structure

    override fun getName(): String = "SMSReaderModule"

    /**
     * Request SMS read permission from user
     * Works on Android 6.0+ (API 23+)
     */
    @ReactMethod
    fun requestSMSPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val activity = currentActivity

            if (activity == null) {
                promise.reject("ERROR", "Activity is null")
                return
            }

            // Check Android version
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val permission = Manifest.permission.READ_SMS

                // Check if permission already granted
                if (ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED) {
                    promise.resolve(true)
                    return
                }

                // Request permission
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(permission),
                    REQUEST_CODE_READ_SMS
                )

                // Store promise for callback
                smsPermissionPromise = promise
            } else {
                // Pre-Android 6.0 - permission is granted at install time
                promise.resolve(true)
            }
        } catch (error: Exception) {
            promise.reject("ERROR", error.message)
        }
    }

    /**
     * Read SMS from device
     * Returns array of SMS messages
     */
    @ReactMethod
    fun readSMS(limit: Int, offset: Int, promise: Promise) {
        try {
            val context = reactApplicationContext
            val permission = Manifest.permission.READ_SMS

            // Check permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (ContextCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED) {
                    promise.reject("ERROR", "SMS permission not granted")
                    return
                }
            }

            // Read SMS from device
            val smsMessages = readDeviceSMS(context, limit, offset)
            promise.resolve(smsMessages)
        } catch (error: Exception) {
            promise.reject("ERROR", error.message ?: "Failed to read SMS")
        }
    }

    /**
     * Read SMS from device SMS content provider
     */
    private fun readDeviceSMS(context: Context, limit: Int, offset: Int): WritableArray {
        val smsList = WritableNativeArray()
        
        try {
            val contentResolver: ContentResolver = context.contentResolver
            val uri: Uri = Uri.parse("content://sms/")
            
            // Sort by date descending to get newest SMS first
            val cursor: Cursor? = contentResolver.query(
                uri,
                arrayOf("_id", "address", "body", "date", "type"),
                null,
                null,
                "date DESC LIMIT $limit OFFSET $offset"
            )

            cursor?.use {
                while (cursor.moveToNext()) {
                    try {
                        val id = cursor.getLong(cursor.getColumnIndex("_id"))
                        val address = cursor.getString(cursor.getColumnIndex("address"))
                        val body = cursor.getString(cursor.getColumnIndex("body"))
                        val date = cursor.getLong(cursor.getColumnIndex("date"))
                        val type = cursor.getInt(cursor.getColumnIndex("type"))

                        // Create SMS object
                        val sms = WritableNativeMap()
                        sms.putString("id", "sms_$id")
                        sms.putString("address", address ?: "Unknown")
                        sms.putString("body", body ?: "")
                        sms.putDouble("timestamp", date.toDouble())
                        sms.putInt("type", type) // 1=received, 2=sent
                        
                        smsList.pushMap(sms)
                    } catch (e: Exception) {
                        // Skip malformed SMS
                        continue
                    }
                }
            }
        } catch (error: Exception) {
            error.printStackTrace()
        }

        return smsList
    }

    companion object {
        private const val REQUEST_CODE_READ_SMS = 1001
        private var smsPermissionPromise: Promise? = null

        /**
         * Handle permission request result
         * Called from MainActivity
         */
        fun handlePermissionResult(requestCode: Int, grantResults: IntArray) {
            if (requestCode == REQUEST_CODE_READ_SMS) {
                val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
                smsPermissionPromise?.resolve(granted)
                smsPermissionPromise = null
            }
        }
    }
}
