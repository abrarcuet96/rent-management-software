# RentFlow — Hands-On User Journey Checklist

## 1. Registration & Onboarding (`/register`)

- [ ] **1.1** Navigate to `/register` — confirm the dark green `#0D4A38` left panel renders with "RentFlow" logo, the tagline "আপনার সম্পত্তি পরিচালনা করুন সহজে", and the right-side card titled "নিবন্ধন করুন" with subtitle "নতুন অ্যাকাউন্ট তৈরি করুন".
- [ ] **1.2** Click "নিবন্ধন করুন" with all fields empty — verify four field-level errors: "নাম কমপক্ষে ২ অক্ষরের হতে হবে", "ইমেইল আবশ্যক", "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে", and "পাসওয়ার্ড নিশ্চিত করুন".
- [ ] **1.3** Enter a single-character name (e.g., "A") — verify "নাম কমপক্ষে ২ অক্ষরের হতে হবে" still appears.
- [ ] **1.4** Enter an invalid email (e.g., "abc") in "ইমেইল" — verify "সঠিক ইমেইল ঠিকানা দিন".
- [ ] **1.5** Enter a 7-character password — verify "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে".
- [ ] **1.6** Enter a mismatched "পাসওয়ার্ড নিশ্চিত করুন" — verify "পাসওয়ার্ড মিলছে না" on the confirm field.
- [ ] **1.7** Fill "পূর্ণ নাম", "ইমেইল", "পাসওয়ার্ড" (≥8 chars), matching "পাসওয়ার্ড নিশ্চিত করুন" — click "নিবন্ধন করুন" — verify button shows spinner + "নিবন্ধন হচ্ছে...".
- [ ] **1.8** On success, verify a green toast "নিবন্ধন সফল" appears and the URL redirects to `/dashboard`.
- [ ] **1.9** Log out, register again with the same email — verify red banner inside form showing the duplicate-email server error.
- [ ] **1.10** Click "লগইন করুন" link at bottom — verify navigation to `/login`.

## 2. Login (`/login`)

- [ ] **2.1** Open `/login` — verify the card title "লগইন করুন", subtitle "আপনার অ্যাকাউন্টে প্রবেশ করুন".
- [ ] **2.2** Submit empty form — verify "ইমেইল আবশ্যক" and "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে".
- [ ] **2.3** Enter wrong credentials — verify red alert box with the AlertCircle icon showing "ইমেইল বা পাসওয়ার্ড সঠিক নয়".
- [ ] **2.4** Edit any field after the error — verify the red banner is cleared.
- [ ] **2.5** Submit valid credentials — button shows "লগইন হচ্ছে..." then toast "লগইন সফল", redirect to `/dashboard`.
- [ ] **2.6** Click "নিবন্ধন করুন" link — confirm navigation to `/register`.
- [ ] **2.7** While unauthenticated, type `/buildings` in URL — verify `AuthGuard` redirects to `/login`.

## 3. App Shell, Sidebar, Theme

- [ ] **3.1** Confirm the green `#0D4A38` sidebar renders with sections "সম্পত্তি", "পেমেন্ট", "আর্থিক" and items: ড্যাশবোর্ড, বিল্ডিং, অ্যাপার্টমেন্ট, ভাড়াটে, বাল্ক পেমেন্ট, পেমেন্ট ইতিহাস, খরচ, রিপোর্ট, ব্যবহার গাইড, সেটিংস.
- [ ] **3.2** Click the chevron at the bottom — sidebar collapses to icon-only width (`w-14`); hover an icon — verify tooltip with Bangla label appears to the right.
- [ ] **3.3** Expand sidebar again — verify the owner avatar circle showing first letter of `user.full_name` and the full name beside it.
- [ ] **3.4** Click "থিম" dropdown — pick "ডার্ক" — verify entire app switches to dark, then "লাইট", then "সিস্টেম" (system follows OS preference).
- [ ] **3.5** On mobile width, verify the hamburger menu opens the drawer sidebar; click outside / close button — drawer slides shut.
- [ ] **3.6** Navigate between pages — verify the active route gets the white left-border highlight.
- [ ] **3.7** Verify the browser tab title updates to "ড্যাশবোর্ড | RentFlow", "বিল্ডিং | RentFlow", etc. as you move between routes.

