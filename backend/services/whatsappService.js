export const sendWhatsAppText = async (
  phone,
  message
) => {
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const graphVersion =
    process.env.WHATSAPP_GRAPH_VERSION;

  if (
    !phoneNumberId ||
    !accessToken ||
    !graphVersion
  ) {
    throw new Error(
      "WhatsApp API environment variables are missing"
    );
  }

  const url =
    `https://graph.facebook.com/` +
    `${graphVersion}/` +
    `${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,

      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      messaging_product: "whatsapp",

      recipient_type: "individual",

      to: phone,

      type: "text",

      text: {
        preview_url: true,

        body: message,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp API error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "WhatsApp API request failed"
    );
  }

  return data;
};