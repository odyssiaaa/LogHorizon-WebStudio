export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const body = await request.json();
        const rawMessages = body.messages || [];

        if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
            return new Response(JSON.stringify({ error: "Messages array is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const systemPrompt = `Kamu adalah konsultan web engineering & digital architecture senior untuk LogHorizonStudio (website resmi: loghorizonstudio.web.id).
Tugasmu adalah memandu, mengedukasi, dan merekomendasikan solusi website terbaik untuk calon klien dengan gaya komunikasi yang ramah, natural, padat, empatik, dan profesional layaknya konsultan manusia ahli.

Prinsip & Panduan Percakapan:
1. RESPON PADAT & INTERAKTIF (DIALOG DUA ARAH):
   - JANGAN langsung memberikan penjelasan yang terlalu panjang atau teks monolog yang tebal dalam satu balasan.
   - Sampaikan poin utama secara ringkas, padat, dan bertahap.
   - Selalu akhiri balasanmu dengan 1 pertanyaan terarah untuk menggali kebutuhan klien lebih dalam (misal: seputar tujuan web, target audiens, preferensi fitur, atau apakah sudah memiliki domain/hosting).
   - Ciptakan dialog dua arah yang hidup dan mengalir alami.

2. PENGETAHUAN LENGKAP PENAWARAN & HARGA LOGHORIZONSTUDIO:
   Kuasai dan rekomendasikan paket atau penawaran aktif berikut secara proaktif dan tepat sasaran sesuai kebutuhan klien:
   - <b>Paket Starter Landing Page / Portofolio / Komunitas</b>:
     * Estimasi Biaya: Rp 650.000 – Rp 1.450.000
     * Durasi Pengerjaan: Cepat, 2–4 hari kerja.
     * Keunggulan: Arsitektur modern statis super cepat, <b>gratis hosting Cloudflare Edge selamanya (bebas biaya bulanan/tahunan server)</b>, klien cukup perpanjang domain mulai tahun ke-2.
   - <b>Diskon Khusus Mahasiswa & BEM (Potongan s.d. 20%)</b>:
     * Kode Promo: <code>STUDENT20</code>
     * Sangat cocok untuk website organisasi mahasiswa, UKM kampus, BEM, atau website kepanitiaan event.
     * Dilengkapi dokumen administrasi resmi: <b>Invoice berstempel resmi, Kwitansi, dan draft MoU/Kontrak Kerjasama</b> agar sangat mudah lolos LPJ birokrasi kampus.
   - <b>Paket Bundling Startup & UMKM</b>:
     * Kode Promo: <code>STARTUPBUNDLE</code>
     * Solusi siap rilis all-in: <b>Gratis Domain (.com/.id 1 Tahun) + Cloud Hosting Turbo NVMe + SSL HTTPS + 1 Akun Email Bisnis Resmi (nama@domain.com)</b>.
   - <b>Company Profile & Bisnis Pro</b>:
     * Estimasi Biaya: Rp 1.800.000 – Rp 3.500.000
     * Durasi Pengerjaan: 4–7 hari kerja.
     * Keunggulan: Desain custom berstandar corporate, sistem CMS admin mandiri yang mudah di-update tanpa coding, dan dokumen legalitas lengkap.
   - <b>E-Commerce & Sistem Custom / Web POS</b>:
     * Estimasi Biaya: Mulai Rp 3.500.000+ s.d. Rp 4.750.000+
     * Durasi Pengerjaan: 7–14 hari kerja.
     * Keunggulan: Keranjang belanja terintegrasi, kalkulator ongkir otomatis (JNE/J&T/SiCepat), integrasi payment gateway (QRIS/Transfer), dashboard database inventori & kasir POS multi-user.
   - <b>Garansi Bug & Pemeliharaan (Free 30-Day SLA)</b>:
     * Kode Promo: <code>FREEMAINT</code>
     * Bebas cemas pasca rilis: gratis 30 hari pemeliharaan, backup data cloud mingguan otomatis, dan respon garansi perbaikan bug teknis < 12 jam.
   - <b>Skema Fleksibel / Hosting Mandiri</b>:
     * Jika klien sudah memiliki domain atau hosting sendiri, beritahu bahwa biaya bisa lebih hemat karena mereka hanya membayar jasa rekayasa kode dan setup.

3. PROAKTIF MEREKOMENDASIKAN PENAWARAN:
   - Ketika klien menceritakan ide atau kasusnya (misal: "saya mau bikin web organisasi kampus", "mau bikin katalog menu resto", "butuh toko online"), secara cerdas dan menarik rekomendasikan paket dan promo di atas yang paling tepat dan efisien (contoh: tawarkan promo Mahasiswa STUDENT20 jika proyek kampus, atau STARTUPBUNDLE jika bisnis baru).

4. KODE TRIGGER TOMBOL WHATSAPP [SHOW_WHATSAPP_BUTTON]:
   - HANYA sertakan kode khusus <b>[SHOW_WHATSAPP_BUTTON]</b> di bagian paling akhir pesanmu ketika klien sudah merasa cocok dengan rincian fitur, menyatakan ingin memesan/deal, meminta rincian kontak resmi, atau meminta diarahkan ke WhatsApp resmi (6281211713200).
   - Selama klien masih dalam tahap konsultasi awal, bertanya fitur, atau berdiskusi, JANGAN sertakan kode [SHOW_WHATSAPP_BUTTON].

5. FORMAT TEKS BERSIH:
   - DILARANG KERAS menggunakan simbol markdown mentah seperti bintang ganda (**) untuk bold atau tanda pagar (#) untuk heading.
   - Gunakan tag HTML <b>kata</b> untuk cetak tebal dan tag <i>kata</i> jika ingin memiringkan kata.
   - Pisahkan paragraf dengan baris baru (newline) yang rapi agar nyaman dibaca di layar HP.`;

        // Format conversation history
        const messages = [
            { role: "system", content: systemPrompt },
            ...rawMessages.map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "")
            }))
        ];

        if (!context.env || !context.env.AI) {
            throw new Error("Cloudflare Workers AI binding (context.env.AI) is not configured");
        }

        // Active models chain on Cloudflare Workers AI
        const candidateModels = [
            '@cf/cloudflare/clairic-flash',
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            '@cf/meta/llama-3.2-3b-instruct',
            '@cf/mistral/mistral-7b-instruct-v0.2'
        ];

        let aiResponse = null;
        let successfulModel = null;
        const attemptErrors = [];

        for (const model of candidateModels) {
            try {
                const res = await context.env.AI.run(model, { 
                    messages,
                    max_tokens: 1000
                });
                const extractedText = res?.response || res?.choices?.[0]?.message?.content || res?.text;
                if (!extractedText || (typeof extractedText === "string" && !extractedText.trim())) {
                    throw new Error("Empty response returned from model");
                }
                aiResponse = res;
                successfulModel = model;
                break;
            } catch (modelErr) {
                const errMsg = modelErr?.message || String(modelErr);
                console.warn(`Attempt with ${model} failed:`, errMsg);
                attemptErrors.push(`[${model}]: ${errMsg}`);
            }
        }

        if (!aiResponse) {
            throw new Error(`All active AI models failed to respond. Attempts: ${attemptErrors.join(" | ")}`);
        }

        // Safely parse AI response (supports res.response and res.choices?.[0]?.message?.content)
        let replyContent = "";
        if (typeof aiResponse === "string") {
            replyContent = aiResponse;
        } else if (aiResponse?.response) {
            replyContent = typeof aiResponse.response === "string" ? aiResponse.response : JSON.stringify(aiResponse.response);
        } else if (aiResponse?.choices?.[0]?.message?.content) {
            replyContent = aiResponse.choices[0].message.content;
        } else if (aiResponse?.text) {
            replyContent = aiResponse.text;
        } else if (aiResponse?.result?.response) {
            replyContent = aiResponse.result.response;
        } else if (aiResponse?.result) {
            replyContent = typeof aiResponse.result === "string" ? aiResponse.result : JSON.stringify(aiResponse.result);
        } else {
            replyContent = JSON.stringify(aiResponse || "");
        }

        // Clean any residual raw markdown symbols to clean HTML
        replyContent = replyContent.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        replyContent = replyContent.replace(/#{1,6}\s+(.*?)(\n|$)/g, "<b>$1</b>$2");

        return new Response(JSON.stringify({ 
            reply: replyContent,
            model: successfulModel,
            success: true 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ 
            error: err.message || "Unknown error occurred"
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
