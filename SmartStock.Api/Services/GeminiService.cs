using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SmartStock.Api.Interfaces;

namespace SmartStock.Api.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            // Trim() যোগ করা হয়েছে যাতে ভুলে স্পেস থাকলে রিমুভ হয়
            _apiKey = (configuration["Gemini:ApiKey"] ?? string.Empty).Trim();
        }

        public async Task<string> ListAvailableModelsAsync()
        {
            if (string.IsNullOrEmpty(_apiKey)) return "API Key missing.";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={_apiKey}";

            try
            {
                var response = await _httpClient.GetAsync(url);
                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                return $"Exception: {ex.Message}";
            }
        }

        public async Task<string> AnalyzeInventoryAsync(string inventoryJson)
        {
            if (string.IsNullOrEmpty(_apiKey)) return "API Key missing.";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={_apiKey}";

            var requestPayload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"You are an expert business analyst. Analyze the following data and provide a highly structured, professional report in HTML format. Use <h5> for headings, <ul> and <li> for points, and <strong> for highlighting. Ensure it is very clean and easy to read. Do NOT include markdown tags like ```html. Just return the raw HTML content. Data: {inventoryJson}" }
                        }
                    }
                }
            };

            return await ExecuteAiCallAsync(url, requestPayload);
        }

        public async Task<string> ChatWithDataAsync(string userQuery, string contextJson)
        {
            if (string.IsNullOrEmpty(_apiKey)) return "API Key missing.";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={_apiKey}";

            var requestPayload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"You are a helpful assistant for a stock management system. Answer the user's question based on the provided business data. If the answer isn't in the data, say you don't know. Provide answers in Bengali if asked in Bengali, otherwise in English. Context: {contextJson}. User Question: {userQuery}" }
                        }
                    }
                }
            };

            return await ExecuteAiCallAsync(url, requestPayload);
        }

        private async Task<string> ExecuteAiCallAsync(string url, object payload)
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var jsonString = JsonSerializer.Serialize(payload, jsonOptions);
            var content = new StringContent(jsonString, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                if (!response.IsSuccessStatusCode) return "AI Service currently unavailable.";

                var responseString = await response.Content.ReadAsStringAsync();
                using var jsonDoc = JsonDocument.Parse(responseString);

                return jsonDoc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "No response generated.";
            }
            catch
            {
                return "Error connecting to AI service.";
            }
        }

        public async Task<Dictionary<string, string>> GenerateProductDataAsync(string productName)
        {
            var result = new Dictionary<string, string>
            {
                { "description", "No description generated." },
                { "sku", "" }
            };

            if (string.IsNullOrEmpty(_apiKey)) return result;

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={_apiKey}";

            var requestPayload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"Generate a professional retail product description (max 2 sentences) and a unique, logical SKU code for: {productName}. Return ONLY a JSON object with keys 'description' and 'sku'. Example: {{\"description\": \"...\", \"sku\": \"...\"}}" }
                        }
                    }
                }
            };

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var jsonString = JsonSerializer.Serialize(requestPayload, jsonOptions);
            var content = new StringContent(jsonString, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                if (!response.IsSuccessStatusCode) return result;

                var responseString = await response.Content.ReadAsStringAsync();
                using var jsonDoc = JsonDocument.Parse(responseString);

                var aiRawText = jsonDoc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrEmpty(aiRawText)) return result;

                // এআই অনেক সময় ```json ... ``` এর ভেতরে ডাটা দেয়, সেটা ক্লিন করা
                var cleanJson = aiRawText.Replace("```json", "").Replace("```", "").Trim();
                using var aiData = JsonDocument.Parse(cleanJson);
                
                result["description"] = aiData.RootElement.GetProperty("description").GetString() ?? result["description"];
                result["sku"] = aiData.RootElement.GetProperty("sku").GetString() ?? "";

                return result;
            }
            catch
            {
                return result;
            }
        }


    }
}