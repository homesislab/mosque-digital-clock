package com.mosquedigitalclock.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.mosquedigitalclock.client.model.MosqueConfig
import com.mosquedigitalclock.client.network.RetrofitClient
import com.mosquedigitalclock.client.ui.components.BottomBar
import com.mosquedigitalclock.client.ui.components.MainSlider
import com.mosquedigitalclock.client.ui.components.TopBar
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalTvMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var config by remember { mutableStateOf<MosqueConfig?>(null) }
            val mosqueKey = "default" // Placeholder, should come from setup/prefs

            // Initial and periodic fetch
            LaunchedEffect(Unit) {
                while (true) {
                    try {
                        val response = RetrofitClient.apiService.getConfig(mosqueKey)
                        if (response.isSuccessful) {
                            config = response.body()
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    delay(30000) // 30 seconds polling
                }
            }

            MaterialTheme {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black)
                ) {
                    if (config != null) {
                        // 1. Background Slider (Full Screen)
                        MainSlider(
                            config = config!!,
                            modifier = Modifier.fillMaxSize()
                        )

                        // 2. Light Overlay for readability (matches web-client)
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.White.copy(alpha = 0.1f))
                        )

                        // 3. UI Layer
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Header
                            TopBar(config = config!!)

                            // Footer (Bottom Bar includes PrayerTimes and RunningText)
                            BottomBar(config = config!!)
                        }
                    } else {
                        // Loading State
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Menyambungkan...",
                                style = MaterialTheme.typography.headlineMedium,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
