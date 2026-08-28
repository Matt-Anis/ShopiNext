# ⚠️ This project is still under development

## Database

Migrations run as a Postgres superuser (see `docker-compose.yml` / `.env.local`).
That role's name must never match a schema name in `packages/db` (currently
`public`, `admin`) — Postgres's default `search_path` is `"$user", public`, so a
role named e.g. `admin` silently shadows the `public` schema for any
unqualified `CREATE TABLE`, routing new tables into the wrong schema.

## Features

### MVP
- [x] Product listing page
- [x] Product detail page
- [x] Cart (add/remove/update quantity, guest and signed-in)
- [x] Authentication
- [x] Guest checkout
- [x] Checkout
- [x] Order confirmation page


### V1
- [x] Email verification
- [x] Password reset
- [x] OAuth
- [ ] Order history page
- [ ] Order receipt email
- [ ] Order status tracking
- [ ] Admin panel (product management)
- [ ] Staff roles & permissions
- [x] Staff invite via magic link
- [ ] Product images
- [ ] Product categories
- [ ] Product variants (size, color, stock per variant)
- [ ] Address management
- [ ] Basic SEO
- [ ] Promotional

### Later
- [ ] Search and filters
- [ ] Abandoned cart emails
- [ ] Email notifications
- [ ] Reviews & comments
- [ ] Dashboard analytics
- [ ] Coupons
- [ ] Shipping & tax settings
- [ ] Wishlist
- [ ] Inventory & stock management
- [ ] Returns & refunds
- [ ] Staff chat
- [ ] Docker setup for self-hosting
