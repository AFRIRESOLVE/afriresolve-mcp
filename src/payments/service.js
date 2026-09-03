import { authenticateCustomer } from "../billing/auth.js";
import { getPaymentPlan } from "./plans.js";
import { getLocalizedPaymentPrice } from "./markets.js";
import { initializePaystackTransaction } from "./paystack.js";

function createReference() {
  return `afr_${Date.now()}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function createPayment({
  db,
  secretKey,
  apiKey,
  plan,
  email,
  callbackUrl,
  country,
}) {
  const authentication = await authenticateCustomer(db, apiKey);

  if (!authentication.authenticated) {
    return {
      success: false,
      reason: authentication.reason || "authentication_failed",
    };
  }

  const paymentPlan = getPaymentPlan(plan);

  if (!paymentPlan) {
    return {
      success: false,
      reason: "invalid_payment_plan",
    };
  }

  const localizedPrice = getLocalizedPaymentPrice(
    paymentPlan.plan,
    country
  );

  if (!localizedPrice) {
    return {
      success: false,
      reason: "invalid_payment_market",
    };
  }

  if (!secretKey) {
    return {
      success: false,
      reason: "payment_provider_not_configured",
    };
  }

  const paymentEmail =
    typeof email === "string" && email.trim()
      ? email.trim().toLowerCase()
      : authentication.customer.email;

  if (!paymentEmail) {
    return {
      success: false,
      reason: "customer_email_required",
    };
  }

  const customer = authentication.customer;
  const reference = createReference();
  const paymentId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await db
      .prepare(
        `INSERT INTO payments
         (
           payment_id,
           customer_id,
           plan,
           amount,
           currency,
           reference,
           status,
           credits,
           fulfilled,
           metadata,
           created_at,
           updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        paymentId,
        customer.customer_id,
        paymentPlan.plan,
        localizedPrice.amount,
        localizedPrice.currency,
        reference,
        "initialized",
        paymentPlan.credits,
        0,
        JSON.stringify({
          plan_name: paymentPlan.name,
        }),
        now,
        now
      )
      .run();

    const initialized = await initializePaystackTransaction({
      secretKey,
      email: paymentEmail,
      amount: localizedPrice.amount * 100,
      currency: localizedPrice.currency,
      reference,
      callbackUrl,
      metadata: {
        payment_id: paymentId,
        customer_id: customer.customer_id,
        plan: paymentPlan.plan,
        credits: paymentPlan.credits,
      },
    });

    if (!initialized.success) {
      await db
        .prepare(
          `UPDATE payments
           SET status = ?, updated_at = ?
           WHERE payment_id = ?`
        )
        .bind(
          "initialization_failed",
          new Date().toISOString(),
          paymentId
        )
        .run();

      return {
        success: false,
        reason: initialized.reason,
        message: initialized.message,
        payment_id: paymentId,
      };
    }

    await db
      .prepare(
        `UPDATE payments
         SET status = ?, updated_at = ?
         WHERE payment_id = ?`
      )
      .bind(
        "pending",
        new Date().toISOString(),
        paymentId
      )
      .run();

    return {
      success: true,
      payment_id: paymentId,
      reference: initialized.reference,
      authorization_url: initialized.authorization_url,
      plan: paymentPlan.plan,
      amount: localizedPrice.amount,
      currency: localizedPrice.currency,
      market: localizedPrice.market,
      market_name: localizedPrice.marketName,
      credits: paymentPlan.credits,
    };
  } catch (error) {
    console.error("AfriResolve payment creation failed:", error);

    return {
      success: false,
      reason: "payment_creation_failed",
    };
  }
}