## 4. Dashboard (`/dashboard`)

- [ ] **4.1** Open `/dashboard` — confirm the month dropdown defaults to the current month (e.g., "মে") and the year dropdown to current year, both in Bangla.
- [ ] **4.2** Verify four StatCards: "এই মাসে সংগৃহীত" (green, ArrowUp icon), "মোট বাকি" (red, ArrowDown), "খালি অ্যাপার্টমেন্ট" (neutral, Building icon), "ভাড়াটে সংখ্যা" (warning/yellow, Users). Numbers should display in Bangla numerals via `toBn`, currency with ৳ prefix.
- [ ] **4.3** If `pending > 0`, confirm the yellow "AlertTriangle" banner: "{N} জন ভাড়াটের ডিউ তৈরি করা বাকি" with "ডিউ তৈরি করুন" button.
- [ ] **4.4** Click the "ডিউ তৈরি করুন" button — `BulkGenerateDueDialog` opens (see section 12).
- [ ] **4.5** Verify two charts side by side: `CollectionBarChart` and `PaymentStatusDonut`.
- [ ] **4.6** Change the month/year selector — verify all stat cards, charts, and banner re-fetch.
- [ ] **4.7** Scroll to "বকেয়া ভাড়াটেদের তালিকা" — verify columns: ভাড়াটে, বিল্ডিং/ইউনিট, মাস/বছর, বাকি, বকেয়া দিন, স্ট্যাটাস, অ্যাকশন.
- [ ] **4.8** With no overdue dues, confirm CheckCircle2 (green) empty state: "কোনো বকেয়া নেই" / "সকল পেমেন্ট সময়মতো পরিশোধিত হয়েছে".
- [ ] **4.9** If overdue items exist, verify negative `days_overdue` shows greyed "আসছে", zero shows "—", positive shows red Bangla number.
- [ ] **4.10** Click "পরিশোধ" on any overdue row — `RecordPayment` dialog opens prefilled with the remaining balance (see section 11).
- [ ] **4.11** With no buildings/apartments yet, verify all stat values show ৳0 / ০ without crashing.

## 5. Buildings — List (`/buildings`)

- [ ] **5.1** Open `/buildings` — header reads "আপনার বিল্ডিং সমূহ" with subtitle "মোট ০ টি বিল্ডিং" on a fresh account.
- [ ] **5.2** Verify the empty state: Building2 icon, title "কোনো বিল্ডিং নেই", description "আপনার প্রথম বিল্ডিং যোগ করুন", and a primary "নতুন বিল্ডিং" button.
- [ ] **5.3** Click the top-right "নতুন বিল্ডিং" button — `CreateBuilding` dialog opens.
- [ ] **5.4** Submit dialog empty — verify three errors: "বিল্ডিং এর নাম প্রয়োজন", "ঠিকানা প্রয়োজন", "কমপক্ষে ১ তলা হতে হবে".
- [ ] **5.5** Enter `total_floors = 0` — verify the same min-floor error.
- [ ] **5.6** Submit "ABC ভবন" / "ঢাকা, মিরপুর-১০" / `5` — button shows spinner + "তৈরি করুন" — success toast, dialog closes, card appears in grid.
- [ ] **5.7** Verify each building card shows: green DoorOpen-style Building2 icon, name, address (both truncated), and a Layers chip "৫ তলা" in Bangla.
- [ ] **5.8** Click the pencil icon on the card — `EditBuilding` opens with current values; submit button reads "আপডেট করুন".
- [ ] **5.9** Click the trash icon — `ConfirmDialog`: "বিল্ডিং মুছুন" / "আপনি কি নিশ্চিত যে এই বিল্ডিংটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।" — Cancel keeps it, "মুছে ফেলুন" soft-deletes.
- [ ] **5.10** Try to delete a building that has apartments — verify backend error toast (FK ON DELETE RESTRICT) about apartments existing.
- [ ] **5.11** Trigger a network failure (offline) and refresh — verify `ErrorState` with a "আবার চেষ্টা করুন" retry button.

## 6. Building Detail (`/buildings/:buildingId`)

