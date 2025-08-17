import { Webhooks } from "@dodopayments/nextjs";
import { UserService } from "@/lib/user-service";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (payload) => {
    console.log('Webhook received:', payload);
  },
  onPaymentSucceeded: async (payload) => {
    try {
      console.log('Payment succeeded:', payload);
      
      // Complete the purchase and add credits to user
      if (payload.payment_id) {
        await UserService.completePurchase(payload.payment_id);
        console.log('Credits added successfully for payment:', payload.payment_id);
      }
    } catch (error) {
      console.error('Error processing payment success webhook:', error);
      // Don't throw error to avoid webhook retries for our internal errors
    }
  },
  onPaymentFailed: async (payload) => {
    try {
      console.log('Payment failed:', payload);
      
      // Update purchase status to failed
      if (payload.payment_id) {
        // You could implement a method to mark purchase as failed
        console.log('Payment failed for payment ID:', payload.payment_id);
      }
    } catch (error) {
      console.error('Error processing payment failed webhook:', error);
    }
  },
  onPaymentCancelled: async (payload) => {
    try {
      console.log('Payment cancelled:', payload);
      
      // Handle cancelled payment
      if (payload.payment_id) {
        console.log('Payment cancelled for payment ID:', payload.payment_id);
      }
    } catch (error) {
      console.error('Error processing payment cancelled webhook:', error);
    }
  }
});