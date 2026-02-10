package com.mosquedigitalclock.client.model

import com.google.gson.annotations.SerializedName

data class MosqueConfig(
    @SerializedName("mosqueKey") val mosqueKey: String = "",
    @SerializedName("mosqueInfo") val mosqueInfo: MosqueInfo = MosqueInfo(),
    @SerializedName("iqamah") val iqamah: IqamahConfig = IqamahConfig(),
    @SerializedName("audio") val audio: AudioConfig = AudioConfig(),
    @SerializedName("display") val display: DisplayConfig = DisplayConfig(),
    @SerializedName("ramadhan") val ramadhan: RamadhanConfig = RamadhanConfig(),
    @SerializedName("finance") val finance: FinanceConfig = FinanceConfig(),
    @SerializedName("prayerTimes") val prayerTimes: PrayerTimesConfig = PrayerTimesConfig(),
    @SerializedName("jumat") val jumat: List<JumatSchedule> = emptyList(),
    @SerializedName("sliderImages") val sliderImages: List<String> = emptyList()
)

data class MosqueInfo(
    @SerializedName("name") val name: String = "",
    @SerializedName("address") val address: String = "",
    @SerializedName("logoUrl") val logoUrl: String? = null
)

data class IqamahConfig(
    @SerializedName("waitTime") val waitTime: Map<String, Int> = emptyMap(),
    @SerializedName("audioEnabled") val audioEnabled: Boolean = false,
    @SerializedName("audioUrl") val audioUrl: String? = null
)

data class AudioConfig(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("url") val url: String = "",
    @SerializedName("playBeforeMinutes") val playBeforeMinutes: Int = 10,
    @SerializedName("customSchedule") val customSchedule: Map<String, CustomAudioSchedule> = emptyMap()
)

data class CustomAudioSchedule(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("url") val url: String = "",
    @SerializedName("playMode") val playMode: String = "before", // before, at, after
    @SerializedName("offsetMinutes") val offsetMinutes: Int = 0
)

data class DisplayConfig(
    @SerializedName("theme") val theme: String = "dark",
    @SerializedName("showSeconds") val showSeconds: Boolean = true,
    @SerializedName("showHijriDate") val showHijriDate: Boolean = true,
    @SerializedName("runningText") val runningText: List<String> = emptyList(),
    @SerializedName("gallery") val gallery: List<String> = emptyList()
)

data class PrayerTimesConfig(
    @SerializedName("calculationMethod") val calculationMethod: String = "Kemenag",
    @SerializedName("coordinates") val coordinates: Coordinates = Coordinates(),
    @SerializedName("adjustments") val adjustments: Map<String, Int> = emptyMap()
)

data class Coordinates(
    @SerializedName("lat") val lat: Double = -6.2088,
    @SerializedName("lng") val lng: Double = 106.8456
)

data class JumatSchedule(
    @SerializedName("date") val date: String = "",
    @SerializedName("khotib") val khotib: String = "",
    @SerializedName("imam") val imam: String = "",
    @SerializedName("muadzin") val muadzin: String = ""
)

data class RamadhanConfig(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("imsakOffset") val imsakOffset: Int = 10,
    @SerializedName("imsakAudioEnabled") val imsakAudioEnabled: Boolean = false,
    @SerializedName("imsakAudioUrl") val imsakAudioUrl: String? = null,
    @SerializedName("imsakAudioDuration") val imsakAudioDuration: Int = 30
)

data class FinanceConfig(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("accounts") val accounts: List<FinanceAccount> = emptyList(),
    @SerializedName("totalBalance") val totalBalance: Long = 0,
    @SerializedName("lastUpdated") val lastUpdated: String = ""
)

data class FinanceAccount(
    @SerializedName("name") val name: String = "",
    @SerializedName("balance") val balance: Long = 0,
    @SerializedName("income") val income: Long = 0,
    @SerializedName("expense") val expense: Long = 0
)
