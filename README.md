# Safarnama — Travel More, Worry Less

A travel agency website built for the **MKT901 Web Marketing** academic task (LPU). Live site: **https://ashmoil.github.io/safarnama-travel/**

> Safarnama is a student project. The brand, prices and reviews are illustrative.

## Pages
| Page | Purpose |
|---|---|
| `index.html` | Home: hero search, destinations (horizontal scroll), journey steps, packages, testimonials, newsletter |
| `destinations.html` | All 16 trips with category filters and search (`?q=` / `?type=`) |
| `packages.html` | Budget, Signature and Luxury packages + brochure download |
| `about.html` | Story, stats, values, team |
| `contact.html` | **Plan My Trip** lead form, WhatsApp/phone/email, FAQ |
| `thank-you.html` | Shown after a lead form is submitted (goal confirmation page) |

## Google Analytics 4
Open `js/analytics.js` and replace `G-XXXXXXXXXX` with your Measurement ID. Every page loads this one file.

Goals (mark these as **Key events** in GA4 → Admin → Events):
| Event | Fires when |
|---|---|
| `generate_lead` | Plan My Trip form submitted |
| `sign_up` | Newsletter subscription |
| `brochure_download` | Itinerary PDF downloaded |

Supporting events: `search`, `select_destination`, `cta_click`, `whatsapp_click`, `filter_used`.

## SEO
Unique title + meta description per page, canonical URLs, Open Graph/Twitter tags, JSON-LD (TravelAgency, BreadcrumbList, ItemList, OfferCatalog, FAQPage), one H1 per page, descriptive image alt text, `sitemap.xml`, `robots.txt`, lazy-loaded images, custom 404.

## Tech
Plain HTML/CSS/JS. Animations with GSAP + ScrollTrigger and Lenis smooth scroll, bundled locally in `js/vendor/` (no build step). Photos from Unsplash.
