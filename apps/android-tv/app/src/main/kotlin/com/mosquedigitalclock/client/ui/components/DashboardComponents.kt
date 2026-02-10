package com.mosquedigitalclock.client.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.tv.material3.*
import coil.compose.AsyncImage
import com.mosquedigitalclock.client.model.FinanceAccount
import com.mosquedigitalclock.client.model.MosqueConfig
import java.text.SimpleDateFormat
import java.util.*
import java.util.Locale
import kotlinx.coroutines.delay

// --- COLORS & STYLES ---
val GlassWhite = Color(0xFFFFFFFF).copy(alpha = 0.9f)
val AccentOrange = Color(0xFFF97316)
val DarkBackground = Color(0xFF0F172A)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TopBar(config: MosqueConfig) {
    var currentTime by remember { mutableStateOf(Date()) }

    LaunchedEffect(Unit) {
        while (true) {
            currentTime = Date()
            kotlinx.coroutines.delay(1000)
        }
    }

    val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    val dayFormat = SimpleDateFormat("EEEE", Locale("id", "ID"))
    val dateFormat = SimpleDateFormat("d MMMM yyyy", Locale("id", "ID"))

    Surface(
        shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp),
        colors = SurfaceDefaults.colors(containerColor = GlassWhite),
        modifier = Modifier
            .fillMaxWidth(0.95f)
            .height(80.dp)
            .padding(horizontal = 0.dp)
            .shadow(10.dp, RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 1. Clock
            Box(
                modifier = Modifier
                    .weight(3f)
                    .fillMaxHeight(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = timeFormat.format(currentTime),
                    style = MaterialTheme.typography.displayMedium.copy(
                        color = Color.Black,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 56.sp
                    )
                )
            }

            // Separator
            VerticalDivider()

            // 2. Mosque Info
            Column(
                modifier = Modifier
                    .weight(4f)
                    .fillMaxHeight(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (config.mosqueInfo.logoUrl != null) {
                        AsyncImage(
                            model = config.mosqueInfo.logoUrl,
                            contentDescription = "Logo",
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    } else {
                        Text(text = "🕌", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        text = config.mosqueInfo.name.uppercase(),
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = Color.Black,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                    )
                }
                Text(
                    text = config.mosqueInfo.address,
                    style = MaterialTheme.typography.labelSmall.copy(color = Color.DarkGray)
                )
            }

            // Separator
            VerticalDivider()

            // 3. Date
            Column(
                modifier = Modifier
                    .weight(3f)
                    .fillMaxHeight(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Hijri Date Placeholder", // Need a library or helper for this
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                )
                Text(
                    text = "${dayFormat.format(currentTime).uppercase()}, ${dateFormat.format(currentTime).uppercase()}",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
            }
        }
    }
}

@Composable
fun VerticalDivider() {
    Box(
        modifier = Modifier
            .width(2.dp)
            .height(30.dp)
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Color(0xFFFFB200), Color.Transparent)
                )
            )
    )
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun BottomBar(config: MosqueConfig) {
    Column {
        // Prayer Times Strip
        Surface(
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            colors = SurfaceDefaults.colors(containerColor = GlassWhite),
            modifier = Modifier
                .fillMaxWidth(0.98f)
                .height(96.dp)
                .align(Alignment.CenterHorizontally)
                .shadow(15.dp, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
        ) {
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PrayerTile("SUBUH", "04:37")
                PrayerTile("SYURUQ", "05:57")
                PrayerTile("DZUHUR", "12:08")
                PrayerTile("ASHAR", "15:24", isActive = true, countdown = "-00:28:34")
                PrayerTile("MAGHRIB", "18:17")
                PrayerTile("ISYA", "19:29")
            }
        }

        // Running Text
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(DarkBackground),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(0.dp)) // Add skew if possible
                    .background(Color(0xFFEA580C))
                    .padding(horizontal = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "INFO TERKINI",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
            
            // Ticker placeholder
            Text(
                text = config.display.runningText.joinToString(" • "),
                modifier = Modifier
                    .padding(horizontal = 16.dp)
                    .fillMaxWidth(),
                style = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                maxLines = 1
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PrayerTile(label: String, time: String, isActive: Boolean = false, countdown: String? = null) {
    Column(
        modifier = Modifier
            .fillMaxHeight()
            .width(160.dp)
            .then(
                if (isActive) Modifier.background(Color(0xFFEA580C)) else Modifier
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                color = if (isActive) Color.White else Color.Gray,
                fontWeight = FontWeight.Bold
            )
        )
        Text(
            text = time,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = if (isActive) Color.White else Color.Black,
                fontWeight = FontWeight.Black,
                fontSize = 32.sp
            )
        )
        if (isActive && countdown != null) {
            Text(
                text = countdown,
                style = MaterialTheme.typography.labelSmall.copy(
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun FinanceSlide(config: MosqueConfig) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "LAPORAN KEUANGAN MASJID",
            style = MaterialTheme.typography.headlineLarge.copy(
                color = AccentOrange,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp
            ),
            modifier = Modifier.padding(bottom = 32.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(0.9f),
            horizontalArrangement = Arrangement.spacedBy(40.dp)
        ) {
            // Summary Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(300.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF45220C), Color.Black)
                        )
                    )
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "TOTAL SELURUH SALDO",
                        style = MaterialTheme.typography.labelLarge.copy(
                            color = Color.White.copy(alpha = 0.6f),
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = "Rp ${String.format(Locale("id", "ID"), "%,d", config.finance.totalBalance)}",
                        style = MaterialTheme.typography.displayLarge.copy(
                            color = Color(0xFFFBBF24),
                            fontWeight = FontWeight.Black,
                            fontSize = 64.sp
                        ),
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Text(
                            text = "Update: ${config.finance.lastUpdated}",
                            style = MaterialTheme.typography.labelSmall.copy(color = Color.Gray)
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(Color(0xFF065F46).copy(alpha = 0.4f))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "LAPORAN RESMI",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFF34D399),
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Black
                                )
                            )
                        }
                    }
                }
            }

            // Accounts List
            Column(
                modifier = Modifier.weight(1.2f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                config.finance.accounts.take(3).forEach { account ->
                    FinanceAccountCard(account)
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun FinanceAccountCard(account: FinanceAccount) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        colors = SurfaceDefaults.colors(containerColor = Color.White.copy(alpha = 0.05f)),
        modifier = Modifier.fillMaxWidth().height(80.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = account.name,
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
                Row {
                    FinanceIndicator("MASUK", account.income, Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(16.dp))
                    FinanceIndicator("KELUAR", account.expense, Color(0xFFF43F5E))
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "SALDO AKHIR",
                    style = MaterialTheme.typography.labelSmall.copy(color = Color.Gray)
                )
                Text(
                    text = "Rp ${String.format(Locale("id", "ID"), "%,d", account.balance)}",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = Color(0xFFFBBF24),
                        fontWeight = FontWeight.Black
                    )
                )
            }
        }
    }
}

@Composable
fun FinanceIndicator(label: String, amount: Long, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(6.dp).clip(RoundedCornerShape(50)).background(color))
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = "$label: RP ${String.format(Locale("id", "ID"), "%,d", amount)}",
            style = MaterialTheme.typography.labelSmall.copy(
                color = color,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}