- [ ] **6.1** Click a building card — navigate into the detail page; verify info header with building name, address, and "মোট তলা: ৫ • মোট অ্যাপার্টমেন্ট: ০".
- [ ] **6.2** Confirm the breadcrumb / TopBar updates with the building name via `useNavigationStore`.
- [ ] **6.3** Three tabs: "সব", "খালি", "ভর্তি". Default is "সব".
- [ ] **6.4** Empty state inside each tab: "কোনো অ্যাপার্টমেন্ট নেই", "কোনো খালি অ্যাপার্টমেন্ট নেই", "কোনো ভর্তি অ্যাপার্টমেন্ট নেই" — each with a DoorOpen icon.
- [ ] **6.5** Click "নতুন অ্যাপার্টমেন্ট" — `CreateApartment` dialog opens.
- [ ] **6.6** Submit empty — errors: "ইউনিট নম্বর প্রয়োজন", "তলা নম্বর প্রয়োজন".
- [ ] **6.7** Enter floor `0` — verify "তলা নম্বর ন্যূনতম ১ হতে হবে".
- [ ] **6.8** Enter floor `99` for a 5-floor building — verify "তলা নম্বর সর্বোচ্চ ৫ হতে পারে" (Bangla number).
- [ ] **6.9** Submit `unit_number = "101"`, `floor = 3` — toast, dialog closes, card appears with `StatusBadge` "খালি" (green).
- [ ] **6.10** Try to add another apartment with the same `unit_number = "101"` — verify backend error: "Apartment number already exists" surfaced via toast (UNIQUE constraint).
- [ ] **6.11** Edit apartment via pencil — `EditApartment` opens; in edit mode the "অবস্থা" select with options "খালি" / "ভর্তি" appears (not visible in create mode).
- [ ] **6.12** Delete an apartment via trash — `ConfirmDialog` "অ্যাপার্টমেন্ট মুছুন"; deletion fails with toast if a tenant is currently assigned.

## 7. Apartments (Portfolio) (`/apartments`)

- [ ] **7.1** Open `/apartments` — verify header "অ্যাপার্টমেন্ট", a building Select with placeholder "বিল্ডিং বেছে নিন".
- [ ] **7.2** With no buildings, the Select dropdown shows "কোনো বিল্ডিং নেই — বিল্ডিং পেজে গিয়ে তৈরি করুন".
- [ ] **7.3** Before selecting any building — verify the centered empty state "বিল্ডিং বেছে নিন" / "অ্যাপার্টমেন্ট দেখতে উপরে থেকে একটি বিল্ডিং সিলেক্ট করুন".
- [ ] **7.4** Select a building — subtitle reads "{building.name} — মোট {N} টি" and the "নতুন" button appears next to the Select.
- [ ] **7.5** Confirm tabs read "সব ({N})", "খালি ({N})", "ভর্তি ({N})" with Bangla counts.
- [ ] **7.6** For a vacant card, click "ভাড়াটে যোগ করুন" — `AssignTenant` opens (see section 8).
- [ ] **7.7** For an occupied card, click "ভাড়াটে দেখুন" — verify the expandable panel shows the tenant name as a link to `/tenants/:id`, phone, and move-in date.
- [ ] **7.8** Click the tenant link — navigates to the tenant detail page.

## 8. Tenant Assignment (Vacant → Occupied)

- [ ] **8.1** From a vacant apartment row, open `AssignTenant` — verify the dialog title "ভাড়াটে যোগ করুন".
- [ ] **8.2** Fields visible: পূর্ণ নাম*, ফোন নম্বর*, এনআইডি নম্বর (optional), ঠিকানা (optional), পরিবারের সদস্য সংখ্যা* (default 1), প্রবেশের তারিখ* (date picker), মাসিক ভাড়া (৳)*, চুক্তির শুরুর তারিখ*.
- [ ] **8.3** Submit blank — verify: "নাম কমপক্ষে ২ অক্ষর হতে হবে", "সঠিক ফোন নম্বর দিন", "কমপক্ষে ১ জন সদস্য", "প্রবেশের তারিখ প্রয়োজন", "ভাড়ার পরিমাণ প্রয়োজন", "চুক্তির তারিখ প্রয়োজন".
- [ ] **8.4** Enter phone with fewer than 7 chars — verify "সঠিক ফোন নম্বর দিন".
- [ ] **8.5** Enter member count `0` — verify "কমপক্ষে ১ জন সদস্য".
- [ ] **8.6** Enter rent `0` — verify "ভাড়ার পরিমাণ প্রয়োজন".
- [ ] **8.7** Pick a future "প্রবেশের তারিখ" via FormDatePicker popover — calendar appears, date selects, value renders as `YYYY-MM-DD`.
- [ ] **8.8** Submit valid values — toast "ভাড়াটে যোগ হয়েছে", dialog closes, apartment card flips to "ভর্তি" badge.
- [ ] **8.9** Try assigning a second tenant to the now-occupied apartment — verify backend rejection (only one active tenant allowed per apartment).

