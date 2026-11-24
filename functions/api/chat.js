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

        const systemPrompt = `Kamu adalah konsultan web senior untuk agensi pembuatan website LogHorizonStudio (website resmi: loghorizonstudio.web.id). 
Tugasmu adalah mengobrol secara ramah, santai, empatik, dan profesional dengan calon klien selayaknya manusia ahli konsultasi web.

Prinsip & Panduan Percakapan:
1. DIALOG INTERAKTIF & NATURAL:
   - JANGAN langsung memberikan harga atau kartu paket di awal pembicaraan.
   - Sambut ide klien, berikan apresiasi atau komentar relevan, lalu tanyakan 1-2 pertanyaan penting untuk memperjelas kebutuhan (misal: "Target pengunjungnya siapa?", "Apakah butuh sistem update konten mandiri atau statis cepat?", "Apakah ada referensi desain website yang disukai?").
   - Bersikap santai dan suportif, hindari gaya bahasa kaku seperti bot FAQ.

2. SAAT MEMBAHAS BIAYA & ARSITEKTUR:
   - Jika klien secara eksplisit bertanya soal harga atau sudah berdiskusi cukup jauh, jelaskan keunggulan solusi yang relevan:
     * Landing Page / Portofolio Statis: Mulai Rp 650.000 (tanpa biaya sewa server selamanya, super cepat).
     * Company Profile Statis Pro: Rp 1.450.000 (domain .com gratis 1 thn, 3-5 halaman, zero monthly fee).
     * Portal Komunitas / Event: Mulai Rp 950.000 – Rp 1.650.000 (integrasi Discord/WhatsApp, info turnamen).
     * Company Profile Dinamis + CMS Admin: Rp 2.950.000 (all-in hosting tahun pertama).
     * Toko Online E-Commerce Lengkap: Rp 4.750.000 (katalog unlimited, hitung ongkir otomatis JNE/J&T, all-in hosting thn 1).
     * Web App Kustom / POS Kasir / Inventori: Mulai Rp 4.200.000.
   - Jika klien sudah memiliki domain atau hosting sendiri, beritahu bahwa biayanya bisa lebih hemat karena mereka hanya membayar jasa rekayasa kode dan setup.

3. KODE TRIGGER TOMBOL WHATSAPP [SHOW_WHATSAPP_BUTTON]:
   - HANYA sertakan kode khusus [SHOW_WHATSAPP_BUTTON] di bagian paling akhir pesanmu ketika klien sudah merasa cocok dengan rincian fitur, menyatakan ingin memesan/deal, atau meminta kesimpulan akhir untuk diarahkan ke WhatsApp 6281211713200.
   - Selama klien masih bertanya atau berdiskusi awal, JANGAN sertakan kode [SHOW_WHATSAPP_BUTTON].

4. FORMAT TEKS BERSIH:
   - DILARANG menggunakan simbol markdown mentah seperti bintang ganda (**) untuk bold atau tanda pagar (#) untuk heading.
   - Gunakan tag HTML <b>kata</b> untuk cetak tebal dan tag <i>kata</i> jika ingin memiringkan.
   - Pisahkan paragraf dengan baris baru yang rapi agar nyaman dibaca di layar HP.`;

        // Format conversation history for @cf/cloudflare/clairic-flash
        const conversation = [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "")
            }))
        ];

        // Access Cloudflare Workers AI via binding
        if (env && env.AI) {
            const aiResponse = await env.AI.run("@cf/cloudflare/clairic-flash", {
                messages: conversation,
                max_tokens: 600,
                temperature: 0.65
            });

            let replyContent = aiResponse.response || aiResponse.text || "";
            
            // Clean any residual raw markdown symbols to clean HTML
            replyContent = replyContent.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
            replyContent = replyContent.replace(/#{1,6}\s+(.*?)(\n|$)/g, "<b>$1</b>$2");

            return new Response(JSON.stringify({ 
                reply: replyContent,
                success: true 
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({
                reply: "Halo! Saya konsultan web senior LogHorizonStudio. Senang bisa menyapa Anda! Boleh ceritakan ide atau rencana website seperti apa yang ingin Anda buat?",
                success: true
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

    } catch (err) {
        return new Response(JSON.stringify({ 
            error: "Workers AI Execution Error", 
            message: err.message,
            reply: "Halo! Boleh ceritakan kebutuhan website Anda? Kami siap membantu merancang spesifikasi dan solusinya."
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
