// src/stripe.js
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51PoopEFRoOvFRat0yXCedbYqfM61nz2lnQPI4wtS5IBpzXDGSXpeulCuXkxrzxnhBi3i13Tn7A40vswgLpZXnWxT00MSAdWBg4");

export { stripePromise };