## 9. Tenants — Portfolio (`/tenants`)

- [ ] **9.1** Open `/tenants` — heading "ভাড়াটেদের তালিকা" with tabs "সক্রিয়", "চলে গেছে", "সব". Default tab is "সক্রিয়".
- [ ] **9.2** With no tenants, verify empty state Users icon + "কোনো ভাড়াটে নেই" / "একটি অ্যাপার্টমেন্টে ভাড়াটে যোগ করুন".
- [ ] **9.3** Click top-right "নতুন ভাড়াটে" — `CreateTenantDialog` opens.
- [ ] **9.4** Verify there is a grey "অ্যাপার্টমেন্ট নির্বাচন" panel containing a building FormSearchSelect and (only once building chosen) an apartment Select.
- [ ] **9.5** Without selecting a building, see helper text "প্রথমে বিল্ডিং বেছে নিন, তারপর অ্যাপার্টমেন্ট দেখাবে".
- [ ] **9.6** When the building has no vacant apartments, the apartment Select shows "এই বিল্ডিংয়ে কোনো খালি অ্যাপার্টমেন্ট নেই".
- [ ] **9.7** Apartment options render as "ইউনিট {unit_number} — {floor} তলা" and only vacant ones appear.
- [ ] **9.8** Change building after picking an apartment — verify the apartment value is cleared.
- [ ] **9.9** Submit valid form — toast "ভাড়াটে যোগ হয়েছে", new card appears in the Active tab.
- [ ] **9.10** Each tenant card shows name, phone, building name • unit number (via `building_name` and `apartment_unit_number`).
- [ ] **9.11** Switch to "চলে গেছে" — only inactive tenants display; "সব" shows everyone.

## 10. Tenant Detail (`/tenants/:tenantId`)

- [ ] **10.1** Navigate to a tenant detail page — header shows: avatar circle (User icon, green), full name, phone with Phone icon, building • "ইউনিট {N}", a `StatusBadge` ("active" or "moved_out"), plus "সম্পাদনা" and "চলে গেছে" buttons (only if active).
- [ ] **10.2** Click "Print" button at top — verify the browser print preview shows tenant name and the dues/agreements tables fully laid out (no overflow, no buttons).
- [ ] **10.3** Verify the four-column info grid: এনআইডি, ঠিকানা, পরিবার ({N} জন), প্রবেশের তারিখ — empty fields fall back to "—".
- [ ] **10.4** Three summary cards: "মোট পরিশোধিত" (green), "মোট বাকি" (red), "ডিউ সংখ্যা" (count of unpaid + partial).
- [ ] **10.5** Click "সম্পাদনা" — `EditTenantInfo` dialog opens with name/phone/NID prefilled. Submit empty name — error "নাম কমপক্ষে ২ অক্ষর হতে হবে". Save valid values — toast "ভাড়াটে আপডেট হয়েছে".
- [ ] **10.6** Click "চলে গেছে" — `MoveOutTenant` opens, description "{name} এর চলে যাওয়ার তারিখ নির্ধারণ করুন", date required. Submit empty — "চলে যাওয়ার তারিখ প্রয়োজন". Submit valid date — toast "ভাড়াটে চলে গেছে", apartment becomes vacant, tenant status flips to inactive (Edit/MoveOut buttons disappear).
- [ ] **10.7** Verify the "চুক্তিসমূহ" section with the FileText icon and the table columns: শুরুর তারিখ, শেষের তারিখ, ভাড়া, স্ট্যাটাস (active row = green "সক্রিয়" pill, others = grey "নিষ্ক্রিয়"). Empty state shows "কোনো চুক্তি নেই".
- [ ] **10.8** Click "নতুন চুক্তি" — `CreateAgreementDialog` opens with rent_amount and start_date required. Submit `rent_amount = 0` — error "ভাড়ার পরিমাণ প্রয়োজন". Valid submit — toast "চুক্তি তৈরি হয়েছে"; the previously active agreement's `end_date` should populate.
- [ ] **10.9** Click "বাল্ক ভাড়া" — `BulkRentAdjustDialog` opens (see section 13).

