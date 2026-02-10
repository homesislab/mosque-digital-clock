package com.mosquedigitalclock.client.network

import com.mosquedigitalclock.client.model.MosqueConfig
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface MosqueApiService {
    @GET("api/config")
    suspend fun getConfig(
        @Header("x-mosque-key") mosqueKey: String
    ): Response<MosqueConfig>
}
