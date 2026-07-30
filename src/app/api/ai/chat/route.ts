import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDashboardStats } from "@/services/asset";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA API Key tidak dikonfigurasi." }, { status: 500 });
    }

    // 2. Parse request
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 3. Fetch live stats to inject as context
    const stats = await getDashboardStats(session.user.opdId);
    const { metrics, charts } = stats;

    const kondisiSummary = [
      `- Baik/Normal: ${metrics.normal} aset`,
      `- Rusak Ringan: ${metrics.rusakRingan} aset`,
      `- Rusak Berat: ${metrics.rusakBerat} aset`,
      `- Dalam Perbaikan: ${metrics.perbaikan} aset`,
      `- Dipinjam: ${metrics.dipinjam} aset`,
      `- Hilang: ${metrics.hilang} aset`,
    ].join("\n");

    const distribusiTop = charts.byDistribution
      .slice(0, 5)
      .map((d) => `  * ${d.name}: ${d.total} aset`)
      .join("\n");

    const categoryTop = charts.byType
      .slice(0, 5)
      .map((c) => `  * ${c.name}: ${c.total} aset`)
      .join("\n");

    const kibSummary = charts.byKib
      .slice(0, 5)
      .map((k) => `  * ${k.name} (${k.kode}): ${k.value} aset`)
      .join("\n");

    const totalValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(metrics.totalValue);

    const systemPrompt = `Kamu adalah Asisten Inventaris AI yang cerdas, ramah, dan membantu untuk sistem manajemen aset pemerintah bernama "${session.user.opdName || "SKPD"}". 
Kamu bernama "AssetAI" dan berbicara dalam Bahasa Indonesia yang sopan dan profesional namun tetap mudah dipahami.

Berikut adalah DATA INVENTARIS TERKINI dari organisasi ini yang perlu kamu gunakan untuk menjawab pertanyaan:

📊 RINGKASAN ASET:
- Total Aset: ${metrics.total} unit
- Total Nilai Aset: ${totalValue}

🔍 STATUS KONDISI ASET:
${kondisiSummary}

🏢 5 UNIT KERJA DENGAN ASET TERBANYAK:
${distribusiTop || "  * (Tidak ada data)"}

📦 5 JENIS ASET TERBANYAK (KATEGORI):
${categoryTop || "  * (Tidak ada data)"}

📋 5 KIB (Kartu Inventaris Barang) TERBANYAK:
${kibSummary || "  * (Tidak ada data)"}

Ketentuan menjawab:
1. Gunakan data di atas saat menjawab pertanyaan terkait inventaris.
2. Jika ditanya tentang aset yang spesifik (nomor register, detail lengkap), jelaskan bahwa kamu hanya memiliki data ringkasan dan arahkan user ke halaman Data Aset.
3. Bisa memberikan analisis, rekomendasi, dan insight berdasarkan data di atas.
4. Jawab dengan format yang rapi, gunakan emoji bila sesuai konteks.
5. Jika ada pertanyaan di luar konteks inventaris, tetap bantu semampunya namun ingatkan fokus utama sistem ini adalah manajemen aset.`;

    const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, "");

    // List of supported models ordered by speed & reliability
    const modelCandidates = [
      "nvidia/nemotron-mini-4b-instruct",
      "nvidia/nvidia-nemotron-nano-9b-v2",
      "meta/llama-3.2-3b-instruct",
      "nvidia/llama-3.3-nemotron-super-49b-v1",
    ];

    let aiMessage = "";
    let lastError = "";

    for (const model of modelCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per model call

        const response = await fetch(
          "https://integrate.api.nvidia.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cleanApiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages,
              ],
              temperature: 0.5,
              top_p: 0.9,
              max_tokens: 512,
              stream: false,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          aiMessage = data.choices?.[0]?.message?.content || "";
          if (aiMessage) break;
        } else {
          const errText = await response.text();
          console.warn(`NVIDIA API model ${model} failed (${response.status}):`, errText);
          lastError = `Model ${model}: ${errText}`;
        }
      } catch (e: any) {
        console.warn(`Error connecting with model ${model}:`, e);
        lastError = e.message;
      }
    }

    if (!aiMessage) {
      console.error("All NVIDIA models failed. Last error:", lastError);
      return NextResponse.json(
        { error: "Gagal menghubungi API AI. Pastikan API key NVIDIA valid." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: aiMessage });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