## 11. Monthly Dues & Single Payments (Apartment & Tenant pages)

- [ ] **11.1** On a tenant or apartment detail page, scroll to "মাসিক ডিউ" — table columns: মাস/বছর, মোট দেয়, পরিশোধিত, বাকি, স্ট্যাটাস, অ্যাকশন.
- [ ] **11.2** Empty state inside dues table: "কোনো ডিউ নেই" / "ডিউ তৈরি করতে উপরের বাটনে ক্লিক করুন".
- [ ] **11.3** Click "ডিউ তৈরি" — `GenerateMonthlyDue` dialog opens with month/year prefilled to today.
- [ ] **11.4** Enter month `13` or `0` — error "মাস ১-১২ এর মধ্যে হতে হবে".
- [ ] **11.5** Enter year `1999` or `2200` — error "সালটি সঠিক নয়".
- [ ] **11.6** Generate a due for a tenant that already has the same month/year — verify backend error toast (UNIQUE constraint on `(tenant_id, month, year)`).
- [ ] **11.7** Generate a due for a tenant with no active agreement — verify backend error "No active agreement".
- [ ] **11.8** Successful generation — toast "ডিউ তৈরি হয়েছে", new row appears with status "বেকায়া" (red).
- [ ] **11.9** Click a due row — verify it expands inline to show `DuePaymentHistory` (table of তারিখ / পরিমাণ / নোট). Empty: "কোনো পেমেন্ট রেকর্ড নেই". Click the ExpandCollapseButton to expand-all / collapse-all.
- [ ] **11.10** Click "সম্পাদনা" on an `unpaid` row — `AdjustDueDialog` opens with prefilled `total_due`, `rent_amount`, `due_date`. (The "সম্পাদনা" button is hidden once any payment has been recorded.)
- [ ] **11.11** In AdjustDue, enter `total_due = -1` — error "পরিমাণ ০ বা তার বেশি হতে হবে". Save valid changes — toast "ডিউ আপডেট হয়েছে".
- [ ] **11.12** Click "পরিশোধ" on a non-paid due — `RecordPayment` dialog opens with the "বাকি: ৳XXX" panel and amount prefilled to remaining balance.
- [ ] **11.13** Enter amount `0` — error "পরিমাণ প্রয়োজন". Enter amount > remaining — error "সর্বোচ্চ ৳X.XX পর্যন্ত".
- [ ] **11.14** Submit a partial payment (< remaining) — toast "পেমেন্ট রেকর্ড হয়েছে", row updates: amount_paid increases, remaining_balance decreases, status flips to "আংশিক" (yellow).
- [ ] **11.15** Submit a payment equal to remaining — status flips to "পরিশোধিত" (green), both "সম্পাদনা" and "পরিশোধ" buttons disappear.
- [ ] **11.16** Re-open the expanded ledger — verify the new payment row, including the optional "নোট".

## 12. Bulk Due Generation (Dashboard banner)

- [ ] **12.1** From the dashboard warning banner or via the Bulk dialog directly, open `BulkGenerateDueDialog`. Title: "মাসিক ডিউ তৈরি করুন".
- [ ] **12.2** Change month/year — verify the preview box re-fetches: "X জন ভাড়াটের ডিউ তৈরি করা বাকি", "Y জনের ইতিমধ্যে ডিউ আছে", "Z জনের কোনো active চুক্তি নেই".
- [ ] **12.3** When pending = 0, banner shows green CheckCircle "এই মাসের সবার ডিউ তৈরি করা আছে" and the bottom button is disabled.
- [ ] **12.4** Optionally pick a "ডিউ তারিখ" — verify the FormDatePicker.
- [ ] **12.5** Click "ডিউ তৈরি করুন ({N})" — toast "{N} টি ডিউ তৈরি হয়েছে", result panel below shows created / skipped / no_agreement counts in Bangla.
- [ ] **12.6** Close and reopen — verify month/year/state reset to current and result cleared.

