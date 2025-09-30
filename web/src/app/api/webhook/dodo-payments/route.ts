import { Webhooks } from "@dodopayments/nextjs";
import { UserService } from "@/lib/user-service";
import { prisma } from "@/lib/prisma";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (payload) => {
    console.log('Webhook received:', payload);
  },
  onPaymentSucceeded: async (payload) => {
    try {
      console.log('Payment succeeded:', JSON.stringify(payload, null, 2));
      
      const paymentData = payload.data;
      const paymentId = paymentData?.payment_id;
      const customerEmail = paymentData?.customer?.email;
      const productCart = paymentData?.product_cart;
      
      if (!paymentId || !productCart || productCart.length === 0) {
        console.error('Missing required payment data:', { paymentId, productCart });
        return;
      }

      // Get the product ID from the cart
      const productId = productCart[0]?.product_id;
      const quantity = productCart[0]?.quantity || 1;
      
      if (!productId) {
        console.error('No product ID found in cart');
        return;
      }

      // Find the credit plan by product ID
      const creditPlan = UserService.getCreditPlanByProductId(productId);
      if (!creditPlan) {
        console.error('No credit plan found for product ID:', productId);
        return;
      }

      console.log('Found credit plan:', creditPlan);

      // Try to find an existing purchase record first
      const purchase = await prisma.purchase.findUnique({
        where: { dodoPaymentId: paymentId }
      });

      if (!purchase) {
        // If no purchase record exists, we need to find the user by email
        // Since we don't have userId in the webhook, we'll use the customer email
        if (!customerEmail) {
          console.error('No customer email found in webhook data');
          return;
        }

        // Find user by email (assuming email is stored in Clerk and we can find them)
        // For now, let's create a direct purchase completion without pre-existing record
        console.log('No existing purchase record found, creating new completion');
        
        // We'll need to handle this differently since we don't have the userId directly
        // Let's look up the user by their Clerk ID if possible, or create a direct credit addition
        
        // For now, let's add credits directly by finding the user through Clerk
        // This is a simpler approach that works with the webhook data we have
        
        try {
          // Import Clerk to find user by email
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const users = await client.users.getUserList({
            emailAddress: [customerEmail]
          });
          
          if (users.data.length === 0) {
            console.error('No user found with email:', customerEmail);
            return;
          }
          
          const user = users.data[0];
          const userId = user.id;
          
          console.log('Found user:', { userId, email: customerEmail });
          
          // Add credits directly to the user
          const totalCredits = creditPlan.credits * quantity;
          const updatedUser = await UserService.addCredits(userId, totalCredits);
          
          console.log('Credits added successfully:', {
            userId,
            creditsAdded: totalCredits,
            newBalance: updatedUser.creditBalance
          });

          // Create a purchase record for tracking
          await prisma.purchase.create({
            data: {
              userId,
              plan: creditPlan.id,
              credits: totalCredits,
              amountPaid: paymentData.total_amount || 0,
              dodoPaymentId: paymentId,
              status: 'completed'
            }
          });

          console.log('Purchase record created for payment:', paymentId);
          
        } catch (clerkError) {
          console.error('Error finding user in Clerk:', clerkError);
          return;
        }
        
      } else {
        // Complete the existing purchase
        console.log('Completing existing purchase:', purchase.id);
        await UserService.completePurchase(paymentId);
        console.log('Credits added successfully for payment:', paymentId);
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
      if (payload.data?.payment_id) {
        // You could implement a method to mark purchase as failed
        console.log('Payment failed for payment ID:', payload.data.payment_id);
      }
    } catch (error) {
      console.error('Error processing payment failed webhook:', error);
    }
  },
  onPaymentCancelled: async (payload) => {
    try {
      console.log('Payment cancelled:', payload);
      
      // Handle cancelled payment
      if (payload.data?.payment_id) {
        console.log('Payment cancelled for payment ID:', payload.data.payment_id);
      }
    } catch (error) {
      console.error('Error processing payment cancelled webhook:', error);
    }
  }
});