export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const body = await request.json();
        const messages = body.messages || [];

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Messages array is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const systemPrompt = `Kamu adalah konsultan web senior untuk agensi pembuatan website LogHorizonStudio (website: loghorizonstudio.web.id). 
Tugasmu adalah mengobrol secara ramah, santai, profesional, dan natural dengan calon klien yang ingin membuat website (baik landing page, company profile, e-commerce / toko online, maupun custom portal/aplikasi web).

Pedoman Komunikasi Penting:
1. Jangan langsung memberikan harga total di pesan pembuka. Ajak ngobrol ramah dulu, tanyakan kebutuhan bisnis, target pengunjung, dan fitur spesifik yang mereka bayangkan.
2. Jelaskan konsep arsitektur dengan analogi yang mudah dipahami (misal: "Keunggulan landing page statis adalah tanpa sewa server selamanya dan super cepat").
3. Jika klien menanyakan harga atau setelah berdiskusi 2-3 kali tentang fitur, berikan perkiraan kisaran harga standar LogHorizon:
   - Landing Page Statis (UMKM / Portofolio): Mulai Rp 650.000 (tanpa sewa hosting selamanya).
   - Company Profile Statis Pro (Best Seller): Rp 1.450.000 (domain .com, 3-5 halaman, zero server fee).
   - Portal Komunitas / Event: Mulai Rp 950.000 – Rp 1.650.000.
   - Company Profile Dinamis + CMS Admin: Rp 2.950.000 (termasuk hosting tahun 1).
   - Toko Online E-Commerce Lengkap: Rp 4.750.000 (katalog unlimited, hitung ongkir otomatis, hosting tahun 1).
   - Sistem Kustom / Web App POS / Inventori: Mulai Rp 4.200.000.
4. Gaya Bahasa & Format:
   - Bersihkan dan HINDARI simbol markdown mentah seperti bintang ganda (**teks**).
   - Gunakan format HTML yang rapi seperti <b>teks tebal</b> untuk penekanan, dan baris baru biasa.
   - Di akhir respons saat klien sudah merasa cocok atau ingin melanjutkan ke tahap pemesanan, ajak klien untuk menekan tombol "Kirim Rancangan ke WhatsApp" agar bisa langsung terhubung dengan tim teknis LogHorizon.`;

        // Format messages for Cloudflare Workers AI (@cf/meta/llama-3-8b-instruct)
        const conversation = [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "")
            }))
        ];

        // Check if env.AI is bound
        if (env && env.AI) {
            const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
                messages: conversation,
                max_tokens: 600,
                temperature: 0.7
            });

            const replyContent = aiResponse.response || aiResponse.text || "";
            return new Response(JSON.stringify({ reply: replyContent }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } else {
            // Graceful fallback if AI binding is not yet attached in dashboard
            return new Response(JSON.stringify({
                reply: "Halo! Konsultasi AI backend kami aktif. Silakan hubungkan binding Cloudflare Workers AI (AI) pada dashboard Cloudflare Pages Anda.",
                fallback: true
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

    } catch (err) {
        return new Response(JSON.stringify({ 
            error: "Internal Server Error", 
            message: err.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
}