## 13. Agreements — Single & Bulk Rent Adjust

- [ ] **13.1** From tenant detail, "নতুন চুক্তি" — see section 10.8.
- [ ] **13.2** Click "বাল্ক ভাড়া" → `BulkRentAdjustDialog` opens. Fields: অ্যাডজাস্টমেন্ট টাইপ (নির্দিষ্ট পরিমাণ (+/-) | শতকরা (%)), পরিমাণ, স্কোপ (সকল বিল্ডিং | নির্দিষ্ট বিল্ডিং), বিল্ডিং (only when scope = building), কার্যকর তারিখ.
- [ ] **13.3** Enter `amount = 0` — verify "পরিমাণ ০ হতে পারে না".
- [ ] **13.4** Choose scope "নির্দিষ্ট বিল্ডিং" without picking one — verify "বিল্ডিং স্কোপে বিল্ডিং প্রয়োজন".
- [ ] **13.5** Enter a "শতকরা (%)" of `10` with effective date = today, scope = সকল — submit — toast "{N} জন ভাড়াটের ভাড়া আপডেট হয়েছে"; verify each active agreement's rent on `/tenants/:id` increased by 10%.
- [ ] **13.6** Enter "নির্দিষ্ট পরিমাণ" of `-500` — verify all rents decrease by 500.

## 14. Bulk Payments (`/payments` → "বাল্ক পেমেন্ট" tab)

- [ ] **14.1** Open `/payments` — verify tabs "বাল্ক পেমেন্ট" (default) and "বাল্ক ইতিহাস".
- [ ] **14.2** In the "ভাড়াটে" Select — if no active tenants, dropdown shows "কোনো সক্রিয় ভাড়াটে নেই — ভাড়াটে পেজে গিয়ে যোগ করুন".
- [ ] **14.3** Pick a tenant — verify either the "এই ভাড়াটের কোনো বকেয়া নেই" message or the read-only "বকেয়া (Nটি)" table (মাস/বছর | মোট দেয় | পরিশোধিত | বাকি | footer: মোট বাকি).
- [ ] **14.4** Enter "মোট পেমেন্ট পরিমাণ (৳)" greater than total outstanding — verify the inline red error "সর্বোচ্চ ৳X পর্যন্ত দেওয়া সম্ভব — মোট বকেয়া এর বেশি গ্রহণযোগ্য নয়" and the submit button stays disabled.
- [ ] **14.5** Enter `0` or leave blank — verify "পরিমাণ প্রয়োজন".
- [ ] **14.6** Enter an amount ≤ outstanding — the read-only table is replaced by `BulkDistributionPreview` showing oldest-first distribution per due.
- [ ] **14.7** Optional "নোট" textarea — type "নগদ — মে মাস".
- [ ] **14.8** Pick "পেমেন্টের তারিখ" — required.
- [ ] **14.9** Click "বাল্ক পেমেন্ট করুন" — toast "বাল্ক পেমেন্ট সফল হয়েছে", form resets, tenant selector clears.
- [ ] **14.10** Switch to "বাল্ক ইতিহাস" — verify each row collapses/expands to reveal the per-due breakdown (মাস/বছর, পরিশোধিত, স্ট্যাটাস). Hover a truncated "নোট" — verify Tooltip showing full text.
- [ ] **14.11** With > 20 records — verify pagination: "পূর্ববর্তী" / "পরবর্তী" buttons and "পৃষ্ঠা X / Y" in Bangla.

## 15. Payment History Report (`/payment-history`)

- [ ] **15.1** Open `/payment-history` — see "ভাড়াটে বেছে নিন" Select; if no tenants, "কোনো সক্রিয় ভাড়াটে নেই".
- [ ] **15.2** Without a selection, verify the CreditCard EmptyState "ভাড়াটে নির্বাচন করুন".
- [ ] **15.3** Pick a tenant — if zero records, the Receipt EmptyState "কোনো পেমেন্ট রেকর্ড নেই".
- [ ] **15.4** Otherwise verify each due block: header chip with `getMonthName(month)` + year, status badge, summary line (মোট দেয়, পরিশোধিত, বাকি) and the payment sub-table (তারিখ / পরিমাণ / নোট), or "কোনো পেমেন্ট নেই" if generated but unpaid.
- [ ] **15.5** Click "প্রিন্ট করুন" — verify PrintHeader renders tenant + phone + building + unit metadata and full payment list prints cleanly.

