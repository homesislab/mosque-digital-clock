package com.mosquedigitalclock.client.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.tv.material3.ExperimentalTvMaterial3Api
import coil.compose.AsyncImage
import com.mosquedigitalclock.client.model.MosqueConfig
import kotlinx.coroutines.delay

sealed class SlideType {
    data class Image(val url: String) : SlideType()
    object Finance : SlideType()
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun MainSlider(config: MosqueConfig, modifier: Modifier = Modifier) {
    val slides = remember(config) {
        val list = mutableListOf<SlideType>()
        list.addAll(config.sliderImages.map { SlideType.Image(it) })
        if (config.finance.enabled) {
            list.add(SlideType.Finance)
        }
        list
    }

    if (slides.isEmpty()) return

    var currentIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(slides) {
        if (slides.size > 1) {
            while (true) {
                delay(10000) // 10 seconds per slide
                currentIndex = (currentIndex + 1) % slides.size
            }
        }
    }

    Box(modifier = modifier) {
        AnimatedContent(
            targetState = slides[currentIndex],
            transitionSpec = {
                fadeIn() togetherWith fadeOut()
            },
            label = "MainSliderFade"
        ) { slide ->
            when (slide) {
                is SlideType.Image -> {
                    AsyncImage(
                        model = slide.url,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                is SlideType.Finance -> {
                    FinanceSlide(config = config)
                }
            }
        }
    }
}
