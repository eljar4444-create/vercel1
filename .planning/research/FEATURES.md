# Research: Features for Beauty B2B SaaS

## Table Stakes (Must-Have)
Users will churn immediately if these are broken or missing.
- **Real-Time Availability:** The schedule must accurately reflect availability without lag or caching anomalies.
- **Strict Double-Booking Prevention:** The system must lock a slot the millisecond someone starts checking out.
- **Automated Notifications:** Email/Telegram reminders to prevent no-shows.
- **Flexible Service Catalog:** Providers must configure duration, price, and buffer times.

## Differentiators (Competitive Advantage)
- **Seamless, Frictionless Onboarding:** Many platforms fail by overwhelming the provider. A polished, state-based onboarding UX is a massive conversion driver.
- **Expat-Friendly Localization:** Seamlessly handling German/Russian/Ukrainian languages for both the provider UI and the client UI.
- **Legal & Tax Ready Vault:** Built-in DAC7 reporting exports make it a "pro" tool, not just a calendar.

## Anti-Features (Do Not Build)
- **Social Media Feeds:** It's a booking tool, not Instagram.
- **Fragile "Optimistic" Bookings:** Do not let a booking "look" confirmed on the UI before the database fully commits the transaction and slot lock.
