import { getPaymentPlan } from "./plans.js";

export async function fulfillPayment(db, reference, transaction) {
  if (!db || !reference || !transaction) {
    return {
      success: false,
      fulfilled: false,
      reason: "invalid_fulfillment_parameters",
    };
  }

  if (transaction.status !== "success") {
    return {
      success: false,
      fulfilled: false,
      reason: "payment_not_successful",
    };
  }

  try {
    const payment = await db
      .prepare(
        `SELECT payment_id, customer_id, plan, amount, currency,
                reference, status, credits, fulfilled
         FROM payments
         WHERE reference = ?
         LIMIT 1`
      )
      .bind(reference)
      .first();

    if (!payment) {
      return {
        success: false,
        fulfilled: false,
        reason: "payment_not_found",
      };
    }

    const paymentPlan = getPaymentPlan(payment.plan);

    if (!paymentPlan) {
      return {
        success: false,
        fulfilled: false,
        reason: "invalid_payment_plan",
      };
    }

    if (Number(transaction.amount) !== Number(payment.amount) * 100) {
      return {
        success: false,
        fulfilled: false,
        reason: "payment_amount_mismatch",
      };
    }

    if (transaction.currency !== payment.currency) {
      return {
        success: false,
        fulfilled: false,
        reason: "payment_currency_mismatch",
      };
    }

    if (payment.fulfilled === 1) {
      return {
        success: true,
        fulfilled: true,
        already_fulfilled: true,
        payment_id: payment.payment_id,
        customer_id: payment.customer_id,
        plan: payment.plan,
        credits: payment.credits,
      };
    }

    const now = new Date().toISOString();

    const statements = [
      db
        .prepare(
          `UPDATE customers
           SET plan = ?,
               credits = credits + ?,
               updated_at = ?
           WHERE customer_id = ?
             AND status = 'active'
             AND EXISTS (
               SELECT 1
               FROM payments
               WHERE reference = ?
                 AND fulfilled = 0
             )`
        )
        .bind(
          paymentPlan.plan,
          paymentPlan.credits,
          now,
          payment.customer_id,
          reference
        ),

      db
        .prepare(
          `UPDATE payments
           SET status = ?,
               fulfilled = 1,
               paystack_transaction_id = ?,
               updated_at = ?
           WHERE reference = ?
             AND fulfilled = 0
             AND EXISTS (
               SELECT 1
               FROM customers
               WHERE customer_id = ?
                 AND status = 'active'
             )`
        )
        .bind(
          "success",
          String(transaction.id ?? ""),
          now,
          reference,
          payment.customer_id
        ),
    ];

    const results = await db.batch(statements);

    const customerChanges = Number(
      results?.[0]?.meta?.changes || 0
    );

    const paymentChanges = Number(
      results?.[1]?.meta?.changes || 0
    );

    if (customerChanges === 1 && paymentChanges === 1) {
      return {
        success: true,
        fulfilled: true,
        already_fulfilled: false,
        payment_id: payment.payment_id,
        customer_id: payment.customer_id,
        plan: paymentPlan.plan,
        credits_added: paymentPlan.credits,
      };
    }

    const current = await db
      .prepare(
        `SELECT fulfilled
         FROM payments
         WHERE reference = ?
         LIMIT 1`
      )
      .bind(reference)
      .first();

    if (current?.fulfilled === 1) {
      return {
        success: true,
        fulfilled: true,
        already_fulfilled: true,
        payment_id: payment.payment_id,
        customer_id: payment.customer_id,
        plan: payment.plan,
        credits: payment.credits,
      };
    }

    return {
      success: false,
      fulfilled: false,
      reason:
        customerChanges === 0
          ? "customer_not_eligible"
          : "payment_fulfillment_conflict",
      payment_id: payment.payment_id,
    };
  } catch (error) {
    console.error(
      "AfriResolve payment fulfillment failed:",
      error
    );

    return {
      success: false,
      fulfilled: false,
      reason: "payment_fulfillment_failed",
    };
  }
}
