const PAYSTACK_API = "https://api.paystack.co";

function jsonHeaders(secretKey) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export async function initializePaystackTransaction({
  secretKey,
  email,
  amount,
  currency,
  reference,
  callbackUrl,
  metadata = {},
}) {
  if (!secretKey || !email || !amount || !currency || !reference) {
    return {
      success: false,
      reason: "missing_required_payment_parameters",
    };
  }

  try {
    const response = await fetch(
      `${PAYSTACK_API}/transaction/initialize`,
      {
        method: "POST",
        headers: jsonHeaders(secretKey),
        body: JSON.stringify({
          email,
          amount: String(amount),
          currency,
          reference,
          callback_url: callbackUrl,
          metadata: JSON.stringify(metadata),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        success: false,
        reason: "paystack_initialization_failed",
        message: data?.message || "Unable to initialize Paystack transaction",
      };
    }

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    console.error("AfriResolve Paystack initialization failed:", error);

    return {
      success: false,
      reason: "paystack_request_failed",
    };
  }
}

export async function verifyPaystackTransaction({
  secretKey,
  reference,
}) {
  if (!secretKey || !reference) {
    return {
      success: false,
      reason: "missing_secret_or_reference",
    };
  }

  try {
    const response = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        success: false,
        reason: "paystack_verification_failed",
        message: data?.message || "Unable to verify Paystack transaction",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("AfriResolve Paystack verification failed:", error);

    return {
      success: false,
      reason: "paystack_request_failed",
    };
  }
}