## 16. Expenses (`/expenses` → tabs)

### 16a. Categories tab

- [ ] **16.1** Open `/expenses`, switch to "ক্যাটাগরি" tab — header "খরচের ক্যাটাগরি ({N})".
- [ ] **16.2** Verify default categories exist (seeded) with a "ডিফল্ট" pill and no delete button (because `is_default = TRUE`).
- [ ] **16.3** Click "নতুন ক্যাটাগরি" — enter blank — error "ক্যাটাগরির নাম প্রয়োজন". Enter "রং এর খরচ" — toast "ক্যাটাগরি তৈরি হয়েছে".
- [ ] **16.4** Click "ডিলিট" on a custom category — `ConfirmDialog` "ক্যাটাগরি ডিলিট করুন" / `"{name}" ক্যাটাগরিটি মুছে ফেলবেন?` — confirm — toast "ক্যাটাগরি মুছে ফেলা হয়েছে".

### 16b. Expenses tab

- [ ] **16.5** Switch to "খরচ" tab — header "খরচ ({N})" + "নতুন খরচ" button.
- [ ] **16.6** Empty state with Receipt icon: "কোনো খরচ নেই" / "নতুন খরচ যোগ করতে উপরের বাটনে ক্লিক করুন".
- [ ] **16.7** Click "নতুন খরচ" — `ExpenseFormDialog` opens (title "নতুন খরচ").
- [ ] **16.8** Submit empty — errors: "ক্যাটাগরি প্রয়োজন", "বিবরণ প্রয়োজন", "পরিমাণ প্রয়োজন", "তারিখ প্রয়োজন".
- [ ] **16.9** With no categories, the category FormSearchSelect shows "কোনো ক্যাটাগরি নেই — খরচ → ক্যাটাগরি ট্যাবে গিয়ে তৈরি করুন।"
- [ ] **16.10** Pick a building — verify the apartment FormSearchSelect appears below; clear the building — apartment field clears too.
- [ ] **16.11** Verify the "ভাড়াটের উপর চার্জ হবে" Checkbox toggles `is_tenant_charged`.
- [ ] **16.12** Submit a tenant-charged expense at apartment scope — toast "খরচ তৈরি হয়েছে"; the row shows the orange "ভাড়াটে" pill and the "চার্জ" button.
- [ ] **16.13** Click "চার্জ" — `ChargeTenantsDialog` opens with description, amount, date summary card.
- [ ] **16.14** For apartment-scope expense, the single active tenant is auto-selected; for building scope, see a list with "{N} জন নির্বাচিত" header and a "সবাই নির্বাচন করুন" / "সব বাতিল করুন" toggle.
- [ ] **16.15** Already-charged tenants render greyed with "✓ চার্জ হয়েছে" and a disabled checkbox.
- [ ] **16.16** Click "চার্জ করুন (0)" with nothing selected — toast "কমপক্ষে একজন ভাড়াটে নির্বাচন করুন".
- [ ] **16.17** Submit with valid selection — toast "{N} জনকে সফলভাবে চার্জ করা হয়েছে" (or skipped count if duplicate / no due).
- [ ] **16.18** Edit a non-tenant-charged expense → toggle the checkbox → save — toast "খরচ আপডেট হয়েছে"; verify the "চার্জ" button now appears.
- [ ] **16.19** Delete an expense — `ConfirmDialog` "খরচ ডিলিট করুন" → toast "খরচ মুছে ফেলা হয়েছে".

## 17. Reports (`/reports`)

