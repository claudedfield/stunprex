/**
 * Checkout is off until the sales terms and the membership lines on /privacy are live (D-LEGAL-17)
 * and CHECKOUT_OPEN=1 is set on the server. Staging may open it for the tests, with a test key.
 */
export const checkoutOpen = () =>
  Boolean(process.env.STRIPE_SECRET_KEY) && (process.env.CHECKOUT_OPEN === '1' || process.env.STAGING === '1')
