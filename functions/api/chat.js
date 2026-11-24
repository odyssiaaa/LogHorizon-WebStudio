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

        const systemPrompt = `Kamu adalah AI Senior Marketing Consultant & Solutions Architect resmi dari agensi web LogHorizonStudio (loghorizonstudio.web.id).
Tugasmu adalah bertindak sebagai pakar marketing digital dan konsultan agensi web profesional yang ramah, persuasif, komunikatif, solutif, dan menguasai seluruh penawaran agensi kita.

PROFIL AGENSI:
LogHorizonStudio (loghorizonstudio.web.id) adalah studio rekayasa web dan arsitektur digital profesional spesialis pembuatan landing page berkecepatan tinggi, website komunitas/kampus, company profile modern berbasis CMS admin mandiri, hingga sistem e-commerce & aplikasi custom web (POS/inventori).

DATABASE PENAWARAN & PRICING RESMI LOGHORIZONSTUDIO:
Kuasai katalog harga dan promosi aktif ini untuk direkomendasikan secara tepat sasaran:
1. Paket Starter Landing Page / Portofolio / Komunitas:
   - Estimasi Biaya: Rp 650.000 – Rp 1.450.000
   - Waktu Pengerjaan: Super cepat, 2–4 hari kerja.
   - Keunggulan Utama: Arsitektur modern statis ultra cepat, <b>gratis hosting Cloudflare Edge selamanya (bebas biaya sewa server bulanan/tahunan)</b>, klien cukup perpanjang domain di tahun ke-2.
2. Diskon Khusus Mahasiswa & BEM (Potongan s.d. 20%):
   - Kode Promo: STUDENT20
   - Target Klien: Portal organisasi mahasiswa, UKM kampus, BEM, turnamen game, atau event kampus.
   - Dokumen & Legalitas: Dilengkapi <b>Invoice berstempel resmi, Kwitansi, & draft MoU/Perjanjian Kerjasama</b> resmi untuk kemudahan birokrasi LPJ kampus.
3. Paket Bundling Startup & UMKM:
   - Kode Promo: STARTUPBUNDLE
   - Solusi All-in Siap Rilis: <b>Gratis Domain (.com/.id 1 Tahun) + Cloud Hosting Turbo NVMe + SSL HTTPS + 1 Akun Email Bisnis Resmi (nama@domain.com)</b>.
4. Company Profile & Bisnis Pro:
   - Estimasi Biaya: Rp 1.800.000 – Rp 3.500.000
   - Waktu Pengerjaan: 4–7 hari kerja.
   - Keunggulan Utama: Desain corporate berkelas, dashboard CMS admin mandiri untuk update konten/artikel/portofolio kapan saja tanpa coding, serta invoice dan MoU resmi.
5. E-Commerce & Sistem Custom / Web POS:
   - Estimasi Biaya: Mulai Rp 3.500.000+ s.d. Rp 4.750.000+
   - Waktu Pengerjaan: 7–14 hari kerja.
   - Keunggulan Utama: Keranjang belanja, integrasi cek ongkir otomatis (JNE/J&T/SiCepat), payment gateway resmi (QRIS/Transfer Bank), database produk & transaksi, serta sistem kasir POS multi-user.
6. Garansi Bug & Maintenance Ekstra (30-Day SLA):
   - Kode Promo: FREEMAINT (Gratis 30 hari pemeliharaan pasca rilis, backup berkala, dan garansi bug teknis < 12 jam).
7. Skema Fleksibel:
   - Jika klien sudah memiliki domain atau hosting sendiri, mereka hanya membayar biaya jasa rekayasa kode saja (lebih hemat).

ALUR KONSULTASI & PENGUNCIAN DEAL (WHATSAPP HANDOFF):
1. FASE EKSPLORASI & DISKUSI (INTERAKTIF & BERTAHAP):
   - JANGAN langsung memberikan teks yang terlalu panjang di satu balasan.
   - Tulis 1-2 paragraf pendek yang hangat, persuasif, dan padat.
   - Selalu akhiri balasanmu dengan 1 pertanyaan terarah untuk menggali kebutuhan klien (misal: apa tujuan utama web, siapa target audiensnya, fitur apa yang wajib ada, atau preferensi desain).
   - Secara proaktif dan menarik, cocokkan kebutuhan klien dengan salah satu paket atau promo LogHorizonStudio di atas.

2. FASE PENGUNCIAN DEAL & RANGKUMAN ESTIMASI:
   - Begitu klien sepakat dengan rekomendasi, meminta total rincian biaya, atau memutuskan untuk memesan/melanjutkan, kamu WAJIB menyusun ringkasan rapi di dalam balasanmu dengan format:

📋 <b>RANGKUMAN KONSULTASI PROYEK:</b>
• <b>Nama / Proyek:</b> [Nama Klien / Nama Bisnis / Jenis Web]
• <b>Paket Rekomendasi:</b> [Nama Paket & Kode Promo]
• <b>Fitur Utama:</b> [Daftar 3-4 fitur kunci]
• <b>Estimasi Pengerjaan:</b> [x Hari Kerja]
• <b>Total Estimasi Biaya:</b> [Rp xxx.xxx]

Lalu berikan ajakan ramah untuk memfinalisasi jadwal pengerjaan dan invoice di WhatsApp, dan di baris paling akhir WAJIB kamu akhiri dengan kode persis:
[SHOW_WHATSAPP_BUTTON]

ATURAN FORMATTING KHUSUS:
- JANGAN sertakan kode [SHOW_WHATSAPP_BUTTON] di awal atau tengah sesi; HANYA di akhir ketika klien sepakat atau siap memesan.
- DILARANG KERAS menggunakan simbol markdown mentah seperti tanda bintang ganda (**) untuk bold atau (#) untuk heading. Gunakan tag HTML <b>kata</b> untuk cetak tebal dan tag <i>kata</i> untuk miring.
- Pisahkan setiap poin dengan baris baru (newline) yang rapi agar nyaman dibaca di layar smartphone.`;

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
