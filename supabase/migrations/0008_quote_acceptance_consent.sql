-- ----------------------------------------------------------------------------
-- Quote acceptance = contract conclusion for a distance-sold service. Record,
-- per acceptance (Finnish Consumer Protection Act, ch. 6):
--   * 'quote_acceptance'  — the consumer accepted the Terms (notice_version =
--                            the Terms' lastUpdated date)
--   * 'withdrawal_waiver' — whether the consumer EXPRESSLY asked for work to
--                            start before the 14-day withdrawal period ends
--                            ('start_early_requested') or not
--                            ('start_after_withdrawal_period')
-- Written only by the service-role client in src/features/quotes/actions.ts.
-- Idempotent.
-- ----------------------------------------------------------------------------
alter table public.consents drop constraint if exists consents_purpose_check;
alter table public.consents add constraint consents_purpose_check
  check (purpose in ('account_signup', 'cookie_preferences', 'quote_acceptance', 'withdrawal_waiver'));
