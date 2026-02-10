package com.mosquedigitalclock.client.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mosquedigitalclock.client.model.MosqueConfig
import com.mosquedigitalclock.client.network.RetrofitClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
    private val _config = MutableStateFlow<MosqueConfig?>(null)
    val config = _config.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading = _isLoading.asStateFlow()

    fun fetchConfig(mosqueKey: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = RetrofitClient.apiService.getConfig(mosqueKey)
                if (response.isSuccessful) {
                    _config.value = response.body()
                }
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    init {
        // Continuous refresh every 30s logic could be added here
        viewModelScope.launch {
            while (true) {
                // Check if mosqueKey exists in a real app (e.g. from DataStore/SharedPreferences)
                // fetchConfig("test-key") 
                delay(30000)
            }
        }
    }
}