- [ ] **17.1** Open `/reports` — verify three tabs: "বকেয়া রিপোর্ট" (default), "মাসিক সংগ্রহ", "বার্ষিক সারসংক্ষেপ".
- [ ] **17.2** "বকেয়া রিপোর্ট" — `PrintHeader` shows "মোট বকেয়া: {N} টি" / "স্ট্যাটাস: সক্রিয় বকেয়া". Columns: ভাড়াটে, বিল্ডিং/ইউনিট, মাস/বছর, প্রদান, বাকি, দিন, স্ট্যাটাস. Empty state: green CheckCircle2 "কোনো বকেয়া নেই".
- [ ] **17.3** Click "প্রিন্ট করুন" — verify a clean printable layout.
- [ ] **17.4** "মাসিক সংগ্রহ" tab — Year Select defaults to current. Twelve rows render (one per month). Each row fetches its own month total. While loading, the column shows "...".
- [ ] **17.5** Switch year — verify all 12 rows refetch.
- [ ] **17.6** "বার্ষিক সারসংক্ষেপ" tab — four cards: মোট সংগ্রহ (green), মোট ব্যয় (red), নিট লাভ, বাকি (yellow). Print view also renders a formal table with footer "নিট লাভ".
- [ ] **17.7** No data year — verify EmptyState "কোনো ডেটা নেই".

## 18. Settings (`/settings`)

- [ ] **18.1** Open `/settings` — three cards: প্রোফাইল, থিম, লগআউট (the last in red).
- [ ] **18.2** Profile card shows the user's `full_name` and `email` with a User-icon avatar.
- [ ] **18.3** Theme card — pick "লাইট", "ডার্ক", or "সিস্টেম" via radio group; verify the chosen value persists across reloads (Zustand `useUiStore`).
- [ ] **18.4** Logout card — click "লগআউট করুন" — Zustand auth cleared, redirect to `/login`. Hit Back — verify you cannot return without re-login.

## 19. User Manual (`/user-manual`)

- [ ] **19.1** Open `/user-manual` — verify the green hero "RentFlow শিখুন সহজে" and the three quick stats: "মোট ফিচার ৭টি", "ধাপে ধাপে গাইড ৬টি বিভাগ", "দরকারী টিপস ১০+".
- [ ] **19.2** Section 1 — horizontal/vertical flowchart of 7 steps: নিবন্ধন → বিল্ডিং → অ্যাপার্টমেন্ট → ভাড়াটে → চুক্তি → মাসিক ডিউ → পেমেন্ট. Click each — verify the colored detail panel expands with "কিভাবে করবেন" steps and "পরবর্তী ধাপ".
- [ ] **19.3** Section 2 — verify the hierarchy diagram (বিল্ডিং → অ্যাপার্টমেন্ট → ভাড়াটে → চুক্তি → মাসিক ডিউ → পেমেন্ট রেকর্ড).
- [ ] **19.4** Section 3 — six expandable feature cards (ড্যাশবোর্ড, বিল্ডিং ও অ্যাপার্টমেন্ট, ভাড়াটে ব্যবস্থাপনা, পেমেন্ট, খরচ ব্যবস্থাপনা, রিপোর্ট) — verify the amber "দরকারী টিপস" callout inside each.
- [ ] **19.5** Section 4 — verify 5 quick tip tiles.
- [ ] **19.6** Section 5 — verify status legends for both অ্যাপার্টমেন্ট (খালি/ভর্তি) and মাসিক ডিউ (বেকায়া/আংশিক/পরিশোধিত).

## 20. Cross-Cutting Behaviour

- [ ] **20.1** Refresh any page — verify Zustand auth token persists; you stay logged in.
- [ ] **20.2** Manually edit the token in localStorage / clear it — protected routes redirect back to `/login`.
- [ ] **20.3** After any successful create / update / delete, observe TanStack Query refetching the affected lists (no stale UI).
- [ ] **20.4** Trigger a backend 500 (e.g., stop the API) — verify each page falls back to `ErrorState` with "আবার চেষ্টা করুন".
- [ ] **20.5** All currency renders as "৳1,234.00" via `formatCurrency`; all integer counts use Bangla numerals via `toBn`.
- [ ] **20.6** All dates display as `YYYY-MM-DD`; FormDatePicker popovers render the shadcn `Calendar`.
- [ ] **20.7** Print buttons (apartment detail, tenant detail, all reports, payment history) hide nav/sidebar and produce a clean PrintHeader + PrintFooter layout.
- [ ] **20.8** No raw `<button>`, `<input>`, `<table>` etc. anywhere outside print-only blocks — every UI element is a shadcn primitive or one of the `Form*` wrappers.
- [ ] **20.9** All toasts come from `react-hot-toast` — success (green) and error (red) appear at the top of the viewport.
- [ ] **20.10** Verify Bangla labels render with proper font and no monospaced fallback (check on Firefox + Chrome).
