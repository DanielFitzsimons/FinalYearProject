/* While this template provides a good starting point for using Wear Compose, you can always
 * take a look at https://github.com/android/wear-os-samples/tree/main/ComposeStarter and
 * https://github.com/android/wear-os-samples/tree/main/ComposeAdvanced to find the most up to date
 * changes to the libraries and their usages.
 */

package com.example.wearo.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Devices
import androidx.compose.ui.tooling.preview.Preview
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import com.example.wearo.R
import com.example.wearo.presentation.theme.AndroidTheme
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.widget.TextView
import androidx.compose.runtime.mutableStateOf


class MainActivity : ComponentActivity(), SensorEventListener {

  private lateinit var sensorManager: SensorManager
  private var heartRateSensor: Sensor? = null


  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    installSplashScreen()
    setTheme(android.R.style.Theme_DeviceDefault)

    sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
    heartRateSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)

    sensorManager.registerListener(this, heartRateSensor, SensorManager.SENSOR_DELAY_NORMAL)

    setContent {
      AndroidTheme {
        Box(
          modifier = Modifier.fillMaxSize(),
          contentAlignment = Alignment.Center
        ) {
          // This is where you'd dynamically update your UI based on heart rate data
          Text(text = "Heart Rate App")
        }
      }
    }
  }
  // Method to update the heart rate TextView
  fun updateHeartRateTextView(heartRate: Float) {
    // Ensure this runs on the main thread
    runOnUiThread {
      findViewById<TextView>(R.id.textView3).text = "Heart Rate: $heartRate"
    }
  }


  override fun onSensorChanged(event: SensorEvent?) {
    event?.let {
      if (it.sensor.type == Sensor.TYPE_HEART_RATE) {
        val heartRate = it.values.firstOrNull() ?: return
        // Update the heart rate TextView
        updateHeartRateTextView(heartRate)
      }
    }
  }


  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    // Handle sensor accuracy changes if needed
  }

  override fun onDestroy() {
    super.onDestroy()
    sensorManager.unregisterListener(this)
  }
}


@Composable
fun WearApp(greetingName: String) {
    AndroidTheme {
        Box(
                modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colors.background),
                contentAlignment = Alignment.Center
        ) {
            TimeText()
            Greeting(greetingName = greetingName)
        }
    }
}

@Composable
fun Greeting(greetingName: String) {
    Text(
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
            color = MaterialTheme.colors.primary,
            text = stringResource(R.string.hello_world, greetingName)
    )
}

@Preview(device = Devices.WEAR_OS_SMALL_ROUND, showSystemUi = true)
@Composable
fun DefaultPreview() {
    WearApp("Preview Android")
}
