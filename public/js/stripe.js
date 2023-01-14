import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MPtAKSGGh3yAg9SklszulgCI6bELdoAcKd9oOMw9wC9sNPPbKBrV19UsSkDnfFb4wAZDPqFF30VZO8Mv0QmBDK2005l78kLIH'
);

export const bookTour = async (tourId) => {
  // 1) Get the session from api endpoint
  try {
    const res = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(res.data.session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
