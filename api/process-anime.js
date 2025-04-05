export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // ✅ CORS ayarları (Shopify domainine özel)
  res.setHeader("Access-Control-Allow-Origin", "https://casetify.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ CORS preflight (OPTIONS isteği)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "Missing image" });
  }

  try {
    const response = await fetch("https://stablediffusionapi.com/api/v4/dreambooth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: process.env.SD_API_KEY,
        model_id: "toonyou",
        prompt: "anime ghibli style portrait, cel shaded, pastel colors",
        negative_prompt: "bad quality, blurry, ugly",
        width: "512",
        height: "512",
        samples: "1",
        num_inference_steps: "30",
        guidance_scale: 7.5,
        image: base64Image.split(',')[1], // sadece base64 içeriği
      }),
    });

    const result = await response.json();

    if (result.status !== "success") {
      return res.status(500).json({ error: result.message || "Failed to generate image" });
    }

    const outputUrl = result.output[0];
    return res.status(200).json({ imageUrl: outputUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Something went wrong" });
  }
}
